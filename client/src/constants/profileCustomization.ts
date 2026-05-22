/** Premium profile status badges (stored as id). */
export const PROFILE_STATUS_ICONS: { id: string; imageUrl: string; labelKey: string }[] = [
  { id: 'status-metallic-star', imageUrl: 'https://i.ibb.co/ccPL9pxL/image.png', labelKey: 'metallicStar' },
  { id: 'status-gloss-a', imageUrl: 'https://i.ibb.co/TMYhvCZJ/image.png', labelKey: 'glossA' },
  { id: 'status-gloss-b', imageUrl: 'https://i.ibb.co/Kc1NcY9z/image.png', labelKey: 'glossB' },
  { id: 'status-gloss-c', imageUrl: 'https://i.ibb.co/Tqmw104D/image.png', labelKey: 'glossC' },
  { id: 'status-gloss-d', imageUrl: 'https://i.ibb.co/xKd0d7J0/image.png', labelKey: 'glossD' },
  { id: 'status-gloss-e', imageUrl: 'https://i.ibb.co/Ld1m4rDS/image.png', labelKey: 'glossE' },
  { id: 'status-gloss-f', imageUrl: 'https://i.ibb.co/S79V2T3R/image.png', labelKey: 'glossF' },
  {
    id: 'status-filled-star',
    imageUrl: 'https://i.ibb.co/VY6PKhbk/2aa6ddfa-6511-4fa7-8038-8d39a1f3ca3b-Filledstarblack.png',
    labelKey: 'filledStar',
  },
  {
    id: 'status-eyes',
    imageUrl: 'https://i.ibb.co/fzq2P5Mz/ea732981-75a9-4a1d-86b6-1cf40c29c066-Eyesblack.png',
    labelKey: 'eyes',
  },
  {
    id: 'status-particles',
    imageUrl: 'https://i.ibb.co/rKPCn27Z/efacc90a-2fc5-4eab-a2e5-0761f080dcf4-Particlesblack.png',
    labelKey: 'particles',
  },
  {
    id: 'status-bomb',
    imageUrl: 'https://i.ibb.co/0yBd5D6r/f144d1b7-8f98-4c0f-a551-0077b48750a3-Bombblack.png',
    labelKey: 'bomb',
  },
  {
    id: 'status-alien',
    imageUrl: 'https://i.ibb.co/F4Mc7L1h/690e1abf-9bfc-4b34-bdd2-cbbf28ee9925-Alienblack.png',
    labelKey: 'alien',
  },
  { id: 'status-sparkle', imageUrl: 'https://i.ibb.co/RGWfLVC8/image.png', labelKey: 'sparkle' },
];

export const PROFILE_STATUS_ICON_IDS = PROFILE_STATUS_ICONS.map((s) => s.id);

export function getProfileStatusIconUrl(statusId: string | undefined): string | undefined {
  if (!statusId) return undefined;
  const item = PROFILE_STATUS_ICONS.find((s) => s.id === statusId);
  return item?.imageUrl;
}

export function isAllowedProfileStatusIcon(statusId: string): boolean {
  if (!statusId) return true;
  return PROFILE_STATUS_ICONS.some((s) => s.id === statusId);
}

export function normalizeProfileStatusIcon(raw: string | undefined): string {
  const value = (raw || '').trim();
  if (!value) return '';
  if (isAllowedProfileStatusIcon(value)) return value;
  const byUrl = PROFILE_STATUS_ICONS.find((s) => s.imageUrl === value);
  return byUrl?.id || '';
}

/** Preset name colors (hex). Empty = default theme. */
export const PROFILE_NAME_COLORS: { id: string; hex: string; labelKey: string }[] = [
  { id: 'default', hex: '', labelKey: 'default' },
  { id: 'violet', hex: '#7c3aed', labelKey: 'violet' },
  { id: 'rose', hex: '#e11d48', labelKey: 'rose' },
  { id: 'sky', hex: '#0284c7', labelKey: 'sky' },
  { id: 'emerald', hex: '#059669', labelKey: 'emerald' },
  { id: 'amber', hex: '#d97706', labelKey: 'amber' },
  { id: 'fuchsia', hex: '#c026d3', labelKey: 'fuchsia' },
];

export const PROFILE_BG_EMOJIS = [
  '✨',
  '🔥',
  '💜',
  '🌸',
  '⭐',
  '🎉',
  '💖',
  '🦋',
  '🌙',
  '☀️',
  '👋',
  '🫶',
  '💫',
  '🌟',
  '🎀',
  '🍀',
  '💎',
  '🌈',
  '⚡',
  '🎵',
  '🌺',
  '🍭',
  '👑',
  '🪩',
  '🧸',
  '🐾',
] as const;

/** Profile header fill disabled in UI for now — always cleared on save */
export const PROFILE_HEADER_BG_DISABLED = {
  profileBgMode: 'none' as const,
  profileBgColor: '',
  profileBgColor2: '',
};

export type ProfileBgEmoji = (typeof PROFILE_BG_EMOJIS)[number];

