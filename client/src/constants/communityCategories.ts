/** Canonical community category values stored in MongoDB. */
export const COMMUNITY_CATEGORIES = [
  'Technology',
  'Business',
  'Education',
  'Finance',
  'Investing',
  'Marketing',
  'Design',
  'Startups',
  'Health',
  'Entertainment',
  'Gaming',
  'Art',
  'Sports',
  'Science',
  'Career',
  'Lifestyle',
  'Crypto',
  'Memecoins',
  'Futures',
  'On-Chain',
  'Airdrops',
  'DeFi',
  'NFT',
  'Other',
] as const;

export type CommunityCategory = (typeof COMMUNITY_CATEGORIES)[number];

/** Categories shown in create / settings pickers (broader first, crypto included). */
export const COMMUNITY_CATEGORY_OPTIONS: readonly CommunityCategory[] = [
  'Technology',
  'Business',
  'Education',
  'Finance',
  'Investing',
  'Marketing',
  'Design',
  'Startups',
  'Health',
  'Entertainment',
  'Gaming',
  'Art',
  'Sports',
  'Science',
  'Career',
  'Lifestyle',
  'Crypto',
  'Memecoins',
  'Futures',
  'On-Chain',
  'Airdrops',
  'DeFi',
  'NFT',
  'Other',
] as const;

export const COMMUNITY_CATEGORY_LABEL_KEY: Record<CommunityCategory, string> = {
  Technology: 'communityCategories.technology',
  Business: 'communityCategories.business',
  Education: 'communityCategories.education',
  Finance: 'communityCategories.finance',
  Investing: 'communityCategories.investing',
  Marketing: 'communityCategories.marketing',
  Design: 'communityCategories.design',
  Startups: 'communityCategories.startups',
  Health: 'communityCategories.health',
  Entertainment: 'communityCategories.entertainment',
  Gaming: 'communityCategories.gaming',
  Art: 'communityCategories.art',
  Sports: 'communityCategories.sports',
  Science: 'communityCategories.science',
  Career: 'communityCategories.career',
  Lifestyle: 'communityCategories.lifestyle',
  Crypto: 'communityCategories.crypto',
  Memecoins: 'communityCategories.memecoins',
  Futures: 'communityCategories.futures',
  'On-Chain': 'communityCategories.onChain',
  Airdrops: 'communityCategories.airdrops',
  DeFi: 'communityCategories.defi',
  NFT: 'communityCategories.nft',
  Other: 'communityCategories.other',
};

export function isCommunityCategory(value: string): value is CommunityCategory {
  return (COMMUNITY_CATEGORIES as readonly string[]).includes(value);
}

/** Localized label for a stored category value. */
export function communityCategoryLabel(
  category: string,
  t: (key: string) => string,
): string {
  if (isCommunityCategory(category)) {
    return t(COMMUNITY_CATEGORY_LABEL_KEY[category]);
  }
  return category;
}
