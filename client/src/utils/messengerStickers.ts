import type { MessengerStickerItem } from '../types/messengerStickers';

const STICKER_TOKEN_RE = /\[\[sticker:([^\]]+)\]\]/g;

export interface StickerMessagePart {
  type: 'sticker';
  packSlug: string;
  stickerId: string;
  imageUrl: string;
}

function parseTokenParams(inner: string): Record<string, string> {
  const params: Record<string, string> = {};
  inner.split(';').forEach((segment) => {
    const eq = segment.indexOf('=');
    if (eq <= 0) return;
    const key = segment.slice(0, eq).trim();
    const raw = segment.slice(eq + 1);
    try {
      params[key] = decodeURIComponent(raw);
    } catch {
      params[key] = raw;
    }
  });
  return params;
}

export function encodeStickerMessage(
  sticker: Pick<MessengerStickerItem, 'id' | 'imageUrl'> & { packSlug: string }
): string {
  const url = encodeURIComponent(sticker.imageUrl);
  return `[[sticker:pack=${sticker.packSlug};id=${sticker.id};url=${url}]]`;
}

export function parseStickerToken(text: string): StickerMessagePart | null {
  const re = new RegExp(STICKER_TOKEN_RE.source);
  const match = re.exec(text.trim());
  if (!match) return null;
  const params = parseTokenParams(match[1]);
  if (!params.pack || !params.id || !params.url) return null;
  return {
    type: 'sticker',
    packSlug: params.pack,
    stickerId: params.id,
    imageUrl: params.url,
  };
}

export function isStickerOnlyMessage(text: string): boolean {
  const trimmed = text.trim();
  const re = new RegExp(`^${STICKER_TOKEN_RE.source}$`);
  return re.test(trimmed);
}

export function stickerPreviewLabel(packSlug?: string): string {
  if (packSlug === 'kawaii') return 'Kawaii';
  return 'Sticker';
}
