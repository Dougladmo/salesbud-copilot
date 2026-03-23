import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createScheduleMeetingTool } from '../schedule-meeting.tool.js';
import {
  CalendarAuthError,
  CalendarConflictError,
} from '../../utils/calendar-errors.js';
import { LeadStatus } from '../../models/lead.model.js';

const TIMEZONE = 'America/Sao_Paulo';
const CLERK_USER_ID = 'clerk_test_123';
const SELLER_ID = 'seller_test_123';
const CONTACT_JID = '5511999999999@s.whatsapp.net';

function getFutureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

function mockCalendarService(overrides: Record<string, any> = {}) {
  return {
    safeScheduleMeeting: vi.fn().mockResolvedValue({
      eventId: 'evt_123',
      htmlLink: 'https://calendar.google.com/event/123',
      meetLink: 'https://meet.google.com/abc-def-ghi',
      start: '2026-04-01T10:00:00-03:00',
      end: '2026-04-01T11:00:00-03:00',
      summary: 'Demo SalesBud',
    }),
    storePendingSchedule: vi.fn().mockResolvedValue('pending_123'),
    ...overrides,
  } as any;
}

function mockLeadService(overrides: Record<string, any> = {}) {
  return {
    findBySellerAndJid: vi.fn().mockResolvedValue({
      id: 'lead_123',
      status: LeadStatus.QUALIFIED,
    }),
    update: vi.fn().mockResolvedValue({}),
    ...overrides,
  } as any;
}

function createTool(
  calendarOverrides: Record<string, any> = {},
  leadOverrides: Record<string, any> = {},
) {
  return createScheduleMeetingTool(
    mockCalendarService(calendarOverrides),
    mockLeadService(leadOverrides),
    SELLER_ID,
    CLERK_USER_ID,
    CONTACT_JID,
    TIMEZONE,
  );
}

const validInput = (dateOverride?: string) => ({
  date: dateOverride ?? getFutureDate(3),
  start_time: '10:00',
  end_time: '11:00',
  summary: 'Demo SalesBud - Cliente',
});

