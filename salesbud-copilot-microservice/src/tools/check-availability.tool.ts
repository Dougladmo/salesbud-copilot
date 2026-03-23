import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { CalendarService } from '../services/calendar.service.js';
import { CalendarAuthError } from '../utils/calendar-errors.js';
import { logger } from '../config/logger.js';

const MIN_LEAD_TIME_HOURS = 8;
const BUSINESS_HOUR_START = 9;
const BUSINESS_HOUR_END = 17;

export function createCheckAvailabilityTool(
  calendarService: CalendarService,
  clerkUserId: string,
  timezone: string,
) {
  const today = new Date().toLocaleDateString('pt-BR', { timeZone: timezone });

  return new DynamicStructuredTool({
    name: 'check_availability',
    description:
      `Verifica a disponibilidade na agenda do vendedor. Use ANTES de sugerir ou confirmar qualquer horário de reunião. Retorna os horários ocupados e se o período solicitado está livre. A data de HOJE é ${today}. IMPORTANTE: Reuniões só podem ser agendadas em horário comercial (9h-17h), com pelo menos 8 horas de antecedência e com intervalo mínimo de 30 minutos entre reuniões.`,
    schema: z.object({
      date: z.string().describe(`Data para verificar no formato YYYY-MM-DD. Hoje é ${today}. Use o ano correto (${new Date().getFullYear()}).`),
      start_time: z
        .string()
        .describe('Hora de início no formato HH:mm (24h). Deve ser entre 09:00 e 17:00.'),
      end_time: z.string().describe('Hora de fim no formato HH:mm (24h). Deve ser entre 09:00 e 17:00.'),
      buffer_minutes: z
        .number()
        .optional()
        .default(30)
        .describe('Minutos de folga antes e depois do horário (padrão: 30)'),
    }),
    func: async ({ date, start_time, end_time, buffer_minutes }) => {
      try {
        // Validate date is not in the past
        const dateValidation = validateDate(date, timezone);
        if (dateValidation) return dateValidation;

        // Validate business hours
        const businessHoursValidation = validateBusinessHours(start_time, end_time);
        if (businessHoursValidation) return businessHoursValidation;

        // Validate minimum lead time
        const leadTimeValidation = validateMinLeadTime(date, start_time, timezone);
        if (leadTimeValidation) return leadTimeValidation;

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

        return `Horário JÁ OCUPADO — já existe compromisso(s) agendado(s) neste período ou dentro do intervalo mínimo de 30 minutos:\n${busyInfo}\n\nIsso NÃO é um erro técnico. O horário está reservado ou muito próximo de outro compromisso. Informe o cliente que esse horário já está ocupado e sugira 2-3 horários alternativos dentro do horário comercial (9h-17h) com pelo menos ${MIN_LEAD_TIME_HOURS}h de antecedência e 30min de intervalo entre reuniões.`;
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
  const todayFormatted = new Date().toLocaleDateString('pt-BR', { timeZone: timezone });
  const todayISO = toDateISO(timezone);
  if (date < todayISO) {
    return `Data inválida: ${date} é no passado. Hoje é ${todayFormatted}. Use uma data futura com o ano correto (${new Date().getFullYear()}).`;
  }
  return null;
}

function toDateISO(timezone: string): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  return parts; // returns YYYY-MM-DD
}

function validateBusinessHours(startTime: string, endTime: string): string | null {
  const [startH] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  if (startH < BUSINESS_HOUR_START || endH > BUSINESS_HOUR_END || (endH === BUSINESS_HOUR_END && endM > 0)) {
    return `Horário fora do expediente comercial. Reuniões só podem ser agendadas entre ${BUSINESS_HOUR_START}h e ${BUSINESS_HOUR_END}h. Informe o cliente e sugira um horário dentro desse período.`;
  }
  return null;
}

function validateMinLeadTime(date: string, startTime: string, timezone: string): string | null {
  const meetingDate = new Date(`${date}T${startTime}:00`);
  const now = new Date();
  const diffMs = meetingDate.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < MIN_LEAD_TIME_HOURS) {
    return `Antecedência insuficiente. Reuniões precisam ser agendadas com pelo menos ${MIN_LEAD_TIME_HOURS} horas de antecedência para que o vendedor tenha tempo de ver e se preparar. Informe o cliente e sugira um horário mais adiante.`;
  }
  return null;
}

function toISODateTime(
  date: string,
  time: string,
  timezone: string,
): string {
  const dateTimeStr = `${date}T${time}:00`;

  const formatter = new Intl.DateTimeFormat('pt-BR', {
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
