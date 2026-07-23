import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CandlestickChart, Image, Link2, Loader2, SquareArrowOutUpRight, X, ChartNoAxesColumn } from 'lucide-react';
import FloatingMenu, { type FloatingMenuAnchor } from '../Common/FloatingMenu';
import MobileBottomSheet from '../Common/MobileBottomSheet';
import AnimatedPlusIcon from '../Common/AnimatedPlusIcon';
import PostMediaUpload, { PostMediaUploadHandle } from './PostMediaUpload';
import PostCoinAttachmentModal, { PostCoinAttachmentForm } from './PostCoinAttachmentModal';
import PostLinkAttachmentModal, { PostLinkAttachmentForm } from './PostLinkAttachmentModal';
import PostPollAttachmentModal, { PostPollAttachmentForm } from './PostPollAttachmentModal';
import PostMediaUrlModal, { PostMediaUrlForm } from './PostMediaUrlModal';
import PostAttachSheetHeader from './PostAttachSheetHeader';
import type { PostCoinAttachment } from '../../types/postCoin';
import type { PostLinkAttachment } from '../../types/postLink';
import { isValidPollDraft, type PostPollDraft } from '../../types/postPoll';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useTranslation } from '../../i18n/useTranslation';
import { MAX_POST_MEDIA } from '../../utils/postMedia';

export type PostComposerVariant = 'home' | 'profile' | 'community';

type MobileAttachView = 'menu' | 'link' | 'coin' | 'poll' | 'mediaUrl';

interface PostComposerProps {
  isOpen: boolean;
  onOpen: () => void;
  content: string;
  onContentChange: (value: string) => void;
  media: string[];
  onMediaChange: (urls: string[]) => void;
  linkAttachment?: PostLinkAttachment | null;
  onLinkAttachmentChange?: (link: PostLinkAttachment | null) => void;
  coinAttachment?: PostCoinAttachment | null;
  onCoinAttachmentChange?: (coin: PostCoinAttachment | null) => void;
  pollAttachment?: PostPollDraft | null;
  onPollAttachmentChange?: (poll: PostPollDraft | null) => void;
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
  coinAttachment = null,
  onCoinAttachmentChange,
  pollAttachment = null,
  onPollAttachmentChange,
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
  const [coinModalOpen, setCoinModalOpen] = useState(false);
  const [pollModalOpen, setPollModalOpen] = useState(false);
  const [mediaUrlModalOpen, setMediaUrlModalOpen] = useState(false);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [attachMenuAnchor, setAttachMenuAnchor] = useState<FloatingMenuAnchor | null>(null);
  const attachMenuBtnRef = useRef<HTMLButtonElement>(null);
  const [mobileAttach, setMobileAttach] = useState<{
    open: boolean;
    view: MobileAttachView;
    fromMenu: boolean;
  }>({ open: false, view: 'menu', fromMenu: false });

  const hasLink = Boolean(linkAttachment?.title?.trim() && linkAttachment?.url?.trim());
  const hasCoin = Boolean(
    coinAttachment?.coinId?.trim() &&
      coinAttachment?.name?.trim() &&
      coinAttachment?.symbol?.trim()
  );
  const hasPoll = isValidPollDraft(pollAttachment);
  const canSubmit =
    Boolean(content.trim()) || media.length > 0 || hasLink || hasCoin || hasPoll;

  // const avatarSrc =
  //   userAvatar ||
  //   `https://ui-avatars.com/api/?name=${encodeURIComponent(userFullName || 'User')}&background=000&color=fff&size=40&bold=true`;

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

  const closeAttachMenu = useCallback(() => {
    setAttachMenuOpen(false);
    setAttachMenuAnchor(null);
  }, []);

  const closeMobileAttach = useCallback(() => {
    setMobileAttach({ open: false, view: 'menu', fromMenu: false });
  }, []);

  const openMobileAttach = useCallback((view: MobileAttachView, fromMenu: boolean) => {
    setMobileAttach({ open: true, view, fromMenu });
  }, []);

  const backMobileAttach = useCallback(() => {
    setMobileAttach((prev) => {
      if (prev.fromMenu) {
        return { open: true, view: 'menu', fromMenu: false };
      }
      return { open: false, view: 'menu', fromMenu: false };
    });
  }, []);

  const mobileAttachTitle = (() => {
    switch (mobileAttach.view) {
      case 'link':
        return t('postLink.modalTitle');
      case 'coin':
        return t('postCoin.modalTitle');
      case 'poll':
        return t('postPoll.modalTitle');
      case 'mediaUrl':
        return t('postMedia.urlModalTitle');
      default:
        return t('postComposer.attachMenuLabel');
    }
  })();

  const requireAuth = () => {
    if (token) return true;
    window.dispatchEvent(new CustomEvent('openLogin'));
    return false;
  };

  const handleAddPhotos = () => {
    if (!requireAuth()) return;
    if (isLgUp) closeAttachMenu();
    else closeMobileAttach();
    mediaUploadRef.current?.openPicker();
  };

