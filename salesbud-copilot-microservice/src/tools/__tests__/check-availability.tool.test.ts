import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCheckAvailabilityTool } from '../check-availability.tool.js';
import { CalendarAuthError } from '../../utils/calendar-errors.js';

const TIMEZONE = 'America/Sao_Paulo';
const CLERK_USER_ID = 'clerk_test_123';

function mockCalendarService(overrides: Record<string, any> = {}) {
  return {
    checkAvailability: vi.fn().mockResolvedValue({ available: true, busy: [] }),
    ...overrides,
  } as any;
}

function getFutureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

async function invokeTool(
  tool: ReturnType<typeof createCheckAvailabilityTool>,
  input: Record<string, any>,
) {
  return tool.invoke(input);
}

describe('check_availability tool', () => {
  let calendarService: ReturnType<typeof mockCalendarService>;

  beforeEach(() => {
    vi.restoreAllMocks();
    calendarService = mockCalendarService();
  });

  describe('business hours validation', () => {
    it('rejects start time before 9h', async () => {
      const tool = createCheckAvailabilityTool(calendarService, CLERK_USER_ID, TIMEZONE);
      const result = await invokeTool(tool, {
        date: getFutureDate(3),
        start_time: '08:00',
        end_time: '09:00',
      });

      expect(result).toContain('fora do expediente comercial');
      expect(result).toContain('9h');
      expect(result).toContain('17h');
      expect(calendarService.checkAvailability).not.toHaveBeenCalled();
    });

    it('rejects end time after 17h', async () => {
      const tool = createCheckAvailabilityTool(calendarService, CLERK_USER_ID, TIMEZONE);
      const result = await invokeTool(tool, {
        date: getFutureDate(3),
        start_time: '16:00',
        end_time: '18:00',
      });

      expect(result).toContain('fora do expediente comercial');
      expect(calendarService.checkAvailability).not.toHaveBeenCalled();
    });

    it('rejects end time at 17:30', async () => {
      const tool = createCheckAvailabilityTool(calendarService, CLERK_USER_ID, TIMEZONE);
      const result = await invokeTool(tool, {
        date: getFutureDate(3),
        start_time: '16:00',
        end_time: '17:30',
      });

      expect(result).toContain('fora do expediente comercial');
      expect(calendarService.checkAvailability).not.toHaveBeenCalled();
    });

    it('accepts start at 9h and end at 17h', async () => {
      const tool = createCheckAvailabilityTool(calendarService, CLERK_USER_ID, TIMEZONE);
      const result = await invokeTool(tool, {
        date: getFutureDate(3),
        start_time: '09:00',
        end_time: '17:00',
      });

      expect(result).toContain('disponível');
      expect(calendarService.checkAvailability).toHaveBeenCalled();
    });

    it('accepts mid-day time range', async () => {
      const tool = createCheckAvailabilityTool(calendarService, CLERK_USER_ID, TIMEZONE);
      const result = await invokeTool(tool, {
        date: getFutureDate(3),
        start_time: '10:00',
        end_time: '11:00',
      });

      expect(result).toContain('disponível');
      expect(calendarService.checkAvailability).toHaveBeenCalled();
    });
  });

  describe('minimum lead time validation (8 hours)', () => {
    it('rejects a meeting too soon (less than 8h from now)', async () => {
      const tool = createCheckAvailabilityTool(calendarService, CLERK_USER_ID, TIMEZONE);

      // Use today with a time 1 hour from now
      const now = new Date();
      const soonDate = new Date(now.getTime() + 1 * 60 * 60 * 1000);
      const date = soonDate.toISOString().split('T')[0];
      const startTime = `${String(soonDate.getHours()).padStart(2, '0')}:${String(soonDate.getMinutes()).padStart(2, '0')}`;
      const endHour = soonDate.getHours() + 1;
      const endTime = `${String(endHour).padStart(2, '0')}:00`;

      const result = await invokeTool(tool, {
        date,
        start_time: startTime,
        end_time: endTime,
      });

      // Should be rejected either by business hours or lead time
      const isRejected =
        result.includes('Antecedência insuficiente') ||
        result.includes('fora do expediente');
      expect(isRejected).toBe(true);
      expect(calendarService.checkAvailability).not.toHaveBeenCalled();
    });

    it('accepts a meeting well in advance (3 days ahead)', async () => {
      const tool = createCheckAvailabilityTool(calendarService, CLERK_USER_ID, TIMEZONE);
      const result = await invokeTool(tool, {
        date: getFutureDate(3),
        start_time: '10:00',
        end_time: '11:00',
      });

      expect(result).toContain('disponível');
      expect(calendarService.checkAvailability).toHaveBeenCalled();
    });
  });

  describe('conflict handling (occupied slot)', () => {
    it('returns clear "already occupied" message, not "technical error"', async () => {
      calendarService = mockCalendarService({
        checkAvailability: vi.fn().mockResolvedValue({
          available: false,
          busy: [
            {
              start: `${getFutureDate(3)}T10:00:00-03:00`,
              end: `${getFutureDate(3)}T11:00:00-03:00`,
            },
          ],
        }),
      });

      const tool = createCheckAvailabilityTool(calendarService, CLERK_USER_ID, TIMEZONE);
      const result = await invokeTool(tool, {
        date: getFutureDate(3),
        start_time: '10:00',
        end_time: '11:00',
      });

      expect(result).toContain('JÁ OCUPADO');
      expect(result).toContain('compromisso');
      expect(result).toContain('NÃO é um erro técnico');
      expect(result).toContain('horários alternativos');
      expect(result).not.toContain('problema técnico');
      expect(result).not.toContain('erro do sistema');
    });

    it('lists the conflicting time slots', async () => {
      calendarService = mockCalendarService({
        checkAvailability: vi.fn().mockResolvedValue({
          available: false,
          busy: [
            {
              start: `${getFutureDate(3)}T10:00:00-03:00`,
              end: `${getFutureDate(3)}T11:00:00-03:00`,
            },
            {
              start: `${getFutureDate(3)}T14:00:00-03:00`,
              end: `${getFutureDate(3)}T15:00:00-03:00`,
            },
          ],
        }),
      });

      const tool = createCheckAvailabilityTool(calendarService, CLERK_USER_ID, TIMEZONE);
      const result = await invokeTool(tool, {
        date: getFutureDate(3),
        start_time: '10:00',
        end_time: '15:00',
      });

      expect(result).toContain('JÁ OCUPADO');
      // Should contain time ranges from busy slots
      expect(result).toContain('às');
    });
  });

  describe('available slot', () => {
    it('returns availability confirmation', async () => {
      const tool = createCheckAvailabilityTool(calendarService, CLERK_USER_ID, TIMEZONE);
      const futureDate = getFutureDate(3);
      const result = await invokeTool(tool, {
        date: futureDate,
        start_time: '10:00',
        end_time: '11:00',
      });

      expect(result).toContain('Horário disponível');
      expect(result).toContain(futureDate);
      expect(result).toContain('10:00');
      expect(result).toContain('11:00');
    });
  });

  describe('error handling', () => {
    it('handles CalendarAuthError gracefully', async () => {
      calendarService = mockCalendarService({
        checkAvailability: vi.fn().mockRejectedValue(new CalendarAuthError('Not connected')),
      });

      const tool = createCheckAvailabilityTool(calendarService, CLERK_USER_ID, TIMEZONE);
      const result = await invokeTool(tool, {
        date: getFutureDate(3),
        start_time: '10:00',
        end_time: '11:00',
      });

      expect(result).toContain('conectar a conta Google');
    });

    it('handles generic errors gracefully', async () => {
      calendarService = mockCalendarService({
        checkAvailability: vi.fn().mockRejectedValue(new Error('Network error')),
      });

      const tool = createCheckAvailabilityTool(calendarService, CLERK_USER_ID, TIMEZONE);
      const result = await invokeTool(tool, {
        date: getFutureDate(3),
        start_time: '10:00',
        end_time: '11:00',
      });

      expect(result).toContain('Erro ao verificar agenda');
    });
  });

  describe('past date validation', () => {
    it('rejects dates in the past', async () => {
      const tool = createCheckAvailabilityTool(calendarService, CLERK_USER_ID, TIMEZONE);
      const result = await invokeTool(tool, {
        date: '2020-01-01',
        start_time: '10:00',
        end_time: '11:00',
      });

      expect(result).toContain('passado');
      expect(calendarService.checkAvailability).not.toHaveBeenCalled();
    });
  });
});
