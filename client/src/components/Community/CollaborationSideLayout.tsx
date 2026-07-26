import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { communityPath } from '../../constants/communityRoutes';
import { COMMUNITY_APP_IDS } from '../../constants/communityApps';
import {
  CollaborationRightPanel,
  type CollabAppInstance,
  type CreatorFace,
} from './CollaborationWorkspace';
import { isCommunityOwner } from '../../utils/communityOwner';
import { COMMUNITIES_API as API_URL } from '../../config/api';

type LayoutCommunity = {
  _id: string;
  name: string;
  handle: string;
  kind?: 'community' | 'collaboration';
  isOwner?: boolean;
  owner?: {
    _id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
  coOwner?: {
    _id: string;
    username: string;
    fullName: string;
    avatar: string;
  } | null;
  ownerFace?: CreatorFace | null;
  coOwnerFace?: CreatorFace | null;
  installedAppInstances?: CollabAppInstance[];
};

export type CollaborationSideLayoutContext = {
  community: LayoutCommunity | null;
  refreshCommunity: () => Promise<void>;
};

/**
 * Layout for collaboration secondary pages (settings, store):
 * left = CollaborationRightPanel, center = Outlet.
 * Regular communities render children full-width.
 */
const CollaborationSideLayout: React.FC = () => {
  const { handle: handleParam } = useParams<{ handle: string }>();
  const handle = handleParam?.toLowerCase() || '';
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [community, setCommunity] = useState<LayoutCommunity | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshCommunity = useCallback(async () => {
    if (!handle) return;
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/${encodeURIComponent(handle)}`, { headers });
      if (!res.ok) {
        navigate('/discover', { replace: true });
        return;
      }
      const data = (await res.json()) as LayoutCommunity;
      setCommunity(data);
    } catch {
      navigate('/discover', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [handle, token, navigate]);

  useEffect(() => {
    setLoading(true);
    void refreshCommunity();
  }, [refreshCommunity]);

  const isCollaboration = community?.kind === 'collaboration';
  const isOwner =
    community?.isOwner === true || isCommunityOwner(community || {}, user?.id);

  const instances = useMemo(() => {
    const list = community?.installedAppInstances || [];
    return list.filter(
      (i) =>
        i.appId === COMMUNITY_APP_IDS.CHAT ||
        i.appId === COMMUNITY_APP_IDS.COURSES ||
        i.appId === COMMUNITY_APP_IDS.CONTENT ||
        i.appId === COMMUNITY_APP_IDS.FILES ||
        i.appId === COMMUNITY_APP_IDS.ANNOUNCEMENTS ||
        i.appId === COMMUNITY_APP_IDS.EVENTS ||
        i.appId === COMMUNITY_APP_IDS.AI ||
        i.appId === COMMUNITY_APP_IDS.KANBAN ||
        i.appId === COMMUNITY_APP_IDS.FORMS
    );
  }, [community?.installedAppInstances]);

  const copyLink = useCallback(async () => {
    if (!community?.handle) return false;
    const url = `${window.location.origin}${communityPath(community.handle)}`;
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  }, [community?.handle]);

  const openApp = useCallback(
    (inst: CollabAppInstance) => {
      if (!community?.handle) return;
      const stateKey =
        inst.appId === COMMUNITY_APP_IDS.CHAT
          ? { focusChat: true, chatInstanceId: inst.id }
          : inst.appId === COMMUNITY_APP_IDS.COURSES
            ? { focusCourses: true, coursesInstanceId: inst.id }
            : inst.appId === COMMUNITY_APP_IDS.CONTENT
              ? { focusContent: true, contentInstanceId: inst.id }
              : inst.appId === COMMUNITY_APP_IDS.FILES
                ? { focusFiles: true, filesInstanceId: inst.id }
                : inst.appId === COMMUNITY_APP_IDS.ANNOUNCEMENTS
                  ? { focusAnnouncements: true, announcementsInstanceId: inst.id }
                  : inst.appId === COMMUNITY_APP_IDS.EVENTS
                    ? { focusEvents: true, eventsInstanceId: inst.id }
                    : inst.appId === COMMUNITY_APP_IDS.AI
                      ? { focusAi: true, aiInstanceId: inst.id }
                      : inst.appId === COMMUNITY_APP_IDS.KANBAN
                        ? { focusKanban: true, kanbanInstanceId: inst.id }
                        : inst.appId === COMMUNITY_APP_IDS.FORMS
                          ? { focusForms: true, formsInstanceId: inst.id }
                          : {};
      navigate(communityPath(community.handle), { state: stateKey });
    },
    [community?.handle, navigate]
  );

  const outletContext = useMemo<CollaborationSideLayoutContext>(
    () => ({ community, refreshCommunity }),
    [community, refreshCommunity]
  );

  if (loading && !community) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
      </div>
    );
  }

  if (!isCollaboration || !community?.owner) {
    return <Outlet context={outletContext} />;
  }

  return (
    <div className="flex h-full min-h-[calc(100dvh-var(--app-header-height)-var(--app-mobile-nav-height))] flex-col overflow-hidden lg:min-h-[calc(100dvh-var(--app-header-height))]">
      <div className="mx-auto grid h-full min-h-full w-full max-w-[1600px] flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)] gap-1 p-2 max-lg:min-h-[calc(100dvh-var(--app-header-height)-var(--app-mobile-nav-height))] max-lg:gap-0 max-lg:p-0 lg:min-h-[calc(100dvh-var(--app-header-height)-1rem)] lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="hidden h-full min-h-0 overflow-y-auto lg:block">
          <CollaborationRightPanel
            handle={community.handle}
            name={community.name}
            owner={community.owner}
            coOwner={community.coOwner}
            ownerFace={community.ownerFace}
            coOwnerFace={community.coOwnerFace}
            instances={instances}
            isOwner={isOwner}
            onCopyLink={copyLink}
            onOpenApp={openApp}
          />
        </div>
        <div className="relative z-0 flex h-full min-h-0 min-w-0 flex-col overflow-hidden max-lg:min-h-0">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <Outlet context={outletContext} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborationSideLayout;
