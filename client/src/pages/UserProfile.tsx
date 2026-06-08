// pages/UserProfile.tsx
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import EditTextModal from '../components/Common/EditTextModal';
import {
  Calendar,
  MapPin,
  Link as LinkIcon,
  MessageCircle,
  Repeat2,
  Heart,
  MoreHorizontal,
  Search,
  Pen,
  Trash,
  Unlink2,
  Zap,
  Sparkles,
  Globe,
  Lock,
} from 'lucide-react';
import ProfileBgEmojiDecor from '../components/Profile/ProfileBgEmojiDecor';
import {
  PROFILE_HEADER_BG_DISABLED,
  getProfileStatusIconUrl,
  normalizeProfileStatusIcon,
} from '../constants/profileCustomization';
import ProfilePremiumStyleModal, {
  type ProfileCustomizationDraft,
} from '../components/Profile/ProfilePremiumStyleModal';
import ProfileUserActionsMenu, {
  type ProfileUserActionId,
} from '../components/Profile/ProfileUserActionsMenu';
import ProfileFollowersSheet from '../components/Profile/ProfileFollowersSheet';
import { profilePath } from '../constants/paths';
import { hasProSubscription } from '../utils/userPlan';
import MobileBottomSheet from '../components/Common/MobileBottomSheet';
import FloatingMenu from '../components/Common/FloatingMenu';
import PostDetailPanel from '../components/Posts/PostDetailPanel';
import { PostCommentsSection } from '../components/Posts/PostCommentsSection';
import { usePostDetail } from '../hooks/usePostDetail';
import type { FeedPost } from '../types/postFeed';
import PostMediaGallery from '../components/Posts/PostMediaGallery';
import PostComposer from '../components/Posts/PostComposer';
import PostContentBody from '../components/Posts/PostContentBody';
import type { PostCoinAttachment } from '../types/postCoin';
import type { PostLinkAttachment } from '../types/postLink';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { buildPostLightboxMeta } from '../utils/buildPostLightboxMeta';
import { getPostDisplayMeta } from '../utils/postDisplay';
import { tryAwardActivity } from '../utils/awardActivity';

import { USERS_API as API_URL, POSTS_API as POSTS_API_URL, MESSAGES_API } from '../config/api';
import { useTranslation } from '../i18n/useTranslation';

type Post = FeedPost;

interface UserProfile {
  _id: string;
  username: string;
  fullName: string;
  bio: string;
  avatar: string;
  banner: string;
  location: string;
  website: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: string;
  isFollowing: boolean;
  profileStatusIcon?: string;
  profileNameColor?: string;
  profileBgEmoji?: string;
}

interface FollowerUser {
  _id: string;
  username: string;
  fullName: string;
  avatar: string;
  bio: string;
  followersCount: number;
}

