export type SocialPlatform = 'twitter' | 'telegram' | 'instagram' | 'youtube' | 'tiktok' | 'discord';

export type SocialLinks = Record<SocialPlatform, string>;

export const EMPTY_SOCIAL_LINKS: SocialLinks = {
  twitter: '',
  telegram: '',
  instagram: '',
  youtube: '',
  tiktok: '',
  discord: '',
};

export interface UserProfilePayload {
  id: string;
  username: string;
  fullName: string;
  bio: string;
  avatar: string;
  banner: string;
  location: string;
  website: string;
  socialLinks: SocialLinks;
}