  const handleAddImageUrl = () => {
    if (!requireAuth()) return;
    if (isLgUp) {
      closeAttachMenu();
      setMediaUrlModalOpen(true);
      return;
    }
    openMobileAttach('mediaUrl', true);
  };

  const handleAddLink = () => {
    if (!requireAuth()) return;
    if (isLgUp) {
      closeAttachMenu();
      setLinkModalOpen(true);
      return;
    }
    openMobileAttach('link', true);
  };

  const handleAddCoin = () => {
    if (!requireAuth()) return;
    if (isLgUp) {
      closeAttachMenu();
      setCoinModalOpen(true);
      return;
    }
    openMobileAttach('coin', true);
  };

  const handleAddPoll = () => {
    if (!requireAuth()) return;
    if (isLgUp) {
      closeAttachMenu();
      setPollModalOpen(true);
      return;
    }
    openMobileAttach('poll', true);
  };

  const openLinkEditor = () => {
    if (isLgUp) setLinkModalOpen(true);
    else openMobileAttach('link', false);
  };

  const openCoinEditor = () => {
    if (isLgUp) setCoinModalOpen(true);
    else openMobileAttach('coin', false);
  };

  const openPollEditor = () => {
    if (isLgUp) setPollModalOpen(true);
    else openMobileAttach('poll', false);
  };

  const toggleAttachMenu = () => {
    if (isLgUp) {
      if (attachMenuOpen) {
        closeAttachMenu();
        return;
      }
      if (attachMenuBtnRef.current) {
        setAttachMenuAnchor({ rect: attachMenuBtnRef.current.getBoundingClientRect() });
      }
      setAttachMenuOpen(true);
      return;
    }
    if (mobileAttach.open) closeMobileAttach();
    else openMobileAttach('menu', false);
  };

  const attachUiActive = isLgUp ? attachMenuOpen : mobileAttach.open;

  const attachMenuItemClass =
    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-black transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50';

  const attachMenuSheetItemClass =
    'flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50 active:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50';

