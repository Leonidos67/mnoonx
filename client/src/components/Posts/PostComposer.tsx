import React, { useEffect, useRef, useState } from 'react';
import { Image, Link2, Loader2, PlusCircle, SquareArrowOutUpRight, X } from 'lucide-react';
import PostMediaUpload, { PostMediaUploadHandle } from './PostMediaUpload';
import PostLinkAttachmentModal from './PostLinkAttachmentModal';
import PostMediaUrlModal from './PostMediaUrlModal';
import type { PostLinkAttachment } from '../../types/postLink';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useTranslation } from '../../i18n/useTranslation';
import { MAX_POST_MEDIA } from '../../utils/postMedia';

export type PostComposerVariant = 'home' | 'profile' | 'community';

interface PostComposerProps {
  isOpen: boolean;
  onOpen: () => void;
  content: string;
  onContentChange: (value: string) => void;
  media: string[];
  onMediaChange: (urls: string[]) => void;
  linkAttachment?: PostLinkAttachment | null;
  onLinkAttachmentChange?: (link: PostLinkAttachment | null) => void;
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
  linkAttachment = null,
  onLinkAttachmentChange,
  onCancel,
  onSubmit,
  isPosting,
  userAvatar,
  userFullName,
  token,
  variant = 'home',
}) => {
  const { t } = useTranslation();
  const isLgUp = useMediaQuery('(min-width: 1024px)');
  const mobileFull = isOpen && !isLgUp;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaUploadRef = useRef<PostMediaUploadHandle>(null);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [mediaUrlModalOpen, setMediaUrlModalOpen] = useState(false);

  const hasLink = Boolean(linkAttachment?.title?.trim() && linkAttachment?.url?.trim());
  const canSubmit =
    Boolean(content.trim()) || media.length > 0 || hasLink;

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
    const timer = window.setTimeout(() => textareaRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
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
            {t('postComposer.whatsOnMind')}
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
          <PlusCircle size={28} className="text-neutral-500" aria-hidden />
          <div className="flex-1">
            <p className="text-base text-neutral-500">{t('postComposer.whatsOnMind')}</p>
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
            placeholder={t('postComposer.whatsOnMind')}
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
          {hasLink ? (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#dbeafe] bg-[#eef2ff] px-3 py-2 text-sm">
              <Link2 className="h-4 w-4 shrink-0 text-[#315efb]" aria-hidden />
              <button
                type="button"
                onClick={() => setLinkModalOpen(true)}
                className="min-w-0 flex-1 truncate text-left font-medium text-[#315efb] underline underline-offset-2"
              >
                {linkAttachment!.title}
              </button>
              {onLinkAttachmentChange ? (
                <button
                  type="button"
                  onClick={() => onLinkAttachmentChange(null)}
                  className="rounded-full p-1 text-neutral-500 hover:bg-white/80"
                  aria-label={t('postComposer.removeLink')}
                >
                  <X size={16} aria-hidden />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      <div className={`mt-3 flex shrink-0 items-center justify-between border-t pt-3 ${toolbarBorderClass}`}>
        <div className="flex flex-wrap items-center">
          {media.length < MAX_POST_MEDIA ? (
            <>
              <button
                type="button"
                onClick={handleAddPhotos}
                disabled={mediaUploading}
                className="inline-flex items-center gap-2 rounded-full p-2 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-50"
              >
                {mediaUploading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Image size={18} />
                )}
                <span className="hidden lg:block">{mediaUploading ? t('postComposer.uploading') : t('postComposer.addPhotos')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!token) {
                    window.dispatchEvent(new CustomEvent('openLogin'));
                    return;
                  }
                  setMediaUrlModalOpen(true);
                }}
                disabled={mediaUploading}
                className="inline-flex items-center gap-2 rounded-full p-2 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-50"
              >
                <Link2 size={18} aria-hidden />
                <span className="hidden lg:block">{t('postComposer.addImageUrl')}</span>
                <span className="block lg:hidden">Img</span>
              </button>
            </>
          ) : null}
          {onLinkAttachmentChange ? (
            <button
              type="button"
              onClick={() => {
                if (!token) {
                  window.dispatchEvent(new CustomEvent('openLogin'));
                  return;
                }
                setLinkModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-full p-2 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              <SquareArrowOutUpRight size={18} aria-hidden />
              <span className="hidden lg:block">{hasLink ? t('postComposer.editLink') : t('postComposer.addLink')}</span>
              <span className="block lg:hidden">{hasLink ? t('postComposer.editLink') : t('postComposer.addLink')}</span>
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-sm font-semibold transition-colors hover:bg-neutral-100"
          >
            {t('postComposer.cancel')}
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit || isPosting}
            className="flex items-center gap-2 rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
          >
            {isPosting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t('postComposer.posting')}
              </>
            ) : (
              <>{t('postComposer.post')}</>
            )}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className={openWrapperClass}>{composerInner}</div>
      {onLinkAttachmentChange ? (
        <PostLinkAttachmentModal
          open={linkModalOpen}
          onClose={() => setLinkModalOpen(false)}
          onSave={onLinkAttachmentChange}
          initialValue={linkAttachment}
          token={token}
        />
      ) : null}
      <PostMediaUrlModal
        open={mediaUrlModalOpen}
        onClose={() => setMediaUrlModalOpen(false)}
        onAdd={(url) => {
          if (media.includes(url)) return;
          if (media.length >= MAX_POST_MEDIA) return;
          onMediaChange([...media, url]);
        }}
      />
    </>
  );
};

export default PostComposer;