/** Decorative positions (right side of profile header) */
export const PROFILE_BG_EMOJI_POSITIONS: { top: string; right: string; size: string; opacity: number; rotate: number }[] = [
  { top: '4%', right: '6%', size: '2.25rem', opacity: 0.22, rotate: -12 },
  { top: '18%', right: '22%', size: '1.75rem', opacity: 0.18, rotate: 8 },
  { top: '32%', right: '4%', size: '2rem', opacity: 0.2, rotate: 15 },
  { top: '48%', right: '18%', size: '2.5rem', opacity: 0.24, rotate: -6 },
  { top: '62%', right: '8%', size: '1.5rem', opacity: 0.16, rotate: 20 },
  { top: '78%', right: '24%', size: '2rem', opacity: 0.2, rotate: -10 },
  { top: '12%', right: '38%', size: '1.25rem', opacity: 0.14, rotate: 5 },
  { top: '55%', right: '32%', size: '1.85rem', opacity: 0.17, rotate: -18 },
];

export function isAllowedProfileNameColor(hex: string): boolean {
  if (!hex) return true;
  return PROFILE_NAME_COLORS.some((c) => c.hex === hex);
}

export function isAllowedProfileBgEmoji(emoji: string): boolean {
  return (PROFILE_BG_EMOJIS as readonly string[]).includes(emoji);
}

export const PROFILE_BG_MODES = ['none', 'solid', 'gradient'] as const;
export type ProfileBgMode = (typeof PROFILE_BG_MODES)[number];

/** Header background presets — bottom-left → top-right + white fade from BL at 0% opacity */
export const PROFILE_HEADER_BACKGROUNDS: {
  id: string;
  mode: ProfileBgMode;
  color1: string;
  color2: string;
  labelKey: string;
}[] = [
  { id: 'none', mode: 'none', color1: '', color2: '', labelKey: 'none' },
  { id: 'violet-solid', mode: 'solid', color1: '#7c3aed', color2: '', labelKey: 'violetSolid' },
  { id: 'sky-solid', mode: 'solid', color1: '#0ea5e9', color2: '', labelKey: 'skySolid' },
  { id: 'rose-solid', mode: 'solid', color1: '#e11d48', color2: '', labelKey: 'roseSolid' },
  { id: 'violet-sky', mode: 'gradient', color1: '#7c3aed', color2: '#38bdf8', labelKey: 'violetSky' },
  { id: 'rose-amber', mode: 'gradient', color1: '#f43f5e', color2: '#fbbf24', labelKey: 'roseAmber' },
  { id: 'emerald-teal', mode: 'gradient', color1: '#059669', color2: '#14b8a6', labelKey: 'emeraldTeal' },
  { id: 'indigo-fuchsia', mode: 'gradient', color1: '#4f46e5', color2: '#d946ef', labelKey: 'indigoFuchsia' },
  { id: 'slate-solid', mode: 'solid', color1: '#64748b', color2: '', labelKey: 'slateSolid' },
];

const ALLOWED_PROFILE_BG_HEX = new Set(
  PROFILE_HEADER_BACKGROUNDS.flatMap((p) => [p.color1, p.color2].filter(Boolean))
);

/** Diagonal BL → TR; white veil from BL (0% opacity) fading out toward TR */
export const PROFILE_HEADER_WHITE_FADE =
  'linear-gradient(to top right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.65) 52%, rgba(255,255,255,0) 100%)';

export function getProfileHeaderBackgroundStyle(
  mode: ProfileBgMode,
  color1: string,
  color2: string
): { backgroundImage?: string } {
  if (mode === 'none' || !color1) return {};
  const c2 = mode === 'gradient' && color2 ? color2 : color1;
  const base = `linear-gradient(to top right, ${color1} 0%, ${c2} 100%)`;
  return { backgroundImage: `${PROFILE_HEADER_WHITE_FADE}, ${base}` };
}

export function isAllowedProfileHeaderBg(
  mode: ProfileBgMode,
  color1: string,
  color2: string
): boolean {
  if (!PROFILE_BG_MODES.includes(mode)) return false;
  if (mode === 'none') return !color1 && !color2;
  if (!color1 || !ALLOWED_PROFILE_BG_HEX.has(color1)) return false;
  if (mode === 'solid') return !color2 || color2 === '';
  return Boolean(color2 && ALLOWED_PROFILE_BG_HEX.has(color2));
}

export function normalizeProfileHeaderBg(
  mode: string | undefined,
  color1: string | undefined,
  color2: string | undefined
): { profileBgMode: ProfileBgMode; profileBgColor: string; profileBgColor2: string } {
  const m = PROFILE_BG_MODES.includes(mode as ProfileBgMode) ? (mode as ProfileBgMode) : 'none';
  const c1 = (color1 || '').trim();
  const c2 = (color2 || '').trim();
  if (!isAllowedProfileHeaderBg(m, c1, c2)) {
    return { profileBgMode: 'none', profileBgColor: '', profileBgColor2: '' };
  }
  return {
    profileBgMode: m,
    profileBgColor: m === 'none' ? '' : c1,
    profileBgColor2: m === 'gradient' ? c2 : '',
  };
}
