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
  Loader2,
  BarChart3,
} from 'lucide-react';
import { COMMUNITY_APP_IDS } from '../../constants/communityApps';
import {
  communitySettingsPath,
  communityStorePath,
  communityDashboardInvitesPath,
  communityDashboardProductsPath,
} from '../../constants/communityRoutes';
import { useTranslation } from '../../i18n/useTranslation';
import { AnimatedCommunitySidebarIcon } from './CommunitySidebarAnimatedIcons';
import FloatingMenu, { type FloatingMenuAnchor } from '../Common/FloatingMenu';

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
  onRenameApp: (inst: CommunitySidebarAppInstance) => void;
  onMoveApp: (instanceId: string, direction: 'up' | 'down') => void | Promise<void>;
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
  onRenameApp,
  onMoveApp,
  onNavigate,
  className = '',
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [appInstanceMenuId, setAppInstanceMenuId] = useState<string | null>(null);
  const [appMenuAnchor, setAppMenuAnchor] = useState<FloatingMenuAnchor | null>(null);
  const [appInstanceMenuPanel, setAppInstanceMenuPanel] = useState<'main' | 'visibility'>('main');
  const [duplicateSuccessId, setDuplicateSuccessId] = useState<string | null>(null);
  const [movingApp, setMovingApp] = useState<{ id: string; direction: 'up' | 'down' } | null>(null);
  const duplicateTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (duplicateTimerRef.current != null) window.clearTimeout(duplicateTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!appInstanceMenuId) setAppMenuAnchor(null);
  }, [appInstanceMenuId]);

  const closeAppMenu = () => {
    setAppInstanceMenuId(null);
    setAppMenuAnchor(null);
    setDuplicateSuccessId(null);
    setAppInstanceMenuPanel('main');
  };

  const menuInst = apps.find((a) => a.id === appInstanceMenuId) ?? null;
  const menuAppIndex = menuInst ? apps.findIndex((a) => a.id === menuInst.id) : -1;

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
                <div className="relative h-6 w-6 shrink-0 pr-1">
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
                    data-floating-menu-trigger
                    aria-label={t('community.appOptionsAria')}
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      if (appInstanceMenuId === inst.id) {
                        closeAppMenu();
                        return;
                      }
                      setAppInstanceMenuPanel('main');
                      setAppMenuAnchor({ rect });
                      setAppInstanceMenuId(inst.id);
                    }}
                    className={`flex h-6 w-6 items-center justify-center rounded-md text-black transition-opacity hover:bg-black/5 ${
                      menuOpen
                        ? 'pointer-events-auto opacity-100'
                        : 'pointer-events-none opacity-0 group-hover/row:pointer-events-auto group-hover/row:opacity-100'
                    }`}
                  >
                    <AnimatedCommunitySidebarIcon kind="ellipsisVertical" size={14} />
                  </button>
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

      <FloatingMenu
        open={Boolean(menuInst && appMenuAnchor)}
        anchor={appMenuAnchor}
        onClose={closeAppMenu}
        width={200}
      >
        {menuInst && appInstanceMenuPanel === 'main' && (
          <>
            <div className="mb-1 flex gap-1 px-0.5 pt-0.5">
              <button
                type="button"
                disabled={menuAppIndex === 0 || movingApp !== null}
                aria-label={t('community.moveAppUpAria')}
                title={t('community.moveAppUpAria')}
                onClick={() => {
                  if (menuAppIndex === 0 || movingApp) return;
                  void (async () => {
                    setMovingApp({ id: menuInst.id, direction: 'up' });
                    try {
                      await onMoveApp(menuInst.id, 'up');
                    } finally {
                      setMovingApp(null);
                    }
                  })();
                }}
                className={`flex h-8 flex-1 items-center justify-center rounded-md transition-colors ${
                  menuAppIndex === 0 || movingApp !== null
                    ? 'cursor-not-allowed text-neutral-300'
                    : 'text-neutral-800 hover:bg-black/5'
                }`}
              >
                {movingApp?.id === menuInst.id && movingApp.direction === 'up' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-600" aria-hidden />
                ) : (
                  <AnimatedCommunitySidebarIcon
                    kind="arrowUp"
                    size={16}
                    color={menuAppIndex === 0 || movingApp !== null ? '#d4d4d4' : 'currentColor'}
                  />
                )}
              </button>
              <button
                type="button"
                disabled={menuAppIndex >= apps.length - 1 || movingApp !== null}
                aria-label={t('community.moveAppDownAria')}
                title={t('community.moveAppDownAria')}
                onClick={() => {
                  if (menuAppIndex >= apps.length - 1 || movingApp) return;
                  void (async () => {
                    setMovingApp({ id: menuInst.id, direction: 'down' });
                    try {
                      await onMoveApp(menuInst.id, 'down');
                    } finally {
                      setMovingApp(null);
                    }
                  })();
                }}
                className={`flex h-8 flex-1 items-center justify-center rounded-md transition-colors ${
                  menuAppIndex >= apps.length - 1 || movingApp !== null
                    ? 'cursor-not-allowed text-neutral-300'
                    : 'text-neutral-800 hover:bg-black/5'
                }`}
              >
                {movingApp?.id === menuInst.id && movingApp.direction === 'down' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-600" aria-hidden />
                ) : (
                  <AnimatedCommunitySidebarIcon
                    kind="arrowDown"
                    size={16}
                    color={
                      menuAppIndex >= apps.length - 1 || movingApp !== null
                        ? '#d4d4d4'
                        : 'currentColor'
                    }
                  />
                )}
              </button>
            </div>
            <div className="my-1 h-px bg-neutral-100" />
            <Link
              to={communitySettingsPath(handle)}
              onClick={() => {
                closeAppMenu();
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
                closeAppMenu();
                onRenameApp(menuInst);
              }}
              className="flex w-full items-center gap-2 rounded px-3 py-1 text-left text-[14px] text-neutral-900 transition-colors hover:bg-black/5"
              role="menuitem"
            >
              <AnimatedCommunitySidebarIcon kind="rename" size={12} />
              {t('community.renameApp')}
            </button>
            <Link
              to={`${communityDashboardProductsPath(handle)}?app=${encodeURIComponent(menuInst.id)}`}
              onClick={() => {
                closeAppMenu();
                onNavigate?.();
              }}
              className="flex w-full items-center gap-2 rounded px-3 py-1 text-left text-[14px] text-neutral-900 transition-colors hover:bg-black/5"
              role="menuitem"
            >
              <BarChart3 className="h-3 w-3 shrink-0" aria-hidden />
              {t('community.appStats')}
            </Link>
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  const result = await onDuplicateApp(menuInst.id);
                  if (result === false) return;
                  setDuplicateSuccessId(menuInst.id);
                  if (duplicateTimerRef.current != null) {
                    window.clearTimeout(duplicateTimerRef.current);
                  }
                  duplicateTimerRef.current = window.setTimeout(() => {
                    setDuplicateSuccessId(null);
                    closeAppMenu();
                    duplicateTimerRef.current = null;
                  }, 3000);
                })();
              }}
              className="flex w-full items-center gap-2 rounded px-3 py-1 text-left text-[14px] text-neutral-900 transition-colors hover:bg-black/5"
              role="menuitem"
            >
              <AnimatedCommunitySidebarIcon
                kind={duplicateSuccessId === menuInst.id ? 'check' : 'copy'}
                size={12}
                autoPlay={duplicateSuccessId === menuInst.id}
              />
              {t('community.duplicateApp')}
            </button>
            <Link
              to={communityDashboardInvitesPath(handle)}
              onClick={() => {
                closeAppMenu();
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
              onClick={() => {
                void onDeleteApp(menuInst.id);
                closeAppMenu();
              }}
              className="flex w-full items-center gap-2 rounded px-3 py-1 text-left text-[14px] text-red-600 transition-colors hover:bg-red-50"
              role="menuitem"
            >
              <AnimatedCommunitySidebarIcon kind="trash" size={12} color="#dc2626" />
              {t('community.deleteApp')}
            </button>
          </>
        )}
        {menuInst && appInstanceMenuPanel === 'visibility' && (
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
              onClick={() => void onPatchVisibility(menuInst.id, true)}
            >
              <span className="flex items-center gap-2">
                <AnimatedCommunitySidebarIcon kind="eye" size={12} />
                {t('community.showToMembers')}
              </span>
              {menuInst.visibleToMembers && <Check className="h-3 w-3 shrink-0" aria-hidden />}
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 rounded px-3 py-1 text-left text-[14px] text-neutral-900 transition-colors hover:bg-black/5"
              onClick={() => void onPatchVisibility(menuInst.id, false)}
            >
              <span className="flex items-center gap-2">
                <AnimatedCommunitySidebarIcon kind="eyeOff" size={12} />
                {t('community.hideFromMembers')}
              </span>
              {!menuInst.visibleToMembers && <Check className="h-3 w-3 shrink-0" aria-hidden />}
            </button>
          </>
        )}
      </FloatingMenu>
    </div>
  );
};

export default CommunityLeftSidebar;
