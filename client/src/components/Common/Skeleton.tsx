import React from 'react';

/** Shared pulse skeletons for feed/profile/discover loading states */
export const SkeletonPulse: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-neutral-200/80 ${className}`} />
);

export const PostCardSkeleton: React.FC = () => (
  <div className="border-b border-neutral-100 px-4 py-4">
    <div className="flex gap-3">
      <SkeletonPulse className="h-10 w-10 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <SkeletonPulse className="h-3 w-32" />
        <SkeletonPulse className="h-3 w-full" />
        <SkeletonPulse className="h-3 w-4/5" />
        <SkeletonPulse className="mt-3 h-36 w-full rounded-xl" />
        <div className="mt-2 flex gap-4">
          <SkeletonPulse className="h-4 w-10" />
          <SkeletonPulse className="h-4 w-10" />
          <SkeletonPulse className="h-4 w-10" />
        </div>
      </div>
    </div>
  </div>
);

export const FeedSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="divide-y divide-neutral-50">
    {Array.from({ length: count }).map((_, i) => (
      <PostCardSkeleton key={i} />
    ))}
  </div>
);

export const ProfileHeaderSkeleton: React.FC = () => (
  <div className="px-4 pb-4 pt-3">
    <SkeletonPulse className="h-20 w-20 rounded-full" />
    <SkeletonPulse className="mt-3 h-6 w-40" />
    <SkeletonPulse className="mt-2 h-4 w-28" />
    <SkeletonPulse className="mt-3 h-12 w-full" />
    <div className="mt-3 flex gap-4">
      <SkeletonPulse className="h-4 w-20" />
      <SkeletonPulse className="h-4 w-20" />
    </div>
  </div>
);

export const DiscoverCardSkeleton: React.FC = () => (
  <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
    <SkeletonPulse className="h-24 w-full rounded-none" />
    <div className="space-y-2 p-4">
      <SkeletonPulse className="h-5 w-2/3" />
      <SkeletonPulse className="h-3 w-full" />
      <SkeletonPulse className="h-3 w-1/2" />
    </div>
  </div>
);

export default FeedSkeleton;
