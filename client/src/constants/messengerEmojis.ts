export interface MessengerEmojiItem {
  emoji: string;
  /** Animoji id (e.g. MAX picker) */
  id?: string;
  /** MAX picker file slug → picker_{slug}.json */
  slug?: string;
  lottieUrl?: string;
}

export const MAX_LOTTIE_PICKER_BASE = 'https://st.max.ru/lottie_old';

export function maxPickerLottieUrl(slug: string): string {
  return `${MAX_LOTTIE_PICKER_BASE}/picker_${slug}.json`;
}

export function maxPickerLottieFallback(slug: string): string {
  return `/lottie/picker_${slug}.json`;
}

/** @deprecated use maxPickerLottieUrl('kiss') */
export const KISS_ANIMOJI_URL = maxPickerLottieUrl('kiss');
/** @deprecated use maxPickerLottieFallback('kiss') */
export const KISS_ANIMOJI_FALLBACK = maxPickerLottieFallback('kiss');

export const MESSENGER_ANIMOJIS: MessengerEmojiItem[] = [
  { id: '10', emoji: '😘', slug: 'kiss', lottieUrl: maxPickerLottieUrl('kiss') },
  { id: '11', emoji: '❤️', slug: 'heart', lottieUrl: maxPickerLottieUrl('heart') },
  { id: '12', emoji: '🔥', slug: 'fire', lottieUrl: maxPickerLottieUrl('fire') },
  { id: '13', emoji: '😢', slug: 'cry', lottieUrl: maxPickerLottieUrl('cry') },
  { id: '14', emoji: '👏', slug: 'clap', lottieUrl: maxPickerLottieUrl('clap') },
  { id: '15', emoji: '⭐', slug: 'star', lottieUrl: maxPickerLottieUrl('star') },
  { id: '16', emoji: '🚀', slug: 'rocket', lottieUrl: maxPickerLottieUrl('rocket') },
  { id: '17', emoji: '🎁', slug: 'gift', lottieUrl: maxPickerLottieUrl('gift') },
  { id: '18', emoji: '😍', slug: 'heart_eyes', lottieUrl: maxPickerLottieUrl('heart_eyes') },
  { id: '19', emoji: '🎉', slug: 'tada', lottieUrl: maxPickerLottieUrl('tada') },
  { id: '20', emoji: '✨', slug: 'sparkles', lottieUrl: maxPickerLottieUrl('sparkles') },
  { id: '21', emoji: '💔', slug: 'broken_heart', lottieUrl: maxPickerLottieUrl('broken_heart') },
  { id: '22', emoji: '💕', slug: 'two_hearts', lottieUrl: maxPickerLottieUrl('two_hearts') },
  { id: '23', emoji: '😈', slug: 'devil', lottieUrl: maxPickerLottieUrl('devil') },
  { id: '24', emoji: '🦄', slug: 'unicorn', lottieUrl: maxPickerLottieUrl('unicorn') },
  { id: '25', emoji: '👑', slug: 'crown', lottieUrl: maxPickerLottieUrl('crown') },
  { id: '26', emoji: '🎈', slug: 'balloon', lottieUrl: maxPickerLottieUrl('balloon') },
  { id: '27', emoji: '💣', slug: 'bomb', lottieUrl: maxPickerLottieUrl('bomb') },
  { id: '28', emoji: '👀', slug: 'eyes', lottieUrl: maxPickerLottieUrl('eyes') },
  { id: '29', emoji: '👌', slug: 'ok', lottieUrl: maxPickerLottieUrl('ok') },
  { id: '30', emoji: '😡', slug: 'rage', lottieUrl: maxPickerLottieUrl('rage') },
  { id: '31', emoji: '😨', slug: 'fear', lottieUrl: maxPickerLottieUrl('fear') },
  { id: '32', emoji: '🤒', slug: 'sick', lottieUrl: maxPickerLottieUrl('sick') },
  { id: '33', emoji: '🍷', slug: 'wine', lottieUrl: maxPickerLottieUrl('wine') },
  { id: '34', emoji: '🎂', slug: 'cake', lottieUrl: maxPickerLottieUrl('cake') },
  { id: '35', emoji: '🐱', slug: 'cat', lottieUrl: maxPickerLottieUrl('cat') },
  { id: '36', emoji: '🐶', slug: 'dog', lottieUrl: maxPickerLottieUrl('dog') },
  { id: '37', emoji: '💯', slug: '100', lottieUrl: maxPickerLottieUrl('100') },
  { id: '38', emoji: '🔔', slug: 'bell', lottieUrl: maxPickerLottieUrl('bell') },
  { id: '39', emoji: '⚽', slug: 'ball', lottieUrl: maxPickerLottieUrl('ball') },
  { id: '40', emoji: '💤', slug: 'zzz', lottieUrl: maxPickerLottieUrl('zzz') },
  { id: '41', emoji: '👎', slug: 'thumbs_down', lottieUrl: maxPickerLottieUrl('thumbs_down') },
  { id: '42', emoji: '💀', slug: 'skull', lottieUrl: maxPickerLottieUrl('skull') },
  { id: '43', emoji: '❓', slug: 'question', lottieUrl: maxPickerLottieUrl('question') },
  { id: '44', emoji: '❗', slug: 'exclamation', lottieUrl: maxPickerLottieUrl('exclamation') },
  { id: '45', emoji: '🏅', slug: 'medal', lottieUrl: maxPickerLottieUrl('medal') },
  { id: '46', emoji: '🛑', slug: 'stop', lottieUrl: maxPickerLottieUrl('stop') },
];