  const renderAttachMenuItems = (itemClass: string) => (
    <>
      {media.length < MAX_POST_MEDIA ? (
        <>
          <button
            type="button"
            role="menuitem"
            onClick={handleAddPhotos}
            disabled={mediaUploading}
            className={itemClass}
          >
            {mediaUploading ? (
              <Loader2 size={14} className="animate-spin text-black" aria-hidden />
            ) : (
              <Image size={16} className="text-black" aria-hidden />
            )}
            {mediaUploading ? t('postComposer.uploading') : t('postComposer.addPhotos')}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleAddImageUrl}
            disabled={mediaUploading}
            className={itemClass}
          >
            <Link2 size={16} className="text-black" aria-hidden />
            {t('postComposer.addImageUrl')}
          </button>
        </>
      ) : null}
      {onLinkAttachmentChange ? (
        <button type="button" role="menuitem" onClick={handleAddLink} className={itemClass}>
          <SquareArrowOutUpRight size={16} className="text-black" aria-hidden />
          {hasLink ? t('postComposer.editLink') : t('postComposer.addLink')}
        </button>
      ) : null}
      {onCoinAttachmentChange ? (
        <button type="button" role="menuitem" onClick={handleAddCoin} className={itemClass}>
          <CandlestickChart size={16} className="text-black" aria-hidden />
          {hasCoin ? t('postComposer.editCoin') : t('postComposer.addCoin')}
        </button>
      ) : null}
      {onPollAttachmentChange ? (
        <button type="button" role="menuitem" onClick={handleAddPoll} className={itemClass}>
          <ChartNoAxesColumn size={16} className="text-black" aria-hidden />
          {hasPoll ? t('postComposer.editPoll') : t('postComposer.addPoll')}
        </button>
      ) : null}
    </>
  );

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
          <AnimatedPlusIcon variant="circle" size={28} color="currentColor" className="text-neutral-500" />
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
                onClick={openLinkEditor}
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
          {hasCoin ? (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
              <CandlestickChart className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
              <button
                type="button"
                onClick={openCoinEditor}
                className="min-w-0 flex-1 truncate text-left font-medium text-amber-900"
              >
                {coinAttachment!.name} ({coinAttachment!.symbol.toUpperCase()})
              </button>
              {onCoinAttachmentChange ? (
                <button
                  type="button"
                  onClick={() => onCoinAttachmentChange(null)}
                  className="rounded-full p-1 text-neutral-500 hover:bg-white/80"
                  aria-label={t('postComposer.removeCoin')}
                >
                  <X size={16} aria-hidden />
                </button>
              ) : null}
            </div>
          ) : null}
          {hasPoll ? (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm">
              <ChartNoAxesColumn className="h-4 w-4 shrink-0 text-violet-700" aria-hidden />
              <button
                type="button"
                onClick={openPollEditor}
                className="min-w-0 flex-1 truncate text-left font-medium text-violet-900"
              >
                {t('postComposer.pollPreview', {
                  count: pollAttachment!.options.filter((o) => o.text.trim()).length,
                })}
              </button>
              {onPollAttachmentChange ? (
                <button
                  type="button"
                  onClick={() => onPollAttachmentChange(null)}
                  className="rounded-full p-1 text-neutral-500 hover:bg-white/80"
                  aria-label={t('postComposer.removePoll')}
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
          <button
            ref={attachMenuBtnRef}
            type="button"
            onClick={toggleAttachMenu}
            aria-expanded={attachUiActive}
            aria-haspopup="menu"
            aria-label={t('postComposer.attachMenuLabel')}
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 ${
              attachUiActive ? 'bg-neutral-100 text-neutral-900' : ''
            }`}
          >
            {mediaUploading ? (
              <Loader2 size={20} className="animate-spin" aria-hidden />
            ) : (
              <AnimatedPlusIcon variant="plus" size={20} color="currentColor" />
            )}
          </button>
          {isLgUp ? (
            <FloatingMenu
              open={attachMenuOpen}
              anchor={attachMenuAnchor}
              onClose={closeAttachMenu}
              width={220}
              placement="top"
            >
              {renderAttachMenuItems(attachMenuItemClass)}
            </FloatingMenu>
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
      {isLgUp && onLinkAttachmentChange ? (
        <PostLinkAttachmentModal
          open={linkModalOpen}
          onClose={() => setLinkModalOpen(false)}
          onSave={onLinkAttachmentChange}
          initialValue={linkAttachment}
          token={token}
        />
      ) : null}
      {isLgUp && onCoinAttachmentChange ? (
        <PostCoinAttachmentModal
          open={coinModalOpen}
          onClose={() => setCoinModalOpen(false)}
          onSave={onCoinAttachmentChange}
          initialValue={coinAttachment}
        />
      ) : null}
      {isLgUp && onPollAttachmentChange ? (
        <PostPollAttachmentModal
          open={pollModalOpen}
          onClose={() => setPollModalOpen(false)}
          onSave={onPollAttachmentChange}
          initialValue={pollAttachment}
        />
      ) : null}
      {isLgUp ? (
        <PostMediaUrlModal
          open={mediaUrlModalOpen}
          onClose={() => setMediaUrlModalOpen(false)}
          onAdd={(url) => {
            if (media.includes(url)) return;
            if (media.length >= MAX_POST_MEDIA) return;
            onMediaChange([...media, url]);
          }}
        />
      ) : null}
      {!isLgUp ? (
        <MobileBottomSheet
          open={mobileAttach.open}
          onClose={closeMobileAttach}
          title={mobileAttachTitle}
          padded
        >
          {mobileAttach.view === 'menu' ? (
            <div className="flex flex-col gap-0.5 pb-1" role="menu">
              {renderAttachMenuItems(attachMenuSheetItemClass)}
            </div>
          ) : null}
          {mobileAttach.view === 'link' && onLinkAttachmentChange ? (
            <div className="flex min-h-0 flex-col pb-1">
              <PostAttachSheetHeader title={t('postLink.modalTitle')} onBack={backMobileAttach} />
              <PostLinkAttachmentForm
                variant="sheet"
                initialValue={linkAttachment}
                token={token}
                onSave={(link) => {
                  onLinkAttachmentChange(link);
                  closeMobileAttach();
                }}
                onCancel={closeMobileAttach}
              />
            </div>
          ) : null}
          {mobileAttach.view === 'coin' && onCoinAttachmentChange ? (
            <div className="flex min-h-0 max-h-[70dvh] flex-col pb-1">
              <PostAttachSheetHeader title={t('postCoin.modalTitle')} onBack={backMobileAttach} />
              <PostCoinAttachmentForm
                variant="sheet"
                initialValue={coinAttachment}
                onSave={(coin) => {
                  onCoinAttachmentChange(coin);
                  closeMobileAttach();
                }}
                onCancel={closeMobileAttach}
              />
            </div>
          ) : null}
          {mobileAttach.view === 'poll' && onPollAttachmentChange ? (
            <div className="flex min-h-0 flex-col pb-1">
              <PostAttachSheetHeader title={t('postPoll.modalTitle')} onBack={backMobileAttach} />
              <PostPollAttachmentForm
                variant="sheet"
                initialValue={pollAttachment}
                onSave={(poll) => {
                  onPollAttachmentChange(poll);
                  closeMobileAttach();
                }}
                onCancel={closeMobileAttach}
              />
            </div>
          ) : null}
          {mobileAttach.view === 'mediaUrl' ? (
            <div className="pb-1">
              <PostAttachSheetHeader title={t('postMedia.urlModalTitle')} onBack={backMobileAttach} />
              <PostMediaUrlForm
                variant="sheet"
                onAdd={(url) => {
                  if (media.includes(url)) return;
                  if (media.length >= MAX_POST_MEDIA) return;
                  onMediaChange([...media, url]);
                  closeMobileAttach();
                }}
                onCancel={closeMobileAttach}
              />
            </div>
          ) : null}
        </MobileBottomSheet>
      ) : null}
    </>
  );
};

export default PostComposer;
