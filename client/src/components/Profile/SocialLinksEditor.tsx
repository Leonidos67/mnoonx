import React from 'react';
import type { SocialLinks, SocialPlatform } from '../../types/socialLinks';
import SocialPlatformIcon from './SocialPlatformIcon';
import { useTranslation } from '../../i18n/useTranslation';

const EDIT_PLATFORMS: SocialPlatform[] = ['twitter', 'telegram', 'instagram', 'youtube', 'tiktok', 'discord'];

interface SocialLinksEditorProps {
  value: SocialLinks;
  onChange: (platform: SocialPlatform, next: string) => void;
}

const SocialLinksEditor: React.FC<SocialLinksEditorProps> = ({ value, onChange }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {EDIT_PLATFORMS.map((platform) => (
        <div key={platform}>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-700">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
              <SocialPlatformIcon platform={platform} className="h-4 w-4" />
            </span>
            <span>{t(`settings.social.${platform}`)}</span>
          </label>
          <input
            type="text"
            value={value[platform]}
            onChange={(e) => onChange(platform, e.target.value)}
            placeholder={t(`settings.social.${platform}Placeholder`)}
            className="w-full rounded-xl border border-neutral-200 px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-black/10"
            autoComplete="off"
          />
        </div>
      ))}
    </div>
  );
};

export default SocialLinksEditor;
