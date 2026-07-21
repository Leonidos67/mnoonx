import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  HouseHeart,
  GraduationCap,
  ChevronRight,
  Check,
  ArrowLeft,
  MessagesSquare,
  Quote,
  CloudDownload,
  Megaphone,
  Calendar,
  Bot,
  Columns3,
  ClipboardList,
} from 'lucide-react';
import { COMMUNITY_APP_IDS } from '../../constants/communityApps';
import { communitySettingsPath, communityStorePath, communityDashboardInvitesPath } from '../../constants/communityRoutes';
import { useTranslation } from '../../i18n/useTranslation';
import { AnimatedCommunitySidebarIcon } from './CommunitySidebarAnimatedIcons';

export interface CommunitySidebarAppInstance {
  id: string;
  appId: string;
  title: string;
  visibleToMembers: boolean;
}

export type CommunityLeftNav =
  | 'home'
  | 'chat'
  | 'courses'
  | 'content'
  | 'files'
  | 'announcements'
  | 'events'
  | 'ai'
  | 'kanban'
  | 'forms';

export interface CommunityLeftSidebarProps {
  communityName: string;
  communityAvatar?: string;
  memberCount: number;
  handle: string;
  leftNav: CommunityLeftNav;
  onGoHome: () => void;
  apps: CommunitySidebarAppInstance[];
  onActivateApp: (inst: CommunitySidebarAppInstance) => void;
  activeChatInstanceId: string | null;
  activeCoursesInstanceId: string | null;
  activeContentInstanceId: string | null;
  activeFilesInstanceId: string | null;
  activeAnnouncementsInstanceId: string | null;
  activeEventsInstanceId: string | null;
  activeAiInstanceId: string | null;
  activeKanbanInstanceId: string | null;
  activeFormsInstanceId: string | null;
  unreadByInstance: Record<string, number>;
  isOwner: boolean;
  formatCount: (n: number) => string;
  onPatchVisibility: (instanceId: string, visible: boolean) => void | Promise<void>;
  onDeleteApp: (instanceId: string) => void | Promise<void>;
  onDuplicateApp: (instanceId: string) => boolean | void | Promise<boolean | void>;
  /** Close mobile drawer after navigation */
  onNavigate?: () => void;
  className?: string;
}

