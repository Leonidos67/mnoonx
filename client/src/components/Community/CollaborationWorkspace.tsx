import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bot,
  Calendar,
  ClipboardList,
  CloudDownload,
  Columns3,
  GraduationCap,
  Globe,
  Lock,
  Megaphone,
  MessagesSquare,
  Plus,
  QrCode,
  Quote,
  Users2,
} from 'lucide-react';
import {
  communityPath,
  communitySettingsPath,
  communityStorePath,
} from '../../constants/communityRoutes';
import { COMMUNITY_APP_IDS } from '../../constants/communityApps';
import { profilePath } from '../../constants/paths';
import { useTranslation } from '../../i18n/useTranslation';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { ProfileQrCodeModal } from '../Profile/ProfileQrCodeModal';
import { AnimatedCommunitySidebarIcon } from './CommunitySidebarAnimatedIcons';

export type CollabAppInstance = {
  id: string;
  appId: string;
  title: string;
  visibleToMembers?: boolean;
  note?: string;
};

export type CreatorFace = {
  type: 'user' | 'community';
  name: string;
  handle: string;
  avatar?: string;
  userId?: string;
  username?: string;
  fullName?: string;
};

type Creator = {
  username?: string;
  fullName?: string;
  avatar?: string;
};

export function resolveCreatorFace(
  face?: CreatorFace | null,
  fallback?: Creator | null
): CreatorFace | null {
  if (face && (face.name || face.handle || face.username)) {
    return face;
  }
  if (!fallback?.username && !fallback?.fullName) return null;
  const username = fallback.username || '';
  return {
    type: 'user',
    name: fallback.fullName || username,
    handle: username,
    avatar: fallback.avatar || '',
    username,
    fullName: fallback.fullName || username,
  };
}

function faceHref(face: CreatorFace): string {
  if (face.type === 'community' && face.handle) {
    return communityPath(face.handle);
  }
  return profilePath(face.username || face.handle);
}

function faceLabel(face: CreatorFace): string {
  return face.name || face.fullName || face.username || face.handle || '—';
}

function faceSubLabel(face: CreatorFace): string {
  if (face.type === 'community') return `@${face.handle}`;
  return `@${face.username || face.handle}`;
}