const ANIMOJI_EMOJI_SET = new Set(MESSENGER_ANIMOJIS.map((a) => a.emoji));

export const MESSENGER_STATIC_EMOJIS: MessengerEmojiItem[] = [
  { emoji: '😀' },
  { emoji: '😃' },
  { emoji: '😄' },
  { emoji: '😁' },
  { emoji: '😆' },
  { emoji: '😅' },
  { emoji: '🤣' },
  { emoji: '😂' },
  { emoji: '🙂' },
  { emoji: '😉' },
  { emoji: '😊' },
  { emoji: '😇' },
  { emoji: '🥰' },
  { emoji: '🤩' },
  { emoji: '😗' },
  { emoji: '😚' },
  { emoji: '😙' },
  { emoji: '🥲' },
  { emoji: '😋' },
  { emoji: '😛' },
  { emoji: '😜' },
  { emoji: '🤪' },
  { emoji: '😝' },
  { emoji: '🤑' },
  { emoji: '🤗' },
  { emoji: '🤭' },
  { emoji: '🤫' },
  { emoji: '🤔' },
  { emoji: '🤐' },
  { emoji: '🤨' },
  { emoji: '😐' },
  { emoji: '😑' },
  { emoji: '😶' },
  { emoji: '😏' },
  { emoji: '😒' },
  { emoji: '🙄' },
  { emoji: '😬' },
  { emoji: '🤥' },
  { emoji: '😌' },
  { emoji: '😔' },
  { emoji: '😪' },
  { emoji: '🤤' },
  { emoji: '😴' },
  { emoji: '😷' },
  { emoji: '🤕' },
  { emoji: '🤢' },
  { emoji: '🤮' },
  { emoji: '🤧' },
  { emoji: '🥵' },
  { emoji: '🥶' },
  { emoji: '🥴' },
  { emoji: '😵' },
  { emoji: '🤯' },
  { emoji: '🤠' },
  { emoji: '🥳' },
  { emoji: '😎' },
  { emoji: '🤓' },
  { emoji: '🧐' },
  { emoji: '😕' },
  { emoji: '😟' },
  { emoji: '🙁' },
  { emoji: '☹️' },
  { emoji: '😮' },
  { emoji: '😯' },
  { emoji: '😲' },
  { emoji: '😳' },
  { emoji: '🥺' },
  { emoji: '😦' },
  { emoji: '😧' },
  { emoji: '😰' },
  { emoji: '😥' },
  { emoji: '😭' },
  { emoji: '😱' },
  { emoji: '😖' },
  { emoji: '😣' },
  { emoji: '😞' },
  { emoji: '😓' },
  { emoji: '😩' },
  { emoji: '😫' },
  { emoji: '🥱' },
  { emoji: '😤' },
  { emoji: '😠' },
  { emoji: '🤬' },
  { emoji: '👍' },
  { emoji: '👎' },
  { emoji: '🙌' },
  { emoji: '🙏' },
  { emoji: '💪' },
  { emoji: '🧡' },
  { emoji: '💛' },
  { emoji: '💚' },
  { emoji: '💙' },
  { emoji: '💜' },
  { emoji: '🖤' },
].filter((item) => !ANIMOJI_EMOJI_SET.has(item.emoji));

/** All picker rows (animated + static); prefer MESSENGER_ANIMOJIS + MESSENGER_STATIC_EMOJIS in UI */
export const MESSENGER_EMOJI_PICKER_ITEMS: MessengerEmojiItem[] = [
  ...MESSENGER_ANIMOJIS,
  ...MESSENGER_STATIC_EMOJIS,
];