describe('schedule_meeting tool', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('business hours validation', () => {
    it('rejects start time before 9h', async () => {
      const tool = createTool();
      const result = await tool.invoke({
        ...validInput(),
        start_time: '07:00',
        end_time: '08:00',
      });

      expect(result).toContain('fora do expediente comercial');
      expect(result).toContain('9h');
      expect(result).toContain('17h');
    });

    it('rejects end time after 17h', async () => {
      const tool = createTool();
      const result = await tool.invoke({
        ...validInput(),
        start_time: '16:00',
        end_time: '18:00',
      });

      expect(result).toContain('fora do expediente comercial');
    });

    it('rejects end time at 17:15', async () => {
      const tool = createTool();
      const result = await tool.invoke({
        ...validInput(),
        start_time: '16:00',
        end_time: '17:15',
      });

      expect(result).toContain('fora do expediente comercial');
    });

    it('accepts exactly 9h-17h range', async () => {
      const tool = createTool();
      const result = await tool.invoke({
        ...validInput(),
        start_time: '09:00',
        end_time: '17:00',
      });

      expect(result).toContain('agendada com sucesso');
    });

    it('accepts 14h-15h range', async () => {
      const tool = createTool();
      const result = await tool.invoke({
        ...validInput(),
        start_time: '14:00',
        end_time: '15:00',
      });

      expect(result).toContain('agendada com sucesso');
    });
  });

  describe('minimum lead time validation (8 hours)', () => {
    it('rejects a meeting scheduled too soon', async () => {
      const tool = createTool();

      // Try to schedule 2 hours from now
      const now = new Date();
      const soonDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const date = soonDate.toISOString().split('T')[0];
      const startTime = `${String(soonDate.getHours()).padStart(2, '0')}:${String(soonDate.getMinutes()).padStart(2, '0')}`;
      const endHour = soonDate.getHours() + 1;
      const endTime = `${String(endHour).padStart(2, '0')}:00`;

      const result = await tool.invoke({
        date,
        start_time: startTime,
        end_time: endTime,
        summary: 'Demo',
      });

      // Rejected by either business hours or lead time
      const isRejected =
        result.includes('Antecedência insuficiente') ||
        result.includes('fora do expediente');
      expect(isRejected).toBe(true);
    });

    it('accepts a meeting 3 days ahead', async () => {
      const tool = createTool();
      const result = await tool.invoke(validInput());

      expect(result).toContain('agendada com sucesso');
    });
  });

  describe('successful scheduling', () => {
    it('returns success message with Meet link', async () => {
      const tool = createTool();
      const result = await tool.invoke(validInput());

      expect(result).toContain('agendada com sucesso');
      expect(result).toContain('meet.google.com');
      expect(result).toContain('Demo SalesBud - Cliente');
    });

    it('auto-updates lead status to SCHEDULED', async () => {
      const leadService = mockLeadService();
      const tool = createScheduleMeetingTool(
        mockCalendarService(),
        leadService,
        SELLER_ID,
        CLERK_USER_ID,
        CONTACT_JID,
        TIMEZONE,
      );

      await tool.invoke(validInput());

      expect(leadService.findBySellerAndJid).toHaveBeenCalledWith(SELLER_ID, CONTACT_JID);
      expect(leadService.update).toHaveBeenCalledWith('lead_123', {
        status: LeadStatus.SCHEDULED,
      });
    });

    it('does not downgrade CONVERTED leads to SCHEDULED', async () => {
      const leadService = mockLeadService({
        findBySellerAndJid: vi.fn().mockResolvedValue({
          id: 'lead_123',
          status: LeadStatus.CONVERTED,
        }),
      });

      const tool = createScheduleMeetingTool(
        mockCalendarService(),
        leadService,
        SELLER_ID,
        CLERK_USER_ID,
        CONTACT_JID,
        TIMEZONE,
      );

      await tool.invoke(validInput());

      expect(leadService.update).not.toHaveBeenCalled();
    });
  });

  describe('conflict handling', () => {
    it('returns conflict message when slot is already taken', async () => {
      const tool = createTool({
        safeScheduleMeeting: vi.fn().mockRejectedValue(
          new CalendarConflictError('Já existe um compromisso neste horário'),
        ),
      });

      const result = await tool.invoke(validInput());

      expect(result).toContain('Não foi possível agendar');
      expect(result).toContain('sugira outro horário');
    });
  });

  describe('auth error handling', () => {
    it('returns auth error message when Google not connected', async () => {
      const tool = createTool({
        safeScheduleMeeting: vi.fn().mockRejectedValue(
          new CalendarAuthError('Token expired'),
        ),
      });

      const result = await tool.invoke(validInput());

      expect(result).toContain('conectar a conta Google');
    });
  });

  describe('transient error handling', () => {
    it('stores pending schedule on transient API errors', async () => {
      const calendarService = mockCalendarService({
        safeScheduleMeeting: vi.fn().mockRejectedValue(new Error('502 Bad Gateway')),
      });

      const tool = createScheduleMeetingTool(
        calendarService,
        mockLeadService(),
        SELLER_ID,
        CLERK_USER_ID,
        CONTACT_JID,
        TIMEZONE,
      );

      const result = await tool.invoke(validInput());

      expect(result).toContain('instabilidade temporária');
      expect(calendarService.storePendingSchedule).toHaveBeenCalled();
    });

    it('returns generic error when pending storage also fails', async () => {
      const tool = createTool({
        safeScheduleMeeting: vi.fn().mockRejectedValue(new Error('502')),
        storePendingSchedule: vi.fn().mockRejectedValue(new Error('Redis down')),
      });

      const result = await tool.invoke(validInput());

      expect(result).toContain('Erro ao agendar');
      expect(result).toContain('tentar novamente');
    });
  });

  describe('past date validation', () => {
    it('rejects dates in the past', async () => {
      const tool = createTool();
      const result = await tool.invoke({
        ...validInput('2020-01-01'),
      });

      expect(result).toContain('passado');
    });
  });
});
