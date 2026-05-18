import { MessengerEmojiItem } from '../constants/messengerEmojis';

const ANIMOJI_TOKEN_RE =
  /\[\[animoji:id=([^;\]]+);emoji=([^;\]]+);(?:slug=([^;\]]+);)?url=([^\]]+)\]\]/g;

export type MessagePart =
  | { type: 'text'; value: string }
  | { type: 'animoji'; id: string; emoji: string; lottieUrl: string; slug?: string };

export function encodeAnimojiMessage(
  item: Pick<MessengerEmojiItem, 'id' | 'emoji' | 'lottieUrl' | 'slug'>
): string {
  const id = item.id ?? '0';
  const url = item.lottieUrl ?? '';
  const slugPart = item.slug ? `slug=${item.slug};` : '';
  return `[[animoji:id=${id};emoji=${item.emoji};${slugPart}url=${encodeURIComponent(url)}]]`;
}

export function formatMessagePreview(text: string): string {
  return text.replace(ANIMOJI_TOKEN_RE, (_full, _id, emoji) => emoji);
}

export function parseMessageParts(text: string): MessagePart[] {
  const parts: MessagePart[] = [];
  let lastIndex = 0;
  const re = new RegExp(ANIMOJI_TOKEN_RE.source, 'g');
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    parts.push({
      type: 'animoji',
      id: match[1],
      emoji: match[2],
      slug: match[3] || undefined,
      lottieUrl: decodeURIComponent(match[4]),
    });
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
