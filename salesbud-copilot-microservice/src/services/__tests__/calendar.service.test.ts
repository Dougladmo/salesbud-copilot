import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CalendarService } from '../calendar.service.js';

// Mock redis
vi.mock('../../config/redis.js', () => ({
  redis: {
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(1),
    keys: vi.fn().mockResolvedValue([]),
  },
}));

// Mock logger
vi.mock('../../config/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock clerkClient
vi.mock('@clerk/express', () => ({
  clerkClient: {
    users: {
      getUserOauthAccessToken: vi.fn().mockResolvedValue({
        data: [{ token: 'mock-google-token' }],
      }),
    },
  },
}));

const TIMEZONE = 'America/Sao_Paulo';
const CLERK_USER_ID = 'clerk_test_123';

describe('CalendarService.checkAvailability — 30min buffer gap', () => {
  let service: CalendarService;

  beforeEach(() => {
    vi.restoreAllMocks();
    service = new CalendarService();
  });

  function stubGoogleApiRequest(busySlots: Array<{ start: string; end: string }>) {
    // Spy on the private googleApiRequest method
    vi.spyOn(service as any, 'googleApiRequest').mockResolvedValue({
      calendars: {
        primary: {
          busy: busySlots,
        },
      },
    });
    // Spy on private getGoogleAccessToken
    vi.spyOn(service as any, 'getGoogleAccessToken').mockResolvedValue('mock-token');
  }

  describe('rejects scheduling within 30min buffer of existing meetings', () => {
    it('rejects meeting starting exactly when another ends (0min gap)', async () => {
      // Existing meeting: 13:00-14:00
      // Requested: 14:00-15:00 → should be REJECTED (0min gap < 30min)
      stubGoogleApiRequest([
        { start: '2026-04-01T13:00:00-03:00', end: '2026-04-01T14:00:00-03:00' },
      ]);

      const result = await service.checkAvailability({
        clerkUserId: CLERK_USER_ID,
        timeMin: '2026-04-01T14:00:00-03:00',
        timeMax: '2026-04-01T15:00:00-03:00',
        timezone: TIMEZONE,
      });

      expect(result.available).toBe(false);
    });

    it('rejects meeting starting 15min after another ends (15min gap < 30min)', async () => {
      stubGoogleApiRequest([
        { start: '2026-04-01T13:00:00-03:00', end: '2026-04-01T14:00:00-03:00' },
      ]);

      const result = await service.checkAvailability({
        clerkUserId: CLERK_USER_ID,
        timeMin: '2026-04-01T14:15:00-03:00',
        timeMax: '2026-04-01T15:15:00-03:00',
        timezone: TIMEZONE,
      });

      expect(result.available).toBe(false);
    });

    it('rejects meeting starting 29min after another ends (29min gap < 30min)', async () => {
      stubGoogleApiRequest([
        { start: '2026-04-01T13:00:00-03:00', end: '2026-04-01T14:00:00-03:00' },
      ]);

      const result = await service.checkAvailability({
        clerkUserId: CLERK_USER_ID,
        timeMin: '2026-04-01T14:29:00-03:00',
        timeMax: '2026-04-01T15:29:00-03:00',
        timezone: TIMEZONE,
      });

      expect(result.available).toBe(false);
    });

    it('accepts meeting starting exactly 30min after another ends', async () => {
      stubGoogleApiRequest([
        { start: '2026-04-01T13:00:00-03:00', end: '2026-04-01T14:00:00-03:00' },
      ]);

      const result = await service.checkAvailability({
        clerkUserId: CLERK_USER_ID,
        timeMin: '2026-04-01T14:30:00-03:00',
        timeMax: '2026-04-01T15:30:00-03:00',
        timezone: TIMEZONE,
      });

      expect(result.available).toBe(true);
    });

    it('accepts meeting starting 45min after another ends', async () => {
      stubGoogleApiRequest([
        { start: '2026-04-01T13:00:00-03:00', end: '2026-04-01T14:00:00-03:00' },
      ]);

      const result = await service.checkAvailability({
        clerkUserId: CLERK_USER_ID,
        timeMin: '2026-04-01T14:45:00-03:00',
        timeMax: '2026-04-01T15:45:00-03:00',
        timezone: TIMEZONE,
      });

      expect(result.available).toBe(true);
    });
  });

  describe('rejects scheduling within 30min buffer BEFORE existing meetings', () => {
    it('rejects meeting ending exactly when another starts (0min gap)', async () => {
      stubGoogleApiRequest([
        { start: '2026-04-01T15:00:00-03:00', end: '2026-04-01T16:00:00-03:00' },
      ]);

      const result = await service.checkAvailability({
        clerkUserId: CLERK_USER_ID,
        timeMin: '2026-04-01T14:00:00-03:00',
        timeMax: '2026-04-01T15:00:00-03:00',
        timezone: TIMEZONE,
      });

      expect(result.available).toBe(false);
    });

    it('rejects meeting ending 10min before another starts (10min gap < 30min)', async () => {
      stubGoogleApiRequest([
        { start: '2026-04-01T15:00:00-03:00', end: '2026-04-01T16:00:00-03:00' },
      ]);

      const result = await service.checkAvailability({
        clerkUserId: CLERK_USER_ID,
        timeMin: '2026-04-01T13:50:00-03:00',
        timeMax: '2026-04-01T14:50:00-03:00',
        timezone: TIMEZONE,
      });

      expect(result.available).toBe(false);
    });

    it('accepts meeting ending 30min before another starts', async () => {
      stubGoogleApiRequest([
        { start: '2026-04-01T15:00:00-03:00', end: '2026-04-01T16:00:00-03:00' },
      ]);

      const result = await service.checkAvailability({
        clerkUserId: CLERK_USER_ID,
        timeMin: '2026-04-01T13:30:00-03:00',
        timeMax: '2026-04-01T14:30:00-03:00',
        timezone: TIMEZONE,
      });

      expect(result.available).toBe(true);
    });
  });

  describe('handles multiple existing meetings', () => {
    it('rejects when squeezed between two meetings without enough gap', async () => {
      // Existing: 10:00-11:00 and 12:00-13:00
      // Requested: 11:15-11:45 → REJECTED (15min after first < 30min)
      stubGoogleApiRequest([
        { start: '2026-04-01T10:00:00-03:00', end: '2026-04-01T11:00:00-03:00' },
        { start: '2026-04-01T12:00:00-03:00', end: '2026-04-01T13:00:00-03:00' },
      ]);

      const result = await service.checkAvailability({
        clerkUserId: CLERK_USER_ID,
        timeMin: '2026-04-01T11:15:00-03:00',
        timeMax: '2026-04-01T11:45:00-03:00',
        timezone: TIMEZONE,
      });

      expect(result.available).toBe(false);
    });

    it('accepts when there is enough gap between two meetings', async () => {
      // Existing: 09:00-10:00 and 12:00-13:00
      // Requested: 10:30-11:30 → ACCEPTED (30min after first, 30min before second)
      stubGoogleApiRequest([
        { start: '2026-04-01T09:00:00-03:00', end: '2026-04-01T10:00:00-03:00' },
        { start: '2026-04-01T12:00:00-03:00', end: '2026-04-01T13:00:00-03:00' },
      ]);

      const result = await service.checkAvailability({
        clerkUserId: CLERK_USER_ID,
        timeMin: '2026-04-01T10:30:00-03:00',
        timeMax: '2026-04-01T11:30:00-03:00',
        timezone: TIMEZONE,
      });

      expect(result.available).toBe(true);
    });
  });

  describe('direct overlap still detected', () => {
    it('rejects meeting that directly overlaps with existing', async () => {
      stubGoogleApiRequest([
        { start: '2026-04-01T10:00:00-03:00', end: '2026-04-01T11:00:00-03:00' },
      ]);

      const result = await service.checkAvailability({
        clerkUserId: CLERK_USER_ID,
        timeMin: '2026-04-01T10:30:00-03:00',
        timeMax: '2026-04-01T11:30:00-03:00',
        timezone: TIMEZONE,
      });

      expect(result.available).toBe(false);
    });
  });

  describe('no existing meetings', () => {
    it('accepts any time when calendar is empty', async () => {
      stubGoogleApiRequest([]);

      const result = await service.checkAvailability({
        clerkUserId: CLERK_USER_ID,
        timeMin: '2026-04-01T10:00:00-03:00',
        timeMax: '2026-04-01T11:00:00-03:00',
        timezone: TIMEZONE,
      });

      expect(result.available).toBe(true);
    });
  });

  describe('custom buffer override', () => {
    it('uses custom bufferMinutes when provided', async () => {
      // Existing: 13:00-14:00
      // Requested: 14:10-15:10 with 10min buffer → ACCEPTED (10min gap >= 10min)
      stubGoogleApiRequest([
        { start: '2026-04-01T13:00:00-03:00', end: '2026-04-01T14:00:00-03:00' },
      ]);

      const result = await service.checkAvailability({
        clerkUserId: CLERK_USER_ID,
        timeMin: '2026-04-01T14:10:00-03:00',
        timeMax: '2026-04-01T15:10:00-03:00',
        timezone: TIMEZONE,
        bufferMinutes: 10,
      });

      expect(result.available).toBe(true);
    });

    it('rejects with custom bufferMinutes when gap is insufficient', async () => {
      // Existing: 13:00-14:00
      // Requested: 14:05-15:05 with 10min buffer → REJECTED (5min gap < 10min)
      stubGoogleApiRequest([
        { start: '2026-04-01T13:00:00-03:00', end: '2026-04-01T14:00:00-03:00' },
      ]);

      const result = await service.checkAvailability({
        clerkUserId: CLERK_USER_ID,
        timeMin: '2026-04-01T14:05:00-03:00',
        timeMax: '2026-04-01T15:05:00-03:00',
        timezone: TIMEZONE,
        bufferMinutes: 10,
      });

      expect(result.available).toBe(false);
    });
  });
});
