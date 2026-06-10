const SOCIAL_PLATFORMS = ['twitter', 'telegram', 'instagram', 'youtube', 'tiktok', 'discord'];

function cleanSocialValue(raw) {
  if (typeof raw !== 'string') return '';
  return raw.trim().slice(0, 120);
}

function normalizeSocialLinks(input) {
  const out = {};
  if (!input || typeof input !== 'object') {
    for (const platform of SOCIAL_PLATFORMS) out[platform] = '';
    return out;
  }
  for (const platform of SOCIAL_PLATFORMS) {
    out[platform] = cleanSocialValue(input[platform] || '');
  }
  return out;
}

function serializeSocialLinks(userLinks) {
  const src = userLinks && typeof userLinks === 'object' ? userLinks : {};
  return SOCIAL_PLATFORMS.reduce((acc, platform) => {
    acc[platform] = cleanSocialValue(src[platform] || '');
    return acc;
  }, {});
}

function profilePayload(user) {
  return {
    id: user._id.toString(),
    username: user.username,
    fullName: user.fullName || '',
    bio: user.bio || '',
    avatar: user.avatar || '',
    banner: user.banner || '',
    location: user.location || '',
    website: user.website || '',
    socialLinks: serializeSocialLinks(user.socialLinks),
  };
}

module.exports = {
  SOCIAL_PLATFORMS,
  normalizeSocialLinks,
  serializeSocialLinks,
  profilePayload,
};
