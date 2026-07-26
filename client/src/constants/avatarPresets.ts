/** Built-in avatar presets: solid / linear / radial fills + optional emoji (SVG data URLs). */

export const AVATAR_PRESET_EMOJIS = ['🚀', '🦊', '⚡', '🌙', '🔥', '💎', '🎮', '🌊', '🦄', '☕'] as const;

export const AVATAR_PRESET_COLORS = [
  '#171717',
  '#315efb',
  '#0d9488',
  '#ea580c',
  '#7c3aed',
  '#db2777',
  '#0891b2',
  '#65a30d',
] as const;

export type AvatarFillStyle = 'solid' | 'linear' | 'radial';

export type AvatarFill =
  | { type: 'solid'; color: string }
  | { type: 'linear'; colorA: string; colorB: string; angle?: number }
  | { type: 'radial'; colorA: string; colorB: string };

export const AVATAR_LINEAR_PRESETS: Array<{ colorA: string; colorB: string; angle: number }> = [
  { colorA: '#315efb', colorB: '#7c3aed', angle: 135 },
  { colorA: '#ea580c', colorB: '#db2777', angle: 120 },
  { colorA: '#0d9488', colorB: '#0891b2', angle: 90 },
  { colorA: '#171717', colorB: '#404040', angle: 160 },
  { colorA: '#65a30d', colorB: '#0d9488', angle: 45 },
  { colorA: '#7c3aed', colorB: '#db2777', angle: 200 },
];

export const AVATAR_RADIAL_PRESETS: Array<{ colorA: string; colorB: string }> = [
  { colorA: '#ffffff', colorB: '#315efb' },
  { colorA: '#fde68a', colorB: '#ea580c' },
  { colorA: '#a7f3d0', colorB: '#0d9488' },
  { colorA: '#ddd6fe', colorB: '#7c3aed' },
  { colorA: '#fecdd3', colorB: '#db2777' },
  { colorA: '#e5e5e5', colorB: '#171717' },
];

function normalizeHex(color: string): string {
  const raw = String(color || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
    const r = raw[1];
    const g = raw[2];
    const b = raw[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw.toLowerCase()}`;
  return '#171717';
}

function escapeXmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildFillDef(fill: AvatarFill): { defs: string; fillAttr: string } {
  if (fill.type === 'solid') {
    return { defs: '', fillAttr: normalizeHex(fill.color) };
  }

  if (fill.type === 'linear') {
    const angle = ((fill.angle ?? 135) % 360 + 360) % 360;
    const rad = (angle * Math.PI) / 180;
    const x1 = +(50 - Math.cos(rad) * 50).toFixed(2);
    const y1 = +(50 - Math.sin(rad) * 50).toFixed(2);
    const x2 = +(50 + Math.cos(rad) * 50).toFixed(2);
    const y2 = +(50 + Math.sin(rad) * 50).toFixed(2);
    const a = normalizeHex(fill.colorA);
    const b = normalizeHex(fill.colorB);
    return {
      defs: `<defs><linearGradient id="g" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%"><stop offset="0%" stop-color="${a}"/><stop offset="100%" stop-color="${b}"/></linearGradient></defs>`,
      fillAttr: 'url(#g)',
    };
  }

  const a = normalizeHex(fill.colorA);
  const b = normalizeHex(fill.colorB);
  return {
    defs: `<defs><radialGradient id="g" cx="50%" cy="40%" r="70%"><stop offset="0%" stop-color="${a}"/><stop offset="100%" stop-color="${b}"/></radialGradient></defs>`,
    fillAttr: 'url(#g)',
  };
}

export function buildAvatarDataUrl(options: {
  fill: AvatarFill;
  emoji?: string | null;
  /** full square vs circle clip — avatars display as circle via CSS either way */
  rounded?: boolean;
}): string {
  const { fill, emoji, rounded = false } = options;
  const { defs, fillAttr } = buildFillDef(fill);
  const shape = rounded
    ? `<rect width="256" height="256" rx="128" fill="${fillAttr}"/>`
    : `<rect width="256" height="256" fill="${fillAttr}"/>`;
  const emojiLayer =
    emoji && emoji.trim()
      ? `<text x="128" y="142" text-anchor="middle" font-size="132" font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif">${escapeXmlText(emoji.trim())}</text>`
      : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">${defs}${shape}${emojiLayer}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** @deprecated use buildAvatarDataUrl */
export function buildEmojiAvatarDataUrl(emoji: string, background: string): string {
  return buildAvatarDataUrl({ fill: { type: 'solid', color: background }, emoji });
}

/** @deprecated use buildAvatarDataUrl */
export function buildSolidAvatarDataUrl(background: string): string {
  return buildAvatarDataUrl({ fill: { type: 'solid', color: background }, rounded: true });
}

export function cssPreviewForFill(fill: AvatarFill): string {
  if (fill.type === 'solid') return normalizeHex(fill.color);
  if (fill.type === 'linear') {
    const angle = fill.angle ?? 135;
    return `linear-gradient(${angle}deg, ${normalizeHex(fill.colorA)}, ${normalizeHex(fill.colorB)})`;
  }
  return `radial-gradient(circle at 50% 40%, ${normalizeHex(fill.colorA)}, ${normalizeHex(fill.colorB)})`;
}
