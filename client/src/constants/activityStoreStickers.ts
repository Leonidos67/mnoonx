import type { ActivityStoreItemId } from './activityStore';

export interface ActivityStoreStickerPackMeta {
  packSlug: string;
  /** Cover image on store cards */
  cardImageUrl: string;
  /** All stickers shown on detail screen */
  previewImageUrls: string[];
}

export const ACTIVITY_STORE_STICKER_PACKS: Partial<
  Record<ActivityStoreItemId, ActivityStoreStickerPackMeta>
> = {
  'sticker-ham-pack': {
    packSlug: 'kawaii',
    cardImageUrl: 'https://i.ibb.co/jkXVvHmh/image-Photoroom.png',
    previewImageUrls: [
      'https://i.ibb.co/jkXVvHmh/image-Photoroom.png',
      'https://i.ibb.co/nSWKJ8Y/image-Photoroom-1.png',
      'https://i.ibb.co/9kQ5nLQf/image-Photoroom-2.png',
      'https://i.ibb.co/0pjkBpzY/image-Photoroom-4.png',
      'https://i.ibb.co/fGN5CKNv/image-Photoroom-3.png',
      'https://i.ibb.co/tp6Rgyvk/image-Photoroom-5.png',
      'https://i.ibb.co/1fn11rbC/image-Photoroom-6.png',
      'https://i.ibb.co/DPKKYCVr/image-Photoroom-7.png',
      'https://i.ibb.co/mrZyN19r/image-Photoroom-1.png',
    ],
  },
  'sticker-hands-pack': {
    packSlug: 'hands',
    cardImageUrl: 'https://i.ibb.co/PZNM1rM4/Thumbs-Up-Right-Hand.png',
    previewImageUrls: [
      'https://i.ibb.co/rG5qhNJj/Call-Me-Left-Hand.png',
      'https://i.ibb.co/XrCJQvj1/Pointing-Down-Left-Hand.png',
      'https://i.ibb.co/FkF16dfm/Pointing-Up-Right-Hand.png',
      'https://i.ibb.co/k637QtCD/Rock-On-Left-Hand.png',
      'https://i.ibb.co/vxND3xrk/Scrolling-Phone-with-Right-Hand.png',
      'https://i.ibb.co/PZNM1rM4/Thumbs-Up-Right-Hand.png',
    ],
  },
};

export const ACTIVITY_STORE_STICKER_INSTALL: Partial<Record<ActivityStoreItemId, string>> = {
  'sticker-ham-pack': 'kawaii',
  'sticker-hands-pack': 'hands',
};

export function getStickerStoreMeta(
  itemId: ActivityStoreItemId
): ActivityStoreStickerPackMeta | undefined {
  return ACTIVITY_STORE_STICKER_PACKS[itemId];
}
