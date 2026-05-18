import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  communityDashboardPath,
  communitySettingsPath,
  communityStorePath,
} from '../constants/communityRoutes';
import { COMMUNITY_APP_IDS } from '../constants/communityApps';
import CommunityChatPanel from '../components/Community/CommunityChatPanel';
import CommunityCoursesPanel from '../components/Community/CommunityCoursesPanel';
import CommunityContentPanel from '../components/Community/CommunityContentPanel';
import CommunityFilesPanel from '../components/Community/CommunityFilesPanel';
import CommunityAnnouncementsPanel from '../components/Community/CommunityAnnouncementsPanel';
import CommunityEventsPanel from '../components/Community/CommunityEventsPanel';
import {
  MessageCircle,
  Repeat2,
  Heart,
  Plus,
  UserPlus,
  Copy,
  HouseHeart,
  Globe,
  Lock,
  Bolt,
  GraduationCap,
  MoreVertical,
  Pencil,
  ChevronRight,
  Check,
  Trash2,
  ArrowLeft,
  MessagesSquare,
  Quote,
  CloudDownload,
  Megaphone,
  Star,
  LayoutList,
  LayoutGrid,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Package,
  Camera,
  Calendar,
  EyeOff,
  X,
  LayoutDashboard,
} from 'lucide-react';
import PostMediaUpload from '../components/Posts/PostMediaUpload';
import PostMediaGallery from '../components/Posts/PostMediaGallery';
import { buildPostLightboxMeta } from '../utils/buildPostLightboxMeta';
import AddCommunityAdminModal from '../components/Community/AddCommunityAdminModal';
import { canAccessCommunityDashboard } from '../utils/communityRoles';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

const API_ORIGIN = 'http://localhost:5000';
const OWNER_ONLY_POST_NOTICE_KEY = 'communityOwnerOnlyPostNoticeDismissed';
const API_URL = `${API_ORIGIN}/api/communities`;
const POSTS_API_URL = `${API_ORIGIN}/api/posts`;

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

