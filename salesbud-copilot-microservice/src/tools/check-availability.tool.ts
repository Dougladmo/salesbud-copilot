import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { CalendarService } from '../services/calendar.service.js';
import { CalendarAuthError } from '../utils/calendar-errors.js';
import { logger } from '../config/logger.js';

export function createCheckAvailabilityTool(
  calendarService: CalendarService,
  clerkUserId: string,
  timezone: string,
) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: timezone });

  return new DynamicStructuredTool({
    name: 'check_availability',
    description:
      `Verifica a disponibilidade na agenda do vendedor. Use ANTES de sugerir ou confirmar qualquer horário de reunião. Retorna os horários ocupados e se o período solicitado está livre. A data de HOJE é ${today}.`,
    schema: z.object({
      date: z.string().describe(`Data para verificar no formato YYYY-MM-DD. Hoje é ${today}. Use o ano correto (${new Date().getFullYear()}).`),
      start_time: z
        .string()
        .describe('Hora de início no formato HH:mm (24h)'),
      end_time: z.string().describe('Hora de fim no formato HH:mm (24h)'),
      buffer_minutes: z
        .number()
        .optional()
        .default(15)
        .describe('Minutos de folga antes e depois do horário (padrão: 15)'),
    }),
    func: async ({ date, start_time, end_time, buffer_minutes }) => {
      try {
        // Validate date is not in the past
        const dateValidation = validateDate(date, timezone);
        if (dateValidation) return dateValidation;

        const timeMin = toISODateTime(date, start_time, timezone);
        const timeMax = toISODateTime(date, end_time, timezone);

        const { available, busy } = await calendarService.checkAvailability({
          clerkUserId,
          timeMin,
          timeMax,
          timezone,
          bufferMinutes: buffer_minutes,
        });

        if (available) {
          return `Horário disponível: ${date} das ${start_time} às ${end_time}. Pode agendar neste horário.`;
        }

        const busyInfo = busy
          .map((slot) => {
            const s = new Date(slot.start).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: timezone,
            });
            const e = new Date(slot.end).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: timezone,
            });
            return `- ${s} às ${e}`;
          })
          .join('\n');

        return `Horário indisponível. Compromissos encontrados:\n${busyInfo}\n\nSugira um horário alternativo ao cliente.`;
      } catch (error: any) {
        if (error instanceof CalendarAuthError) {
          return 'O vendedor precisa conectar a conta Google no painel. Não é possível verificar a agenda no momento.';
        }
        logger.error(`check_availability error: ${error.message}`);
        return 'Erro ao verificar agenda. Continue a conversa normalmente.';
      }
    },
  });
}

function validateDate(date: string, timezone: string): string | null {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: timezone });
  if (date < today) {
    return `Data inválida: ${date} é no passado. Hoje é ${today}. Use uma data futura com o ano correto (${new Date().getFullYear()}).`;
  }
  return null;
}

function toISODateTime(
  date: string,
  time: string,
  timezone: string,
): string {
  const dateTimeStr = `${date}T${time}:00`;

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'longOffset',
  });

  const parts = formatter.formatToParts(new Date(dateTimeStr));
  const offsetPart = parts.find((p) => p.type === 'timeZoneName');
  const offset = offsetPart?.value ?? '';

  const tzOffset = offset.replace('GMT', '') || '+00:00';

  return `${dateTimeStr}${tzOffset}`;
}
