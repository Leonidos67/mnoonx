import type { SocialLinks, SocialPlatform } from '../types/socialLinks';
import { EMPTY_SOCIAL_LINKS } from '../types/socialLinks';

export function normalizeSocialLinksInput(input?: Partial<SocialLinks> | null): SocialLinks {
  const out = { ...EMPTY_SOCIAL_LINKS };
  if (!input) return out;
  (Object.keys(EMPTY_SOCIAL_LINKS) as SocialPlatform[]).forEach((platform) => {
    out[platform] = (input[platform] || '').trim();
  });
  return out;
}

export function socialLinkUrl(platform: SocialPlatform, value: string): string {
  const raw = value.trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;

  const handle = raw.replace(/^@/, '').replace(/\/$/, '');

  switch (platform) {
    case 'twitter':
      return `https://x.com/${handle}`;
    case 'telegram':
      return `https://t.me/${handle}`;
    case 'instagram':
      return `https://instagram.com/${handle}`;
    case 'youtube':
      return handle.startsWith('channel/') || handle.startsWith('c/')
        ? `https://youtube.com/${handle}`
        : `https://youtube.com/@${handle}`;
    case 'tiktok':
      return `https://tiktok.com/@${handle}`;
    case 'discord':
      return raw.includes('discord.') ? `https://${handle}` : `https://discord.gg/${handle}`;
    default:
      return raw;
  }
}

export function socialLinkLabel(platform: SocialPlatform, value: string): string {
  const raw = value.trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
      const path = url.pathname.replace(/^\//, '').replace(/\/$/, '');
      if (platform === 'twitter' || platform === 'instagram' || platform === 'tiktok') {
        const segment = path.split('/').pop() || path;
        return segment.startsWith('@') ? segment : `@${segment}`;
      }
      return path || url.hostname.replace(/^www\./, '');
    } catch {
      return raw.replace(/^https?:\/\//, '');
    }
  }
  return raw.startsWith('@') ? raw : `@${raw}`;
}

export function hasAnySocialLink(links?: Partial<SocialLinks> | null): boolean {
  if (!links) return false;
  return (Object.keys(EMPTY_SOCIAL_LINKS) as SocialPlatform[]).some((p) => Boolean(links[p]?.trim()));
}
