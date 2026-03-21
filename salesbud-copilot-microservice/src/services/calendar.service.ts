import { injectable } from 'tsyringe';
import { randomUUID } from 'node:crypto';
import { clerkClient } from '@clerk/express';
import { redis } from '../config/redis.js';
import { logger } from '../config/logger.js';
import {
  CalendarAuthError,
  CalendarConflictError,
  CalendarApiError,
} from '../utils/calendar-errors.js';

const GOOGLE_CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3';
const LOCK_TTL_MS = 10_000;
const IDEMPOTENCY_TTL_SECONDS = 86_400; // 24h
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1_000;
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const PENDING_SCHEDULE_TTL_SECONDS = 3_600; // 1h

export interface PendingSchedule {
  sellerId: string;
  clerkUserId: string;
  contactJid: string;
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  timezone: string;
  attendeeEmail?: string;
  retryCount: number;
  createdAt: string;
}

export interface BusySlot {
  start: string;
  end: string;
}

export interface CalendarEvent {
  eventId: string;
  htmlLink: string;
  meetLink: string;
  start: string;
  end: string;
  summary: string;
}

interface CheckAvailabilityParams {
  clerkUserId: string;
  timeMin: string;
  timeMax: string;
  timezone: string;
  bufferMinutes?: number;
}

interface SafeScheduleParams {
  sellerId: string;
  clerkUserId: string;
  contactJid: string;
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  timezone: string;
  attendeeEmail?: string;
  bufferMinutes?: number;
}

@injectable()
export class CalendarService {
  // ─── Token Retrieval ───

  private async getGoogleAccessToken(clerkUserId: string): Promise<string> {
    try {
      const response = await clerkClient.users.getUserOauthAccessToken(
        clerkUserId,
        'google',
      );

      const tokens = response.data;
      if (!tokens || tokens.length === 0 || !tokens[0].token) {
        throw new CalendarAuthError(
          'Conta Google não conectada. O vendedor precisa vincular o Google no painel.',
        );
      }

      return tokens[0].token;
    } catch (error: any) {
      if (error instanceof CalendarAuthError) throw error;
      logger.error(`Clerk OAuth token error: ${error.message}`);
      throw new CalendarAuthError(
        'Erro ao obter token Google. O vendedor precisa reconectar a conta Google.',
      );
    }
  }

  // ─── Google API Request Wrapper with Retry ───

