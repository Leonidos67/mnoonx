import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  communityPath,
  communityStorePath,
} from '../constants/communityRoutes';
import CommunityLeftSidebar, { type CommunityLeftNav } from '../components/Community/CommunityLeftSidebar';
import CommunityRightSidebar from '../components/Community/CommunityRightSidebar';
import CommunityMobileSideAccess from '../components/Community/CommunityMobileSideAccess';
import { COMMUNITY_APP_IDS } from '../constants/communityApps';
import CommunityChatPanel from '../components/Community/CommunityChatPanel';
import CommunityCoursesPanel from '../components/Community/CommunityCoursesPanel';
import CommunityContentPanel from '../components/Community/CommunityContentPanel';
import CommunityFilesPanel from '../components/Community/CommunityFilesPanel';
import CommunityAnnouncementsPanel from '../components/Community/CommunityAnnouncementsPanel';
import CommunityEventsPanel from '../components/Community/CommunityEventsPanel';
import CommunityAiPanel from '../components/Community/CommunityAiPanel';
import CommunityKanbanPanel from '../components/Community/CommunityKanbanPanel';
import CommunityFormsPanel from '../components/Community/CommunityFormsPanel';
import {
  Plus,
  UserPlus,
  Globe,
  Lock,
  GraduationCap,
  ChevronRight,
  Trash2,
  MessagesSquare,
  Quote,
  CloudDownload,
  Megaphone,
  Star,
  ChevronUp,
  ChevronDown,
  Package,
  Camera,
  Calendar,
  X,
  Users,
  Loader2,
  Bot,
  Columns3,
  ClipboardList,
} from 'lucide-react';
import PostComposer from '../components/Posts/PostComposer';
import PostFeedCard from '../components/Posts/PostFeedCard';
import { AnimatedPostMenuIcon } from '../components/Posts/PostMenuAnimatedIcons';
import PostDetailPanel from '../components/Posts/PostDetailPanel';
import type { PostCoinAttachment } from '../types/postCoin';
import type { PostLinkAttachment } from '../types/postLink';
import type { FeedPost } from '../types/postFeed';
import EditTextModal from '../components/Common/EditTextModal';
import FloatingMenu from '../components/Common/FloatingMenu';
import MobileBottomSheet from '../components/Common/MobileBottomSheet';
import { FeedSkeleton, SkeletonPulse } from '../components/Common/Skeleton';
import { usePostDetail } from '../hooks/usePostDetail';
import { useMediaQuery } from '../hooks/useMediaQuery';
import AddCommunityAdminModal from '../components/Community/AddCommunityAdminModal';
import CommunityBannerModal from '../components/Community/CommunityBannerModal';
import { canAccessCommunityDashboard } from '../utils/communityRoles';
import { isPopulatedCommunity } from '../utils/postDisplay';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { useTranslation } from '../i18n/useTranslation';
import { setDocumentMeta } from '../utils/documentMeta';
import { resolveMediaUrl } from '../utils/mediaUrl';

import { COMMUNITIES_API as API_URL, POSTS_API as POSTS_API_URL } from '../config/api';
const OWNER_ONLY_POST_NOTICE_KEY = 'communityOwnerOnlyPostNoticeDismissed';

interface InstalledAppInstance {
  id: string;
  appId: string;
  title: string;
  visibleToMembers: boolean;
  note?: string;
}

interface Community {
  _id: string;
  name: string;
  handle: string;
  description: string;
  avatar: string;
  banner: string;
  owner: {
    _id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
  members: string[];
  memberCount: number;
  category: string;
  isPublic: boolean;
  membersCanPost?: boolean;
  isPaid: boolean;
  price: number;
  createdAt: string;
  installedApps?: string[];
  installedAppInstances?: InstalledAppInstance[];
  chatPublic?: boolean;
  isMember?: boolean;
  isOwner?: boolean;
  isAdmin?: boolean;
  admins?: CommunityAdminEntry[];
  canViewFull?: boolean;
  canPost?: boolean;
}

interface CommunityAdminEntry {
  _id: string;
  username: string;
  fullName: string;
  avatar: string;
  role: string;
}

interface CommunityAccessPreview {
  name: string;
  handle: string;
  description: string;
  avatar: string;
  banner: string;
  memberCount: number;
  isPublic: boolean;
  category: string;
  requiresJoinCode?: boolean;
}

type Post = FeedPost;

const CommunityPage: React.FC = () => {
  const { handle } = useParams<{ handle: string }>();
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [community, setCommunity] = useState<Community | null>(null);
  const [privateGatePreview, setPrivateGatePreview] = useState<CommunityAccessPreview | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [repostedPosts, setRepostedPosts] = useState<Set<string>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());
  const [leftNav, setLeftNav] = useState<CommunityLeftNav>('home');
  const [activeChatInstanceId, setActiveChatInstanceId] = useState<string | null>(null);
  const [activeCoursesInstanceId, setActiveCoursesInstanceId] = useState<string | null>(null);
  const [activeContentInstanceId, setActiveContentInstanceId] = useState<string | null>(null);
  const [activeFilesInstanceId, setActiveFilesInstanceId] = useState<string | null>(null);
  const [activeAnnouncementsInstanceId, setActiveAnnouncementsInstanceId] = useState<string | null>(null);
  const [activeEventsInstanceId, setActiveEventsInstanceId] = useState<string | null>(null);
  const [activeAiInstanceId, setActiveAiInstanceId] = useState<string | null>(null);
  const [activeKanbanInstanceId, setActiveKanbanInstanceId] = useState<string | null>(null);
  const [activeFormsInstanceId, setActiveFormsInstanceId] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState<'home' | 'apps' | 'products' | 'about'>('home');
  const [productsBundleOpen, setProductsBundleOpen] = useState(true);
  const avatarFileRef = useRef<HTMLInputElement | null>(null);
  const [brandingFieldBusy, setBrandingFieldBusy] = useState<'banner' | 'avatar' | null>(null);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [unreadByInstance, setUnreadByInstance] = useState<Record<string, number>>({});
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState<string[]>([]);
  const [newPostLink, setNewPostLink] = useState<PostLinkAttachment | null>(null);
  const [newPostCoin, setNewPostCoin] = useState<PostCoinAttachment | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const isLgUp = useMediaQuery('(min-width: 1024px)');
  const [postVisibility] = useState<'public' | 'private'>('public');
  const [ownerOnlyPostNoticeDismissed, setOwnerOnlyPostNoticeDismissed] = useState(false);
  const [addAdminModalOpen, setAddAdminModalOpen] = useState(false);
  const [adminActionBusy, setAdminActionBusy] = useState<string | null>(null);
  const [menuOpenPostId, setMenuOpenPostId] = useState<string | null>(null);
  const [editPostTarget, setEditPostTarget] = useState<{ postId: string; content: string } | null>(null);
  const [editPostSaving, setEditPostSaving] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const postDetail = usePostDetail(posts, [], setPosts);
  const {
    selectedPost,
    setSelectedPost,
    commentText,
    setCommentText,
    inlineCommentText,
    setInlineCommentText,
    commentSubmitting,
    commentsLoadingPostId,
    expandedCommentsPostId,
    openCommentMenu,
    setOpenCommentMenu,
    editCommentTarget,
    setEditCommentTarget,
    editCommentSaving,
    handleSubmitComment,
    toggleFeedComments,
    isCommentOwner,
    submitEditComment,
    handleDeleteComment,
    onPostDeleted,
    patchPostInLists,
  } = postDetail;

