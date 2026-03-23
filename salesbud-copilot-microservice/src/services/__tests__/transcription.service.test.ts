import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreate = vi.fn();

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  })),
}));

vi.mock('../../config/env.js', () => ({
  env: { OPENROUTER_API_KEY: 'test-key' },
}));

vi.mock('../../config/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

// Import after mocks are set up
const { TranscriptionService } = await import('../transcription.service.js');

describe('TranscriptionService', () => {
  let service: InstanceType<typeof TranscriptionService>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TranscriptionService();
  });

  describe('transcribeAudio', () => {
    it('sends audio to Gemini with correct format and returns transcription', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Olá, quero saber o preço do plano' } }],
      });

      const result = await service.transcribeAudio('base64audiodata', 'audio/ogg');

      expect(result).toBe('Olá, quero saber o preço do plano');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'google/gemini-2.5-flash',
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.arrayContaining([
                expect.objectContaining({ type: 'input_audio', input_audio: { data: 'base64audiodata', format: 'ogg' } }),
              ]),
            }),
          ]),
        }),
      );
    });

    it('maps audio/mp4 mimetype to m4a format', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Transcribed' } }],
      });

      await service.transcribeAudio('data', 'audio/mp4');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.arrayContaining([
                expect.objectContaining({ input_audio: { data: 'data', format: 'm4a' } }),
              ]),
            }),
          ]),
        }),
      );
    });

    it('defaults to ogg format when mimetype is unknown or missing', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Transcribed' } }],
      });

      // No mimetype
      await service.transcribeAudio('data');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.arrayContaining([
                expect.objectContaining({ input_audio: { data: 'data', format: 'ogg' } }),
              ]),
            }),
          ]),
        }),
      );

      mockCreate.mockClear();

      // Unknown mimetype
      await service.transcribeAudio('data', 'audio/unknown-format');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.arrayContaining([
                expect.objectContaining({ input_audio: { data: 'data', format: 'ogg' } }),
              ]),
            }),
          ]),
        }),
      );
    });

    it('returns "[Audio vazio]" when API returns empty content', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      const result = await service.transcribeAudio('data', 'audio/ogg');
      expect(result).toBe('[Audio vazio]');
    });

    it('returns fallback message on API error', async () => {
      mockCreate.mockRejectedValue(new Error('API timeout'));

      const result = await service.transcribeAudio('data', 'audio/ogg');
      expect(result).toBe('[Audio nao pode ser transcrito]');
    });
  });

  describe('describeImage', () => {
    it('sends image as data URL to GPT-4o and returns description', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Uma foto de um produto eletrônico' } }],
      });

      const result = await service.describeImage('imgbase64data', 'image/png');

      expect(result).toBe('Uma foto de um produto eletrônico');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'openai/gpt-4o',
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.arrayContaining([
                expect.objectContaining({
                  type: 'image_url',
                  image_url: { url: 'data:image/png;base64,imgbase64data' },
                }),
              ]),
            }),
          ]),
        }),
      );
    });

    it('defaults to image/jpeg when mimetype not provided', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Descrição' } }],
      });

      await service.describeImage('imgdata');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.arrayContaining([
                expect.objectContaining({
                  image_url: { url: 'data:image/jpeg;base64,imgdata' },
                }),
              ]),
            }),
          ]),
        }),
      );
    });

    it('returns fallback message on API error', async () => {
      mockCreate.mockRejectedValue(new Error('Rate limited'));

      const result = await service.describeImage('imgdata', 'image/png');
      expect(result).toBe('[Imagem nao pode ser descrita]');
    });
  });
});
