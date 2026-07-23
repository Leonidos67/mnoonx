/** Draft poll attached in the composer (before create). */
export interface PostPollDraft {
  options: Array<{ id: string; text: string }>;
}

export interface FeedPostPollOption {
  id: string;
  text: string;
  votesCount: number;
  percent: number;
}

export interface FeedPostPoll {
  options: FeedPostPollOption[];
  totalVotes: number;
  viewerVotedOptionId: string | null;
}

export function createEmptyPollDraft(): PostPollDraft {
  return {
    options: [
      { id: newPollOptionId(), text: '' },
      { id: newPollOptionId(), text: '' },
    ],
  };
}

export function newPollOptionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `opt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function isValidPollDraft(poll: PostPollDraft | null | undefined): boolean {
  if (!poll?.options?.length) return false;
  const texts = poll.options.map((o) => o.text.trim()).filter(Boolean);
  return texts.length >= 2 && texts.length <= 4;
}