  useEffect(() => {
    if (!handle) {
      setOwnerOnlyPostNoticeDismissed(false);
      return;
    }
    setOwnerOnlyPostNoticeDismissed(
      localStorage.getItem(`${OWNER_ONLY_POST_NOTICE_KEY}:${handle}`) === '1'
    );
  }, [handle]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenPostId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!community) return;
    return setDocumentMeta({
      title: community.name,
      description: community.description || `@${community.handle} on MNOONX`,
      image: community.avatar ? resolveMediaUrl(community.avatar) : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    });
  }, [community?.handle, community?.name, community?.description, community?.avatar]);

  const dismissOwnerOnlyPostNotice = useCallback(() => {
    if (handle) {
      localStorage.setItem(`${OWNER_ONLY_POST_NOTICE_KEY}:${handle}`, '1');
    }
    setOwnerOnlyPostNoticeDismissed(true);
  }, [handle]);

  // Загрузка данных сообщества
  const fetchCommunity = useCallback(async () => {
    if (!handle) return;
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`${API_URL}/${handle}`, { headers });
      if (res.status === 404) {
        navigate('/discover');
        return;
      }
      if (res.status === 403) {
        const data = await res.json().catch(() => ({}));
        if (data.preview) {
          setPrivateGatePreview(data.preview as CommunityAccessPreview);
          setCommunity(null);
          setIsMember(false);
          setPosts([]);
        }
        return;
      }
      if (!res.ok) throw new Error('Community not found');

      const data = await res.json();
      setCommunity(data);
      setPrivateGatePreview(null);
      setIsMember(Boolean(data.isMember));
    } catch (err) {
      console.error('Fetch community error:', err);
      navigate('/discover');
    } finally {
      setLoading(false);
    }
  }, [handle, token, user, navigate]);

  const attachCommunityToPosts = useCallback(
    (items: Post[]): Post[] => {
      if (!community) return items;
      const ctx = {
        _id: community._id,
        name: community.name,
        handle: community.handle,
        avatar: community.avatar,
      };
      return items.map((p) => ({
        ...p,
        community: isPopulatedCommunity(p.community) ? p.community : ctx,
      }));
    },
    [community],
  );

  // Загрузка постов сообщества
  const fetchPosts = useCallback(async () => {
    if (!handle) return;
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`${API_URL}/${handle}/posts`, { headers });
      if (res.ok) {
        const data = await res.json();
        setPosts(attachCommunityToPosts(data));
        
        const likedIds = new Set<string>();
        const repostedIds = new Set<string>();
        const bookmarkedIds = new Set<string>();
        data.forEach((post: Post) => {
          const pid = String(post._id);
          if (post.isLiked) likedIds.add(pid);
          if (post.isReposted) repostedIds.add(pid);
          if (post.isBookmarked) bookmarkedIds.add(pid);
        });
        setLikedPosts(likedIds);
        setRepostedPosts(repostedIds);
        setBookmarkedPosts(bookmarkedIds);
      }
    } catch (err) {
      console.error('Fetch posts error:', err);
    }
  }, [handle, token, attachCommunityToPosts]);

  const uploadCommunityBranding = useCallback(
    async (field: 'banner' | 'avatar', file: File) => {
      if (!handle || !token) return;
      setBrandingFieldBusy(field);
      try {
        const fd = new FormData();
        fd.append(field, file);
        const res = await fetch(`${API_URL}/${encodeURIComponent(handle)}/branding`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error((errBody as { message?: string }).message || 'Upload failed');
        }
        const data = await res.json();
        setCommunity((prev) => (prev ? { ...prev, ...data } : prev));
        if (field === 'banner') {
          showToast(t('brandingBanner.updated'));
          setBannerModalOpen(false);
        }
      } catch (e) {
        console.error('Branding upload error:', e);
        showToast(e instanceof Error ? e.message : t('upload.uploading'), 'error');
      } finally {
        setBrandingFieldBusy(null);
        if (field === 'avatar' && avatarFileRef.current) avatarFileRef.current.value = '';
      }
    },
    [handle, token, showToast, t]
  );

  const patchCommunityBanner = useCallback(
    async (banner: string) => {
      if (!handle || !token) return;
      setBrandingFieldBusy('banner');
      try {
        const res = await fetch(`${API_URL}/${encodeURIComponent(handle)}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ banner }),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error((errBody as { message?: string }).message || 'Update failed');
        }
        const data = await res.json();
        setCommunity((prev) => (prev ? { ...prev, banner: data.banner ?? banner } : prev));
        showToast(banner ? t('brandingBanner.updated') : t('brandingBanner.removed'));
        setBannerModalOpen(false);
      } catch (e) {
        console.error('Banner patch error:', e);
        showToast(e instanceof Error ? e.message : t('brandingBanner.updateFailed'), 'error');
      } finally {
        setBrandingFieldBusy(null);
      }
    },
    [handle, token, showToast, t]
  );

  useEffect(() => {
    fetchCommunity();
  }, [fetchCommunity]);

  useEffect(() => {
    const st = location.state as {
      focusChat?: boolean;
      chatInstanceId?: string;
      focusCourses?: boolean;
      coursesInstanceId?: string;
      focusContent?: boolean;
      contentInstanceId?: string;
      focusFiles?: boolean;
      filesInstanceId?: string;
      focusAnnouncements?: boolean;
      announcementsInstanceId?: string;
      focusEvents?: boolean;
      eventsInstanceId?: string;
      focusAi?: boolean;
      aiInstanceId?: string;
      focusKanban?: boolean;
      kanbanInstanceId?: string;
      focusForms?: boolean;
      formsInstanceId?: string;
    } | undefined;
    const chats =
      community?.installedAppInstances?.filter((i) => i.appId === COMMUNITY_APP_IDS.CHAT) ?? [];
    if (st?.focusChat && chats.length > 0) {
      setLeftNav('chat');
      const pick =
        st.chatInstanceId && chats.some((c) => c.id === st.chatInstanceId)
          ? st.chatInstanceId
          : chats[0].id;
      setActiveChatInstanceId(pick);
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }
    const coursesInst =
      community?.installedAppInstances?.filter((i) => i.appId === COMMUNITY_APP_IDS.COURSES) ?? [];
    if (st?.focusCourses && coursesInst.length > 0) {
      setLeftNav('courses');
      const pick =
        st.coursesInstanceId && coursesInst.some((c) => c.id === st.coursesInstanceId)
          ? st.coursesInstanceId
          : coursesInst[0].id;
      setActiveCoursesInstanceId(pick);
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }
    const contentInst =
      community?.installedAppInstances?.filter((i) => i.appId === COMMUNITY_APP_IDS.CONTENT) ?? [];
    if (st?.focusContent && contentInst.length > 0) {
      setLeftNav('content');
      const pick =
        st.contentInstanceId && contentInst.some((c) => c.id === st.contentInstanceId)
          ? st.contentInstanceId
          : contentInst[0].id;
      setActiveContentInstanceId(pick);
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }
    const filesInst =
      community?.installedAppInstances?.filter((i) => i.appId === COMMUNITY_APP_IDS.FILES) ?? [];
    if (st?.focusFiles && filesInst.length > 0) {
      setLeftNav('files');
      const pick =
        st.filesInstanceId && filesInst.some((c) => c.id === st.filesInstanceId)
          ? st.filesInstanceId
          : filesInst[0].id;
      setActiveFilesInstanceId(pick);
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }
    const annInst =
      community?.installedAppInstances?.filter((i) => i.appId === COMMUNITY_APP_IDS.ANNOUNCEMENTS) ?? [];
    if (st?.focusAnnouncements && annInst.length > 0) {
      setLeftNav('announcements');
      const pick =
        st.announcementsInstanceId && annInst.some((c) => c.id === st.announcementsInstanceId)
          ? st.announcementsInstanceId
          : annInst[0].id;
      setActiveAnnouncementsInstanceId(pick);
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }
    const eventsInst =
      community?.installedAppInstances?.filter((i) => i.appId === COMMUNITY_APP_IDS.EVENTS) ?? [];
    if (st?.focusEvents && eventsInst.length > 0) {
      setLeftNav('events');
      const pick =
        st.eventsInstanceId && eventsInst.some((c) => c.id === st.eventsInstanceId)
          ? st.eventsInstanceId
          : eventsInst[0].id;
      setActiveEventsInstanceId(pick);
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }
    const aiInst =
      community?.installedAppInstances?.filter((i) => i.appId === COMMUNITY_APP_IDS.AI) ?? [];
    if (st?.focusAi && aiInst.length > 0) {
      setLeftNav('ai');
      const pick =
        st.aiInstanceId && aiInst.some((c) => c.id === st.aiInstanceId)
          ? st.aiInstanceId
          : aiInst[0].id;
      setActiveAiInstanceId(pick);
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }
    const kanbanInst =
      community?.installedAppInstances?.filter((i) => i.appId === COMMUNITY_APP_IDS.KANBAN) ?? [];
    if (st?.focusKanban && kanbanInst.length > 0) {
      setLeftNav('kanban');
      const pick =
        st.kanbanInstanceId && kanbanInst.some((c) => c.id === st.kanbanInstanceId)
          ? st.kanbanInstanceId
          : kanbanInst[0].id;
      setActiveKanbanInstanceId(pick);
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }
    const formsInst =
      community?.installedAppInstances?.filter((i) => i.appId === COMMUNITY_APP_IDS.FORMS) ?? [];
    if (st?.focusForms && formsInst.length > 0) {
      setLeftNav('forms');
      const pick =
        st.formsInstanceId && formsInst.some((c) => c.id === st.formsInstanceId)
          ? st.formsInstanceId
          : formsInst[0].id;
      setActiveFormsInstanceId(pick);
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }
  }, [location.state, location.pathname, community, navigate]);

  useEffect(() => {
    if (!community) return;
    const chats = (community.installedAppInstances || []).filter((i) => i.appId === COMMUNITY_APP_IDS.CHAT);
    setActiveChatInstanceId((prev) => {
      if (prev && chats.some((c) => c.id === prev)) return prev;
      return chats[0]?.id ?? null;
    });
  }, [community]);

  useEffect(() => {
    if (!community) return;
    const coursesInst = (community.installedAppInstances || []).filter(
      (i) => i.appId === COMMUNITY_APP_IDS.COURSES
    );
    setActiveCoursesInstanceId((prev) => {
      if (prev && coursesInst.some((c) => c.id === prev)) return prev;
      return coursesInst[0]?.id ?? null;
    });
  }, [community]);

  useEffect(() => {
    if (!community) return;
    const contentInst = (community.installedAppInstances || []).filter(
      (i) => i.appId === COMMUNITY_APP_IDS.CONTENT
    );
    setActiveContentInstanceId((prev) => {
      if (prev && contentInst.some((c) => c.id === prev)) return prev;
      return contentInst[0]?.id ?? null;
    });
  }, [community]);

  useEffect(() => {
    if (!community) return;
    const filesInst = (community.installedAppInstances || []).filter(
      (i) => i.appId === COMMUNITY_APP_IDS.FILES
    );
    setActiveFilesInstanceId((prev) => {
      if (prev && filesInst.some((c) => c.id === prev)) return prev;
      return filesInst[0]?.id ?? null;
    });
  }, [community]);

  useEffect(() => {
    if (!community) return;
    const annInst = (community.installedAppInstances || []).filter(
      (i) => i.appId === COMMUNITY_APP_IDS.ANNOUNCEMENTS
    );
    setActiveAnnouncementsInstanceId((prev) => {
      if (prev && annInst.some((c) => c.id === prev)) return prev;
      return annInst[0]?.id ?? null;
    });
  }, [community]);

  useEffect(() => {
    if (!community) return;
    const eventsInst = (community.installedAppInstances || []).filter(
      (i) => i.appId === COMMUNITY_APP_IDS.EVENTS
    );
    setActiveEventsInstanceId((prev) => {
      if (prev && eventsInst.some((c) => c.id === prev)) return prev;
      return eventsInst[0]?.id ?? null;
    });
  }, [community]);

  useEffect(() => {
    if (!community) return;
    const aiInst = (community.installedAppInstances || []).filter(
      (i) => i.appId === COMMUNITY_APP_IDS.AI
    );
    setActiveAiInstanceId((prev) => {
      if (prev && aiInst.some((c) => c.id === prev)) return prev;
      return aiInst[0]?.id ?? null;
    });
  }, [community]);

  useEffect(() => {
    if (!community) return;
    const kanbanInst = (community.installedAppInstances || []).filter(
      (i) => i.appId === COMMUNITY_APP_IDS.KANBAN
    );
    setActiveKanbanInstanceId((prev) => {
      if (prev && kanbanInst.some((c) => c.id === prev)) return prev;
      return kanbanInst[0]?.id ?? null;
    });
  }, [community]);

  useEffect(() => {
    if (!community) return;
    const formsInst = (community.installedAppInstances || []).filter(
      (i) => i.appId === COMMUNITY_APP_IDS.FORMS
    );
    setActiveFormsInstanceId((prev) => {
      if (prev && formsInst.some((c) => c.id === prev)) return prev;
      return formsInst[0]?.id ?? null;
    });
  }, [community]);

  useEffect(() => {
    if (!token || !handle || !community) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch(`${API_URL}/${encodeURIComponent(handle)}/chat/unread`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data && typeof data.counts === 'object' && data.counts !== null) {
          setUnreadByInstance(data.counts as Record<string, number>);
        }
      } catch {
        /* ignore */
      }
    };
    void fetchUnread();
    const id = window.setInterval(fetchUnread, 3000);
    return () => clearInterval(id);
  }, [token, handle, community]);

  const canViewFeed =
    Boolean(community) &&
    (community?.canViewFull !== false ||
      community?.isPublic !== false ||
      community?.isMember ||
      community?.isOwner);

  useEffect(() => {
    if (canViewFeed) {
      void fetchPosts();
    } else {
      setPosts([]);
    }
  }, [canViewFeed, fetchPosts]);

  const handleJoin = async () => {
    if (!token) {
      window.dispatchEvent(new CustomEvent('openLogin'));
      return;
    }

    const needsCode = privateGatePreview?.requiresJoinCode === true;
    if (!isMember && needsCode && !joinCodeInput.trim()) {
      setJoinError(t('community.joinPassphraseRequired'));
      return;
    }

    try {
      setJoinLoading(true);
      setJoinError(null);
      const action = isMember ? 'leave' : 'join';
      const res = await fetch(`${API_URL}/${handle}/${action}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          ...(action === 'join' ? { 'Content-Type': 'application/json' } : {}),
        },
        body: action === 'join' ? JSON.stringify({ joinCode: joinCodeInput.trim() }) : undefined,
      });

      if (res.ok) {
        const data = await res.json();
        const joined = !isMember;
        setIsMember(joined);
        setJoinCodeInput('');
        if (community) {
          setCommunity((prev) =>
            prev
              ? {
                  ...prev,
                  memberCount: data.memberCount,
                  isMember: joined,
                  canPost: prev.isOwner || (joined && prev.membersCanPost !== false),
                }
              : null
          );
        }
        if (joined && privateGatePreview) {
          await fetchCommunity();
        }
      } else {
        const data = await res.json().catch(() => ({}));
        const msg =
          (data as { code?: string; message?: string }).code === 'INVALID_JOIN_CODE'
            ? t('community.joinIncorrectPassphrase')
            : (data as { message?: string }).message || t('community.joinFailedGeneric');
        setJoinError(msg);
      }
    } catch (err) {
      console.error('Join error:', err);
      setJoinError(t('community.joinSomethingWrong'));
    } finally {
      setJoinLoading(false);
    }
  };

  // ЕДИНСТВЕННАЯ функция handleCreatePost (удалите дубликат ниже)
  const handleCreatePost = async () => {
    const hasLink = Boolean(newPostLink?.title?.trim() && newPostLink?.url?.trim());
    const hasCoin = Boolean(
      newPostCoin?.coinId?.trim() && newPostCoin?.name?.trim() && newPostCoin?.symbol?.trim()
    );
    if ((!newPostContent.trim() && newPostMedia.length === 0 && !hasLink && !hasCoin) || !token || !canPost || isPosting) return;
    
    try {
      setIsPosting(true);
      const res = await fetch(POSTS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          content: newPostContent, 
          media: newPostMedia,
          linkAttachment: hasLink ? newPostLink : undefined,
          coinAttachment: hasCoin ? newPostCoin : undefined,
          community: community?._id,
          isPrivate: postVisibility === 'private'
        })
      });
      
      if (res.ok) {
        const newPost = await res.json();
        setPosts((prev) => attachCommunityToPosts([newPost, ...prev]));
        closeComposer();
      }
    } catch (err) {
      console.error('Create post error:', err);
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!token) {
      window.dispatchEvent(new CustomEvent('openLogin'));
      return;
    }
    const id = String(postId);
    const current = posts.find((p) => String(p._id) === id) || (selectedPost && String(selectedPost._id) === id ? selectedPost : undefined);
    const wasLiked = likedPosts.has(id);
    const prevCount = current?.likesCount || 0;
    const nextLiked = !wasLiked;
    const nextCount = Math.max(0, prevCount + (nextLiked ? 1 : -1));

    setLikedPosts((prev) => {
      const newSet = new Set(prev);
      nextLiked ? newSet.add(id) : newSet.delete(id);
      return newSet;
    });
    patchPostInLists(id, { likesCount: nextCount, isLiked: nextLiked });

    try {
      const res = await fetch(`${POSTS_API_URL}/${id}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        data.liked ? newSet.add(id) : newSet.delete(id);
        return newSet;
      });
      patchPostInLists(id, { likesCount: data.likesCount, isLiked: data.liked });
    } catch (err) {
      console.error('Like error:', err);
      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        wasLiked ? newSet.add(id) : newSet.delete(id);
        return newSet;
      });
      patchPostInLists(id, { likesCount: prevCount, isLiked: wasLiked });
      showToast(t('common.likeFailed'), 'error');
    }
  };

  const handleRepost = async (postId: string) => {
    if (!token) {
      window.dispatchEvent(new CustomEvent('openLogin'));
      return;
    }
    const id = String(postId);
    const current = posts.find((p) => String(p._id) === id) || (selectedPost && String(selectedPost._id) === id ? selectedPost : undefined);
    const wasReposted = repostedPosts.has(id);
    const prevCount = current?.repostsCount || 0;
    const nextReposted = !wasReposted;
    const nextCount = Math.max(0, prevCount + (nextReposted ? 1 : -1));

    setRepostedPosts((prev) => {
      const newSet = new Set(prev);
      nextReposted ? newSet.add(id) : newSet.delete(id);
      return newSet;
    });
    patchPostInLists(id, { repostsCount: nextCount, isReposted: nextReposted });

    try {
      const res = await fetch(`${POSTS_API_URL}/${id}/repost`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRepostedPosts(prev => {
        const newSet = new Set(prev);
        data.reposted ? newSet.add(id) : newSet.delete(id);
        return newSet;
      });
      patchPostInLists(id, { repostsCount: data.repostsCount, isReposted: data.reposted });
    } catch (err) {
      console.error('Repost error:', err);
      setRepostedPosts((prev) => {
        const newSet = new Set(prev);
        wasReposted ? newSet.add(id) : newSet.delete(id);
        return newSet;
      });
      patchPostInLists(id, { repostsCount: prevCount, isReposted: wasReposted });
      showToast(t('common.repostFailed'), 'error');
    }
  };

  const handleBookmark = async (postId: string) => {
    if (!token) {
      window.dispatchEvent(new CustomEvent('openLogin'));
      return;
    }
    const id = String(postId);
    const current = posts.find((p) => String(p._id) === id) || (selectedPost && String(selectedPost._id) === id ? selectedPost : undefined);
    const wasBookmarked = bookmarkedPosts.has(id);
    const prevCount = current?.bookmarksCount || 0;
    const nextBookmarked = !wasBookmarked;
    const nextCount = Math.max(0, prevCount + (nextBookmarked ? 1 : -1));

    setBookmarkedPosts((prev) => {
      const newSet = new Set(prev);
      nextBookmarked ? newSet.add(id) : newSet.delete(id);
      return newSet;
    });
    patchPostInLists(id, { bookmarksCount: nextCount, isBookmarked: nextBookmarked });

    try {
      const res = await fetch(`${POSTS_API_URL}/${id}/bookmark`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBookmarkedPosts((prev) => {
        const newSet = new Set(prev);
        data.bookmarked ? newSet.add(id) : newSet.delete(id);
        return newSet;
      });
      patchPostInLists(id, { bookmarksCount: data.bookmarksCount, isBookmarked: data.bookmarked });
      showToast(data.bookmarked ? t('common.bookmarkAdded') : t('common.bookmarkRemoved'));
    } catch (err) {
      console.error('Bookmark error:', err);
      setBookmarkedPosts((prev) => {
        const newSet = new Set(prev);
        wasBookmarked ? newSet.add(id) : newSet.delete(id);
        return newSet;
      });
      patchPostInLists(id, { bookmarksCount: prevCount, isBookmarked: wasBookmarked });
      showToast(t('common.bookmarkFailed'), 'error');
    }
  };

  const copyPostLink = (postId: string) => {
    const link = `${window.location.origin}/post/${postId}`;
    navigator.clipboard
      .writeText(link)
      .then(() => showToast(t('common.linkCopied')))
      .catch(() => showToast(t('common.copyLinkFailed'), 'error'));
  };

  const copyCommunityLink = useCallback(async (): Promise<boolean> => {
    if (!community?.handle) return false;
    const link = `${window.location.origin}${communityPath(community.handle)}`;
    try {
      await navigator.clipboard.writeText(link);
      showToast(t('common.linkCopied'));
      return true;
    } catch {
      showToast(t('common.copyLinkFailed'), 'error');
      return false;
    }
  }, [community?.handle, showToast, t]);

  const isPostOwner = (post: Post) => {
    if (!user) return false;
    if (user.username === post.author.username) return true;
    if (user.id && post.author._id && String(user.id) === String(post.author._id)) return true;
    if ((user as { _id?: string })._id && String((user as { _id?: string })._id) === String(post.author._id)) {
      return true;
    }
    return false;
  };

  const handleDeletePost = async (postId: string) => {
    setMenuOpenPostId(null);
    if (!token) return;
    const confirmed = await confirm({
      title: t('common.deletePostTitle'),
      message: t('common.deletePostMessage'),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`${POSTS_API_URL}/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message || t('common.failedToDeletePost'));
      }
      setPosts((prev) => prev.filter((p) => String(p._id) !== postId));
      onPostDeleted(postId);
      showToast(t('common.postDeleted'));
    } catch (err: unknown) {
      console.error('Delete post error:', err);
      showToast(err instanceof Error ? err.message : t('common.failedToDeletePost'), 'error');
    }
  };

  const openEditPost = (postId: string, content: string) => {
    setMenuOpenPostId(null);
    setEditPostTarget({ postId, content });
  };

  const submitEditPost = async (newContent: string) => {
    if (!editPostTarget || !token) return;
    const { postId } = editPostTarget;
    setEditPostSaving(true);
    try {
      const res = await fetch(`${POSTS_API_URL}/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newContent }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message || t('common.failedToUpdatePost'));
      }
      const updatedPost = await res.json();
      patchPostInLists(postId, updatedPost);
      setEditPostTarget(null);
      showToast(t('common.postUpdated'));
    } catch (err: unknown) {
      console.error('Edit post error:', err);
      showToast(err instanceof Error ? err.message : t('common.failedToUpdatePost'), 'error');
    } finally {
      setEditPostSaving(false);
    }
  };

  const formatPostDate = useCallback(
    (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      if (minutes < 1) return t('home.timeNow');
      if (minutes < 60) return t('home.timeMinutes', { count: minutes });
      if (hours < 24) return t('home.timeHours', { count: hours });
      if (days < 7) return t('home.timeDays', { count: days });
      return date.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric' });
    },
    [t, locale]
  );

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const isOwner =
    community?.isOwner === true || String(user?.id) === String(community?.owner?._id);
  const canOpenDashboard = community ? canAccessCommunityDashboard(community) : false;

  const handleRemoveAdmin = useCallback(
    async (adminUserId: string) => {
      if (!token || !handle || !isOwner) return;
      const confirmed = await confirm({
        title: t('community.removeAdminConfirmTitle'),
        message: t('community.removeAdminConfirmMessage'),
        confirmLabel: t('community.removeAction'),
        variant: 'danger',
      });
      if (!confirmed) return;
      setAdminActionBusy(adminUserId);
      try {
        const res = await fetch(
          `${API_URL}/${encodeURIComponent(handle)}/admins/${encodeURIComponent(adminUserId)}`,
          { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          showToast((data as { message?: string }).message || t('community.failedRemoveAdmin'), 'error');
          return;
        }
        await fetchCommunity();
        showToast(t('community.adminRemovedToast'));
      } catch {
        showToast(t('community.networkError'), 'error');
      } finally {
        setAdminActionBusy(null);
      }
    },
    [token, handle, isOwner, fetchCommunity, confirm, showToast, t]
  );

  const canPost =
    community?.canPost === true ||
    isOwner ||
    (isMember && community?.membersCanPost !== false);
  const mobileComposerFull = isCreateOpen && !isLgUp && mainTab === 'home' && canPost;
  const memberButCannotPost = isMember && !canPost && !isOwner;

  const closeComposer = useCallback(() => {
    setIsCreateOpen(false);
    setNewPostContent('');
    setNewPostMedia([]);
    setNewPostLink(null);
    setNewPostCoin(null);
  }, []);
  const chatInstances =
    community?.installedAppInstances?.filter((i) => i.appId === COMMUNITY_APP_IDS.CHAT) ?? [];
  const courseInstances =
    community?.installedAppInstances?.filter((i) => i.appId === COMMUNITY_APP_IDS.COURSES) ?? [];
  const contentInstances =
    community?.installedAppInstances?.filter((i) => i.appId === COMMUNITY_APP_IDS.CONTENT) ?? [];
  const fileInstances =
    community?.installedAppInstances?.filter((i) => i.appId === COMMUNITY_APP_IDS.FILES) ?? [];
  const announcementInstances =
    community?.installedAppInstances?.filter((i) => i.appId === COMMUNITY_APP_IDS.ANNOUNCEMENTS) ?? [];
  const eventInstances =
    community?.installedAppInstances?.filter((i) => i.appId === COMMUNITY_APP_IDS.EVENTS) ?? [];
  const aiInstances =
    community?.installedAppInstances?.filter((i) => i.appId === COMMUNITY_APP_IDS.AI) ?? [];
  const kanbanInstances =
    community?.installedAppInstances?.filter((i) => i.appId === COMMUNITY_APP_IDS.KANBAN) ?? [];
  const formInstances =
    community?.installedAppInstances?.filter((i) => i.appId === COMMUNITY_APP_IDS.FORMS) ?? [];
  const hasChatApp = chatInstances.length > 0;
  const hasCoursesApp = courseInstances.length > 0;
  const hasContentApp = contentInstances.length > 0;
  const hasFilesApp = fileInstances.length > 0;
  const hasAnnouncementsApp = announcementInstances.length > 0;
  const hasEventsApp = eventInstances.length > 0;
  const hasAiApp = aiInstances.length > 0;
  const hasKanbanApp = kanbanInstances.length > 0;
  const hasFormsApp = formInstances.length > 0;
  const sidebarAppInstances = (community?.installedAppInstances ?? []).filter(
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

  const activateAppInstance = useCallback((inst: InstalledAppInstance) => {
    if (inst.appId === COMMUNITY_APP_IDS.CHAT) {
      setActiveChatInstanceId(inst.id);
      setLeftNav('chat');
    } else if (inst.appId === COMMUNITY_APP_IDS.COURSES) {
      setActiveCoursesInstanceId(inst.id);
      setLeftNav('courses');
    } else if (inst.appId === COMMUNITY_APP_IDS.CONTENT) {
      setActiveContentInstanceId(inst.id);
      setLeftNav('content');
    } else if (inst.appId === COMMUNITY_APP_IDS.FILES) {
      setActiveFilesInstanceId(inst.id);
      setLeftNav('files');
    } else if (inst.appId === COMMUNITY_APP_IDS.ANNOUNCEMENTS) {
      setActiveAnnouncementsInstanceId(inst.id);
      setLeftNav('announcements');
    } else if (inst.appId === COMMUNITY_APP_IDS.EVENTS) {
      setActiveEventsInstanceId(inst.id);
      setLeftNav('events');
    } else if (inst.appId === COMMUNITY_APP_IDS.AI) {
      setActiveAiInstanceId(inst.id);
      setLeftNav('ai');
    } else if (inst.appId === COMMUNITY_APP_IDS.KANBAN) {
      setActiveKanbanInstanceId(inst.id);
      setLeftNav('kanban');
    } else if (inst.appId === COMMUNITY_APP_IDS.FORMS) {
      setActiveFormsInstanceId(inst.id);
      setLeftNav('forms');
    }
  }, []);

  const patchInstanceVisibility = useCallback(
    async (instanceId: string, visibleToMembers: boolean) => {
      if (!token || !handle) return;
      try {
        const res = await fetch(`${API_URL}/${handle}/apps/instances/${encodeURIComponent(instanceId)}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ visibleToMembers }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          showToast(typeof data?.message === 'string' ? data.message : t('community.failedUpdateVisibility'), 'error');
          return;
        }
        const data = await res.json();
        setCommunity(data);
        showToast(visibleToMembers ? t('community.appVisibleToast') : t('community.appHiddenToast'));
      } catch (e) {
        console.error(e);
        showToast(t('community.failedUpdateVisibility'), 'error');
      }
    },
    [token, handle, showToast, t]
  );

  const deleteAppInstance = useCallback(
    async (instanceId: string) => {
      if (!token || !handle || !community) return;
      const removed = community.installedAppInstances?.find((i) => i.id === instanceId);
      const msg =
        removed?.appId === COMMUNITY_APP_IDS.CHAT
          ? t('community.removeAppChatBody')
          : removed?.appId === COMMUNITY_APP_IDS.COURSES
            ? t('community.removeAppCoursesBody')
            : removed?.appId === COMMUNITY_APP_IDS.CONTENT
              ? t('community.removeAppContentBody')
              : removed?.appId === COMMUNITY_APP_IDS.FILES
                ? t('community.removeAppFilesBody')
                : removed?.appId === COMMUNITY_APP_IDS.ANNOUNCEMENTS
                  ? t('community.removeAppAnnouncementsBody')
                  : removed?.appId === COMMUNITY_APP_IDS.EVENTS
                    ? t('community.removeAppEventsBody')
                    : removed?.appId === COMMUNITY_APP_IDS.AI
                      ? t('community.removeAppAiBody')
                      : removed?.appId === COMMUNITY_APP_IDS.KANBAN
                        ? t('community.removeAppKanbanBody')
                        : removed?.appId === COMMUNITY_APP_IDS.FORMS
                          ? t('community.removeAppFormsBody')
                          : t('community.removeAppGenericBody');
      const confirmed = await confirm({
        title: t('community.removeAppConfirmTitle'),
        message: msg,
        confirmLabel: t('community.removeAction'),
        variant: 'danger',
      });
      if (!confirmed) return;
      try {
        const res = await fetch(`${API_URL}/${handle}/apps/instances/${encodeURIComponent(instanceId)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          showToast(typeof data?.message === 'string' ? data.message : t('community.failedRemoveApp'), 'error');
          return;
        }
        const data = await res.json();
        setCommunity(data);
        showToast(t('community.appRemovedToast'));
        if (removed?.appId === COMMUNITY_APP_IDS.CHAT) {
          const nextChats =
            data.installedAppInstances?.filter((i: InstalledAppInstance) => i.appId === COMMUNITY_APP_IDS.CHAT) ??
            [];
          setActiveChatInstanceId((prev) => {
            if (instanceId === prev) return nextChats[0]?.id ?? null;
            if (prev && nextChats.some((c: InstalledAppInstance) => c.id === prev)) return prev;
            return nextChats[0]?.id ?? null;
          });
          if (nextChats.length === 0 && leftNav === 'chat') setLeftNav('home');
        }
        if (removed?.appId === COMMUNITY_APP_IDS.COURSES) {
          const nextCourses =
            data.installedAppInstances?.filter((i: InstalledAppInstance) => i.appId === COMMUNITY_APP_IDS.COURSES) ??
            [];
          setActiveCoursesInstanceId((prev) => {
            if (instanceId === prev) return nextCourses[0]?.id ?? null;
            if (prev && nextCourses.some((c: InstalledAppInstance) => c.id === prev)) return prev;
            return nextCourses[0]?.id ?? null;
          });
          if (nextCourses.length === 0 && leftNav === 'courses') setLeftNav('home');
        }
        if (removed?.appId === COMMUNITY_APP_IDS.CONTENT) {
          const nextContent =
            data.installedAppInstances?.filter((i: InstalledAppInstance) => i.appId === COMMUNITY_APP_IDS.CONTENT) ??
            [];
          setActiveContentInstanceId((prev) => {
            if (instanceId === prev) return nextContent[0]?.id ?? null;
            if (prev && nextContent.some((c: InstalledAppInstance) => c.id === prev)) return prev;
            return nextContent[0]?.id ?? null;
          });
          if (nextContent.length === 0 && leftNav === 'content') setLeftNav('home');
        }
        if (removed?.appId === COMMUNITY_APP_IDS.FILES) {
          const nextFiles =
            data.installedAppInstances?.filter((i: InstalledAppInstance) => i.appId === COMMUNITY_APP_IDS.FILES) ??
            [];
          setActiveFilesInstanceId((prev) => {
            if (instanceId === prev) return nextFiles[0]?.id ?? null;
            if (prev && nextFiles.some((c: InstalledAppInstance) => c.id === prev)) return prev;
            return nextFiles[0]?.id ?? null;
          });
          if (nextFiles.length === 0 && leftNav === 'files') setLeftNav('home');
        }
        if (removed?.appId === COMMUNITY_APP_IDS.ANNOUNCEMENTS) {
          const nextAnn =
            data.installedAppInstances?.filter(
              (i: InstalledAppInstance) => i.appId === COMMUNITY_APP_IDS.ANNOUNCEMENTS
            ) ?? [];
          setActiveAnnouncementsInstanceId((prev) => {
            if (instanceId === prev) return nextAnn[0]?.id ?? null;
            if (prev && nextAnn.some((c: InstalledAppInstance) => c.id === prev)) return prev;
            return nextAnn[0]?.id ?? null;
          });
          if (nextAnn.length === 0 && leftNav === 'announcements') setLeftNav('home');
        }
        if (removed?.appId === COMMUNITY_APP_IDS.EVENTS) {
          const nextEv =
            data.installedAppInstances?.filter(
              (i: InstalledAppInstance) => i.appId === COMMUNITY_APP_IDS.EVENTS
            ) ?? [];
          setActiveEventsInstanceId((prev) => {
            if (instanceId === prev) return nextEv[0]?.id ?? null;
            if (prev && nextEv.some((c: InstalledAppInstance) => c.id === prev)) return prev;
            return nextEv[0]?.id ?? null;
          });
          if (nextEv.length === 0 && leftNav === 'events') setLeftNav('home');
        }
        if (removed?.appId === COMMUNITY_APP_IDS.AI) {
          const nextAi =
            data.installedAppInstances?.filter(
              (i: InstalledAppInstance) => i.appId === COMMUNITY_APP_IDS.AI
            ) ?? [];
          setActiveAiInstanceId((prev) => {
            if (instanceId === prev) return nextAi[0]?.id ?? null;
            if (prev && nextAi.some((c: InstalledAppInstance) => c.id === prev)) return prev;
            return nextAi[0]?.id ?? null;
          });
          if (nextAi.length === 0 && leftNav === 'ai') setLeftNav('home');
        }
        if (removed?.appId === COMMUNITY_APP_IDS.KANBAN) {
          const nextKb =
            data.installedAppInstances?.filter(
              (i: InstalledAppInstance) => i.appId === COMMUNITY_APP_IDS.KANBAN
            ) ?? [];
          setActiveKanbanInstanceId((prev) => {
            if (instanceId === prev) return nextKb[0]?.id ?? null;
            if (prev && nextKb.some((c: InstalledAppInstance) => c.id === prev)) return prev;
            return nextKb[0]?.id ?? null;
          });
          if (nextKb.length === 0 && leftNav === 'kanban') setLeftNav('home');
        }
        if (removed?.appId === COMMUNITY_APP_IDS.FORMS) {
          const nextFm =
            data.installedAppInstances?.filter(
              (i: InstalledAppInstance) => i.appId === COMMUNITY_APP_IDS.FORMS
            ) ?? [];
          setActiveFormsInstanceId((prev) => {
            if (instanceId === prev) return nextFm[0]?.id ?? null;
            if (prev && nextFm.some((c: InstalledAppInstance) => c.id === prev)) return prev;
            return nextFm[0]?.id ?? null;
          });
          if (nextFm.length === 0 && leftNav === 'forms') setLeftNav('home');
        }
      } catch (e) {
        console.error(e);
        showToast(t('community.failedRemoveApp'), 'error');
      }
    },
    [token, handle, community, leftNav, confirm, showToast, t]
  );

  const duplicateAppInstance = useCallback(
    async (instanceId: string): Promise<boolean> => {
      if (!token || !handle || !community) return false;
      const source = community.installedAppInstances?.find((i) => i.id === instanceId);
      if (!source) return false;
      const copySuffix = t('community.duplicateAppCopySuffix');
      const baseTitle = String(source.title || '').trim() || source.appId;
      const title = `${baseTitle} (${copySuffix})`.slice(0, 120);
      try {
        const res = await fetch(`${API_URL}/${handle}/apps`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            appId: source.appId,
            title,
            visibleToMembers: source.visibleToMembers !== false,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          showToast(
            typeof data?.message === 'string' ? data.message : t('community.failedDuplicateApp'),
            'error',
          );
          return false;
        }
        const data = await res.json();
        setCommunity(data);
        showToast(t('community.appDuplicatedToast'));
        if (data.newInstanceId) {
          const created = data.installedAppInstances?.find(
            (i: InstalledAppInstance) => i.id === data.newInstanceId,
          );
          if (created) activateAppInstance(created);
        }
        return true;
      } catch (e) {
        console.error(e);
        showToast(t('community.failedDuplicateApp'), 'error');
        return false;
      }
    },
    [token, handle, community, showToast, t, activateAppInstance],
  );

  const leftSidebarProps = useMemo(() => {
    if (!community) return null;
    return {
      communityName: community.name,
      communityAvatar: community.avatar,
      memberCount: community.memberCount,
      handle: community.handle,
      leftNav: leftNav as CommunityLeftNav,
      onGoHome: () => {
        setLeftNav('home');
        setMainTab('home');
      },
      apps: sidebarAppInstances,
      onActivateApp: activateAppInstance,
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
      onPatchVisibility: patchInstanceVisibility,
      onDeleteApp: deleteAppInstance,
      onDuplicateApp: duplicateAppInstance,
    };
  }, [
    community,
    leftNav,
    sidebarAppInstances,
    activateAppInstance,
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
    patchInstanceVisibility,
    deleteAppInstance,
    duplicateAppInstance,
  ]);

  const rightSidebarProps = useMemo(() => {
    if (!community?.owner) return null;
    return {
      handle: community.handle,
      memberCount: community.memberCount,
      owner: community.owner,
      canOpenDashboard,
      isOwner,
      formatCount,
      onCopyLink: copyCommunityLink,
    };
  }, [community, canOpenDashboard, isOwner, copyCommunityLink]);

  if (loading) {
    return (
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1200px] gap-6 overflow-hidden px-0 sm:px-4">
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden border-x border-neutral-200 bg-white sm:max-w-[680px]">
          <div className="border-b border-neutral-200 p-4">
            <div className="flex items-center gap-3">
              <SkeletonPulse className="h-14 w-14 shrink-0 rounded-2xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonPulse className="h-4 w-40" />
                <SkeletonPulse className="h-3 w-24" />
              </div>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <FeedSkeleton count={4} />
          </div>
        </div>
      </div>
    );
  }

  if (privateGatePreview && !community) {
    const preview = privateGatePreview;
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col bg-white">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
            
            {/* Карточка как в соцсетях */}
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              {/* Шапка с аватаркой */}
              <div className="px-6 pt-6 sm:px-8 sm:pt-8">
                <div className="flex items-start gap-4">
                  <img
                    src={
                      preview.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(preview.name)}&background=000&color=fff&size=80&bold=true`
                    }
                    alt={preview.name}
                    className="h-16 w-16 rounded-full object-cover sm:h-20 sm:w-20"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">
                          {preview.name}
                        </h2>
                        <p className="text-sm text-neutral-500">@{preview.handle}</p>
                      </div>
                      <span className="shrink-0 rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Lock className="h-3 w-3" />
                          Приватное
                        </span>
                      </span>
                    </div>
                    
                    {/* Описание */}
                    {preview.description && (
                      <p className="mt-2 text-sm leading-relaxed text-neutral-600 sm:text-base">
                        {preview.description}
                      </p>
                    )}
                    
                    {/* Статистика */}
                    <div className="mt-2 flex items-center gap-4 text-sm text-neutral-500">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {t(
                          preview.memberCount === 1
                            ? 'community.memberCountLineOne'
                            : 'community.memberCountLineMany',
                          { count: formatCount(preview.memberCount) }
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
  
              {/* Контент с приглашением */}
              <div className="mt-4 border-t border-neutral-100 px-6 py-6 sm:px-8 sm:py-8">
                {/* Заголовок приглашения */}
                <div className="text-center">
                  <h3 className="text-base font-semibold text-neutral-900">
                    {t('community.membersOnlyTitle')}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    {t('community.membersOnlySubtitle')}
                  </p>
                </div>
  
                {/* Форма вступления */}
                <div className="mt-6 space-y-4">
                  {preview.requiresJoinCode && (
                    <div>
                      <label htmlFor="code" className="sr-only">
                        {t('community.joinPassphraseLabel')}
                      </label>
                      <input
                        id="code"
                        type="password"
                        autoComplete="off"
                        value={joinCodeInput}
                        onChange={(e) => {
                          setJoinCodeInput(e.target.value);
                          setJoinError(null);
                        }}
                        placeholder={t('community.joinPassphrasePlaceholder')}
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-center text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white focus:ring-0"
                      />
                    </div>
                  )}
  
                  {joinError && (
                    <p className="text-center text-sm text-red-600" role="alert">
                      {joinError}
                    </p>
                  )}
  
                  <button
                    type="button"
                    onClick={handleJoin}
                    disabled={joinLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {joinLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('community.joining')}
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        {t('community.joinCommunity')}
                      </>
                    )}
                  </button>
  
                  {!token && (
                    <p className="text-center text-xs text-neutral-400">
                      {t('community.signInToJoin')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!community) return null;

  const isAppNavActive =
    leftNav === 'chat' ||
    leftNav === 'courses' ||
    leftNav === 'content' ||
    leftNav === 'files' ||
    leftNav === 'announcements' ||
    leftNav === 'events' ||
    leftNav === 'ai' ||
    leftNav === 'kanban' ||
    leftNav === 'forms';

  return (
    <div className="flex h-full min-h-[calc(100dvh-var(--app-header-height)-var(--app-mobile-nav-height))] flex-col overflow-hidden lg:min-h-[calc(100dvh-var(--app-header-height))]">
      <div
        className={`mx-auto grid h-full min-h-full w-full max-w-[1600px] flex-1 grid-rows-[minmax(0,1fr)] gap-2 p-2 max-lg:min-h-[calc(100dvh-var(--app-header-height)-var(--app-mobile-nav-height))] max-lg:gap-0 max-lg:p-0 lg:min-h-[calc(100dvh-var(--app-header-height)-1rem)] ${
          isAppNavActive ? 'grid-cols-1 lg:grid-cols-[280px_1fr]' : 'grid-cols-1 lg:grid-cols-[280px_1fr_340px]'
        }`}
      >
        {/* LEFT SIDEBAR — desktop */}
        {leftSidebarProps && (
          <div className="relative z-20 hidden h-full min-h-0 min-w-0 overflow-hidden rounded-xl border border-[#e7e7e7] lg:block">
            <CommunityLeftSidebar {...leftSidebarProps} className="h-full" />
          </div>
        )}

        {/* CENTER — at least full viewport height (minus header / mobile nav) */}
        <div className="relative z-0 flex h-full min-h-[calc(100dvh-var(--app-header-height)-var(--app-mobile-nav-height))] min-w-0 flex-col overflow-hidden lg:min-h-[calc(100dvh-var(--app-header-height)-1rem)]">
          {leftNav === 'chat' && hasChatApp && handle && activeChatInstanceId ? (
            <CommunityChatPanel
              handle={handle}
              instanceId={activeChatInstanceId}
              title={chatInstances.find((c) => c.id === activeChatInstanceId)?.title}
              onBackToCommunity={() => {
                setLeftNav('home');
                setMainTab('home');
              }}
            />
          ) : leftNav === 'courses' && hasCoursesApp && handle && activeCoursesInstanceId ? (
            <CommunityCoursesPanel
              handle={handle}
              instanceId={activeCoursesInstanceId}
              instanceTitle={courseInstances.find((c) => c.id === activeCoursesInstanceId)?.title}
              isOwner={isOwner}
              onBackToCommunity={() => {
                setLeftNav('home');
                setMainTab('home');
              }}
            />
          ) : leftNav === 'content' && hasContentApp && handle && activeContentInstanceId ? (
            <CommunityContentPanel
              handle={handle}
              instanceId={activeContentInstanceId}
              instanceTitle={contentInstances.find((c) => c.id === activeContentInstanceId)?.title}
              isOwner={isOwner}
              onBackToCommunity={() => {
                setLeftNav('home');
                setMainTab('home');
              }}
            />
          ) : leftNav === 'files' && hasFilesApp && handle && activeFilesInstanceId ? (
            <CommunityFilesPanel
              handle={handle}
              instanceId={activeFilesInstanceId}
              instanceTitle={fileInstances.find((c) => c.id === activeFilesInstanceId)?.title}
              isOwner={isOwner}
              onBackToCommunity={() => {
                setLeftNav('home');
                setMainTab('home');
              }}
            />
          ) : leftNav === 'announcements' && hasAnnouncementsApp && handle && activeAnnouncementsInstanceId ? (
            <CommunityAnnouncementsPanel
              handle={handle}
              instanceId={activeAnnouncementsInstanceId}
              instanceTitle={announcementInstances.find((c) => c.id === activeAnnouncementsInstanceId)?.title}
              isOwner={isOwner}
              onBackToCommunity={() => {
                setLeftNav('home');
                setMainTab('home');
              }}
            />
          ) : leftNav === 'events' && hasEventsApp && handle && activeEventsInstanceId ? (
            <CommunityEventsPanel
              handle={handle}
              instanceId={activeEventsInstanceId}
              instanceTitle={eventInstances.find((c) => c.id === activeEventsInstanceId)?.title}
              isOwner={isOwner}
              isMember={isMember}
              ownerUsername={community.owner?.username || ''}
              onBackToCommunity={() => {
                setLeftNav('home');
                setMainTab('home');
              }}
            />
          ) : leftNav === 'ai' && hasAiApp && handle && activeAiInstanceId ? (
            <CommunityAiPanel
              handle={handle}
              instanceId={activeAiInstanceId}
              instanceTitle={aiInstances.find((c) => c.id === activeAiInstanceId)?.title}
              isOwner={isOwner}
              onBackToCommunity={() => {
                setLeftNav('home');
                setMainTab('home');
              }}
            />
          ) : leftNav === 'kanban' && hasKanbanApp && handle && activeKanbanInstanceId ? (
            <CommunityKanbanPanel
              handle={handle}
              instanceId={activeKanbanInstanceId}
              instanceTitle={kanbanInstances.find((c) => c.id === activeKanbanInstanceId)?.title}
              isOwner={isOwner}
              onBackToCommunity={() => {
                setLeftNav('home');
                setMainTab('home');
              }}
            />
          ) : leftNav === 'forms' && hasFormsApp && handle && activeFormsInstanceId ? (
            <CommunityFormsPanel
              handle={handle}
              instanceId={activeFormsInstanceId}
              instanceTitle={formInstances.find((c) => c.id === activeFormsInstanceId)?.title}
              isOwner={isOwner}
              onBackToCommunity={() => {
                setLeftNav('home');
                setMainTab('home');
              }}
            />
          ) : (
            <div
              className={
                mobileComposerFull
                  ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
                  : 'flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain max-lg:pb-[calc(env(safe-area-inset-bottom,0px))]'
              }
            >
          <div
            className={`flex min-h-full flex-col rounded-xl border border-[#e7e7e7] bg-white max-lg:rounded-none max-lg:border-x-0 ${
              mobileComposerFull ? 'min-h-0 flex-1 overflow-hidden' : ''
            }`}
          >
            {/* BANNER — top radius matches parent card */}
            <div className="relative h-[140px] shrink-0 overflow-hidden rounded-t-xl bg-gradient-to-r from-gray-800 to-gray-900 max-lg:rounded-t-none sm:h-[200px] lg:h-[250px]">
              {community.banner && (
                <img src={community.banner} alt="" className="h-full w-full object-cover" />
              )}
              {!isLgUp && !isAppNavActive && leftSidebarProps && rightSidebarProps && (
                <CommunityMobileSideAccess
                  unreadByInstance={unreadByInstance}
                  leftSidebar={leftSidebarProps}
                  rightSidebar={rightSidebarProps}
                  bannerTrailing={
                    isOwner ? (
                      <button
                        type="button"
                        disabled={brandingFieldBusy === 'banner'}
                        onClick={() => setBannerModalOpen(true)}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/80 bg-white/90 text-neutral-800 shadow-sm backdrop-blur transition-colors hover:bg-white disabled:opacity-60"
                        aria-label={
                          brandingFieldBusy === 'banner' ? t('upload.uploading') : t('upload.changeBanner')
                        }
                      >
                        <Camera size={18} aria-hidden />
                      </button>
                    ) : undefined
                  }
                />
              )}
              {isOwner && (
                <button
                  type="button"
                  disabled={brandingFieldBusy === 'banner'}
                  onClick={() => setBannerModalOpen(true)}
                  className="absolute top-3 right-3 hidden h-10 items-center gap-2 rounded-2xl border border-white bg-white/90 px-3 text-sm font-medium backdrop-blur transition-all hover:bg-white disabled:opacity-60 sm:top-5 sm:right-5 sm:h-11 sm:px-5 lg:flex"
                >
                  <Camera size={18} />
                  <span className="hidden sm:inline">
                    {brandingFieldBusy === 'banner' ? t('upload.uploading') : t('upload.changeBanner')}
                  </span>
                </button>
              )}
            </div>

            {/* COMMUNITY INFO — centered column */}
            <div className="relative px-3 pb-5 sm:px-7 sm:pb-6">
              <div className="relative mx-auto max-w-3xl">
                <input
                  ref={avatarFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadCommunityBranding('avatar', f);
                  }}
                />
                <div className="absolute -top-4 left-1/2 z-10 flex max-w-[min(100%,20rem)] -translate-x-1/2 items-center justify-center rounded-full bg-white px-4 py-2 sm:max-w-none sm:px-6">
                  <h1 className="truncate text-lg font-semibold leading-none tracking-[-0.05em] sm:text-2xl">{community.name}</h1>
                </div>

                <div className="flex flex-col pt-3 sm:pt-4">
                  <p className="mt-3 max-w-xl text-base text-[#888] sm:mt-4 sm:text-[18px]">{community.description || t('community.setDescriptionHint')}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#666] sm:gap-3 sm:text-[15px]">
                    <span>
                      {t(
                        community.memberCount === 1
                          ? 'community.memberCountLineOne'
                          : 'community.memberCountLineMany',
                        { count: formatCount(community.memberCount) }
                      )}
                    </span>
                    <span>•</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        community.isPublic !== false
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {community.isPublic !== false ? (
                        <>
                          <Globe size={12} />
                          {t('common.public')}
                        </>
                      ) : (
                        <>
                          <Lock size={12} />
                          {t('common.private')}
                        </>
                      )}
                    </span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <span>{t('community.createdBy')}</span>
                      <Link to={`/@${community.owner?.username}`} className="font-semibold text-black hover:underline">
                        {community.owner?.fullName || community.owner?.username}
                      </Link>
                    </div>
                  </div>

                  {user && !isOwner && (
                    <button
                      type="button"
                      onClick={handleJoin}
                      disabled={joinLoading}
                      className={`mt-4 inline-flex h-10 w-fit items-center gap-2 rounded-2xl px-4 font-medium transition-all ${
                        isMember
                          ? 'border border-red-200 bg-white text-red-600 hover:bg-red-50'
                          : 'bg-[#315efb] text-white hover:bg-[#2547c4]'
                      }`}
                    >
                      {isMember ? <UserPlus size={18} /> : <Plus size={18} />}
                      {joinLoading ? t('community.joinLoading') : isMember ? t('community.leave') : t('community.join')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* TABS — full width, active bg + centered thick underline */}
            <div className="grid w-full grid-cols-4 border-t border-[#ececec]">
              {(['home', 'apps', 'products', 'about'] as const).map((tab) => {
                const tabLabel =
                  tab === 'home'
                    ? t('community.tabHome')
                    : tab === 'apps'
                      ? t('community.tabApps')
                      : tab === 'products'
                        ? t('community.tabProducts')
                        : t('community.tabAbout');
                return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setMainTab(tab);
                    setLeftNav('home');
                  }}
                  className={`flex w-full flex-col items-center pt-3 transition-colors ${
                    mainTab === tab ? 'bg-neutral-100 text-black' : 'text-[#777] hover:bg-neutral-100'
                  }`}
                >
                  <span className="pb-2 text-center text-[13px] font-medium sm:text-[17px]">{tabLabel}</span>
                  <span
                    className={`mb-0 h-1 w-[38%] max-w-[96px] rounded-full ${
                      mainTab === tab ? 'bg-[#315efb]' : 'bg-transparent'
                    }`}
                    aria-hidden
                  />
                </button>
              );
              })}
            </div>

            {/* TAB PANELS */}
            <div
              className={`flex flex-col border-t border-[#ececec] py-0 ${
                mobileComposerFull ? 'min-h-0 flex-1 overflow-hidden' : ''
              }`}
            >
              {mainTab === 'home' && (
                <div
                  className={
                    mobileComposerFull
                      ? 'mx-auto mt-4 flex min-h-0 w-full flex-1 flex-col'
                      : 'mx-auto flex w-full flex-col pt-2'
                  }
                >
                  {canPost && (
                    <PostComposer
                      variant="community"
                      isOpen={isCreateOpen}
                      onOpen={() => setIsCreateOpen(true)}
                      content={newPostContent}
                      onContentChange={setNewPostContent}
                      media={newPostMedia}
                      onMediaChange={setNewPostMedia}
                      linkAttachment={newPostLink}
                      onLinkAttachmentChange={setNewPostLink}
                      coinAttachment={newPostCoin}
                      onCoinAttachmentChange={setNewPostCoin}
                      onCancel={closeComposer}
                      onSubmit={() => void handleCreatePost()}
                      isPosting={isPosting}
                      userAvatar={user?.avatar}
                      userFullName={user?.fullName}
                      token={token}
                    />
                  )}
                  {memberButCannotPost && !ownerOnlyPostNoticeDismissed && (
                    <div className="my-6 flex items-start gap-3 rounded-xl border border-[#ececec] bg-[#fafafa] px-4 py-3 text-sm text-[#666]">
                      <p className="min-w-0 flex-1 leading-snug">
                        {t('community.ownerOnlyNotice')}
                      </p>
                      <button
                        type="button"
                        onClick={dismissOwnerOnlyPostNotice}
                        className="shrink-0 rounded-md p-1 text-[#888] transition-colors hover:bg-black/5 hover:text-[#444]"
                        aria-label={t('community.dismiss')}
                      >
                        <X size={16} aria-hidden />
                      </button>
                    </div>
                  )}

                  <div
                    className={`flex flex-1 flex-col border-t border-neutral-200 ${
                      mobileComposerFull ? 'hidden' : 'min-h-0'
                    }`}
                  >
                  {posts.length > 0 ? (
                    posts.map((post) => (
                      <PostFeedCard
                        key={post._id}
                        post={post}
                        communityContext={
                          community
                            ? {
                                _id: community._id,
                                name: community.name,
                                handle: community.handle,
                                avatar: community.avatar,
                              }
                            : null
                        }
                        isSelected={selectedPost?._id === post._id}
                        onSelect={setSelectedPost}
                        formatPostDate={formatPostDate}
                        formatCount={formatCount}
                        likedPosts={likedPosts}
                        repostedPosts={repostedPosts}
                        bookmarkedPosts={bookmarkedPosts}
                        onLike={handleLike}
                        onRepost={handleRepost}
                        onBookmark={handleBookmark}
                        onToggleComments={toggleFeedComments}
                        expandedCommentsPostId={expandedCommentsPostId}
                        menuOpenPostId={menuOpenPostId}
                        onMenuToggle={(postId, e) => {
                          e.stopPropagation();
                          setMenuOpenPostId(menuOpenPostId === postId ? null : postId);
                        }}
                        menuRef={menuRef}
                        onCopyLink={(postId) => {
                          copyPostLink(postId);
                          setMenuOpenPostId(null);
                        }}
                        onEdit={openEditPost}
                        onDelete={handleDeletePost}
                        canManagePost={isPostOwner(post)}
                        inlineCommentText={inlineCommentText}
                        onInlineCommentTextChange={setInlineCommentText}
                        onSubmitInlineComment={() =>
                          void handleSubmitComment(String(post._id), 'inline')
                        }
                        onSubmitInlineReply={(parentId, content) =>
                          void handleSubmitComment(String(post._id), 'inline', {
                            parentId,
                            content,
                          })
                        }
                        token={token}
                        commentSubmitting={commentSubmitting}
                        commentsLoading={commentsLoadingPostId === String(post._id)}
                        isCommentOwner={isCommentOwner}
                        openCommentMenu={openCommentMenu}
                        onCommentMenuToggle={(c, pid, rect, isOpen) => {
                          setOpenCommentMenu(
                            isOpen
                              ? null
                              : { commentId: c._id, postId: pid, content: c.content, rect },
                          );
                        }}
                      />
                    ))
                  ) : (
                    <div className="flex flex-1 min-h-[280px] items-center justify-center px-4 py-12 text-[17px] text-[#999]">
                      {canViewFeed
                        ? t('community.feedEmpty')
                        : t('community.joinToSeePosts')}
                    </div>
                  )}
                  </div>
                </div>
              )}

              {mainTab === 'apps' && handle && (
                <div className="mx-auto flex w-full max-w-2xl flex-col px-4">
                  <div className="flex items-center justify-between border-b border-[#ececec] py-4">
                    <h2 className="text-xl font-bold text-neutral-900">{t('community.appsHeading')}</h2>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => navigate(communityStorePath(handle))}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef2ff] text-[#315efb] transition-colors hover:bg-[#dfe7ff]"
                        title={t('community.addAppTitle')}
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 py-4 sm:grid-cols-3 sm:gap-4 sm:py-6">
                    {sidebarAppInstances.map((inst) => {
                      const IconEl =
                        inst.appId === COMMUNITY_APP_IDS.CHAT ? (
                          <MessagesSquare size={26} />
                        ) : inst.appId === COMMUNITY_APP_IDS.COURSES ? (
                          <GraduationCap size={26} />
                        ) : inst.appId === COMMUNITY_APP_IDS.CONTENT ? (
                          <Quote size={26} />
                        ) : inst.appId === COMMUNITY_APP_IDS.FILES ? (
                          <CloudDownload size={26} />
                        ) : inst.appId === COMMUNITY_APP_IDS.EVENTS ? (
                          <Calendar size={26} />
                        ) : inst.appId === COMMUNITY_APP_IDS.AI ? (
                          <Bot size={26} />
                        ) : inst.appId === COMMUNITY_APP_IDS.KANBAN ? (
                          <Columns3 size={26} />
                        ) : inst.appId === COMMUNITY_APP_IDS.FORMS ? (
                          <ClipboardList size={26} />
                        ) : (
                          <Megaphone size={26} />
                        );
                      const kindLabel =
                        inst.appId === COMMUNITY_APP_IDS.CHAT
                          ? t('community.appKindChat')
                          : inst.appId === COMMUNITY_APP_IDS.COURSES
                            ? t('community.appKindCourses')
                            : inst.appId === COMMUNITY_APP_IDS.CONTENT
                              ? t('community.appKindContent')
                              : inst.appId === COMMUNITY_APP_IDS.FILES
                                ? t('community.appKindFiles')
                                : inst.appId === COMMUNITY_APP_IDS.EVENTS
                                  ? t('community.appKindEvents')
                                  : inst.appId === COMMUNITY_APP_IDS.AI
                                    ? t('community.appKindAi')
                                    : inst.appId === COMMUNITY_APP_IDS.KANBAN
                                      ? t('community.appKindKanban')
                                      : inst.appId === COMMUNITY_APP_IDS.FORMS
                                        ? t('community.appKindForms')
                                        : t('community.appKindAnnouncements');
                      return (
                        <button
                          key={inst.id}
                          type="button"
                          onClick={() => activateAppInstance(inst)}
                          className="flex flex-col items-center gap-2 rounded-2xl border border-[#e5e5e5] bg-white p-3 text-center transition-colors hover:border-[#cfcfcf] hover:bg-neutral-50 sm:gap-3 sm:p-5"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f3f3f3] text-neutral-800 sm:h-16 sm:w-16">
                            {IconEl}
                          </div>
                          <p className="line-clamp-2 text-sm font-semibold leading-tight text-neutral-900">{inst.title}</p>
                          <p className="text-xs text-neutral-500">{kindLabel}</p>
                        </button>
                      );
                    })}
                  </div>
                  {sidebarAppInstances.length === 0 && (
                    <p className="pb-10 text-center text-[17px] text-[#999]">{t('community.noAppsInstalled')}</p>
                  )}
                </div>
              )}

              {mainTab === 'products' && handle && (
                <div className="mx-auto flex w-full max-w-2xl flex-col px-3 pb-6 sm:px-4">
                  <div className="flex flex-col gap-3 border-b border-[#ececec] py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                    <h2 className="text-lg font-bold text-neutral-900 sm:text-xl">{t('community.productsHeading')}</h2>
                    <div className="flex items-center gap-2">
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => navigate(communityStorePath(handle))}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef2ff] text-[#315efb] transition-colors hover:bg-[#dfe7ff]"
                          title={t('community.addFromStoreTitle')}
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="py-6">
                    <div className="overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white">
                      <button
                        type="button"
                        onClick={() => setProductsBundleOpen((v) => !v)}
                        className="flex w-full items-center gap-3 border-b border-[#ececec] px-4 py-4 text-left transition-colors hover:bg-neutral-50"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600">
                          <Package className="h-4 w-4" strokeWidth={2} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-neutral-900">
                            {community.isPaid && community.price
                              ? t('community.appsBundleTitlePaid', {
                                  price: `$${community.price}`,
                                  name: community.name,
                                })
                              : t('community.appsBundleTitleFree', { name: community.name })}
                          </p>
                          <p className="mt-0.5 text-xs text-neutral-500">
                            <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-600">
                              {t('community.appsCountInBundle', { count: sidebarAppInstances.length })}
                            </span>
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1 text-neutral-400">
                          {productsBundleOpen ? (
                            <ChevronUp className="h-5 w-5 text-neutral-600" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-neutral-600" />
                          )}
                        </div>
                      </button>

                      {productsBundleOpen && (
                        <div className="divide-y divide-[#ececec]">
                          {sidebarAppInstances.length === 0 ? (
                            <div className="px-4 py-10 text-center text-[15px] text-neutral-500">
                              {t('community.noProductsInBundle')}
                            </div>
                          ) : (
                            sidebarAppInstances.map((inst) => {
                              const IconComp =
                                inst.appId === COMMUNITY_APP_IDS.CHAT
                                  ? MessagesSquare
                                  : inst.appId === COMMUNITY_APP_IDS.COURSES
                                    ? GraduationCap
                                    : inst.appId === COMMUNITY_APP_IDS.CONTENT
                                      ? Quote
                                      : inst.appId === COMMUNITY_APP_IDS.FILES
                                        ? CloudDownload
                                        : inst.appId === COMMUNITY_APP_IDS.EVENTS
                                          ? Calendar
                                          : inst.appId === COMMUNITY_APP_IDS.AI
                                            ? Bot
                                            : inst.appId === COMMUNITY_APP_IDS.KANBAN
                                              ? Columns3
                                              : inst.appId === COMMUNITY_APP_IDS.FORMS
                                                ? ClipboardList
                                                : Megaphone;
                              let primary = inst.title;
                              let secondary = inst.title;
                              if (inst.appId === COMMUNITY_APP_IDS.CHAT) {
                                primary = inst.title || t('community.defaultChatTitle');
                                secondary = t('community.defaultChatTitle');
                              } else if (inst.appId === COMMUNITY_APP_IDS.CONTENT) {
                                primary = inst.title || t('community.defaultContentPrimary');
                                secondary = t('community.defaultContentSecondary');
                              } else if (inst.appId === COMMUNITY_APP_IDS.ANNOUNCEMENTS) {
                                primary = inst.title || t('community.defaultAnnouncementsPrimary');
                                secondary = t('community.defaultAnnouncementsSecondary');
                              } else if (inst.appId === COMMUNITY_APP_IDS.COURSES) {
                                primary = inst.title || t('community.defaultCoursesTitle');
                                secondary = t('community.defaultCoursesTitle');
                              } else if (inst.appId === COMMUNITY_APP_IDS.FILES) {
                                primary = inst.title || t('community.defaultFilesTitle');
                                secondary = t('community.defaultFilesTitle');
                              } else if (inst.appId === COMMUNITY_APP_IDS.EVENTS) {
                                primary = inst.title || t('community.defaultEventsTitle');
                                secondary = t('community.defaultEventsTitle');
                              } else if (inst.appId === COMMUNITY_APP_IDS.AI) {
                                primary = inst.title || t('community.defaultAiTitle');
                                secondary = t('community.defaultAiTitle');
                              } else if (inst.appId === COMMUNITY_APP_IDS.KANBAN) {
                                primary = inst.title || t('community.defaultKanbanTitle');
                                secondary = t('community.defaultKanbanTitle');
                              } else if (inst.appId === COMMUNITY_APP_IDS.FORMS) {
                                primary = inst.title || t('community.defaultFormsTitle');
                                secondary = t('community.defaultFormsTitle');
                              }
                              const I = IconComp;
                              return (
                                <button
                                  key={inst.id}
                                  type="button"
                                  onClick={() => activateAppInstance(inst)}
                                  className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-neutral-50"
                                >
                                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-black text-amber-400">
                                    <I className="h-6 w-6" strokeWidth={2} />
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-neutral-900">{primary}</p>
                                    <p className="text-sm text-neutral-500">{secondary}</p>
                                  </div>
                                  <ChevronRight className="h-5 w-5 shrink-0 text-neutral-400" />
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 flex items-center justify-center gap-3 rounded-2xl bg-neutral-100 px-5 py-5 text-center text-sm leading-relaxed text-neutral-600">
                      <span className="text-lg" aria-hidden>
                        🍔
                      </span>
                      <span>{t('community.accessAllPurchasable')}</span>
                    </div>
                  </div>
                </div>
              )}

              {mainTab === 'about' && community.owner && (
                <div className="mx-auto flex w-full max-w-2xl flex-col space-y-0 px-4 pb-8">
                  <div className="border-b border-[#ececec] pb-8">
                    {/* <h2 className="text-lg font-semibold text-neutral-800">Team</h2> */}
                    <div className="mt-5 space-y-6">
                      <div>
                        <p className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-[#999]">{t('community.aboutOwner')}</p>
                        <Link
                          to={`/@${community.owner.username}`}
                          className="flex items-center justify-between rounded-2xl border border-[#e5e5e5] p-4 transition-colors hover:border-[#cfcfcf] hover:bg-neutral-50"
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <img
                                src={
                                  community.owner.avatar ||
                                  `https://ui-avatars.com/api/?name=${encodeURIComponent(community.owner.fullName || community.owner.username)}&background=404040&color=fff&size=96&bold=true`
                                }
                                alt=""
                                className="h-14 w-14 rounded-full object-cover"
                              />
                              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                            </div>
                            <div>
                              <p className="font-semibold text-neutral-900">{community.owner.fullName || community.owner.username}</p>
                              <p className="text-sm text-neutral-500">@{community.owner.username}</p>
                            </div>
                          </div>
                          <span className="rounded-full bg-[#f5f5f5] px-3 py-1 text-sm font-medium text-neutral-700">{t('community.ownerRole')}</span>
                        </Link>
                      </div>
                      <div>
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#999]">{t('community.aboutAdmins')}</p>
                          {isOwner && (
                            <button
                              type="button"
                              onClick={() => setAddAdminModalOpen(true)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e5e5] bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 transition-colors hover:border-[#cfcfcf] hover:bg-neutral-50"
                            >
                              <UserPlus className="h-3.5 w-3.5" aria-hidden />
                              {t('community.addAdmin')}
                            </button>
                          )}
                        </div>
                        {(community.admins?.length ?? 0) === 0 ? (
                          <p className="rounded-2xl border border-dashed border-[#e5e5e5] bg-neutral-50/50 px-4 py-6 text-center text-sm text-[#888]">
                            {t('community.noAdminsYet')}
                          </p>
                        ) : (
                          <ul className="space-y-3">
                            {community.admins?.map((admin) => (
                              <li
                                key={admin._id}
                                className="flex items-center justify-between rounded-2xl border border-[#e5e5e5] p-4"
                              >
                                <Link
                                  to={`/@${admin.username}`}
                                  className="flex min-w-0 flex-1 items-center gap-4 transition-colors hover:opacity-90"
                                >
                                  <img
                                    src={
                                      admin.avatar ||
                                      `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.fullName || admin.username)}&background=404040&color=fff&size=96&bold=true`
                                    }
                                    alt=""
                                    className="h-14 w-14 rounded-full object-cover"
                                  />
                                  <div className="min-w-0">
                                    <p className="font-semibold text-neutral-900">
                                      {admin.fullName || admin.username}
                                    </p>
                                    <p className="text-sm text-neutral-500">@{admin.username}</p>
                                  </div>
                                </Link>
                                <div className="ml-3 flex shrink-0 items-center gap-2">
                                  <span className="rounded-full bg-[#f5f5f5] px-3 py-1 text-sm font-medium text-neutral-700">
                                    {t('community.adminRole')}
                                  </span>
                                  {isOwner && (
                                    <button
                                      type="button"
                                      disabled={adminActionBusy === admin._id}
                                      onClick={() => void handleRemoveAdmin(admin._id)}
                                      className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                      aria-label={t('community.removeAdminAria', { username: admin.username })}
                                    >
                                      <Trash2 className="h-4 w-4" aria-hidden />
                                    </button>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="pt-8">
                    <div className="flex items-center gap-2 text-neutral-700">
                      <Star className="h-4 w-4 text-amber-400" fill="currentColor" />
                      <span className="text-sm font-medium">{t('community.reviewsLine')}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center py-12 text-center text-[#999]">
                      <Star className="mb-3 h-16 w-16 text-neutral-200" strokeWidth={1.1} />
                      <p className="text-[17px]">{t('community.noReviewsYet')}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
          )}
        </div>

        {!isAppNavActive && rightSidebarProps && (
          <div className="hidden h-full min-h-0 overflow-y-auto lg:block">
            <CommunityRightSidebar {...rightSidebarProps} />
          </div>
        )}
      </div>

      {community && isOwner && (
        <CommunityBannerModal
          open={bannerModalOpen}
          onClose={() => {
            if (brandingFieldBusy !== 'banner') setBannerModalOpen(false);
          }}
          bannerUrl={community.banner || ''}
          busy={brandingFieldBusy === 'banner'}
          onUploadFile={(file) => uploadCommunityBranding('banner', file)}
          onSaveUrl={(url) => patchCommunityBanner(url)}
          onRemove={() => patchCommunityBanner('')}
        />
      )}

      {community && handle && (
        <AddCommunityAdminModal
          isOpen={addAdminModalOpen}
          onClose={() => setAddAdminModalOpen(false)}
          communityHandle={handle}
          ownerId={String(community.owner._id)}
          existingAdminIds={(community.admins ?? []).map((a) => a._id)}
          onAdded={() => void fetchCommunity()}
        />
      )}

      <MobileBottomSheet
        open={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        title={t('postPage.title')}
      >
        {selectedPost ? (
          <PostDetailPanel
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            onCopyLink={copyPostLink}
            commentText={commentText}
            onCommentTextChange={setCommentText}
            onSubmitComment={() => void handleSubmitComment(String(selectedPost._id), 'sidebar')}
            onSubmitReply={(parentId, content) =>
              void handleSubmitComment(String(selectedPost._id), 'sidebar', {
                parentId,
                content,
              })
            }
            token={token}
            commentSubmitting={commentSubmitting}
            commentsLoading={commentsLoadingPostId === String(selectedPost._id)}
            isCommentOwner={isCommentOwner}
            openCommentMenu={openCommentMenu}
            onCommentMenuToggle={(c, pid, rect, isOpen) => {
              setOpenCommentMenu(
                isOpen ? null : { commentId: c._id, postId: pid, content: c.content, rect },
              );
            }}
          />
        ) : null}
      </MobileBottomSheet>

      <FloatingMenu
        open={!!openCommentMenu}
        anchor={openCommentMenu ? { rect: openCommentMenu.rect } : null}
        onClose={() => setOpenCommentMenu(null)}
      >
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            if (!openCommentMenu) return;
            setEditCommentTarget({
              postId: openCommentMenu.postId,
              commentId: openCommentMenu.commentId,
              content: openCommentMenu.content,
            });
            setOpenCommentMenu(null);
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-50"
        >
          <AnimatedPostMenuIcon kind="edit" size={14} />
          {t('common.edit')}
        </button>
        <div className="my-1 h-px bg-neutral-100" />
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            if (!openCommentMenu) return;
            void handleDeleteComment(openCommentMenu.postId, openCommentMenu.commentId);
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
        >
          <AnimatedPostMenuIcon kind="trash" size={14} color="#dc2626" />
          {t('common.delete')}
        </button>
      </FloatingMenu>

      <EditTextModal
        isOpen={editPostTarget !== null}
        title={t('userProfile.editPostTitle')}
        description={t('userProfile.editPostDescription')}
        initialValue={editPostTarget?.content ?? ''}
        placeholder={t('postComposer.whatsOnMind')}
        maxLength={5000}
        submitLabel={t('userProfile.savePost')}
        saving={editPostSaving}
        onClose={() => {
          if (!editPostSaving) setEditPostTarget(null);
        }}
        onSubmit={(value) => void submitEditPost(value)}
      />

      <EditTextModal
        isOpen={editCommentTarget !== null}
        title={t('home.editCommentTitle')}
        description={t('home.editCommentDescription')}
        initialValue={editCommentTarget?.content ?? ''}
        placeholder={t('home.editCommentPlaceholder')}
        maxLength={2000}
        submitLabel={t('home.saveComment')}
        saving={editCommentSaving}
        onClose={() => {
          if (!editCommentSaving) setEditCommentTarget(null);
        }}
        onSubmit={(value) => void submitEditComment(value)}
      />
    </div>
  );
};

export default CommunityPage;