function avatarUrl(
  face: { avatar?: string } | null | undefined,
  fallbackName: string,
  size = 80
): string {
  const raw =
    face?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=171717&color=fff&size=${size}&bold=true`;
  return resolveMediaUrl(raw) || raw;
}

function appIcon(appId: string, size = 18) {
  if (appId === COMMUNITY_APP_IDS.CHAT) return <MessagesSquare size={size} />;
  if (appId === COMMUNITY_APP_IDS.COURSES) return <GraduationCap size={size} />;
  if (appId === COMMUNITY_APP_IDS.CONTENT) return <Quote size={size} />;
  if (appId === COMMUNITY_APP_IDS.FILES) return <CloudDownload size={size} />;
  if (appId === COMMUNITY_APP_IDS.EVENTS) return <Calendar size={size} />;
  if (appId === COMMUNITY_APP_IDS.AI) return <Bot size={size} />;
  if (appId === COMMUNITY_APP_IDS.KANBAN) return <Columns3 size={size} />;
  if (appId === COMMUNITY_APP_IDS.FORMS) return <ClipboardList size={size} />;
  return <Megaphone size={size} />;
}

/** Compact horizontal apps rail */
export const CollaborationAppsStrip: React.FC<{
  instances: CollabAppInstance[];
  isOwner: boolean;
  onOpen: (inst: CollabAppInstance) => void;
  onAdd?: () => void;
  className?: string;
}> = ({ instances, isOwner, onOpen, onAdd, className = '' }) => {
  const { t } = useTranslation();

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-neutral-900">{t('community.collab.appsHeading')}</p>
        {isOwner && onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-neutral-800"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('community.addAppTitle')}
          </button>
        ) : null}
      </div>

      {instances.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-3 py-4 text-center text-sm text-neutral-500">
          {t('community.noAppsInstalled')}
        </p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {instances.map((inst) => (
            <button
              key={inst.id}
              type="button"
              onClick={() => onOpen(inst)}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-neutral-200 bg-white py-2 pl-2 pr-3.5 text-left transition-colors hover:border-neutral-300 hover:bg-neutral-50"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
                {appIcon(inst.appId, 16)}
              </span>
              <span className="max-w-[9rem] truncate text-sm font-medium text-neutral-900">
                {inst.title}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/** Center header for collaborations — no banner / cover */
export const CollaborationCenterHeader: React.FC<{
  name: string;
  description?: string;
  isPublic: boolean;
  memberCount: number;
  formatCount: (n: number) => string;
  owner: Creator | null | undefined;
  coOwner: Creator | null | undefined;
  ownerFace?: CreatorFace | null;
  coOwnerFace?: CreatorFace | null;
  instances: CollabAppInstance[];
  isOwner: boolean;
  onOpenApp: (inst: CollabAppInstance) => void;
  onAddApp?: () => void;
  joinSlot?: React.ReactNode;
  mobileTrailing?: React.ReactNode;
}> = ({
  name,
  description,
  isPublic,
  memberCount,
  formatCount,
  owner,
  coOwner,
  ownerFace,
  coOwnerFace,
  instances,
  isOwner,
  onOpenApp,
  onAddApp,
  joinSlot,
  mobileTrailing,
}) => {
  const { t } = useTranslation();
  const ownerDisplay = resolveCreatorFace(ownerFace, owner);
  const coDisplay = resolveCreatorFace(coOwnerFace, coOwner);
  const ownerName = ownerDisplay ? faceLabel(ownerDisplay) : '—';
  const coName = coDisplay ? faceLabel(coDisplay) : '—';
  const focusText = description?.trim() || t('community.collab.focusFallback');

  return (
    <div className="relative space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
      {mobileTrailing ? (
        <div className="absolute right-3 top-3 z-10 lg:hidden">{mobileTrailing}</div>
      ) : null}

      <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">
        <Users2 className="h-3.5 w-3.5" aria-hidden />
        {t('discover.collaborationBadge')}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center">
            <img
              src={avatarUrl(ownerDisplay, ownerName, 96)}
              alt=""
              className="relative z-[1] h-14 w-14 rounded-full border-[3px] border-white object-cover shadow-sm ring-2 ring-neutral-200 sm:h-16 sm:w-16"
            />
            <img
              src={avatarUrl(coDisplay, coName, 96)}
              alt=""
              className="relative -ml-4 h-14 w-14 rounded-full border-[3px] border-white object-cover shadow-sm ring-2 ring-neutral-200 sm:-ml-5 sm:h-16 sm:w-16"
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">{name}</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {t('discover.collaborationByTwo', { a: ownerName, b: coName })}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-600">
            {ownerDisplay ? (
              <Link
                to={faceHref(ownerDisplay)}
                className="font-medium text-neutral-800 hover:underline"
              >
                {faceSubLabel(ownerDisplay)}
              </Link>
            ) : null}
            {coDisplay ? (
              <>
                <span className="text-neutral-300">&</span>
                <Link
                  to={faceHref(coDisplay)}
                  className="font-medium text-neutral-800 hover:underline"
                >
                  {faceSubLabel(coDisplay)}
                </Link>
              </>
            ) : null}
            <span className="text-neutral-300">·</span>
            <span>
              {t(
                memberCount === 1
                  ? 'community.memberCountLineOne'
                  : 'community.memberCountLineMany',
                { count: formatCount(memberCount) }
              )}
            </span>
            <span className="text-neutral-300">·</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                isPublic ? 'bg-neutral-100 text-neutral-700' : 'bg-neutral-100 text-neutral-600'
              }`}
            >
              {isPublic ? <Globe size={11} /> : <Lock size={11} />}
              {isPublic ? t('common.public') : t('common.private')}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
          {t('community.collab.focusHeading')}
        </p>
        <p className="mt-1.5 text-[15px] leading-relaxed text-neutral-700">{focusText}</p>
      </div>

      <CollaborationAppsStrip
        instances={instances}
        isOwner={isOwner}
        onOpen={onOpenApp}
        onAdd={onAddApp}
      />

      {joinSlot ? <div>{joinSlot}</div> : null}
    </div>
  );
};