const UserProfileComponent: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);
  const profileScrollRef = useRef<HTMLDivElement>(null);
  const profileHeaderEndRef = useRef<HTMLDivElement>(null);
  const [compactProfileBar, setCompactProfileBar] = useState(false);
  const isLgUp = useMediaQuery('(min-width: 1024px)');

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [followers, setFollowers] = useState<FollowerUser[]>([]);
  const [following, setFollowing] = useState<FollowerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'reposts' | 'replies' | 'media'>('posts');
  const [reposts, setReposts] = useState<FeedPost[]>([]);
  const [repostsLoading, setRepostsLoading] = useState(false);
  const [searchFollower, setSearchFollower] = useState('');
  const [connectionsTab, setConnectionsTab] = useState<'followers' | 'following'>('followers');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<{ rect: DOMRect } | null>(null);
  const [followersSheetOpen, setFollowersSheetOpen] = useState(false);
  const [followingSheetOpen, setFollowingSheetOpen] = useState(false);
  const [messagingLoading, setMessagingLoading] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [styleSaving, setStyleSaving] = useState(false);
  const [hasProPlan, setHasProPlan] = useState(hasProSubscription);

  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState<string[]>([]);
  const [newPostLink, setNewPostLink] = useState<PostLinkAttachment | null>(null);
  const [newPostCoin, setNewPostCoin] = useState<PostCoinAttachment | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [showPostCreator, setShowPostCreator] = useState(false);
  const mobileComposerFull = showPostCreator && !isLgUp && activeTab === 'posts';

  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [repostedPosts, setRepostedPosts] = useState<Set<string>>(new Set());
  const [menuOpenPostId, setMenuOpenPostId] = useState<string | null>(null);
  const [editPostTarget, setEditPostTarget] = useState<{ postId: string; content: string } | null>(null);
  const [editPostSaving, setEditPostSaving] = useState(false);

  const postDetail = usePostDetail(posts, reposts, setPosts, setReposts);
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
    setExpandedCommentsPostId,
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

  // Проверка владельца поста
  const isPostOwner = (post: Post) => {
    if (!user) return false;
    
    // Проверяем все возможные варианты
    if (user.username === post.author.username) return true;
    if (user.id && post.author._id && user.id === post.author._id) return true;
    if ((user as any)._id && post.author._id && (user as any)._id === post.author._id) return true;
    
    // Дополнительно: если это свой профиль и автор поста совпадает с профилем
    if (profile && user.username === profile.username && post.author.username === profile.username) return true;
    
    return false;
  };

  // Закрытие меню при клике вне
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
    const root = profileScrollRef.current;
    const target = profileHeaderEndRef.current;
    if (!root || !target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setCompactProfileBar(!entry.isIntersecting),
      { root, threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [profile?.username]);

  useEffect(() => {
    const syncPlan = () => setHasProPlan(hasProSubscription());
    window.addEventListener('planTierChanged', syncPlan);
    window.addEventListener('storage', syncPlan);
    return () => {
      window.removeEventListener('planTierChanged', syncPlan);
      window.removeEventListener('storage', syncPlan);
    };
  }, []);

  const handleLike = async (postId: string) => {
    if (!token) {
      window.dispatchEvent(new CustomEvent('openLogin'));
      return;
    }
    try {
      const res = await fetch(`${POSTS_API_URL}/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          data.liked ? newSet.add(postId) : newSet.delete(postId);
          return newSet;
        });
        patchPostInLists(postId, { likesCount: data.likesCount, isLiked: data.liked });
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
    try {
      const res = await fetch(`${POSTS_API_URL}/${postId}/repost`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRepostedPosts(prev => {
          const newSet = new Set(prev);
          data.reposted ? newSet.add(postId) : newSet.delete(postId);
          return newSet;
        });
        patchPostInLists(postId, { repostsCount: data.repostsCount, isReposted: data.reposted });
        if (profileSlug) {
          if (data.reposted) {
            fetchReposts(profileSlug);
          } else {
            setReposts((prev) => prev.filter((p) => String(p._id) !== postId));
          }
        }
      }
    } catch (err) {
      console.error('Repost error:', err);
    }
  };

  const copyPostLink = (postId: string) => {
    const link = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(link).then(() => {
      showToast(t('common.linkCopied'));
    }).catch(() => {
      showToast(t('common.copyLinkFailed'), 'error');
    });
  };

  const handleDeletePost = async (postId: string) => {
    setMenuOpenPostId(null);
    if (!token) return;
    const confirmed = await confirm({
      title: t('common.deletePostTitle'),
      message: t('userProfile.deletePostMessageProfile'),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`${POSTS_API_URL}/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || t('common.failedToDeletePost'));
      }

      setPosts((prev) => prev.filter((p) => String(p._id) !== postId));
      setReposts((prev) => prev.filter((p) => String(p._id) !== postId));
      onPostDeleted(postId);
      
      // Обновляем счетчик
      setProfile(prev => prev ? {
        ...prev,
        postsCount: Math.max(0, (prev.postsCount || 1) - 1)
      } : null);
      
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
        const data = await res.json();
        throw new Error(data.message || t('common.failedToUpdatePost'));
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

  const fetchProfile = useCallback(async (cleanUsername: string) => {
    if (!cleanUsername || cleanUsername === 'undefined') {
      setLoading(false);
      setError(t('userProfile.invalidUsername'));
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`${API_URL}/${cleanUsername}`, { headers });
      if (!res.ok) {
        setError(res.status === 404 ? t('userProfile.userNotFound') : t('userProfile.failedLoadProfile'));
        setLoading(false);
        return;
      }
      const data = await res.json();
      
      setProfile(data);
      setPosts(data.posts || []);
      setIsFollowing(data.isFollowing === true);
      
      // Загружаем начальное состояние лайков и репостов
      const likedIds = new Set<string>();
      const repostedIds = new Set<string>();
      
      (data.posts || []).forEach((post: any) => {
        if (post.isLiked) likedIds.add(post._id);
        if (post.isReposted) repostedIds.add(post._id);
      });
      
      setLikedPosts(likedIds);
      setRepostedPosts(repostedIds);
      
    } catch (err) {
      console.error('Fetch profile error:', err);
      setError(t('userProfile.failedLoadProfile'));
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  const fetchFollowers = useCallback(async (cleanUsername: string) => {
    if (!cleanUsername || cleanUsername === 'undefined') return;
    try {
      const res = await fetch(`${API_URL}/${cleanUsername}/followers`);
      if (res.ok) {
        const data = await res.json();
        setFollowers(data.followers || []);
      }
    } catch (err) {
      console.error('Fetch followers error:', err);
    }
  }, []);

  const fetchFollowing = useCallback(async (cleanUsername: string) => {
    if (!cleanUsername || cleanUsername === 'undefined') return;
    try {
      const res = await fetch(`${API_URL}/${cleanUsername}/following`);
      if (res.ok) {
        const data = await res.json();
        setFollowing(data.following || []);
      }
    } catch (err) {
      console.error('Fetch following error:', err);
    }
  }, []);

  const syncLikeRepostSets = useCallback((postList: Post[]) => {
    const likedIds = new Set<string>();
    const repostedIds = new Set<string>();
    postList.forEach((post) => {
      const pid = String(post._id);
      if (post.isLiked) likedIds.add(pid);
      if (post.isReposted) repostedIds.add(pid);
    });
    setLikedPosts((prev) => {
      const merged = new Set(prev);
      likedIds.forEach((id) => merged.add(id));
      return merged;
    });
    setRepostedPosts((prev) => {
      const merged = new Set(prev);
      repostedIds.forEach((id) => merged.add(id));
      return merged;
    });
  }, []);

  const fetchReposts = useCallback(async (cleanUsername: string) => {
    if (!cleanUsername || cleanUsername === 'undefined') return;
    try {
      setRepostsLoading(true);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/${cleanUsername}/reposts`, { headers });
      if (!res.ok) {
        setReposts([]);
        return;
      }
      const data = await res.json();
      const list: Post[] = data.posts || [];
      setReposts(list);
      syncLikeRepostSets(list);
    } catch (err) {
      console.error('Fetch reposts error:', err);
      setReposts([]);
    } finally {
      setRepostsLoading(false);
    }
  }, [token, syncLikeRepostSets]);

  const profileSlug = useMemo(() => {
    if (!username) return '';
    try {
      return decodeURIComponent(username).replace(/^@/, '').trim();
    } catch {
      return username.replace(/^@/, '').trim();
    }
  }, [username]);

  useEffect(() => {
    setSelectedPost(null);
    setExpandedCommentsPostId(null);
  }, [profileSlug, setSelectedPost]);

  useEffect(() => {
    if (profileSlug && profileSlug !== 'undefined') {
      fetchProfile(profileSlug);
      fetchFollowers(profileSlug);
      fetchFollowing(profileSlug);
      fetchReposts(profileSlug);
    } else {
      setLoading(false);
      setError(t('userProfile.invalidUsername'));
    }
  }, [profileSlug, fetchProfile, fetchFollowers, fetchFollowing, fetchReposts]);

  useEffect(() => {
    if (activeTab === 'reposts' && profileSlug) {
      fetchReposts(profileSlug);
    }
  }, [activeTab, profileSlug, fetchReposts]);

  const closeComposer = useCallback(() => {
    setShowPostCreator(false);
    setNewPostContent('');
    setNewPostMedia([]);
    setNewPostLink(null);
    setNewPostCoin(null);
  }, []);

  const handleCreatePost = async () => {
    const hasLink = Boolean(newPostLink?.title?.trim() && newPostLink?.url?.trim());
    const hasCoin = Boolean(
      newPostCoin?.coinId?.trim() && newPostCoin?.name?.trim() && newPostCoin?.symbol?.trim()
    );
    if ((!newPostContent.trim() && newPostMedia.length === 0 && !hasLink && !hasCoin) || !token || isPosting) return;
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
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || t('common.failedToCreatePost'));
      }
      const newPost = await res.json();
      
      console.log('New post created:', newPost); // Проверь что author заполнен
      
      setPosts(prev => [newPost, ...prev]);
      setProfile(prev => prev ? { ...prev, postsCount: (prev.postsCount || 0) + 1 } : null);
      setNewPostContent('');
      setNewPostMedia([]);
      setNewPostLink(null);
      setNewPostCoin(null);
      closeComposer();
      showToast(t('common.postPublished'));
      tryAwardActivity('post');
    } catch (err: unknown) {
      console.error('Create post error:', err);
      showToast(err instanceof Error ? err.message : t('common.failedToCreatePost'), 'error');
    } finally {
      setIsPosting(false);
    }
  };

  const handleFollow = async () => {
    if (!token) { window.dispatchEvent(new CustomEvent('openLogin')); return; }
    if (!profile) return;
    try {
      setFollowLoading(true);
      const action = isFollowing ? 'unfollow' : 'follow';
      const res = await fetch(`${API_URL}/${profile.username}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.message?.includes('Already following')) {
          setIsFollowing(true);
          if (data.followersCount !== undefined) setProfile(prev => prev ? { ...prev, followersCount: data.followersCount } : null);
          return;
        }
        if (data.message?.includes('Not following')) {
          setIsFollowing(false);
          if (data.followersCount !== undefined) setProfile(prev => prev ? { ...prev, followersCount: data.followersCount } : null);
          return;
        }
        throw new Error(data.message || 'Failed');
      }
      const newIsFollowing = action === 'follow';
      setIsFollowing(newIsFollowing);
      if (data.followersCount !== undefined) {
        setProfile(prev => prev ? { ...prev, followersCount: data.followersCount, isFollowing: newIsFollowing } : null);
      }
      if (profileSlug) fetchFollowers(profileSlug);
    } catch (err: any) {
      console.error('Follow error:', err);
      if (profileSlug) fetchProfile(profileSlug);
    } finally {
      setFollowLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', { month: 'long', year: 'numeric' });
  };

  const formatPostDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const loc = locale === 'ru' ? 'ru-RU' : 'en-US';
    if (minutes < 1) return t('home.timeNow');
    if (minutes < 60) return t('home.timeMinutes', { count: minutes });
    if (hours < 24) return t('home.timeHours', { count: hours });
    if (days < 7) return t('home.timeDays', { count: days });
    return date.toLocaleDateString(loc, { month: 'short', day: 'numeric' });
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const activeTabTitle = useMemo(() => {
    const keys = {
      posts: 'userProfile.posts',
      reposts: 'userProfile.reposts',
      replies: 'userProfile.replies',
      media: 'userProfile.media',
    } as const;
    return t(keys[activeTab]);
  }, [activeTab, t]);

  const filteredFollowers = followers.filter(f => 
    f.fullName?.toLowerCase().includes(searchFollower.toLowerCase()) ||
    f.username?.toLowerCase().includes(searchFollower.toLowerCase())
  );

  const filteredFollowing = following.filter(
    (f) =>
      f.fullName?.toLowerCase().includes(searchFollower.toLowerCase()) ||
      f.username?.toLowerCase().includes(searchFollower.toLowerCase())
  );

  const activeConnectionUsers =
    connectionsTab === 'followers' ? filteredFollowers : filteredFollowing;
  const connectionSearchPlaceholder =
    connectionsTab === 'followers'
      ? t('userProfile.searchFollowersPlaceholder')
      : t('userProfile.searchFollowingPlaceholder');
  const connectionEmptySearch =
    connectionsTab === 'followers'
      ? t('userProfile.noFollowersFound')
      : t('userProfile.noFollowingFound');
  const connectionEmptyList =
    connectionsTab === 'followers'
      ? t('userProfile.noFollowersYet')
      : t('userProfile.notFollowingAnyone');

  const renderConnectionUser = (person: FollowerUser) => (
    <Link
      key={person._id || person.username}
      to={`/@${person.username}`}
      className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-neutral-50"
    >
      <img
        src={
          person.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(person.fullName || person.username)}&background=000&color=fff&size=40&bold=true`
        }
        alt={person.fullName || person.username}
        className="h-10 w-10 shrink-0 rounded-full"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold group-hover:underline">
          {person.fullName || person.username}
        </p>
        <p className="truncate text-sm text-neutral-500">@{person.username}</p>
      </div>
    </Link>
  );

  const openProfileMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    setProfileMenuAnchor({ rect: e.currentTarget.getBoundingClientRect() });
    setProfileMenuOpen(true);
  };

  const openMessengerWithUser = useCallback(
    async (targetUsername: string) => {
      if (!token) {
        showToast(t('userProfile.menu.signInToMessage'), 'info');
        window.dispatchEvent(new CustomEvent('openLogin'));
        return;
      }
      if (messagingLoading) return;
      setMessagingLoading(true);
      try {
        const res = await fetch(`${MESSAGES_API}/dm/${encodeURIComponent(targetUsername)}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showToast(
            (data as { message?: string }).message || t('userProfile.menu.openChatFailed'),
            'error'
          );
          return;
        }
        const conversationId = (data as { conversationId?: string }).conversationId;
        if (!conversationId) {
          showToast(t('userProfile.menu.openChatFailed'), 'error');
          return;
        }
        navigate(`/messenger?chat=${encodeURIComponent(conversationId)}`);
      } catch {
        showToast(t('userProfile.menu.openChatFailed'), 'error');
      } finally {
        setMessagingLoading(false);
      }
    },
    [token, navigate, showToast, t]
  );

  const copyProfileLink = useCallback(async () => {
    if (!profile) return;
    const url = `${window.location.origin}${profilePath(profile.username)}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast(t('userProfile.menu.linkCopied'));
    } catch {
      showToast(t('userProfile.menu.linkCopied'), 'info');
    }
  }, [profile, showToast, t]);

  const handleProfileMenuAction = useCallback(
    (action: ProfileUserActionId) => {
      if (!profile) return;
      if (action === 'message') {
        void openMessengerWithUser(profile.username);
        return;
      }
      if (action === 'copyLink') {
        void copyProfileLink();
        return;
      }
      if (action === 'report') {
        showToast(t('userProfile.menu.reportSent'), 'info');
        return;
      }
      if (action === 'block') {
        showToast(t('userProfile.menu.blocked'), 'info');
      }
    },
    [profile, openMessengerWithUser, copyProfileLink, showToast, t]
  );

  const renderPostCard = (post: Post, options?: { showRepostBanner?: boolean }) => {
    const postId = String(post._id);
    const showRepostBanner = options?.showRepostBanner ?? false;
    const { displayAsCommunity, displayName, displayUsername, displayAvatar, profileLink, communityMeta } =
      getPostDisplayMeta(post);

    return (
      <article
        key={postId}
        onClick={() => setSelectedPost(post)}
        className={`max-w-full overflow-x-hidden p-4 hover:bg-neutral-50 transition-colors border-b border-neutral-200 group/article cursor-pointer ${
          selectedPost?._id === post._id ? 'bg-neutral-50' : ''
        }`}
      >
        {showRepostBanner && profile && (
          <div className="flex items-center gap-2 mb-2 text-sm text-neutral-500">
            <Repeat2 size={14} className="text-green-600 shrink-0" />
            <Link to={`/@${profile.username}`} className="font-medium hover:underline text-neutral-700">
              {profile.fullName} {t('userProfile.reposted')}
            </Link>
          </div>
        )}
        <div className="flex space-x-3">
          <Link to={profileLink} onClick={(e) => e.stopPropagation()}>
            <img
              src={displayAvatar}
              alt={displayName}
              className="h-6 w-6 rounded-full object-cover transition-opacity hover:opacity-90"
            />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              <Link to={profileLink} className="font-bold hover:underline truncate" onClick={(e) => e.stopPropagation()}>
                {displayName}
              </Link>
              <span className="text-neutral-500 truncate">{displayUsername}</span>
              <span className="text-neutral-500">·</span>
              <span className="text-neutral-500 whitespace-nowrap">{formatPostDate(post.createdAt)}</span>
              {post.isPrivate && (
                <span className="ml-2 flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  <Lock size={10} />
                  {t('home.private')}
                </span>
              )}
              {!displayAsCommunity && communityMeta && (
                <span className="ml-2 flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                  <Globe size={10} />
                  {t('common.via')} {communityMeta.name}
                </span>
              )}

              <div className="ml-auto relative" ref={menuOpenPostId === postId ? menuRef : null}>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpenPostId(menuOpenPostId === postId ? null : postId); }}
                  className={`p-1 rounded-full transition-all ${menuOpenPostId === postId ? 'bg-black/10 text-black opacity-100' : 'text-neutral-500 opacity-0 group-hover/article:opacity-100 hover:bg-black/5'}`}
                >
                  <MoreHorizontal size={16} />
                </button>
                {menuOpenPostId === postId && (
                  <div
                    className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-neutral-200 p-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        copyPostLink(postId);
                        setMenuOpenPostId(null);
                      }}
                      className="w-full text-left py-1 px-3 text-[14px] rounded hover:bg-black/5 transition-colors flex items-center gap-2"
                    >
                      <Unlink2 className="h-3 w-3" />
                      {t('home.copyLink')}
                    </button>
                    {isPostOwner(post) && (
                      <>
                        <button
                          onClick={() => openEditPost(postId, post.content)}
                          className="w-full text-left py-1 px-3 text-[14px] rounded hover:bg-black/5 transition-colors flex items-center gap-2"
                        >
                          <Pen className="h-3 w-3" />
                          {t('common.edit')}
                        </button>
                        <div className="h-px bg-neutral-100 my-1" />
                        <button
                          onClick={() => handleDeletePost(postId)}
                          className="w-full text-left px-3 py-1 text-[14px] rounded hover:bg-red-50 transition-colors flex items-center gap-2 text-red-600"
                        >
                          <Trash className="h-3 w-3" />
                          {t('common.delete')}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-1">
              <PostContentBody
                content={post.content}
                linkAttachment={post.linkAttachment}
                coinAttachment={post.coinAttachment}
                contentClassName="text-neutral-900 leading-relaxed whitespace-pre-wrap break-words text-[15px]"
              />
            </div>
            {post.media && post.media.length > 0 && (
              <PostMediaGallery media={post.media} meta={buildPostLightboxMeta(post)} />
            )}
            <div className="flex items-center gap-1 mt-1 max-w-md">
              <button
                onClick={(e) => { e.stopPropagation(); handleLike(postId); }}
                className={`flex items-center transition-colors group ${likedPosts.has(postId) ? 'text-red-500' : 'text-neutral-500 hover:text-red-500'}`}
              >
                <div className="p-2 rounded-full group-hover:bg-red-50 transition-colors">
                  <Heart size={16} fill={likedPosts.has(postId) ? 'currentColor' : 'none'} />
                </div>
                <span className="text-xs">{formatCount(post.likesCount || 0)}</span>
              </button>
              <button
                onClick={(e) => toggleFeedComments(postId, e)}
                className={`flex items-center transition-colors group ${
                  expandedCommentsPostId === postId ? 'text-black' : 'text-neutral-500 hover:text-black'
                }`}
              >
                <div className="p-2 rounded-full group-hover:bg-black/5 transition-colors">
                  <MessageCircle size={16} />
                </div>
                <span className="text-xs">{formatCount(post.commentsCount || 0)}</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleRepost(postId); }}
                className={`flex items-center transition-colors group ${
                  repostedPosts.has(postId) ? 'text-black' : 'text-neutral-500 hover:text-black'
                }`}
              >
                <div className="p-2 rounded-full group-hover:bg-black/5 transition-colors">
                  <Repeat2 size={16} fill={repostedPosts.has(postId) ? 'currentColor' : 'none'} />
                </div>
                <span className="text-xs">{formatCount(post.repostsCount || 0)}</span>
              </button>
            </div>

            {expandedCommentsPostId === postId && (
              <PostCommentsSection
                post={post}
                variant="feed"
                text={inlineCommentText}
                onTextChange={setInlineCommentText}
                onSubmit={() => void handleSubmitComment(postId, 'inline')}
                token={token}
                commentSubmitting={commentSubmitting}
                commentsLoading={commentsLoadingPostId === postId}
                isCommentOwner={isCommentOwner}
                openCommentMenu={openCommentMenu}
                onCommentMenuToggle={(c, pid, rect, isOpen) => {
                  setOpenCommentMenu(
                    isOpen ? null : { commentId: c._id, postId: pid, content: c.content, rect },
                  );
                }}
              />
            )}
          </div>
        </div>
      </article>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-300 border-t-black"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <p className="text-xl text-neutral-500 mb-4">{error || t('userProfile.profileNotFound')}</p>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-black text-white rounded-full hover:bg-neutral-800 transition-colors">{t('userProfile.backToHome')}</button>
      </div>
    );
  }

  const isOwnProfile = user?.username === profile.username;

  const displayName = (() => {
    const fromProfile = (profile.fullName || '').trim();
    if (fromProfile) return fromProfile;
    if (isOwnProfile && (user?.fullName || '').trim()) return (user!.fullName || '').trim();
    return profile.username;
  })();

  const nameColor =
    profile.profileNameColor && profile.profileNameColor.length > 0
      ? profile.profileNameColor
      : undefined;

  const statusIconId = normalizeProfileStatusIcon(profile.profileStatusIcon);
  const statusIconUrl = getProfileStatusIconUrl(statusIconId);

  const customizationDraft: ProfileCustomizationDraft = {
    profileStatusIcon: statusIconId,
    profileNameColor: profile.profileNameColor || '',
    profileBgEmoji: profile.profileBgEmoji || '',
  };

  const saveProfileCustomization = async (draft: ProfileCustomizationDraft) => {
    if (!token || !hasProPlan) return;
    setStyleSaving(true);
    try {
      const res = await fetch(`${API_URL}/me/profile-customization`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...draft, ...PROFILE_HEADER_BG_DISABLED }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || t('userProfile.premiumModal.saveFailed'));
      }
      const data = await res.json();
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              profileStatusIcon: data.profileStatusIcon || '',
              profileNameColor: data.profileNameColor || '',
              profileBgEmoji: data.profileBgEmoji || '',
              profileBgMode: data.profileBgMode || 'none',
              profileBgColor: data.profileBgColor || '',
              profileBgColor2: data.profileBgColor2 || '',
            }
          : null
      );
      setPremiumModalOpen(false);
      showToast(t('userProfile.premiumModal.saved'));
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : t('userProfile.premiumModal.saveFailed'),
        'error'
      );
    } finally {
      setStyleSaving(false);
    }
  };

  return (
    <div className="mx-auto flex h-full min-h-0 w-full min-w-0 max-w-[1200px] gap-0 overflow-x-hidden">

      <div className="flex h-full min-h-0 min-w-0 max-w-[600px] flex-1 flex-col overflow-hidden border-x border-neutral-200 bg-white">
        <div
          ref={profileScrollRef}
          className={`min-h-0 min-w-0 flex-1 ${
            mobileComposerFull ? 'overflow-hidden' : 'overflow-x-hidden overflow-y-auto'
          }`}
        >
        {/* Compact bar — after scrolling past full profile header */}
        <div
          className={`sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur-md transition-all duration-200 ${
            compactProfileBar
              ? 'opacity-100'
              : 'pointer-events-none h-0 overflow-hidden border-transparent opacity-0 py-0'
          }`}
          aria-hidden={!compactProfileBar}
        >
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2.5">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <span
                className="truncate text-base font-bold text-neutral-900"
                style={nameColor ? { color: nameColor } : undefined}
              >
                {displayName}
              </span>
              {statusIconUrl ? (
                <img
                  src={statusIconUrl}
                  alt=""
                  className="h-8 w-8 shrink-0 object-contain"
                  draggable={false}
                />
              ) : null}
              {isOwnProfile ? (
                <button
                  type="button"
                  onClick={() => setPremiumModalOpen(true)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-violet-200 bg-gradient-to-r from-violet-50 to-fuchsia-50 px-2.5 py-0.5 text-[11px] font-semibold text-violet-800"
                >
                  <Sparkles className="h-3 w-3 shrink-0 text-violet-600" aria-hidden />
                  {t('userProfile.premiumStatus')}
                </button>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              {isOwnProfile ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('/settings')}
                    className="whitespace-nowrap rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-900 transition-colors hover:bg-neutral-100"
                  >
                    {t('userProfile.editProfile')}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/activity')}
                    className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-900 transition-colors hover:bg-neutral-100"
                  >
                    <Zap className="h-3.5 w-3.5 text-amber-600" aria-hidden />
                    {t('userProfile.activity')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                      isFollowing
                        ? 'border border-neutral-300 bg-white text-neutral-900 hover:border-red-300 hover:bg-red-50 hover:text-red-600'
                        : 'bg-black text-white hover:bg-neutral-800'
                    } ${followLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    {followLoading ? t('userProfile.followLoading') : isFollowing ? t('userProfile.followingBtn') : t('userProfile.follow')}
                  </button>
                  <button
                    type="button"
                    onClick={() => void openMessengerWithUser(profile.username)}
                    disabled={messagingLoading}
                    className="rounded-full border border-neutral-300 p-1.5 transition-colors hover:bg-neutral-100 disabled:opacity-50"
                    aria-label={t('userProfile.menu.sendMessage')}
                  >
                    <MessageCircle size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={openProfileMenu}
                    className="rounded-full border border-neutral-300 p-1.5 transition-colors hover:bg-neutral-100"
                    aria-label={t('userProfile.menu.title')}
                    aria-haspopup="menu"
                    aria-expanded={profileMenuOpen}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Profile Info — scrolls with feed */}
        <div className="relative -mx-px mt-4 overflow-hidden px-4 pb-4 pt-3">
          {profile.profileBgEmoji ? (
            <ProfileBgEmojiDecor emoji={profile.profileBgEmoji} />
          ) : null}
          <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div className="relative">
              <img 
                src={profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=000&color=fff&size=140&bold=true`}
                alt={displayName}
                className="w-[80px] h-[80px] rounded-full border-4 border-white bg-white"
                onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=000&color=fff&size=140&bold=true`; }}
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center">
            <h1
              className="text-xl font-bold text-neutral-900"
              style={nameColor ? { color: nameColor } : undefined}
            >
              {displayName}
            </h1>
            {statusIconUrl ? (
              <img
                src={statusIconUrl}
                alt=""
                className="h-11 w-11 shrink-0 object-contain sm:h-12 sm:w-12"
                draggable={false}
              />
            ) : null}
            {isOwnProfile ? (
              <button
                type="button"
                onClick={() => setPremiumModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-gradient-to-r from-violet-50 to-fuchsia-50 px-3 py-1 text-xs font-semibold text-violet-800 shadow-sm transition-colors hover:from-violet-100 hover:to-fuchsia-100"
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-violet-600" aria-hidden />
                {t('userProfile.premiumStatus')}
              </button>
            ) : null}
          </div>
          <p className="text-neutral-500">@{profile.username}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {isOwnProfile ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/settings')}
                  className="px-5 py-2 border border-neutral-300 hover:bg-neutral-100 text-neutral-900 rounded-full font-semibold text-sm transition-colors"
                >
                  {t('userProfile.editProfile')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/activity')}
                  className="inline-flex items-center gap-1.5 px-5 py-2 border border-neutral-300 hover:bg-neutral-100 text-neutral-900 rounded-full font-semibold text-sm transition-colors"
                >
                  <Zap className="h-4 w-4 text-amber-600" aria-hidden />
                  {t('userProfile.activity')}
                </button>
              </>
            ) : (
              <>
                <button onClick={handleFollow} disabled={followLoading}
                  className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${isFollowing ? 'bg-white border border-neutral-300 text-neutral-900 hover:border-red-300 hover:text-red-600 hover:bg-red-50' : 'bg-black text-white hover:bg-neutral-800'} ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {followLoading ? t('userProfile.followLoading') : isFollowing ? t('userProfile.followingBtn') : t('userProfile.follow')}
                </button>
                <button
                  type="button"
                  onClick={() => void openMessengerWithUser(profile.username)}
                  disabled={messagingLoading}
                  className="rounded-full border border-neutral-300 p-2 transition-colors hover:bg-neutral-100 disabled:opacity-50"
                  aria-label={t('userProfile.menu.sendMessage')}
                >
                  <MessageCircle size={18} />
                </button>
                <button
                  type="button"
                  onClick={openProfileMenu}
                  className="rounded-full border border-neutral-300 p-2 transition-colors hover:bg-neutral-100"
                  aria-label={t('userProfile.menu.title')}
                  aria-haspopup="menu"
                  aria-expanded={profileMenuOpen}
                >
                  <MoreHorizontal size={18} />
                </button>
              </>
            )}
          </div>
          {profile.bio && (
            <p className="mt-3 break-words text-neutral-900 leading-relaxed">{profile.bio}</p>
          )}
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-neutral-500">
            {profile.location && (<div className="flex items-center gap-1"><MapPin size={16} /><span>{profile.location}</span></div>)}
            {profile.website && (
              <div className="flex min-w-0 max-w-full items-center gap-1">
                <LinkIcon size={16} className="shrink-0" />
                <a
                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 break-all text-blue-500 hover:underline"
                >
                  {profile.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>
          <div className="mb-2 flex gap-5 text-md">
            <button
              type="button"
              className="hover:underline"
              onClick={() => {
                if (!isLgUp) {
                  setConnectionsTab('following');
                  setFollowingSheetOpen(true);
                }
              }}
            >
              <span className="font-bold text-neutral-900">{formatCount(profile.followingCount || 0)}</span>
              <span className="ml-1 text-neutral-500">{t('userProfile.following')}</span>
            </button>
            <button
              type="button"
              className="hover:underline"
              onClick={() => {
                if (!isLgUp) {
                  setConnectionsTab('followers');
                  setFollowersSheetOpen(true);
                }
              }}
            >
              <span className="font-bold text-neutral-900">{formatCount(profile.followersCount || 0)}</span>
              <span className="ml-1 text-neutral-500">{t('userProfile.followers')}</span>
            </button>
          </div>
          <div className="flex text-sm items-center gap-1"><Calendar size={14} /><span>{t('userProfile.joinedLine', { date: formatDate(profile.createdAt) })}</span></div>
          </div>
        </div>
        <div ref={profileHeaderEndRef} className="h-px w-full shrink-0" aria-hidden />

        <ProfilePremiumStyleModal
          open={premiumModalOpen}
          initial={customizationDraft}
          saving={styleSaving}
          onClose={() => setPremiumModalOpen(false)}
          onSave={saveProfileCustomization}
          t={t}
        />

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 bg-white">
          {[
            { id: 'posts', label: t('userProfile.posts') },
            { id: 'reposts', label: t('userProfile.reposts') },
            { id: 'replies', label: t('userProfile.replies') },
            { id: 'media', label: t('userProfile.media') },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 text-sm font-medium text-center hover:bg-neutral-50 transition-colors relative ${activeTab === tab.id ? 'text-neutral-900 bg-neutral-50' : 'text-neutral-500'}`}>
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-14 h-0.5 bg-black rounded-full" />}
            </button>
          ))}
        </div>

        {isOwnProfile && activeTab === 'posts' && (
          <PostComposer
            variant="profile"
            isOpen={showPostCreator}
            onOpen={() => setShowPostCreator(true)}
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

        <div className={mobileComposerFull ? 'hidden' : ''}>
        {/* Posts */}
        {activeTab === 'posts' && (
          <div>
            {posts.length > 0 ? (
              posts.map((post) => renderPostCard(post))
            ) : (
              <div className="text-center py-20 px-4">
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">{t('userProfile.noPosts')}</h2>
                <p className="text-neutral-500">{t('userProfile.noPostsHint', { name: profile.username })}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reposts' && (
          <div>
            {repostsLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-300 border-t-black" />
              </div>
            ) : reposts.length > 0 ? (
              reposts.map((post) => renderPostCard(post, { showRepostBanner: true }))
            ) : (
              <div className="text-center py-20 px-4">
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">{t('userProfile.noReposts')}</h2>
                <p className="text-neutral-500">
                  {t('userProfile.noRepostsHint', { name: profile.username })}
                </p>
              </div>
            )}
          </div>
        )}

        {(activeTab === 'replies' || activeTab === 'media') && (
          <div className="text-center py-20 px-4">
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">{t('userProfile.noTabYet', { tab: activeTabTitle })}</h2>
            <p className="text-neutral-500">{t('userProfile.noTabHint', { name: profile.username, tab: activeTabTitle })}</p>
          </div>
        )}
        </div>
        </div>

      </div>

      <div className="hidden h-full min-h-0 w-[400px] min-w-0 shrink-0 flex-col overflow-x-hidden border-r border-neutral-200 lg:flex">
        <div className="flex min-h-0 flex-1 flex-col">
          {selectedPost ? (
            <PostDetailPanel
              post={selectedPost}
              onClose={() => setSelectedPost(null)}
              onCopyLink={copyPostLink}
              commentText={commentText}
              onCommentTextChange={setCommentText}
              onSubmitComment={() => void handleSubmitComment(String(selectedPost._id), 'sidebar')}
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
          ) : (
            <div className="flex h-full min-h-0 flex-col overflow-hidden p-4">
              <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setConnectionsTab('followers');
                    setSearchFollower('');
                  }}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    connectionsTab === 'followers'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {t('userProfile.followers')}
                  <span className="ml-1 text-neutral-500">{formatCount(profile.followersCount || followers.length)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConnectionsTab('following');
                    setSearchFollower('');
                  }}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    connectionsTab === 'following'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {t('userProfile.following')}
                  <span className="ml-1 text-neutral-500">{formatCount(profile.followingCount || following.length)}</span>
                </button>
              </div>

              <div className="relative mb-4 shrink-0">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchFollower}
                  onChange={(e) => setSearchFollower(e.target.value)}
                  placeholder={connectionSearchPlaceholder}
                  className="w-full rounded-full border border-neutral-200 bg-white py-2 pl-9 pr-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>

              <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
                {activeConnectionUsers.length > 0 ? (
                  activeConnectionUsers.map(renderConnectionUser)
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-sm text-neutral-500">
                      {searchFollower.trim() ? connectionEmptySearch : connectionEmptyList}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

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
          <Pen size={14} />
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
          <Trash size={14} />
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

      {!isOwnProfile ? (
        <ProfileUserActionsMenu
          open={profileMenuOpen}
          onClose={() => {
            setProfileMenuOpen(false);
            setProfileMenuAnchor(null);
          }}
          anchor={profileMenuAnchor}
          username={profile.username}
          title={t('userProfile.menu.title')}
          labels={{
            sendMessage: t('userProfile.menu.sendMessage'),
            copyLink: t('userProfile.menu.copyLink'),
            report: t('userProfile.menu.report'),
            block: t('userProfile.menu.block'),
          }}
          onAction={handleProfileMenuAction}
        />
      ) : null}

      <ProfileFollowersSheet
        open={followersSheetOpen}
        onClose={() => {
          setFollowersSheetOpen(false);
          setSearchFollower('');
        }}
        title={t('userProfile.followersHeading', { count: followers.length })}
        users={filteredFollowers}
        search={searchFollower}
        onSearchChange={setSearchFollower}
        searchPlaceholder={t('userProfile.searchFollowersPlaceholder')}
        emptySearch={t('userProfile.noFollowersFound')}
        emptyList={t('userProfile.noFollowersYet')}
      />

      <ProfileFollowersSheet
        open={followingSheetOpen}
        onClose={() => {
          setFollowingSheetOpen(false);
          setSearchFollower('');
        }}
        title={t('userProfile.followingHeading', { count: following.length })}
        users={filteredFollowing}
        search={searchFollower}
        onSearchChange={setSearchFollower}
        searchPlaceholder={t('userProfile.searchFollowingPlaceholder')}
        emptySearch={t('userProfile.noFollowingFound')}
        emptyList={t('userProfile.notFollowingAnyone')}
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

export default UserProfileComponent;