const CommunityLeftSidebar: React.FC<CommunityLeftSidebarProps> = ({
  communityName,
  communityAvatar,
  memberCount,
  handle,
  leftNav,
  onGoHome,
  apps,
  onActivateApp,
  activeChatInstanceId,
  activeCoursesInstanceId,
  activeContentInstanceId,
  activeFilesInstanceId,
  activeAnnouncementsInstanceId,
  activeEventsInstanceId,
  activeAiInstanceId,
  activeKanbanInstanceId,
  activeFormsInstanceId,
  unreadByInstance,
  isOwner,
  formatCount,
  onPatchVisibility,
  onDeleteApp,
  onDuplicateApp,
  onNavigate,
  className = '',
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [appInstanceMenuId, setAppInstanceMenuId] = useState<string | null>(null);
  const [appInstanceMenuPanel, setAppInstanceMenuPanel] = useState<'main' | 'visibility'>('main');
  const [duplicateSuccessId, setDuplicateSuccessId] = useState<string | null>(null);
  const appInstanceMenuRef = useRef<HTMLDivElement | null>(null);
  const duplicateTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (duplicateTimerRef.current != null) window.clearTimeout(duplicateTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!appInstanceMenuId) return;
    const onDown = (e: MouseEvent) => {
      if (appInstanceMenuRef.current && !appInstanceMenuRef.current.contains(e.target as Node)) {
        setAppInstanceMenuId(null);
        setDuplicateSuccessId(null);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [appInstanceMenuId]);

  const goHome = () => {
    onGoHome();
    onNavigate?.();
  };

  const activate = (inst: CommunitySidebarAppInstance) => {
    onActivateApp(inst);
    onNavigate?.();
  };

  return (
    <div className={`flex h-full min-h-0 flex-col overflow-hidden bg-white ${className}`}>
      <div className="shrink-0 border-b border-[#ececec] p-2">
        <div className="flex items-center gap-3">
          <img
            src={
              communityAvatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(communityName)}&background=000&color=fff&size=44&bold=true`
            }
            alt=""
            className="h-8 w-8 rounded-md object-cover"
          />
          <div>
            <h2 className="text-[14px] font-semibold leading-none">{communityName}</h2>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-[10px] text-green-600">
                {t(
                  memberCount === 1 ? 'community.memberCountLineOne' : 'community.memberCountLineMany',
                  { count: formatCount(memberCount) }
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-1">
        <button
          type="button"
          onClick={goHome}
          className={`flex h-8 w-full items-center gap-2 rounded px-3 text-[14px] font-medium transition-all ${
            leftNav === 'home' ? 'bg-[#eef2ff] text-[#315efb]' : 'text-[#666] hover:bg-[#f5f5f5]'
          }`}
        >
          <HouseHeart size={18} />
          {t('community.sidebarNavHome')}
        </button>

        {apps.map((inst) => {
          const appKind =
            inst.appId === COMMUNITY_APP_IDS.CHAT
              ? 'chat'
              : inst.appId === COMMUNITY_APP_IDS.COURSES
                ? 'courses'
                : inst.appId === COMMUNITY_APP_IDS.CONTENT
                  ? 'content'
                  : inst.appId === COMMUNITY_APP_IDS.FILES
                    ? 'files'
                    : inst.appId === COMMUNITY_APP_IDS.ANNOUNCEMENTS
                      ? 'announcements'
                      : inst.appId === COMMUNITY_APP_IDS.EVENTS
                        ? 'events'
                        : inst.appId === COMMUNITY_APP_IDS.AI
                          ? 'ai'
                          : inst.appId === COMMUNITY_APP_IDS.KANBAN
                            ? 'kanban'
                            : inst.appId === COMMUNITY_APP_IDS.FORMS
                              ? 'forms'
                              : 'other';
          const rowActive =
            (appKind === 'chat' && leftNav === 'chat' && activeChatInstanceId === inst.id) ||
            (appKind === 'courses' && leftNav === 'courses' && activeCoursesInstanceId === inst.id) ||
            (appKind === 'content' && leftNav === 'content' && activeContentInstanceId === inst.id) ||
            (appKind === 'files' && leftNav === 'files' && activeFilesInstanceId === inst.id) ||
            (appKind === 'announcements' &&
              leftNav === 'announcements' &&
              activeAnnouncementsInstanceId === inst.id) ||
            (appKind === 'events' && leftNav === 'events' && activeEventsInstanceId === inst.id) ||
            (appKind === 'ai' && leftNav === 'ai' && activeAiInstanceId === inst.id) ||
            (appKind === 'kanban' && leftNav === 'kanban' && activeKanbanInstanceId === inst.id) ||
            (appKind === 'forms' && leftNav === 'forms' && activeFormsInstanceId === inst.id);
          const menuOpen = appInstanceMenuId === inst.id;
          const instVisible = inst.visibleToMembers;

          return (
            <div
              key={inst.id}
              className={`group/row relative flex w-full items-center rounded font-medium transition-all ${
                rowActive ? 'bg-[#eef2ff] text-[#315efb]' : 'text-[#666] hover:bg-[#f5f5f5]'
              }`}
            >
              <button
                type="button"
                onClick={() => activate(inst)}
                className="flex h-8 min-w-0 flex-1 items-center gap-2 px-3 text-left text-sm"
              >
                {appKind === 'chat' ? (
                  <MessagesSquare size={18} />
                ) : appKind === 'courses' ? (
                  <GraduationCap size={18} />
                ) : appKind === 'content' ? (
                  <Quote size={18} />
                ) : appKind === 'files' ? (
                  <CloudDownload size={18} />
                ) : appKind === 'events' ? (
                  <Calendar size={18} />
                ) : appKind === 'ai' ? (
                  <Bot size={18} />
                ) : appKind === 'kanban' ? (
                  <Columns3 size={18} />
                ) : appKind === 'forms' ? (
                  <ClipboardList size={18} />
                ) : (
                  <Megaphone size={18} />
                )}
                <span className="min-w-0 flex-1 truncate text-[14px]">{inst.title}</span>
                {appKind === 'chat' &&
                  typeof unreadByInstance[inst.id] === 'number' &&
                  unreadByInstance[inst.id] > 0 &&
                  !(leftNav === 'chat' && activeChatInstanceId === inst.id) && (
                    <span className="shrink-0 rounded-full bg-[#e5484d] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white tabular-nums">
                      {unreadByInstance[inst.id] > 99 ? '99+' : unreadByInstance[inst.id]}
                    </span>
                  )}
              </button>
              {isOwner && (
                <div className="relative h-6 w-6 shrink-0 pr-1" ref={menuOpen ? appInstanceMenuRef : undefined}>
                  {!instVisible && (
                    <span
                      className={`pointer-events-none absolute inset-0 flex items-center justify-center rounded-md text-black transition-opacity ${
                        menuOpen ? 'opacity-0' : 'opacity-100 group-hover/row:opacity-0'
                      }`}
                      title={t('community.hiddenFromMembersTitle')}
                    >
                      <AnimatedCommunitySidebarIcon kind="eyeOff" size={14} />
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label={t('community.appOptionsAria')}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setAppInstanceMenuId((v) => {
                        if (v === inst.id) return null;
                        setAppInstanceMenuPanel('main');
                        return inst.id;
                      });
                    }}
                    className={`flex h-6 w-6 items-center justify-center rounded-md text-black transition-opacity hover:bg-black/5 ${
                      menuOpen
                        ? 'pointer-events-auto opacity-100'
                        : 'pointer-events-none opacity-0 group-hover/row:pointer-events-auto group-hover/row:opacity-100'
                    }`}
                  >
                    <AnimatedCommunitySidebarIcon kind="ellipsisVertical" size={14} />
                  </button>
                  {menuOpen && (
                    <div
                      className="absolute right-0 top-full z-[500] mt-1 w-48 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg"
                      role="menu"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {appInstanceMenuPanel === 'main' ? (
                        <>
                          <Link
                            to={communitySettingsPath(handle)}
                            onClick={() => {
                              setAppInstanceMenuId(null);
                              onNavigate?.();
                            }}
                            className="flex w-full items-center gap-2 rounded px-3 py-1 text-left text-[14px] text-neutral-900 transition-colors hover:bg-black/5"
                            role="menuitem"
                          >
                            <AnimatedCommunitySidebarIcon kind="settings" size={12} />
                            {t('community.nestedMenuAdminSettings')}
                          </Link>
                          <button
                            type="button"
                            onClick={() => setAppInstanceMenuPanel('visibility')}
                            className="flex w-full items-center gap-2 rounded px-3 py-1 text-left text-[14px] text-neutral-900 transition-colors hover:bg-black/5"
                            role="menuitem"
                          >
                            <AnimatedCommunitySidebarIcon kind="visibility" size={12} />
                            <span className="min-w-0 flex-1 truncate text-[14px]">{t('community.changeVisibility')}</span>
                            <ChevronRight className="h-3 w-3 shrink-0 text-neutral-400" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              void (async () => {
                                const result = await onDuplicateApp(inst.id);
                                if (result === false) return;
                                setDuplicateSuccessId(inst.id);
                                if (duplicateTimerRef.current != null) {
                                  window.clearTimeout(duplicateTimerRef.current);
                                }
                                duplicateTimerRef.current = window.setTimeout(() => {
                                  setDuplicateSuccessId(null);
                                  setAppInstanceMenuId(null);
                                  duplicateTimerRef.current = null;
                                }, 3000);
                              })();
                            }}
                            className="flex w-full items-center gap-2 rounded px-3 py-1 text-left text-[14px] text-neutral-900 transition-colors hover:bg-black/5"
                            role="menuitem"
                          >
                            <AnimatedCommunitySidebarIcon
                              kind={duplicateSuccessId === inst.id ? 'check' : 'copy'}
                              size={12}
                              autoPlay={duplicateSuccessId === inst.id}
                            />
                            {t('community.duplicateApp')}
                          </button>
                          <Link
                            to={communityDashboardInvitesPath(handle)}
                            onClick={() => {
                              setAppInstanceMenuId(null);
                              onNavigate?.();
                            }}
                            className="flex w-full items-center gap-2 rounded px-3 py-1 text-left text-[14px] text-neutral-900 transition-colors hover:bg-black/5"
                            role="menuitem"
                          >
                            <AnimatedCommunitySidebarIcon kind="userPlus" size={12} />
                            {t('community.invitePeople')}
                          </Link>
                          <div className="my-1 h-px bg-neutral-100" />
                          <button
                            type="button"
                            onClick={() => void onDeleteApp(inst.id)}
                            className="flex w-full items-center gap-2 rounded px-3 py-1 text-left text-[14px] text-red-600 transition-colors hover:bg-red-50"
                            role="menuitem"
                          >
                            <AnimatedCommunitySidebarIcon kind="trash" size={12} color="#dc2626" />
                            {t('community.deleteApp')}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setAppInstanceMenuPanel('main')}
                            className="flex w-full items-center gap-2 rounded px-3 py-1 text-left text-[14px] text-neutral-900 transition-colors hover:bg-black/5"
                          >
                            <ArrowLeft className="h-3 w-3 shrink-0" aria-hidden />
                            {t('common.back')}
                          </button>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between gap-2 rounded px-3 py-1 text-left text-[14px] text-neutral-900 transition-colors hover:bg-black/5"
                            onClick={() => void onPatchVisibility(inst.id, true)}
                          >
                            <span className="flex items-center gap-2">
                              <AnimatedCommunitySidebarIcon kind="eye" size={12} />
                              {t('community.showToMembers')}
                            </span>
                            {instVisible && <Check className="h-3 w-3 shrink-0" aria-hidden />}
                          </button>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between gap-2 rounded px-3 py-1 text-left text-[14px] text-neutral-900 transition-colors hover:bg-black/5"
                            onClick={() => void onPatchVisibility(inst.id, false)}
                          >
                            <span className="flex items-center gap-2">
                              <AnimatedCommunitySidebarIcon kind="eyeOff" size={12} />
                              {t('community.hideFromMembers')}
                            </span>
                            {!instVisible && <Check className="h-3 w-3 shrink-0" aria-hidden />}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {isOwner && handle && (
          <button
            type="button"
            onClick={() => {
              navigate(communityStorePath(handle));
              onNavigate?.();
            }}
            className="flex h-8 w-full items-center gap-2 rounded px-3 text-[14px] font-medium text-[#666] transition-all hover:bg-[#f5f5f5]"
          >
            <Plus size={18} />
            {t('community.addApp')}
          </button>
        )}
      </div>
    </div>
  );
};

export default CommunityLeftSidebar;
