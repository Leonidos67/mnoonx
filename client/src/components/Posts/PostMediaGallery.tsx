import React, { useState } from 'react';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import type { PostLightboxMeta } from './postMediaTypes';
import PostMediaLightbox from './PostMediaLightbox';

interface PostMediaGalleryProps {
  media: string[];
  meta: PostLightboxMeta;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

const PostMediaGallery: React.FC<PostMediaGalleryProps> = ({
  media,
  meta,
  className = '',
  onClick,
}) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!media?.length) return null;

  const openAt = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    onClick?.(e);
    setLightboxIndex(index);
  };

  const renderTile = (url: string, index: number, extraClass: string) => (
    <button
      type="button"
      key={`${url}-${index}`}
      onClick={(e) => openAt(e, index)}
      className={`relative overflow-hidden bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#315efb] ${extraClass}`}
    >
      <img
        src={resolveMediaUrl(url)}
        alt=""
        className="w-full h-full object-cover transition-transform duration-200 hover:scale-[1.02]"
        loading="lazy"
      />
    </button>
  );

  let grid: React.ReactNode;

  if (media.length === 1) {
    grid = (
      <div className="mt-2 overflow-hidden rounded-xl border border-neutral-200">
        {renderTile(media[0], 0, 'block w-full h-[200px]')}
      </div>
    );
  } else if (media.length === 2) {
    grid = (
      <div className="mt-2 grid grid-cols-2 gap-0.5 overflow-hidden rounded-xl border border-neutral-200">
        {media.map((url, i) => renderTile(url, i, 'h-[140px]'))}
      </div>
    );
  } else if (media.length === 3) {
    grid = (
      <div className="mt-2 grid grid-cols-2 gap-0.5 overflow-hidden rounded-xl border border-neutral-200 h-[140px]">
        {renderTile(media[0], 0, 'row-span-2 h-full')}
        {renderTile(media[1], 1, 'h-[69px]')}
        {renderTile(media[2], 2, 'h-[69px]')}
      </div>
    );
  } else {
    grid = (
      <div className="mt-2 grid grid-cols-2 gap-0.5 overflow-hidden rounded-xl border border-neutral-200">
        {media.slice(0, 4).map((url, i) => (
          <div key={`${url}-${i}`} className="relative h-[69px]">
            {renderTile(url, i, 'absolute inset-0 w-full h-full')}
            {i === 3 && media.length > 4 && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-sm font-semibold pointer-events-none"
                aria-hidden
              >
                +{media.length - 4}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className={className} onClick={(e) => e.stopPropagation()}>
        {grid}
      </div>
      {lightboxIndex !== null && (
        <PostMediaLightbox
          media={media}
          index={lightboxIndex}
          meta={meta}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </>
  );
};

export default PostMediaGallery;
