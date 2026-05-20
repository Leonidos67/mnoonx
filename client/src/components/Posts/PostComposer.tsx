import React, { useEffect, useRef, useState } from 'react';
import { Image, Loader2 } from 'lucide-react';
import PostMediaUpload, { PostMediaUploadHandle } from './PostMediaUpload';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { MAX_POST_MEDIA } from '../../utils/postMedia';

export type PostComposerVariant = 'home' | 'profile' | 'community';

interface PostComposerProps {
  isOpen: boolean;
  onOpen: () => void;
  content: string;
  onContentChange: (value: string) => void;
  media: string[];
  onMediaChange: (urls: string[]) => void;
  onCancel: () => void;
  onSubmit: () => void;
  isPosting: boolean;
  userAvatar?: string;
  userFullName?: string;
  token: string | null;
  variant?: PostComposerVariant;
}

const PostComposer: React.FC<PostComposerProps> = ({
  isOpen,
  onOpen,
  content,
  onContentChange,
  media,
  onMediaChange,
  onCancel,
  onSubmit,
  isPosting,
  userAvatar,
  userFullName,
  token,
  variant = 'home',
}) => {
  const isLgUp = useMediaQuery('(min-width: 1024px)');
  const mobileFull = isOpen && !isLgUp;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaUploadRef = useRef<PostMediaUploadHandle>(null);
  const [mediaUploading, setMediaUploading] = useState(false);

  const avatarSrc =
    userAvatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userFullName || 'User')}&background=000&color=fff&size=40&bold=true`;

  useEffect(() => {
    if (mobileFull || !textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [content, mobileFull]);

  useEffect(() => {
    if (!mobileFull) return;
    const t = window.setTimeout(() => textareaRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [mobileFull]);

  useEffect(() => {
    if (!mobileFull) return;
    document.documentElement.classList.add('post-composer-mobile-open');
    return () => document.documentElement.classList.remove('post-composer-mobile-open');
  }, [mobileFull]);

  const handleAddPhotos = () => {
    if (!token) {
      window.dispatchEvent(new CustomEvent('openLogin'));
      return;
    }
    mediaUploadRef.current?.openPicker();
  };

  const closedWrapperClass =
    variant === 'profile'
      ? 'shrink-0 border-b border-neutral-200 bg-neutral-50 p-4'
      : variant === 'community'
        ? 'shrink-0 border-b border-[#ececec] bg-white px-4 py-3'
        : 'shrink-0 cursor-pointer border-b border-neutral-200 p-4 transition-colors hover:bg-neutral-50';

  const closedInnerClass =
    variant === 'profile'
      ? 'w-full cursor-pointer rounded-xl px-4 py-3 text-left text-base text-neutral-500 transition-colors hover:bg-neutral-100'
      : variant === 'community'
        ? 'flex cursor-pointer gap-3'
        : 'flex gap-3';

  const mobileFullScreenClass =
    'fixed inset-x-0 z-50 flex min-h-0 flex-col p-4 top-[var(--app-header-height)] bottom-[calc(var(--app-mobile-nav-height)+env(safe-area-inset-bottom,0px))]';

  const openWrapperClass = mobileFull
    ? `${mobileFullScreenClass} ${variant === 'community' ? 'bg-white' : 'bg-neutral-50'}`
    : variant === 'community'
      ? 'shrink-0 border-b border-[#ececec] bg-white px-4 py-3 pb-6'
      : 'shrink-0 border-b border-neutral-200 bg-neutral-50 p-4';

  const toolbarBorderClass = variant === 'community' ? 'border-[#ececec]' : 'border-neutral-200';

  if (!isOpen) {
    if (variant === 'profile') {
      return (
        <div className={closedWrapperClass}>
          <button type="button" onClick={onOpen} className={closedInnerClass}>
            What&apos;s on your mind?
          </button>
        </div>
      );
    }

    return (
      <div
        onClick={onOpen}
        className={closedWrapperClass}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onOpen();
        }}
      >
        <div className={closedInnerClass}>
          <img src={avatarSrc} alt="" className="h-10 w-10 rounded-full" />
          <div className="flex-1">
            <p className="text-base text-neutral-500">What&apos;s on your mind?</p>
          </div>
        </div>
      </div>
    );
  }

  const composerInner = (
    <>
      <div className={mobileFull ? 'flex min-h-0 flex-1 flex-col' : 'flex gap-3'}>
        {!mobileFull && (
          <img src={avatarSrc} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
        )}
        <div className={mobileFull ? 'flex min-h-0 flex-1 flex-col' : 'min-w-0 flex-1'}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="What's on your mind?"
            className={
              mobileFull
                ? 'min-h-0 w-full flex-1 resize-none bg-transparent text-base text-neutral-900 outline-none placeholder:text-neutral-500'
                : variant === 'community'
                  ? 'min-h-[60px] w-full resize-none bg-transparent text-lg text-neutral-900 outline-none placeholder:text-[#999]'
                  : 'min-h-[100px] w-full resize-none bg-transparent text-base text-neutral-900 outline-none placeholder:text-neutral-500'
            }
            maxLength={2000}
            autoFocus
          />
          <PostMediaUpload
            ref={mediaUploadRef}
            urls={media}
            onUrlsChange={onMediaChange}
            token={token}
            hideAddButton
            onUploadingChange={setMediaUploading}
          />
        </div>
      </div>
      <div className={`mt-3 flex shrink-0 items-center justify-between border-t pt-3 ${toolbarBorderClass}`}>
        {media.length < MAX_POST_MEDIA ? (
          <button
            type="button"
            onClick={handleAddPhotos}
            disabled={mediaUploading}
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-50"
          >
            {mediaUploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Image size={18} />
            )}
            <span>{mediaUploading ? 'Uploading…' : 'Add photos'}</span>
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-sm font-semibold transition-colors hover:bg-neutral-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={(!content.trim() && media.length === 0) || isPosting}
            className="flex items-center gap-2 rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
          >
            {isPosting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Posting...
              </>
            ) : (
              <>Post</>
            )}
          </button>
        </div>
      </div>
    </>
  );

  return <div className={openWrapperClass}>{composerInner}</div>;
};

export default PostComposer;
