import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// --- Mock tsyringe container before any imports that use it ---
const mockResolve = vi.fn();
vi.mock('tsyringe', () => ({
  container: { resolve: mockResolve, registerSingleton: vi.fn() },
  injectable: () => () => {},
  singleton: () => () => {},
  inject: () => () => {},
}));

vi.mock('../../config/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

// Mock @clerk/express to avoid auth in tests
vi.mock('@clerk/express', () => ({
  clerkMiddleware: () => (_req: any, _res: any, next: any) => next(),
}));

// Mock database module to avoid real DB connection
vi.mock('../../config/database.js', () => ({
  AppDataSource: {
    getRepository: vi.fn().mockReturnValue({}),
    initialize: vi.fn().mockResolvedValue(undefined),
  },
}));

// Import after mocks
const { webhookController } = await import('../webhook.controller.js');
const { uuidParam } = await import('../../middlewares/uuid-param.js');
const { catchAsync } = await import('../../utils/catch-async.js');

// Build a minimal app for testing the webhook route
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.post('/webhook/:sellerId', uuidParam('sellerId'), catchAsync(webhookController.handle));
  app.use((err: any, _req: any, res: any, _next: any) => {
    res.status(err.statusCode || 500).json({ error: err.message });
  });
  return app;
}

// --- Mock services ---
const SELLER_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const REMOTE_JID = '5511999999999@s.whatsapp.net';

function createMockServices() {
  return {
    sellerService: {
      findOne: vi.fn().mockResolvedValue({
        id: SELLER_ID,
        isActive: true,
        evolutionInstanceName: 'test-instance',
      }),
    },
    leadService: {
      upsertByRemoteJid: vi.fn().mockResolvedValue({}),
    },
    transcriptionService: {
      transcribeAudio: vi.fn().mockResolvedValue('Texto transcrito do audio'),
      describeImage: vi.fn().mockResolvedValue('Uma foto de produto'),
    },
    evolutionService: {
      getBase64FromMedia: vi.fn().mockResolvedValue('fetched-base64'),
    },
    messageBufferService: {
      addMessage: vi.fn().mockResolvedValue(undefined),
      pauseAgent: vi.fn().mockResolvedValue(undefined),
    },
  };
}

function setupMockResolve(mocks: ReturnType<typeof createMockServices>) {
  mockResolve.mockImplementation((token: any) => {
    const name = typeof token === 'function' ? token.name : String(token);
    const map: Record<string, any> = {
      SellerService: mocks.sellerService,
      LeadService: mocks.leadService,
      TranscriptionService: mocks.transcriptionService,
      EvolutionService: mocks.evolutionService,
      MessageBufferService: mocks.messageBufferService,
    };
    return map[name] || {};
  });
}

function makePayload(overrides: Record<string, any> = {}) {
  return {
    data: {
      key: {
        remoteJid: REMOTE_JID,
        fromMe: false,
        id: 'msg-id-123',
      },
      message: { conversation: 'Oi, quero saber o preço' },
      messageType: 'conversation',
      messageTimestamp: Date.now(),
      pushName: 'João',
      ...overrides,
    },
  };
}