interface Post {
  _id: string;
  content: string;
  author: {
    _id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  media: string[];
  createdAt: string;
  isLiked?: boolean;
  isReposted?: boolean;
  isPrivate?: boolean;
}

const CommunityPage: React.FC = () => {
  const { handle } = useParams<{ handle: string }>();
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
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
  const [leftNav, setLeftNav] = useState<'home' | 'chat' | 'courses' | 'content' | 'files' | 'announcements' | 'events'>('home');
  const [activeChatInstanceId, setActiveChatInstanceId] = useState<string | null>(null);
  const [activeCoursesInstanceId, setActiveCoursesInstanceId] = useState<string | null>(null);
  const [activeContentInstanceId, setActiveContentInstanceId] = useState<string | null>(null);
  const [activeFilesInstanceId, setActiveFilesInstanceId] = useState<string | null>(null);
  const [activeAnnouncementsInstanceId, setActiveAnnouncementsInstanceId] = useState<string | null>(null);
  const [activeEventsInstanceId, setActiveEventsInstanceId] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState<'home' | 'apps' | 'products' | 'about'>('home');
  const [productsView, setProductsView] = useState<'list' | 'grid'>('list');
  const [productsBundleOpen, setProductsBundleOpen] = useState(true);
  const [appInstanceMenuId, setAppInstanceMenuId] = useState<string | null>(null);
  const [appInstanceMenuPanel, setAppInstanceMenuPanel] = useState<'main' | 'visibility'>('main');
  const appInstanceMenuRef = useRef<HTMLDivElement | null>(null);
  const bannerFileRef = useRef<HTMLInputElement | null>(null);
  const avatarFileRef = useRef<HTMLInputElement | null>(null);
  const [brandingFieldBusy, setBrandingFieldBusy] = useState<'banner' | 'avatar' | null>(null);
  const [unreadByInstance, setUnreadByInstance] = useState<Record<string, number>>({});
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [postVisibility, setPostVisibility] = useState<'public' | 'private'>('public');
  const [ownerOnlyPostNoticeDismissed, setOwnerOnlyPostNoticeDismissed] = useState(false);
  const [addAdminModalOpen, setAddAdminModalOpen] = useState(false);
  const [adminActionBusy, setAdminActionBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!handle) {
      setOwnerOnlyPostNoticeDismissed(false);
      return;
    }
    setOwnerOnlyPostNoticeDismissed(
      localStorage.getItem(`${OWNER_ONLY_POST_NOTICE_KEY}:${handle}`) === '1'
    );
  }, [handle]);

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

  // Загрузка постов сообщества
  const fetchPosts = useCallback(async () => {
    if (!handle) return;
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`${API_URL}/${handle}/posts`, { headers });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
        
        const likedIds = new Set<string>();
        const repostedIds = new Set<string>();
        data.forEach((post: Post) => {
          const pid = String(post._id);
          if (post.isLiked) likedIds.add(pid);
          if (post.isReposted) repostedIds.add(pid);
        });
        setLikedPosts(likedIds);
        setRepostedPosts(repostedIds);
      }
    } catch (err) {
      console.error('Fetch posts error:', err);
    }
  }, [handle, token]);

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
      } catch (e) {
        console.error('Branding upload error:', e);
      } finally {
        setBrandingFieldBusy(null);
        if (field === 'banner' && bannerFileRef.current) bannerFileRef.current.value = '';
        if (field === 'avatar' && avatarFileRef.current) avatarFileRef.current.value = '';
      }
    },
    [handle, token]
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
    if (!appInstanceMenuId) setAppInstanceMenuPanel('main');
  }, [appInstanceMenuId]);

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

  useEffect(() => {
    if (!appInstanceMenuId) return;
    const onDown = (e: MouseEvent) => {
      if (appInstanceMenuRef.current && !appInstanceMenuRef.current.contains(e.target as Node)) {
        setAppInstanceMenuId(null);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [appInstanceMenuId]);

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
      setJoinError('Enter the join passphrase to continue.');
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
            ? 'Incorrect join passphrase. Try again.'
            : (data as { message?: string }).message || 'Failed to join community';
        setJoinError(msg);
      }
    } catch (err) {
      console.error('Join error:', err);
      setJoinError('Something went wrong. Please try again.');
    } finally {
      setJoinLoading(false);
    }
  };

  // ЕДИНСТВЕННАЯ функция handleCreatePost (удалите дубликат ниже)
  const handleCreatePost = async () => {
    if ((!newPostContent.trim() && newPostMedia.length === 0) || !token || !canPost || isPosting) return;
    
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
          community: community?._id,
          isPrivate: postVisibility === 'private'
        })
      });
      
      if (res.ok) {
        const newPost = await res.json();
        setPosts(prev => [newPost, ...prev]);
        setNewPostContent('');
        setNewPostMedia([]);
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
    try {
      const res = await fetch(`${POSTS_API_URL}/${id}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          data.liked ? newSet.add(id) : newSet.delete(id);
          return newSet;
        });
        setPosts(prev => prev.map(post => 
          String(post._id) === id ? { ...post, likesCount: data.likesCount } : post
        ));
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleRepost = async (postId: string) => {
    if (!token) {
      window.dispatchEvent(new CustomEvent('openLogin'));
      return;
    }
    const id = String(postId);
    try {
      const res = await fetch(`${POSTS_API_URL}/${id}/repost`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRepostedPosts(prev => {
          const newSet = new Set(prev);
          data.reposted ? newSet.add(id) : newSet.delete(id);
          return newSet;
        });
        setPosts(prev => prev.map(post => 
          String(post._id) === id ? { ...post, repostsCount: data.repostsCount } : post
        ));
      }
    } catch (err) {
      console.error('Repost error:', err);
    }
  };

  const formatPostDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

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
        title: 'Remove admin?',
        message: 'They will lose admin access to this community dashboard.',
        confirmLabel: 'Remove',
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
          showToast((data as { message?: string }).message || 'Failed to remove admin', 'error');
          return;
        }
        await fetchCommunity();
        showToast('Admin removed');
      } catch {
        showToast('Network error.', 'error');
      } finally {
        setAdminActionBusy(null);
      }
    },
    [token, handle, isOwner, fetchCommunity, confirm, showToast]
  );

  const canPost =
    community?.canPost === true ||
    isOwner ||
    (isMember && community?.membersCanPost !== false);
  const memberButCannotPost = isMember && !canPost && !isOwner;
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
  const hasChatApp = chatInstances.length > 0;
  const hasCoursesApp = courseInstances.length > 0;
  const hasContentApp = contentInstances.length > 0;
  const hasFilesApp = fileInstances.length > 0;
  const hasAnnouncementsApp = announcementInstances.length > 0;
  const hasEventsApp = eventInstances.length > 0;
  const sidebarAppInstances = (community?.installedAppInstances ?? []).filter(
    (i) =>
      i.appId === COMMUNITY_APP_IDS.CHAT ||
      i.appId === COMMUNITY_APP_IDS.COURSES ||
      i.appId === COMMUNITY_APP_IDS.CONTENT ||
      i.appId === COMMUNITY_APP_IDS.FILES ||
      i.appId === COMMUNITY_APP_IDS.ANNOUNCEMENTS ||
      i.appId === COMMUNITY_APP_IDS.EVENTS
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
          showToast(typeof data?.message === 'string' ? data.message : 'Failed to update visibility', 'error');
          return;
        }
        const data = await res.json();
        setCommunity(data);
        showToast(visibleToMembers ? 'App is now visible to members' : 'App hidden from members');
      } catch (e) {
        console.error(e);
        showToast('Failed to update visibility', 'error');
      }
      setAppInstanceMenuId(null);
    },
    [token, handle, showToast]
  );

  const deleteAppInstance = useCallback(
    async (instanceId: string) => {
      if (!token || !handle || !community) return;
      const removed = community.installedAppInstances?.find((i) => i.id === instanceId);
      const msg =
        removed?.appId === COMMUNITY_APP_IDS.CHAT
          ? 'Remove this chat from the community? Its messages will be deleted.'
          : removed?.appId === COMMUNITY_APP_IDS.COURSES
            ? 'Remove this Courses app? All course modules in it will be deleted.'
            : removed?.appId === COMMUNITY_APP_IDS.CONTENT
              ? 'Remove this Content app? Its document will be deleted.'
            : removed?.appId === COMMUNITY_APP_IDS.FILES
              ? 'Remove this Files app? All uploaded files in it will be deleted.'
              : removed?.appId === COMMUNITY_APP_IDS.ANNOUNCEMENTS
                ? 'Remove this Announcements app? All announcements in it will be deleted.'
                : removed?.appId === COMMUNITY_APP_IDS.EVENTS
                  ? 'Remove this Events app? All events in it will be deleted.'
                  : 'Remove this app from the community?';
      const confirmed = await confirm({
        title: 'Remove app?',
        message: msg,
        confirmLabel: 'Remove',
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
          showToast(typeof data?.message === 'string' ? data.message : 'Failed to remove app', 'error');
          return;
        }
        const data = await res.json();
        setCommunity(data);
        showToast('App removed');
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
      } catch (e) {
        console.error(e);
        showToast('Failed to remove app', 'error');
      }
      setAppInstanceMenuId(null);
    },
    [token, handle, community, leftNav, confirm, showToast]
  );

  if (loading) {
    return (
      <div className="flex h-full min-h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
      </div>
    );
  }

  if (privateGatePreview && !community) {
    const preview = privateGatePreview;
    return (
      <div className="flex h-full min-h-full flex-col overflow-hidden">
        <div className="mx-auto flex h-full min-h-full w-full max-w-[1600px] flex-1 p-2">
          <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
            <div className="overflow-hidden rounded-xl border border-[#e7e7e7] bg-white">
            <div className="relative h-[250px] bg-gradient-to-r from-gray-800 to-gray-900">
              {preview.banner ? (
                <img src={preview.banner} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="relative px-7 pb-8">
              <div className="relative mx-auto max-w-3xl">
                <div className="absolute -top-14 left-1/2 z-10 -translate-x-1/2">
                  <img
                    src={
                      preview.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(preview.name)}&background=000&color=fff&size=120&bold=true`
                    }
                    alt=""
                    className="h-[120px] w-[120px] rounded-2xl border-4 border-white object-cover shadow-sm"
                  />
                </div>
                <div className="flex flex-col items-center pt-[72px] text-center">
                  <div className="flex h-[40px] items-center justify-center rounded-full bg-white px-6">
                    <h1 className="text-2xl font-semibold leading-none tracking-[-0.05em]">{preview.name}</h1>
                  </div>
                  <p className="mt-1 font-mono text-sm text-[#888]">@{preview.handle}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                    <Lock size={12} />
                    Private community
                  </span>
                  <p className="mt-4 max-w-xl text-[18px] text-[#888]">
                    {preview.description || 'No description yet.'}
                  </p>
                  <p className="mt-2 text-[15px] text-[#666]">
                    {formatCount(preview.memberCount)} {preview.memberCount === 1 ? 'member' : 'members'}
                  </p>
                  <div className="mx-auto mt-10 w-full max-w-md rounded-2xl border border-[#ececec] bg-[#fafafa] px-6 py-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#315efb]">
                      <Lock size={22} />
                    </div>
                <p className="text-[17px] font-semibold text-neutral-900">Members only</p>
                <p className="mt-2 text-sm leading-relaxed text-[#666]">
                  Join this community to see the feed, apps, and chat.
                </p>
                {preview.requiresJoinCode && (
                  <div className="mt-6 text-left">
                    <label htmlFor="community-join-code" className="mb-2 block text-sm font-medium text-neutral-700">
                      Join passphrase
                    </label>
                    <input
                      id="community-join-code"
                      type="password"
                      autoComplete="off"
                      value={joinCodeInput}
                      onChange={(e) => {
                        setJoinCodeInput(e.target.value);
                        setJoinError(null);
                      }}
                      placeholder="Enter passphrase"
                      className="w-full rounded-xl border border-[#e7e7e7] bg-white px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-[#315efb]/25"
                    />
                  </div>
                )}
                {joinError && (
                  <p className="mt-3 text-left text-sm text-red-600" role="alert">
                    {joinError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={joinLoading}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#315efb] px-6 font-medium text-white transition-colors hover:bg-[#2547c4] disabled:opacity-60"
                >
                  <Plus size={18} />
                  {joinLoading ? 'Joining…' : 'Join community'}
                </button>
                {!token && (
                  <p className="mt-3 text-xs text-[#888]">Sign in to join this community.</p>
                )}
                  </div>
                </div>
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
    leftNav === 'events';

  return (
    <div className="flex h-full min-h-full flex-col overflow-hidden">
      <div
        className={`mx-auto grid h-full min-h-full w-full max-w-[1600px] flex-1 grid-rows-[minmax(0,1fr)] gap-2 p-2 max-lg:gap-0 max-lg:p-0 ${
          isAppNavActive ? 'grid-cols-1 lg:grid-cols-[280px_1fr]' : 'grid-cols-1 lg:grid-cols-[280px_1fr_340px]'
        }`}
      >
        {/* LEFT SIDEBAR — desktop only */}
        <div className="relative z-20 hidden h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-[#e7e7e7] bg-white lg:flex">
          <div className="shrink-0 border-b border-[#ececec] p-2">
            <div className="flex items-center gap-3">
              <img 
                src={community.avatar || `https://ui-avatars.com/api/?name=${community.name}&background=000&color=fff&size=44&bold=true`}
                alt=""
                className="h-8 w-8 rounded-md object-cover"
              />
              <div>
                <h2 className="text-[14px] font-semibold leading-none">
                  {community.name}
                </h2>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-[10px] text-green-600">
                    {formatCount(community.memberCount)} members
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* NAVIGATION */}
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-1">
            <button 
              type="button"
              onClick={() => {
                setLeftNav('home');
                setMainTab('home');
              }}
              className={`w-full h-8 rounded flex items-center gap-2 px-3 font-medium transition-all ${
                leftNav === 'home' 
                  ? 'bg-[#eef2ff] text-[#315efb]' 
                  : 'hover:bg-[#f5f5f5] text-[#666]'
              }`}
            >
              <HouseHeart size={18} />
              Home
            </button>

            {sidebarAppInstances.map((inst) => {
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
                            : 'other';
              const rowActive =
                (appKind === 'chat' && leftNav === 'chat' && activeChatInstanceId === inst.id) ||
                (appKind === 'courses' && leftNav === 'courses' && activeCoursesInstanceId === inst.id) ||
                (appKind === 'content' && leftNav === 'content' && activeContentInstanceId === inst.id) ||
                (appKind === 'files' && leftNav === 'files' && activeFilesInstanceId === inst.id) ||
                (appKind === 'announcements' &&
                  leftNav === 'announcements' &&
                  activeAnnouncementsInstanceId === inst.id) ||
                (appKind === 'events' && leftNav === 'events' && activeEventsInstanceId === inst.id);
              const menuOpen = appInstanceMenuId === inst.id;
              const instVisible = inst.visibleToMembers;
              return (
                <div
                  key={inst.id}
                  className={`group/row relative flex w-full items-center rounded font-medium transition-all ${
                    rowActive ? 'bg-[#eef2ff] text-[#315efb]' : 'hover:bg-[#f5f5f5] text-[#666]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => activateAppInstance(inst)}
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
                    ) : (
                      <Megaphone size={18} />
                    )}
                    <span className="min-w-0 flex-1 truncate">{inst.title}</span>
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
                          title="Hidden from members"
                        >
                          <EyeOff size={14} aria-hidden />
                        </span>
                      )}
                      <button
                        type="button"
                        aria-label="App options"
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
                        <MoreVertical size={14} />
                      </button>
                      {menuOpen && (
                        <div
                          className="absolute right-0 top-full z-[500] mt-1 w-48 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200"
                          role="menu"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {appInstanceMenuPanel === 'main' ? (
                            <>
                              <Link
                                to={communitySettingsPath(community.handle)}
                                onClick={() => setAppInstanceMenuId(null)}
                                className="flex w-full items-center gap-2 rounded px-3 py-1 text-left text-[14px] text-neutral-900 transition-colors hover:bg-black/5"
                                role="menuitem"
                              >
                                <Pencil className="h-3 w-3 shrink-0" />
                                Admin settings
                              </Link>
                              <button
                                type="button"
                                onClick={() => setAppInstanceMenuPanel('visibility')}
                                className="flex w-full items-center gap-2 rounded px-3 py-1 text-left text-[14px] text-neutral-900 transition-colors hover:bg-black/5"
                                role="menuitem"
                              >
                                <Globe className="h-3 w-3 shrink-0" />
                                <span className="min-w-0 flex-1 truncate">Change visibility</span>
                                <ChevronRight className="h-3 w-3 shrink-0 text-neutral-400" />
                              </button>
                              <div className="my-1 h-px bg-neutral-100" />
                              <button
                                type="button"
                                onClick={() => void deleteAppInstance(inst.id)}
                                className="flex w-full items-center gap-2 rounded px-3 py-1 text-left text-[14px] text-red-600 transition-colors hover:bg-red-50"
                                role="menuitem"
                              >
                                <Trash2 className="h-3 w-3 shrink-0" />
                                Delete app
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
                                Back
                              </button>
                              <button
                                type="button"
                                className="flex w-full items-center justify-between gap-2 rounded px-3 py-1 text-left text-[14px] text-neutral-900 transition-colors hover:bg-black/5"
                                onClick={() => void patchInstanceVisibility(inst.id, true)}
                              >
                                <span className="flex items-center gap-2">
                                  <Globe className="h-3 w-3 shrink-0" aria-hidden />
                                  Show
                                </span>
                                {instVisible && <Check className="h-3 w-3 shrink-0" aria-hidden />}
                              </button>
                              <button
                                type="button"
                                className="flex w-full items-center justify-between gap-2 rounded px-3 py-1 text-left text-[14px] text-neutral-900 transition-colors hover:bg-black/5"
                                onClick={() => void patchInstanceVisibility(inst.id, false)}
                              >
                                <span className="flex items-center gap-2">
                                  <Lock className="h-3 w-3 shrink-0" aria-hidden />
                                  Hide
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

            {/* Add app - только для владельца */}
            {isOwner && handle && (
              <button
                type="button"
                onClick={() => navigate(communityStorePath(handle))}
                className="w-full h-8 rounded hover:bg-[#f5f5f5] flex items-center gap-2 px-3 text-[#666] font-medium transition-all"
              >
                <Plus size={18} />
                Add app
              </button>
            )}
          </div>
        </div>

        {/* CENTER — full width on mobile */}
        <div className="relative z-0 flex h-full min-h-0 min-w-0 flex-col overflow-hidden max-lg:min-h-0">
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
          ) : (
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          {/* HEADER */}
          <div className="overflow-hidden rounded-xl border border-[#e7e7e7] bg-white max-lg:rounded-none max-lg:border-x-0">
            {/* BANNER */}
            <div className="relative h-[180px] bg-gradient-to-r from-gray-800 to-gray-900 sm:h-[220px] lg:h-[250px]">
              {community.banner && (
                <img src={community.banner} alt="" className="h-full w-full object-cover" />
              )}
              <input
                ref={bannerFileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadCommunityBranding('banner', f);
                }}
              />
              {isOwner && (
                <button
                  type="button"
                  disabled={brandingFieldBusy === 'banner'}
                  onClick={() => bannerFileRef.current?.click()}
                  className="absolute top-5 right-5 flex h-11 items-center gap-2 rounded-2xl border border-white bg-white/90 px-5 font-medium backdrop-blur transition-all hover:bg-white disabled:opacity-60"
                >
                  <Camera size={18} />
                  {brandingFieldBusy === 'banner' ? 'Uploading…' : 'Change banner'}
                </button>
              )}
            </div>

            {/* COMMUNITY INFO — centered column */}
            <div className="relative px-4 pb-6 sm:px-7">
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
                <div className="px-6 absolute -top-4 left-1/2 z-10 flex h-[40px] -translate-x-1/2 items-center justify-center rounded-full bg-white">
                  <h1 className="text-2xl font-semibold leading-none tracking-[-0.05em]">{community.name}</h1>
                </div>

                <div className="flex flex-col pt-4">
                  <p className="mt-4 max-w-xl text-[18px] text-[#888]">{community.description || 'Set a description...'}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[15px] text-[#666]">
                    <span>{formatCount(community.memberCount)} members</span>
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
                          Public
                        </>
                      ) : (
                        <>
                          <Lock size={12} />
                          Private
                        </>
                      )}
                    </span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <span>Created by</span>
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
                      {joinLoading ? 'Loading...' : isMember ? 'Leave' : 'Join'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* TABS — full width, active bg + centered thick underline */}
            <div className="grid w-full grid-cols-4 border-t border-[#ececec]">
              {(['home', 'apps', 'products', 'about'] as const).map((tab) => (
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
                  <span className="pb-2 text-center text-[17px] font-medium capitalize">{tab}</span>
                  <span
                    className={`mb-0 h-1 w-[38%] max-w-[96px] rounded-full ${
                      mainTab === tab ? 'bg-[#315efb]' : 'bg-transparent'
                    }`}
                    aria-hidden
                  />
                </button>
              ))}
            </div>

            {/* TAB PANELS — same card */}
            <div className="border-t border-[#ececec] py-0">
              {mainTab === 'home' && (
                <div className="mx-auto max-w-2xl px-4 mt-4">
                  {canPost && (
                    <div className="my-6 border-b border-[#ececec] pb-6">
                      <div className="flex gap-4">
                        <img
                          src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.fullName || 'User'}&background=000&color=fff&size=48&bold=true`}
                          alt=""
                          className="h-12 w-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <textarea
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            placeholder="What's on your mind?"
                            className="min-h-[60px] w-full resize-none bg-transparent text-[18px] outline-none placeholder:text-[#999]"
                          />
                          <PostMediaUpload
                            urls={newPostMedia}
                            onUrlsChange={setNewPostMedia}
                            token={token}
                          />
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex gap-5 text-xl text-[#315efb]" />
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={handleCreatePost}
                                disabled={(!newPostContent.trim() && newPostMedia.length === 0) || isPosting}
                                className="h-11 rounded-2xl bg-[#315efb] px-6 font-medium text-white disabled:opacity-50"
                              >
                                {isPosting ? 'Posting...' : 'Post'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {memberButCannotPost && !ownerOnlyPostNoticeDismissed && (
                    <div className="my-6 flex items-start gap-3 rounded-xl border border-[#ececec] bg-[#fafafa] px-4 py-3 text-sm text-[#666]">
                      <p className="min-w-0 flex-1 leading-snug">
                        Only the community owner can publish posts in this feed.
                      </p>
                      <button
                        type="button"
                        onClick={dismissOwnerOnlyPostNotice}
                        className="shrink-0 rounded-md p-1 text-[#888] transition-colors hover:bg-black/5 hover:text-[#444]"
                        aria-label="Dismiss notice"
                      >
                        <X size={16} aria-hidden />
                      </button>
                    </div>
                  )}

                  <div className="space-y-0">
                  {posts.length > 0 ? (
                    posts.map((post, idx) => (
                      <div
                        key={post._id}
                        className={`border-t border-[#ececec] py-6 ${idx === 0 ? 'border-t-0 pt-0' : ''}`}
                      >
                        <div className="flex gap-4">
                          <Link to={`/@${post.author.username}`}>
                            <img
                              src={
                                post.author.avatar ||
                                `https://ui-avatars.com/api/?name=${post.author.fullName}&background=000&color=fff&size=48&bold=true`
                              }
                              alt=""
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          </Link>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link to={`/@${post.author.username}`} className="font-semibold hover:underline">
                                {post.author.fullName}
                              </Link>
                              <span className="text-gray-500">@{post.author.username}</span>
                              <span className="text-gray-400">·</span>
                              <span className="text-gray-400">{formatPostDate(post.createdAt)}</span>
                              {post.isPrivate ? (
                                <span className="ml-2 flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                  <Lock size={10} />
                                  Private
                                </span>
                              ) : (
                                <span className="ml-2 flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                                  <Globe size={10} />
                                  Public
                                </span>
                              )}
                            </div>
                            {post.content?.trim() ? (
                              <p className="mt-3 text-[15.5px] leading-relaxed text-gray-800">{post.content}</p>
                            ) : null}
                            {post.media && post.media.length > 0 && (
                              <PostMediaGallery
                                media={post.media}
                                meta={buildPostLightboxMeta(
                                  post,
                                  post.isPrivate || !community
                                    ? null
                                    : {
                                        name: community.name,
                                        handle: community.handle,
                                        avatar: community.avatar,
                                      }
                                )}
                              />
                            )}
                            <div className="mt-6 flex gap-8 text-gray-500">
                              <button
                                type="button"
                                onClick={() => handleLike(String(post._id))}
                                className={`flex items-center gap-2 transition-colors ${likedPosts.has(String(post._id)) ? 'text-red-500' : 'hover:text-red-500'}`}
                              >
                                <Heart size={20} fill={likedPosts.has(String(post._id)) ? 'currentColor' : 'none'} />
                                <span>{formatCount(post.likesCount)}</span>
                              </button>
                              <button type="button" className="flex items-center gap-2 transition-colors hover:text-blue-500">
                                <MessageCircle size={20} />
                                <span>{formatCount(post.commentsCount)}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRepost(String(post._id))}
                                className={`flex items-center gap-2 transition-colors ${repostedPosts.has(String(post._id)) ? 'text-green-500' : 'hover:text-green-500'}`}
                              >
                                <Repeat2 size={20} fill={repostedPosts.has(String(post._id)) ? 'currentColor' : 'none'} />
                                <span>{formatCount(post.repostsCount)}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex min-h-[200px] items-center justify-center text-[17px] text-[#999]">
                      {canViewFeed
                        ? 'Community feed is empty'
                        : community.isPublic === false
                          ? 'Join to see posts'
                          : 'Join to see posts'}
                    </div>
                  )}
                  </div>
                </div>
              )}

              {mainTab === 'apps' && handle && (
                <div className="mx-auto max-w-2xl px-4">
                  <div className="flex items-center justify-between border-b border-[#ececec] py-4">
                    <h2 className="text-xl font-bold text-neutral-900">Apps</h2>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => navigate(communityStorePath(handle))}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef2ff] text-[#315efb] transition-colors hover:bg-[#dfe7ff]"
                        title="Add app"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 py-6">
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
                        ) : (
                          <Megaphone size={26} />
                        );
                      const kindLabel =
                        inst.appId === COMMUNITY_APP_IDS.CHAT
                          ? 'Chat'
                          : inst.appId === COMMUNITY_APP_IDS.COURSES
                            ? 'Courses'
                            : inst.appId === COMMUNITY_APP_IDS.CONTENT
                              ? 'Content'
                              : inst.appId === COMMUNITY_APP_IDS.FILES
                                ? 'Files'
                                : inst.appId === COMMUNITY_APP_IDS.EVENTS
                                  ? 'Events'
                                  : 'Announcements';
                      return (
                        <button
                          key={inst.id}
                          type="button"
                          onClick={() => activateAppInstance(inst)}
                          className="flex flex-col items-center gap-3 rounded-2xl border border-[#e5e5e5] bg-white p-5 text-center transition-colors hover:border-[#cfcfcf] hover:bg-neutral-50"
                        >
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#f3f3f3] text-neutral-800">
                            {IconEl}
                          </div>
                          <p className="line-clamp-2 text-sm font-semibold leading-tight text-neutral-900">{inst.title}</p>
                          <p className="text-xs text-neutral-500">{kindLabel}</p>
                        </button>
                      );
                    })}
                  </div>
                  {sidebarAppInstances.length === 0 && (
                    <p className="pb-10 text-center text-[17px] text-[#999]">No apps installed yet.</p>
                  )}
                </div>
              )}

              {mainTab === 'products' && handle && (
                <div className="mx-auto max-w-2xl px-4">
                  <div className="flex items-center justify-between border-b border-[#ececec] py-4">
                    <h2 className="text-xl font-bold text-neutral-900">Products</h2>
                    <div className="flex items-center gap-2">
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => navigate(communityStorePath(handle))}
                          className="mr-1 flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef2ff] text-[#315efb] transition-colors hover:bg-[#dfe7ff]"
                          title="Add from store"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setProductsView('list')}
                        className={`rounded-lg p-2 transition-colors ${
                          productsView === 'list' ? 'bg-[#eef2ff] text-[#315efb]' : 'text-neutral-500 hover:bg-neutral-100'
                        }`}
                        title="List view"
                      >
                        <LayoutList className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductsView('grid')}
                        className={`rounded-lg p-2 transition-colors ${
                          productsView === 'grid' ? 'bg-[#eef2ff] text-[#315efb]' : 'text-neutral-500 hover:bg-neutral-100'
                        }`}
                        title="Grid view"
                      >
                        <LayoutGrid className="h-5 w-5" />
                      </button>
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
                              ? `$${community.price} · ${community.name}`
                              : `${community.name} · apps bundle`}
                          </p>
                          <p className="mt-0.5 text-xs text-neutral-500">
                            <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-600">
                              {sidebarAppInstances.length} apps
                            </span>
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1 text-neutral-400">
                          <MoreHorizontal className="h-5 w-5" />
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
                            <div className="px-4 py-10 text-center text-[15px] text-neutral-500">No products in this bundle yet.</div>
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
                                          : Megaphone;
                              let primary = inst.title;
                              let secondary = inst.title;
                              if (inst.appId === COMMUNITY_APP_IDS.CHAT) {
                                primary = inst.title || 'Chat';
                                secondary = 'Chat';
                              } else if (inst.appId === COMMUNITY_APP_IDS.CONTENT) {
                                primary = inst.title || 'Content Rewards';
                                secondary = 'Content Rewards';
                              } else if (inst.appId === COMMUNITY_APP_IDS.ANNOUNCEMENTS) {
                                primary = inst.title || 'Announcements';
                                secondary = 'Forums';
                              } else if (inst.appId === COMMUNITY_APP_IDS.COURSES) {
                                primary = inst.title || 'Courses';
                                secondary = 'Courses';
                              } else if (inst.appId === COMMUNITY_APP_IDS.FILES) {
                                primary = inst.title || 'Files';
                                secondary = 'Files';
                              } else if (inst.appId === COMMUNITY_APP_IDS.EVENTS) {
                                primary = inst.title || 'Events';
                                secondary = 'Events';
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
                      <span>You already have access to everything that you can purchase.</span>
                    </div>
                  </div>
                </div>
              )}

              {mainTab === 'about' && community.owner && (
                <div className="mx-auto max-w-2xl space-y-0 px-4">
                  <div className="border-b border-[#ececec] pb-8">
                    {/* <h2 className="text-lg font-semibold text-neutral-800">Team</h2> */}
                    <div className="mt-5 space-y-6">
                      <div>
                        <p className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-[#999]">Owner</p>
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
                          <span className="rounded-full bg-[#f5f5f5] px-3 py-1 text-sm font-medium text-neutral-700">Owner</span>
                        </Link>
                      </div>
                      <div>
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#999]">Admins</p>
                          {isOwner && (
                            <button
                              type="button"
                              onClick={() => setAddAdminModalOpen(true)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e5e5] bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 transition-colors hover:border-[#cfcfcf] hover:bg-neutral-50"
                            >
                              <UserPlus className="h-3.5 w-3.5" aria-hidden />
                              Add admin
                            </button>
                          )}
                        </div>
                        {(community.admins?.length ?? 0) === 0 ? (
                          <p className="rounded-2xl border border-dashed border-[#e5e5e5] bg-neutral-50/50 px-4 py-6 text-center text-sm text-[#888]">
                            No additional admins yet.
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
                                    Admin
                                  </span>
                                  {isOwner && (
                                    <button
                                      type="button"
                                      disabled={adminActionBusy === admin._id}
                                      onClick={() => void handleRemoveAdmin(admin._id)}
                                      className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                      aria-label={`Remove ${admin.username} as admin`}
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
                      <span className="text-sm font-medium">0 (0 Reviews)</span>
                    </div>
                    <div className="flex flex-col items-center justify-center py-12 text-center text-[#999]">
                      <Star className="mb-3 h-16 w-16 text-neutral-200" strokeWidth={1.1} />
                      <p className="text-[17px]">No reviews yet</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
          )}
        </div>

        {!isAppNavActive && (
          /* RIGHT SIDEBAR — desktop only */
          <div className="hidden h-full min-h-0 space-y-4 overflow-y-auto lg:block">
            {/* SEARCH */}
            <div className="bg-white border border-[#e7e7e7] rounded-[24px] p-2">
              <div className="space-y-4">
                <button className="w-full h-10 rounded-2xl bg-[#f5f5f5] hover:bg-[#ececec] transition-all font-medium flex items-center justify-center gap-2">
                  <Copy size={16} />
                  Copy link
                </button>
                {canOpenDashboard && (
                  <button
                    type="button"
                    onClick={() => navigate(communityDashboardPath(community.handle))}
                    className="flex w-full px-2 items-center gap-3 text-[16px] text-[#444] transition-all hover:text-black"
                  >
                    <LayoutDashboard size={18} />
                    Dashboard
                  </button>
                )}
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => navigate(communitySettingsPath(community.handle))}
                    className="flex w-full px-2 pb-2 items-center gap-3 text-[16px] text-[#444] transition-all hover:text-black"
                  >
                    <Bolt size={18} />
                    Settings
                  </button>
                )}
              </div>
            </div>

            {/* PEOPLE */}
            <div className="bg-white border border-[#e7e7e7] rounded-xl overflow-hidden">
              <div className="p-2 border-b border-[#ececec] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-md pl-2 font-semibold">People</h3>
                  <span className="text-[#888]">{formatCount(community.memberCount)}</span>
                </div>
                <button className="text-[#315efb] pr-2 font-medium">See all</button>
              </div>

              <div className="p-2">
                <p className="text-sm tracking-[0.08em] text-[#999] uppercase mb-2 px-2">Creator</p>
                
                <div className="flex items-center justify-between">
                  <Link to={`/@${community.owner?.username}`} className="flex items-center gap-3 flex-1">
                    <img 
                      src={community.owner?.avatar || `https://ui-avatars.com/api/?name=${community.owner?.fullName}&background=5d6472&color=fff&size=48&bold=true`}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium">{community.owner?.fullName || community.owner?.username}</p>
                      <p className="text-sm text-[#777]">@{community.owner?.username}</p>
                    </div>
                  </Link>
                  <div className="px-3 h-8 rounded-full bg-[#f5f5f5] flex items-center text-sm font-medium">
                    owner
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
    </div>
  );
};

export default CommunityPage;