/** Right panel tailored for collaborations */
export const CollaborationRightPanel: React.FC<{
  handle: string;
  name: string;
  owner: Creator;
  coOwner?: Creator | null;
  ownerFace?: CreatorFace | null;
  coOwnerFace?: CreatorFace | null;
  instances: CollabAppInstance[];
  isOwner: boolean;
  onCopyLink: () => boolean | void | Promise<boolean | void>;
  onOpenApp: (inst: CollabAppInstance) => void;
  onOpenSettings?: () => void;
  onNavigate?: () => void;
  className?: string;
}> = ({
  handle,
  name,
  owner,
  coOwner,
  ownerFace,
  coOwnerFace,
  instances,
  isOwner,
  onCopyLink,
  onOpenApp,
  onOpenSettings,
  onNavigate,
  className = '',
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [copySuccess, setCopySuccess] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current != null) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  const go = (fn: () => void) => {
    fn();
    onNavigate?.();
  };

  const handleCopy = async () => {
    const result = await onCopyLink();
    if (result === false) return;
    setCopySuccess(true);
    if (copyTimerRef.current != null) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => {
      setCopySuccess(false);
      copyTimerRef.current = null;
    }, 3000);
  };

  const creators = [
    { face: resolveCreatorFace(ownerFace, owner), role: t('community.collab.roleOwner') },
    {
      face: resolveCreatorFace(coOwnerFace, coOwner),
      role: t('community.collab.roleCoOwner'),
    },
  ].filter((row): row is { face: CreatorFace; role: string } => Boolean(row.face));

  return (
    <div className={`space-y-3 p-3 ${className}`}>
      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
          {t('discover.collaborationBadge')}
        </p>
        <p className="mt-1 text-lg font-bold text-neutral-900">{name}</p>
        <p className="mt-0.5 text-sm text-neutral-600">{t('community.collab.rightHint')}</p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-2">
        <div className="space-y-1">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-100 font-medium text-neutral-800 transition-all hover:bg-neutral-200"
            >
              <AnimatedCommunitySidebarIcon
                kind={copySuccess ? 'check' : 'copy'}
                size={16}
                autoPlay={copySuccess}
              />
              {t('common.copyLink')}
            </button>
            <button
              type="button"
              onClick={() => setQrOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 transition-all hover:bg-neutral-200"
              aria-label={t('community.qr.openAria')}
              title={t('community.qr.openAria')}
            >
              <QrCode size={18} strokeWidth={2} aria-hidden />
            </button>
          </div>
          {isOwner && (
            <button
              type="button"
              onClick={() =>
                go(() => {
                  if (onOpenSettings) onOpenSettings();
                  else navigate(communitySettingsPath(handle));
                })
              }
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-[15px] text-neutral-800 transition-all hover:bg-neutral-50"
            >
              <AnimatedCommunitySidebarIcon kind="bolt" size={18} />
              {t('nav.settings')}
            </button>
          )}
          {isOwner && (
            <button
              type="button"
              onClick={() => go(() => navigate(communityStorePath(handle)))}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-[15px] text-neutral-800 transition-all hover:bg-neutral-50"
            >
              <Plus className="h-[18px] w-[18px]" />
              {t('community.addAppTitle')}
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 bg-neutral-50/60 px-3 py-2.5">
          <h3 className="text-sm font-semibold text-neutral-900">
            {t('community.collab.creatorsHeading')}
          </h3>
        </div>
        <div className="divide-y divide-neutral-100 p-2">
          {creators.map(({ face, role }) => {
            const label = faceLabel(face);
            const key = `${face.type}-${face.handle || face.username}-${role}`;
            return (
              <Link
                key={key}
                to={faceHref(face)}
                onClick={() => onNavigate?.()}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-neutral-50"
              >
                <img
                  src={avatarUrl(face, label, 48)}
                  alt=""
                  className="h-11 w-11 rounded-full object-cover ring-2 ring-neutral-200"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-neutral-900">{label}</p>
                  <p className="truncate text-sm text-neutral-500">{faceSubLabel(face)}</p>
                </div>
                <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">
                  {role}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {instances.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 bg-neutral-50/60 px-3 py-2.5">
            <h3 className="text-sm font-semibold text-neutral-900">
              {t('community.collab.appsHeading')}
            </h3>
          </div>
          <div className="space-y-1 p-2">
            {instances.map((inst) => (
              <button
                key={inst.id}
                type="button"
                onClick={() => {
                  onOpenApp(inst);
                  onNavigate?.();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-neutral-50"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
                  {appIcon(inst.appId, 16)}
                </span>
                <span className="truncate text-sm font-medium text-neutral-900">{inst.title}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <ProfileQrCodeModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        pageUrl={communityPath(handle)}
        fullName={name}
        title={t('community.qr.title')}
        shareTitle={t('community.qr.shareTitle', { name })}
        shareText={t('community.qr.shareText', { name })}
        fileSlug={`mnoonx-community-${handle}-qr`}
      />
    </div>
  );
};

/** @deprecated hub merged into CollaborationCenterHeader */
export const CollaborationCenterHub = CollaborationCenterHeader;

export default CollaborationCenterHeader;