describe('POST /webhook/:sellerId', () => {
  let app: ReturnType<typeof createTestApp>;
  let mocks: ReturnType<typeof createMockServices>;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks = createMockServices();
    setupMockResolve(mocks);
    app = createTestApp();
  });

  describe('request validation', () => {
    it('returns 400 for non-UUID sellerId', async () => {
      const res = await request(app)
        .post('/webhook/not-a-uuid')
        .send(makePayload());

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid UUID');
    });
  });

  describe('payload routing', () => {
    it('returns "ignored" when remoteJid is missing', async () => {
      const res = await request(app)
        .post(`/webhook/${SELLER_ID}`)
        .send({ data: { key: {}, message: {}, messageType: 'conversation', messageTimestamp: 123 } });

      expect(res.body.status).toBe('ignored');
    });

    it('returns "agent_paused" when fromMe is true', async () => {
      const payload = makePayload({ key: { remoteJid: REMOTE_JID, fromMe: true, id: 'msg-1' } });

      const res = await request(app)
        .post(`/webhook/${SELLER_ID}`)
        .send(payload);

      expect(res.body.status).toBe('agent_paused');
      expect(mocks.messageBufferService.pauseAgent).toHaveBeenCalledWith(SELLER_ID, REMOTE_JID);
    });

    it('returns "copilot_disabled" when seller is inactive', async () => {
      mocks.sellerService.findOne.mockResolvedValue({ id: SELLER_ID, isActive: false });

      const res = await request(app)
        .post(`/webhook/${SELLER_ID}`)
        .send(makePayload());

      expect(res.body.status).toBe('copilot_disabled');
    });

    it('returns "unsupported_type" for unknown message type', async () => {
      const res = await request(app)
        .post(`/webhook/${SELLER_ID}`)
        .send(makePayload({ messageType: 'stickerMessage' }));

      expect(res.body.status).toBe('unsupported_type');
    });
  });

  describe('text messages', () => {
    it('buffers conversation text and upserts lead', async () => {
      const res = await request(app)
        .post(`/webhook/${SELLER_ID}`)
        .send(makePayload());

      expect(res.body.status).toBe('buffered');
      expect(mocks.leadService.upsertByRemoteJid).toHaveBeenCalledWith(SELLER_ID, REMOTE_JID, 'João');
      expect(mocks.messageBufferService.addMessage).toHaveBeenCalledWith(
        SELLER_ID,
        REMOTE_JID,
        'Oi, quero saber o preço',
      );
    });

    it('buffers extendedTextMessage text', async () => {
      const res = await request(app)
        .post(`/webhook/${SELLER_ID}`)
        .send(
          makePayload({
            messageType: 'extendedTextMessage',
            message: { extendedTextMessage: { text: 'Texto com link http://example.com' } },
          }),
        );

      expect(res.body.status).toBe('buffered');
      expect(mocks.messageBufferService.addMessage).toHaveBeenCalledWith(
        SELLER_ID,
        REMOTE_JID,
        'Texto com link http://example.com',
      );
    });

    it('returns "no_text" when conversation is null', async () => {
      const res = await request(app)
        .post(`/webhook/${SELLER_ID}`)
        .send(makePayload({ message: { conversation: null } }));

      expect(res.body.status).toBe('no_text');
    });
  });

  describe('audio messages', () => {
    it('transcribes inline base64 audio and buffers the transcription', async () => {
      const res = await request(app)
        .post(`/webhook/${SELLER_ID}`)
        .send(
          makePayload({
            messageType: 'audioMessage',
            message: { audioMessage: { base64: 'audio-base64-data', mimetype: 'audio/ogg' } },
          }),
        );

      expect(res.body.status).toBe('buffered');
      expect(mocks.transcriptionService.transcribeAudio).toHaveBeenCalledWith('audio-base64-data', 'audio/ogg');
      expect(mocks.messageBufferService.addMessage).toHaveBeenCalledWith(
        SELLER_ID,
        REMOTE_JID,
        'Texto transcrito do audio',
      );
    });

    it('fetches base64 from Evolution API when not inline', async () => {
      const res = await request(app)
        .post(`/webhook/${SELLER_ID}`)
        .send(
          makePayload({
            messageType: 'audioMessage',
            message: { audioMessage: { mimetype: 'audio/ogg' } },
          }),
        );

      expect(res.body.status).toBe('buffered');
      expect(mocks.evolutionService.getBase64FromMedia).toHaveBeenCalledWith('test-instance', {
        id: 'msg-id-123',
        remoteJid: REMOTE_JID,
        fromMe: false,
      });
      expect(mocks.transcriptionService.transcribeAudio).toHaveBeenCalledWith('fetched-base64', 'audio/ogg');
    });

    it('returns "no_text" when audio has no base64 and Evolution fetch fails', async () => {
      mocks.sellerService.findOne.mockResolvedValue({
        id: SELLER_ID,
        isActive: true,
        evolutionInstanceName: null,
      });

      const res = await request(app)
        .post(`/webhook/${SELLER_ID}`)
        .send(
          makePayload({
            messageType: 'audioMessage',
            message: { audioMessage: {} },
          }),
        );

      expect(res.body.status).toBe('no_text');
    });
  });

  describe('image messages', () => {
    it('describes image and buffers without caption', async () => {
      const res = await request(app)
        .post(`/webhook/${SELLER_ID}`)
        .send(
          makePayload({
            messageType: 'imageMessage',
            message: { imageMessage: { base64: 'img-base64', mimetype: 'image/jpeg' } },
          }),
        );

      expect(res.body.status).toBe('buffered');
      expect(mocks.transcriptionService.describeImage).toHaveBeenCalledWith('img-base64', 'image/jpeg');
      expect(mocks.messageBufferService.addMessage).toHaveBeenCalledWith(
        SELLER_ID,
        REMOTE_JID,
        '[Imagem: Uma foto de produto]',
      );
    });

    it('combines caption with image description', async () => {
      const res = await request(app)
        .post(`/webhook/${SELLER_ID}`)
        .send(
          makePayload({
            messageType: 'imageMessage',
            message: {
              imageMessage: { base64: 'img-base64', mimetype: 'image/png', caption: 'Olha esse preço' },
            },
          }),
        );

      expect(res.body.status).toBe('buffered');
      expect(mocks.messageBufferService.addMessage).toHaveBeenCalledWith(
        SELLER_ID,
        REMOTE_JID,
        'Olha esse preço\n[Imagem: Uma foto de produto]',
      );
    });

    it('fetches image base64 from Evolution API when not inline', async () => {
      const res = await request(app)
        .post(`/webhook/${SELLER_ID}`)
        .send(
          makePayload({
            messageType: 'imageMessage',
            message: { imageMessage: { mimetype: 'image/jpeg' } },
          }),
        );

      expect(res.body.status).toBe('buffered');
      expect(mocks.evolutionService.getBase64FromMedia).toHaveBeenCalledWith('test-instance', {
        id: 'msg-id-123',
        remoteJid: REMOTE_JID,
        fromMe: false,
      });
      expect(mocks.transcriptionService.describeImage).toHaveBeenCalledWith('fetched-base64', 'image/jpeg');
    });
  });
});
