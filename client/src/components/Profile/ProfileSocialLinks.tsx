import React from 'react';
import type { SocialLinks, SocialPlatform } from '../../types/socialLinks';
import { EMPTY_SOCIAL_LINKS } from '../../types/socialLinks';
import { socialLinkLabel, socialLinkUrl } from '../../utils/socialLinks';
import SocialPlatformIcon from './SocialPlatformIcon';

const DISPLAY_PLATFORMS: SocialPlatform[] = ['twitter', 'telegram', 'instagram', 'youtube', 'tiktok', 'discord'];

interface ProfileSocialLinksProps {
  links?: Partial<SocialLinks> | null;
  variant?: 'chips' | 'icons';
}

const platformColors: Record<SocialPlatform, string> = {
  twitter: 'hover:bg-neutral-900 hover:text-white',
  telegram: 'hover:bg-sky-500 hover:text-white',
  instagram: 'hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-500 hover:text-white',
  youtube: 'hover:bg-red-600 hover:text-white',
  tiktok: 'hover:bg-neutral-900 hover:text-white',
  discord: 'hover:bg-indigo-600 hover:text-white',
};

const ProfileSocialLinks: React.FC<ProfileSocialLinksProps> = ({ links, variant = 'chips' }) => {
  const items = DISPLAY_PLATFORMS.map((platform) => {
    const value = (links?.[platform] || EMPTY_SOCIAL_LINKS[platform]).trim();
    if (!value) return null;
    return {
      platform,
      value,
      href: socialLinkUrl(platform, value),
      label: socialLinkLabel(platform, value),
    };
  }).filter(Boolean) as Array<{ platform: SocialPlatform; value: string; href: string; label: string }>;

  if (items.length === 0) return null;

  if (variant === 'icons') {
    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <a
            key={item.platform}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition-colors ${platformColors[item.platform]}`}
            aria-label={item.label}
            title={item.label}
          >
            <SocialPlatformIcon platform={item.platform} className="h-4 w-4" />
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <a
          key={item.platform}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-700 transition-colors ${platformColors[item.platform]}`}
        >
          <SocialPlatformIcon platform={item.platform} className="h-4 w-4 shrink-0" />
          <span className="max-w-[10rem] truncate">{item.label}</span>
        </a>
      ))}
    </div>
  );
};

export default ProfileSocialLinks;
