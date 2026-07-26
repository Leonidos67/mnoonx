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
  <div className="flex overflow-hidden rounded-2xl border border-neutral-200 bg-white sm:flex-col sm:rounded-[1.25rem]">
    <SkeletonPulse className="h-[4.5rem] w-[5.25rem] shrink-0 rounded-none sm:h-24 sm:w-full" />
    <div className="flex flex-1 flex-col justify-center space-y-2 px-3 py-2.5 sm:px-4 sm:pb-3.5 sm:pt-7">
      <SkeletonPulse className="h-4 w-2/3" />
      <SkeletonPulse className="h-3 w-1/2" />
      <SkeletonPulse className="hidden h-3 w-full sm:block" />
    </div>
  </div>
);

/** Creator / user card skeleton for Discover loading grids */
export const DiscoverCreatorCardSkeleton: React.FC = () => (
  <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white sm:rounded-[1.25rem]">
    <SkeletonPulse className="aspect-[4/3] w-full rounded-none" />
    <div className="space-y-2 bg-white px-3 py-3 sm:px-4 sm:py-3.5">
      <SkeletonPulse className="h-3.5 w-2/5" />
      <SkeletonPulse className="h-3 w-4/5" />
      <SkeletonPulse className="h-3 w-1/3" />
    </div>
  </div>
);

/** Horizontal list-row skeleton matching CreatorCard */
export const DiscoverCreatorRowSkeleton: React.FC = () => (
  <div className="flex w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 sm:rounded-3xl sm:p-4">
    <SkeletonPulse className="h-11 w-11 shrink-0 rounded-full sm:h-12 sm:w-12" />
    <div className="min-w-0 flex-1 space-y-2">
      <SkeletonPulse className="h-3.5 w-1/3" />
      <SkeletonPulse className="h-3 w-1/4" />
      <SkeletonPulse className="h-2.5 w-1/2" />
    </div>
  </div>
);

export default FeedSkeleton;
