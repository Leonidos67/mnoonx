import { MessengerEmojiItem } from '../constants/messengerEmojis';
import { coinPreviewLabel, isCoinOnlyMessage, parseCoinParams } from './messengerCoins';
import { isStickerOnlyMessage, stickerPreviewLabel } from './messengerStickers';

const ANIMOJI_TOKEN_RE =
  /\[\[animoji:id=([^;\]]+);emoji=([^;\]]+);(?:slug=([^;\]]+);)?url=([^\]]+)\]\]/g;

const STICKER_TOKEN_RE = /\[\[sticker:([^\]]+)\]\]/g;

const COIN_TOKEN_RE = /\[\[coin:([^\]]+)\]\]/g;

const MESSAGE_TOKEN_RE =
  /\[\[(animoji):id=([^;\]]+);emoji=([^;\]]+);(?:slug=([^;\]]+);)?url=([^\]]+)\]\]|\[\[(sticker):([^\]]+)\]\]|\[\[(coin):([^\]]+)\]\]/g;

export type MessagePart =
  | { type: 'text'; value: string }
  | { type: 'animoji'; id: string; emoji: string; lottieUrl: string; slug?: string }
  | { type: 'sticker'; packSlug: string; stickerId: string; imageUrl: string }
  | { type: 'coin'; coinId: string; name: string; symbol: string };

function parseStickerParams(inner: string): { packSlug: string; stickerId: string; imageUrl: string } | null {
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
  if (!params.pack || !params.id || !params.url) return null;
  return { packSlug: params.pack, stickerId: params.id, imageUrl: params.url };
}

export function encodeAnimojiMessage(
  item: Pick<MessengerEmojiItem, 'id' | 'emoji' | 'lottieUrl' | 'slug'>
): string {
  const id = item.id ?? '0';
  const url = item.lottieUrl ?? '';
  const slugPart = item.slug ? `slug=${item.slug};` : '';
  return `[[animoji:id=${id};emoji=${item.emoji};${slugPart}url=${encodeURIComponent(url)}]]`;
}

export function formatMessagePreview(text: string): string {
  let out = text.replace(ANIMOJI_TOKEN_RE, (_full, _id, emoji) => emoji);
  out = out.replace(STICKER_TOKEN_RE, (_full, inner) => {
    const parsed = parseStickerParams(inner);
    return parsed ? stickerPreviewLabel(parsed.packSlug) : 'Sticker';
  });
  out = out.replace(COIN_TOKEN_RE, (_full, inner) => {
    const parsed = parseCoinParams(inner);
    return parsed ? coinPreviewLabel(parsed) : 'Coin';
  });
  return out;
}

export function parseMessageParts(text: string): MessagePart[] {
  const parts: MessagePart[] = [];
  let lastIndex = 0;
  const re = new RegExp(MESSAGE_TOKEN_RE.source, 'g');
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    if (match[1] === 'animoji') {
      parts.push({
        type: 'animoji',
        id: match[2],
        emoji: match[3],
        slug: match[4] || undefined,
        lottieUrl: decodeURIComponent(match[5]),
      });
    } else if (match[6] === 'sticker') {
      const sticker = parseStickerParams(match[7]);
      if (sticker) {
        parts.push({ type: 'sticker', ...sticker });
      }
    } else if (match[8] === 'coin') {
      const coin = parseCoinParams(match[9]);
      if (coin) {
        parts.push({ type: 'coin', ...coin });
      }
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'text', value: text }];
}

export function isAnimojiOnlyMessage(text: string): boolean {
  const parts = parseMessageParts(text.trim());
  return parts.length === 1 && parts[0].type === 'animoji';
}

export function isAttachmentOnlyMessage(text: string): boolean {
  const trimmed = text.trim();
  return isAnimojiOnlyMessage(trimmed) || isStickerOnlyMessage(trimmed) || isCoinOnlyMessage(trimmed);
}

export { isCoinOnlyMessage } from './messengerCoins';
export { isStickerOnlyMessage } from './messengerStickers';

/** Stored reply shape: `> quote…` block, blank line, then the sent message body. */
export function splitReplyMessage(text: string): { quoteBlock: string | null; body: string } {
  if (!text.startsWith('> ')) {
    return { quoteBlock: null, body: text };
  }
  const splitAt = text.indexOf('\n\n');
  if (splitAt === -1) {
    return { quoteBlock: null, body: text };
  }
  const quoteBlock = text.slice(0, splitAt);
  const body = text.slice(splitAt + 2);
  const isQuoteBlock = quoteBlock
    .split('\n')
    .every((line) => line.startsWith('> ') || line.trim() === '');
  if (!isQuoteBlock) {
    return { quoteBlock: null, body: text };
  }
  return { quoteBlock, body };
}

export function getMessageBody(text: string): string {
  return splitReplyMessage(text).body;
}

/** One-line preview for the next reply (uses body only, never nested `> `). */
export function getReplyQuotePreview(sourceText: string): string {
  const body = getMessageBody(sourceText);
  return formatMessagePreview(body).replace(/\n/g, ' ').trim().slice(0, 120);
}

export function buildReplyMessage(quotePreview: string, body: string): string {
  const line = quotePreview.replace(/\n/g, ' ').trim();
  return `> ${line}\n\n${body.trim()}`;
}

export function rebuildReplyMessage(quoteBlock: string, body: string): string {
  return `${quoteBlock}\n\n${body.trim()}`;
}