  private async googleApiRequest<T>(
    token: string,
    method: string,
    url: string,
    body?: unknown,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1) + Math.random() * 500;
        logger.info(`Google Calendar API retry ${attempt}/${MAX_RETRIES} after ${Math.round(delay)}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      try {
        const response = await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        if (response.ok) {
          if (method === 'DELETE') return undefined as T;
          return response.json() as T;
        }

        const status = response.status;
        const errorBody = await response.text().catch(() => '');

        // Non-retryable errors — throw immediately
        if (status === 401) {
          throw new CalendarAuthError(
            'Token Google expirado. O vendedor precisa reconectar a conta Google.',
          );
        }
        if (status === 403) {
          throw new CalendarApiError(
            'Sem permissão para acessar o Google Calendar. Verifique os escopos OAuth.',
            403,
          );
        }
        if (status === 409) {
          throw new CalendarConflictError('Conflito detectado pelo Google Calendar.');
        }

        // Retryable errors — retry if attempts remain
        if (RETRYABLE_STATUS_CODES.has(status)) {
          lastError = new CalendarApiError(`Erro na API do Google Calendar: ${status}`);
          logger.warn(`Google Calendar API retryable error: status=${status} attempt=${attempt + 1}/${MAX_RETRIES + 1}`);
          continue;
        }

        // Unknown error — throw immediately
        logger.error(`Google Calendar API error: status=${status} body=${errorBody}`);
        throw new CalendarApiError(`Erro na API do Google Calendar: ${status}`);
      } catch (error: any) {
        // Network errors (ECONNRESET, timeout, etc.) are retryable
        if (
          error instanceof CalendarAuthError ||
          error instanceof CalendarConflictError ||
          (error instanceof CalendarApiError && !RETRYABLE_STATUS_CODES.has(error.statusCode))
        ) {
          throw error;
        }

        lastError = error;
        logger.warn(`Google Calendar API network error: ${error.message} attempt=${attempt + 1}/${MAX_RETRIES + 1}`);
      }
    }

    throw lastError ?? new CalendarApiError('Erro na API do Google Calendar após todas as tentativas.');
  }

  // ─── Redis Distributed Lock ───

  private async acquireLock(lockKey: string): Promise<boolean> {
    const result = await redis.set(lockKey, 'locked', 'PX', LOCK_TTL_MS, 'NX');
    return result === 'OK';
  }

  private async releaseLock(lockKey: string): Promise<void> {
    await redis.del(lockKey);
  }

  // ─── Idempotency ───

  private async checkIdempotency(key: string): Promise<CalendarEvent | null> {
    const cached = await redis.get(key);
    if (!cached) return null;
    return JSON.parse(cached) as CalendarEvent;
  }

  private async storeIdempotency(key: string, event: CalendarEvent): Promise<void> {
    await redis.set(key, JSON.stringify(event), 'EX', IDEMPOTENCY_TTL_SECONDS);
  }

  // ─── Public: Check Availability ───

  async checkAvailability(params: CheckAvailabilityParams): Promise<{
    busy: BusySlot[];
    available: boolean;
  }> {
    const { clerkUserId, timeMin, timeMax, timezone, bufferMinutes = 15 } = params;
    const token = await this.getGoogleAccessToken(clerkUserId);

    const bufferedMin = new Date(
      new Date(timeMin).getTime() - bufferMinutes * 60_000,
    ).toISOString();
    const bufferedMax = new Date(
      new Date(timeMax).getTime() + bufferMinutes * 60_000,
    ).toISOString();

    const freeBusyResponse = await this.googleApiRequest<{
      calendars: { primary: { busy: BusySlot[] } };
    }>(token, 'POST', `${GOOGLE_CALENDAR_BASE}/freeBusy`, {
      timeMin: bufferedMin,
      timeMax: bufferedMax,
      timeZone: timezone,
      items: [{ id: 'primary' }],
    });

    const busySlots = freeBusyResponse.calendars.primary.busy ?? [];

    const requestedStart = new Date(timeMin).getTime();
    const requestedEnd = new Date(timeMax).getTime();

    const hasOverlap = busySlots.some((slot) => {
      const slotStart = new Date(slot.start).getTime();
      const slotEnd = new Date(slot.end).getTime();
      return slotStart < requestedEnd && slotEnd > requestedStart;
    });

    return { busy: busySlots, available: !hasOverlap };
  }

  // ─── Public: Safe Schedule Meeting ───

  async safeScheduleMeeting(params: SafeScheduleParams): Promise<CalendarEvent> {
    const {
      sellerId,
      clerkUserId,
      contactJid,
      summary,
      description,
      startDateTime,
      endDateTime,
      timezone,
      attendeeEmail,
      bufferMinutes = 15,
    } = params;

    // 1. Idempotency check
    const idemKey = `cal:idem:${sellerId}:${contactJid}:${startDateTime}`;
    const cached = await this.checkIdempotency(idemKey);
    if (cached) {
      logger.info(`Calendar idempotency hit: ${idemKey}`);
      return cached;
    }

    // 2. Acquire distributed lock
    const lockKey = `cal:lock:${clerkUserId}:${startDateTime}`;
    const locked = await this.acquireLock(lockKey);
    if (!locked) {
      throw new CalendarConflictError(
        'Horário em processo de agendamento por outra solicitação. Tente novamente em alguns segundos.',
      );
    }

    try {
      // 3. PRE-CHECK: Verify availability with buffer
      const { available, busy } = await this.checkAvailability({
        clerkUserId,
        timeMin: startDateTime,
        timeMax: endDateTime,
        timezone,
        bufferMinutes,
      });

      if (!available) {
        const busyInfo = busy
          .map((s) => {
            const start = new Date(s.start).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: timezone,
            });
            const end = new Date(s.end).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: timezone,
            });
            return `${start} - ${end}`;
          })
          .join(', ');
        throw new CalendarConflictError(
          `Horário indisponível. Compromissos encontrados: ${busyInfo}`,
        );
      }

      // 4. CREATE: Google Calendar event with Meet
      const token = await this.getGoogleAccessToken(clerkUserId);
      const requestId = randomUUID();

      const eventBody: Record<string, unknown> = {
        summary,
        description: description ?? '',
        start: { dateTime: startDateTime, timeZone: timezone },
        end: { dateTime: endDateTime, timeZone: timezone },
        conferenceData: {
          createRequest: {
            requestId,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      };

      if (attendeeEmail) {
        eventBody.attendees = [{ email: attendeeEmail }];
      }

      const created = await this.googleApiRequest<{
        id: string;
        htmlLink: string;
        hangoutLink?: string;
        conferenceData?: {
          entryPoints?: Array<{ entryPointType: string; uri: string }>;
        };
        start: { dateTime: string };
        end: { dateTime: string };
        summary: string;
      }>(
        token,
        'POST',
        `${GOOGLE_CALENDAR_BASE}/calendars/primary/events?conferenceDataVersion=1`,
        eventBody,
      );

      const meetLink =
        created.hangoutLink ??
        created.conferenceData?.entryPoints?.find(
          (ep) => ep.entryPointType === 'video',
        )?.uri ??
        '';

      const calendarEvent: CalendarEvent = {
        eventId: created.id,
        htmlLink: created.htmlLink,
        meetLink,
        start: created.start.dateTime,
        end: created.end.dateTime,
        summary: created.summary,
      };

      // 5. POST-CHECK: Recheck for race conditions
      const recheck = await this.checkAvailability({
        clerkUserId,
        timeMin: startDateTime,
        timeMax: endDateTime,
        timezone,
        bufferMinutes: 0,
      });

      // If there's more than 1 busy slot overlapping (our event + another), rollback
      const overlappingSlots = recheck.busy.filter((slot) => {
        const slotStart = new Date(slot.start).getTime();
        const slotEnd = new Date(slot.end).getTime();
        const reqStart = new Date(startDateTime).getTime();
        const reqEnd = new Date(endDateTime).getTime();
        return slotStart < reqEnd && slotEnd > reqStart;
      });

      if (overlappingSlots.length > 1) {
        logger.warn(
          `Calendar post-check conflict detected: ${overlappingSlots.length} overlapping slots. Rolling back event ${created.id}`,
        );
        await this.deleteEvent(clerkUserId, created.id);
        throw new CalendarConflictError(
          'Conflito detectado após agendamento. Evento cancelado. Tente outro horário.',
        );
      }

      // 6. Store idempotency and return
      await this.storeIdempotency(idemKey, calendarEvent);

      logger.info(
        `Meeting scheduled: seller=${sellerId} event=${created.id} meet=${meetLink}`,
      );

      return calendarEvent;
    } finally {
      await this.releaseLock(lockKey);
    }
  }

  // ─── Public: Pending Schedule (Fallback) ───

  async storePendingSchedule(params: SafeScheduleParams): Promise<string> {
    const pendingKey = `cal:pending:${params.sellerId}:${params.contactJid}:${params.startDateTime}`;
    const pending: PendingSchedule = {
      ...params,
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };
    await redis.set(pendingKey, JSON.stringify(pending), 'EX', PENDING_SCHEDULE_TTL_SECONDS);
    logger.info(`Pending schedule stored: ${pendingKey}`);
    return pendingKey;
  }

  async retryPendingSchedules(): Promise<void> {
    const keys = await redis.keys('cal:pending:*');
    if (keys.length === 0) return;

    logger.info(`Retrying ${keys.length} pending schedules`);

    for (const key of keys) {
      const raw = await redis.get(key);
      if (!raw) continue;

      const pending = JSON.parse(raw) as PendingSchedule;

      // Skip if meeting time has already passed
      if (new Date(pending.startDateTime).getTime() < Date.now()) {
        logger.info(`Pending schedule expired (meeting time passed): ${key}`);
        await redis.del(key);
        continue;
      }

      // Max 5 retry attempts
      if (pending.retryCount >= 5) {
        logger.warn(`Pending schedule max retries reached: ${key}`);
        await redis.del(key);
        continue;
      }

      try {
        await this.safeScheduleMeeting(pending);
        await redis.del(key);
        logger.info(`Pending schedule succeeded on retry: ${key}`);
      } catch (error: any) {
        // Auth/permission errors — no point retrying
        if (error instanceof CalendarAuthError) {
          logger.warn(`Pending schedule auth error, removing: ${key}`);
          await redis.del(key);
          continue;
        }

        pending.retryCount += 1;
        await redis.set(key, JSON.stringify(pending), 'EX', PENDING_SCHEDULE_TTL_SECONDS);
        logger.warn(`Pending schedule retry ${pending.retryCount} failed: ${key} error=${error.message}`);
      }
    }
  }

  // ─── Public: Delete Event (rollback) ───

  async deleteEvent(clerkUserId: string, eventId: string): Promise<void> {
    const token = await this.getGoogleAccessToken(clerkUserId);
    await this.googleApiRequest<void>(
      token,
      'DELETE',
      `${GOOGLE_CALENDAR_BASE}/calendars/primary/events/${eventId}`,
    );
    logger.info(`Calendar event deleted (rollback): ${eventId}`);
  }
}
