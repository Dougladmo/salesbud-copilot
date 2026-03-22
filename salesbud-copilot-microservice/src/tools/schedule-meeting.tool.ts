import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { CalendarService } from '../services/calendar.service.js';
import type { LeadService } from '../services/lead.service.js';
import {
  CalendarAuthError,
  CalendarConflictError,
  CalendarApiError,
} from '../utils/calendar-errors.js';
import { LeadStatus } from '../models/lead.model.js';
import { logger } from '../config/logger.js';

export function createScheduleMeetingTool(
  calendarService: CalendarService,
  leadService: LeadService,
  sellerId: string,
  clerkUserId: string,
  contactJid: string,
  timezone: string,
) {
  const today = new Date().toLocaleDateString('pt-BR', { timeZone: timezone });
  const currentYear = new Date().getFullYear();

  return new DynamicStructuredTool({
    name: 'schedule_meeting',
    description:
      `Agenda uma reunião com link do Google Meet no calendário do vendedor. SEMPRE use check_availability antes para verificar se o horário está livre. Cria automaticamente um link do Google Meet para a reunião. A data de HOJE é ${today}.`,
    schema: z.object({
      date: z.string().describe(`Data da reunião no formato YYYY-MM-DD. Hoje é ${today}. Use o ano correto (${currentYear}).`),
      start_time: z
        .string()
        .describe('Hora de início no formato HH:mm (24h)'),
      end_time: z.string().describe('Hora de fim no formato HH:mm (24h)'),
      summary: z
        .string()
        .describe(
          'Título da reunião (ex: "Demonstração SalesBud - João")',
        ),
      description: z
        .string()
        .optional()
        .describe('Descrição ou pauta da reunião'),
      attendee_email: z
        .string()
        .email()
        .optional()
        .describe('Email do participante para enviar convite pelo Google Calendar. SEMPRE inclua o email do lead se ele forneceu durante a conversa.'),
    }),
    func: async ({
      date,
      start_time,
      end_time,
      summary,
      description,
      attendee_email,
    }) => {
      // Validate date is not in the past
      if (date < today) {
        return `Data inválida: ${date} é no passado. Hoje é ${today}. Use uma data futura com o ano correto (${currentYear}).`;
      }

      const startDateTime = toISODateTime(date, start_time, timezone);
      const endDateTime = toISODateTime(date, end_time, timezone);

      try {

        const event = await calendarService.safeScheduleMeeting({
          sellerId,
          clerkUserId,
          contactJid,
          summary,
          description,
          startDateTime,
          endDateTime,
          timezone,
          attendeeEmail: attendee_email,
        });

        // Auto-update lead status to SCHEDULED
        try {
          const lead = await leadService.findBySellerAndJid(sellerId, contactJid);
          if (lead && lead.status !== LeadStatus.CONVERTED) {
            await leadService.update(lead.id, { status: LeadStatus.SCHEDULED });
            logger.info(`Lead status auto-updated to SCHEDULED: seller=${sellerId} jid=${contactJid}`);
          }
        } catch (statusError: any) {
          logger.warn(`Failed to auto-update lead status: ${statusError.message}`);
        }

        const parts = [
          'Reunião agendada com sucesso!',
          `Data: ${date} das ${start_time} às ${end_time}`,
          `Título: ${summary}`,
        ];

        if (event.meetLink) {
          parts.push(`Link do Meet: ${event.meetLink}`);
        }

        parts.push('Compartilhe o link com o cliente.');

        return parts.join('\n');
      } catch (error: any) {
        if (error instanceof CalendarConflictError) {
          return `Não foi possível agendar: ${error.message}. Verifique a disponibilidade e sugira outro horário.`;
        }
        if (error instanceof CalendarAuthError) {
          return 'O vendedor precisa conectar a conta Google no painel. Não é possível agendar no momento.';
        }

        // Transient error — store as pending for automatic retry
        logger.error(`schedule_meeting error, storing as pending: ${error.message}`);
        try {
          await calendarService.storePendingSchedule({
            sellerId,
            clerkUserId,
            contactJid,
            summary,
            description,
            startDateTime,
            endDateTime,
            timezone,
            attendeeEmail: attendee_email,
          });
          return `Houve uma instabilidade temporária ao agendar. O agendamento foi salvo e será processado automaticamente em breve. Confirme ao cliente que a reunião está sendo agendada para ${date} das ${start_time} às ${end_time}.`;
        } catch (pendingError: any) {
          logger.error(`Failed to store pending schedule: ${pendingError.message}`);
          return 'Erro ao agendar reunião. Peça ao cliente para tentar novamente em alguns minutos.';
        }
      }
    },
  });
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
