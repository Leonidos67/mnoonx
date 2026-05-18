export interface PostLightboxMeta {
  author: {
    username: string;
    fullName: string;
    avatar: string;
  };
  community?: {
    name: string;
    handle: string;
    avatar?: string;
  } | null;
  createdAt: string;
  content?: string;
}
