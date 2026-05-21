export interface MessengerStickerItem {
  id: string;
  slug: string;
  imageUrl: string;
  sortOrder: number;
}

export interface MessengerStickerPack {
  id: string;
  slug: string;
  name: string;
  stickers: MessengerStickerItem[];
}
