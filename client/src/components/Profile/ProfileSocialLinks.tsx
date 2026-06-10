import React from 'react';
import type { SocialLinks, SocialPlatform } from '../../types/socialLinks';
import { EMPTY_SOCIAL_LINKS } from '../../types/socialLinks';
import { socialLinkLabel, socialLinkUrl } from '../../utils/socialLinks';
import { useTranslation } from '../../i18n/useTranslation';
import SocialPlatformIcon from './SocialPlatformIcon';

const DISPLAY_PLATFORMS: SocialPlatform[] = ['twitter', 'telegram', 'instagram', 'youtube', 'tiktok', 'discord'];

function platformDisplayName(platform: SocialPlatform, t: (key: string) => string): string {
  if (platform === 'twitter') return 'X';
  return t(`settings.social.${platform}`);
}

interface ProfileSocialLinksProps {
  links?: Partial<SocialLinks> | null;
  showHeading?: boolean;
}

const platformStyles: Record<SocialPlatform, string> = {
  twitter:
    'border-neutral-200 bg-neutral-50 text-neutral-800 hover:bg-neutral-900 hover:text-white',
  telegram:
    'border-neutral-200 bg-neutral-50 text-sky-700 hover:bg-sky-500 hover:text-white',
  instagram:
    'border-neutral-200 bg-gradient-to-br from-purple-50 to-pink-50 text-pink-700 hover:from-purple-600 hover:to-pink-500 hover:text-white',
  youtube:
    'border-neutral-200 bg-neutral-50 text-red-700 hover:bg-red-600 hover:text-white',
  tiktok:
    'border-neutral-200 bg-neutral-50 text-neutral-800 hover:bg-neutral-900 hover:text-white',
  discord:
    'border-neutral-200 bg-neutral-50 text-indigo-700 hover:bg-indigo-600 hover:text-white',
};

const ProfileSocialLinks: React.FC<ProfileSocialLinksProps> = ({ links, showHeading = false }) => {
  const { t } = useTranslation();

  const items = DISPLAY_PLATFORMS.map((platform) => {
    const value = (links?.[platform] || EMPTY_SOCIAL_LINKS[platform]).trim();
    if (!value) return null;
    return {
      platform,
      href: socialLinkUrl(platform, value),
      handle: socialLinkLabel(platform, value),
      name: platformDisplayName(platform, t),
    };
  }).filter(Boolean) as Array<{
    platform: SocialPlatform;
    href: string;
    handle: string;
    name: string;
  }>;

  if (items.length === 0) return null;

  return (
    <div className="min-w-0 w-full">
      {showHeading ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          {t('userProfile.connectedAccounts')}
        </p>
      ) : null}

      {/* Mobile: horizontal scroll, icon + short handle */}
      <div role="list" className="flex gap-1 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:hidden [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <a
            key={item.platform}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            role="listitem"
            className={`inline-flex items-center justify-center gap-1 shrink-0 rounded-full border px-2 py-1.5 transition-colors active:scale-[0.98] ${platformStyles[item.platform]}`}
            aria-label={`${item.name}: ${item.handle}`}
          >
            <span>
              <SocialPlatformIcon platform={item.platform} className="h-4 w-4" />
            </span>
            <span className="w-full truncate text-center text-[12px] font-semibold leading-tight">
              {item.name}
            </span>
          </a>
        ))}
      </div>

      {/* Desktop / tablet: horizontal scroll or wrap with flex-nowrap */}
      <div role="list" className="hidden sm:flex sm:gap-1 sm:overflow-x-auto sm:overscroll-x-contain sm:pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <a
            key={item.platform}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            role="listitem"
            className={`inline-flex shrink-0 max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${platformStyles[item.platform]}`}
            title={`${item.name} · ${item.handle}`}
          >
            <SocialPlatformIcon platform={item.platform} className="h-4 w-4 shrink-0" />
            <span className="shrink-0 font-medium">{item.name}</span>
            {/* {item.platform !== 'twitter' ? (
              <span className="min-w-0 truncate text-xs opacity-75">{item.handle}</span>
            ) : null} */}
          </a>
        ))}
      </div>
    </div>
  );
};

export default ProfileSocialLinks;