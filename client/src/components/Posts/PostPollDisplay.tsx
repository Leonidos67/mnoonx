import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { POSTS_API } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/useTranslation';
import type { FeedPostPoll } from '../../types/postPoll';

interface PostPollDisplayProps {
  postId: string;
  poll: FeedPostPoll;
  onPollChange?: (poll: FeedPostPoll) => void;
  className?: string;
}

const PostPollDisplay: React.FC<PostPollDisplayProps> = ({
  postId,
  poll: pollProp,
  onPollChange,
  className = '',
}) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [poll, setPoll] = useState(pollProp);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    setPoll(pollProp);
  }, [pollProp]);

  const hasVoted = Boolean(poll.viewerVotedOptionId);
  const showResults = hasVoted;

  const vote = async (optionId: string) => {
    if (!token || voting) {
      if (!token) window.dispatchEvent(new CustomEvent('openLogin'));
      return;
    }
    if (poll.viewerVotedOptionId === optionId) return;

    setVoting(true);
    try {
      const res = await fetch(`${POSTS_API}/${postId}/poll/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ optionId }),
      });
      if (res.status === 401) {
        window.dispatchEvent(new CustomEvent('openLogin'));
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message || 'Vote failed');
      }
      const data = (await res.json()) as { poll: FeedPostPoll };
      setPoll(data.poll);
      onPollChange?.(data.poll);
    } catch (e) {
      console.error(e);
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className={`mt-3 space-y-2 ${className}`}>
      {poll.options.map((opt) => {
        const selected = poll.viewerVotedOptionId === opt.id;
        const fill = showResults ? Math.min(100, Math.max(0, opt.percent)) : 0;

        return (
          <button
            key={opt.id}
            type="button"
            disabled={voting}
            onClick={(e) => {
              e.stopPropagation();
              void vote(opt.id);
            }}
            className={`relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl border px-3 py-2.5 text-left transition-colors ${
              selected
                ? 'border-[#315efb] bg-[#315efb]/[0.06]'
                : 'border-neutral-200 bg-white hover:bg-neutral-50'
            }`}
          >
            {showResults ? (
              <span
                className={`pointer-events-none absolute inset-y-0 left-0 ${
                  selected ? 'bg-[#315efb]/15' : 'bg-neutral-100'
                }`}
                style={{ width: `${fill}%` }}
                aria-hidden
              />
            ) : null}

            <span
              className={`relative z-[1] flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                selected
                  ? 'border-[#315efb] bg-[#315efb] text-white'
                  : 'border-neutral-300 bg-white'
              }`}
              aria-hidden
            >
              {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
            </span>

            <span className="relative z-[1] min-w-0 flex-1 truncate text-sm font-medium text-neutral-900">
              {opt.text}
            </span>

            {showResults ? (
              <span className="relative z-[1] shrink-0 text-sm font-semibold tabular-nums text-neutral-700">
                {Number.isInteger(opt.percent) ? `${opt.percent}%` : `${opt.percent.toFixed(1)}%`}
              </span>
            ) : null}
          </button>
        );
      })}

      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 px-0.5 text-xs text-neutral-500">
        <span>
          {t('postPoll.votesCount', { count: poll.totalVotes })}
        </span>
        {hasVoted ? (
          <>
            <span aria-hidden>·</span>
            <span>{t('postPoll.voteRecorded')}</span>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default PostPollDisplay;
