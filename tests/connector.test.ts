import { describe, it, expect, vi, beforeEach } from 'vitest';
import connector, { extractVideoId } from '../connector/index';

// ── extractVideoId ────────────────────────────────────────────────

describe('extractVideoId', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtube.com/watch?v=dQw4w9WgXcQ&t=42', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ])('extracts video ID from %s', (url, expected) => {
    expect(extractVideoId(url)).toBe(expected);
  });

  it.each([
    ['https://vimeo.com/123456789'],
    ['https://youtube.com/channel/UCfoo'],
    ['https://youtube.com/playlist?list=PLfoo'],
    ['not a url'],
    [''],
  ])('returns null for non-video URL: %s', (url) => {
    expect(extractVideoId(url)).toBeNull();
  });
});

// ── onApiCall handler ─────────────────────────────────────────────

const makeMockSdk = () => ({
  emit: vi.fn(),
  onApiCall: vi.fn(),
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
});

type MockSdk = ReturnType<typeof makeMockSdk>;
type ApiHandler = (call: { action: string; body: unknown }) => Promise<unknown>;

function captureHandler(sdk: MockSdk): ApiHandler {
  connector(sdk as never);
  return sdk.onApiCall.mock.calls[0][0] as ApiHandler;
}

describe('connector onApiCall', () => {
  let sdk: MockSdk;
  let handler: ApiHandler;

  beforeEach(() => {
    sdk = makeMockSdk();
    handler = captureHandler(sdk);
  });

  describe('play', () => {
    it('emits command with extracted videoId for valid URL', async () => {
      const result = await handler({
        action: 'play',
        body: { widgetId: 'kitchen-tv', url: 'https://youtu.be/dQw4w9WgXcQ' },
      });

      expect(result).toEqual({ ok: true });
      expect(sdk.emit).toHaveBeenCalledWith('hubble-youtube:data', {
        action: 'play',
        videoId: 'dQw4w9WgXcQ',
        targetWidgetId: 'kitchen-tv',
      });
    });

    it('returns error for invalid YouTube URL and does not emit', async () => {
      const result = await handler({
        action: 'play',
        body: { widgetId: 'kitchen-tv', url: 'https://vimeo.com/12345' },
      });

      expect(result).toEqual({ error: 'Invalid YouTube URL' });
      expect(sdk.emit).not.toHaveBeenCalled();
    });

    it('returns error when url is missing', async () => {
      const result = await handler({
        action: 'play',
        body: { widgetId: 'kitchen-tv' },
      });

      expect(result).toEqual({ error: 'url is required' });
      expect(sdk.emit).not.toHaveBeenCalled();
    });
  });

  describe('pause', () => {
    it('emits pause command', async () => {
      const result = await handler({
        action: 'pause',
        body: { widgetId: 'kitchen-tv' },
      });

      expect(result).toEqual({ ok: true });
      expect(sdk.emit).toHaveBeenCalledWith('hubble-youtube:data', {
        action: 'pause',
        targetWidgetId: 'kitchen-tv',
      });
    });
  });

  describe('stop', () => {
    it('emits stop command', async () => {
      const result = await handler({
        action: 'stop',
        body: { widgetId: 'kitchen-tv' },
      });

      expect(result).toEqual({ ok: true });
      expect(sdk.emit).toHaveBeenCalledWith('hubble-youtube:data', {
        action: 'stop',
        targetWidgetId: 'kitchen-tv',
      });
    });
  });

  describe('common validation', () => {
    it('returns error when widgetId is missing', async () => {
      const result = await handler({
        action: 'play',
        body: { url: 'https://youtu.be/dQw4w9WgXcQ' },
      });

      expect(result).toEqual({ error: 'widgetId is required' });
      expect(sdk.emit).not.toHaveBeenCalled();
    });

    it('returns error for unknown action', async () => {
      const result = await handler({
        action: 'rewind',
        body: { widgetId: 'kitchen-tv' },
      });

      expect(result).toEqual({ error: 'Unknown action: rewind' });
      expect(sdk.emit).not.toHaveBeenCalled();
    });
  });
});
