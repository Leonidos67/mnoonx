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
  Search,
  Zap,
  Globe,
  Lock,
  Repeat2,
  Pencil,
} from 'lucide-react';
import { MessageCircleIcon, type IconHandle } from '@animateicons/react/lucide';
import { AnimatedPostMenuIcon } from '../components/Posts/PostMenuAnimatedIcons';
import { useAnimateOnParentHover } from '../hooks/useAnimateOnParentHover';
import PostFeedActionButtons from '../components/Posts/PostFeedActionButtons';
import QuotedPostCard from '../components/Posts/QuotedPostCard';
import QuoteComposerModal from '../components/Posts/QuoteComposerModal';
import PullToRefresh from '../components/Common/PullToRefresh';
import { FeedSkeleton, ProfileHeaderSkeleton } from '../components/Common/Skeleton';
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
import ExternalLink from '../components/Common/ExternalLink';
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
import { resolveMediaUrl } from '../utils/mediaUrl';
import { setDocumentMeta } from '../utils/documentMeta';

import { USERS_API as API_URL, POSTS_API as POSTS_API_URL, MESSAGES_API } from '../config/api';
import { useTranslation } from '../i18n/useTranslation';
import ProfileSocialLinks from '../components/Profile/ProfileSocialLinks';
import SocialLinksEditor from '../components/Profile/SocialLinksEditor';
import type { SocialLinks, SocialPlatform } from '../types/socialLinks';
import { EMPTY_SOCIAL_LINKS } from '../types/socialLinks';
import { hasAnySocialLink, normalizeSocialLinksInput } from '../utils/socialLinks';
import { blockUser, reportUser, unblockUser } from '../utils/userModeration';

const ProfileMessengerIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 16,
  color = 'currentColor',
}) => {
  const iconRef = useRef<IconHandle>(null);
  const nodeRef = useRef<HTMLSpanElement>(null);
  useAnimateOnParentHover(iconRef, nodeRef);
  return (
    <span
      ref={nodeRef}
      className="inline-flex shrink-0 items-center justify-center overflow-hidden"
      style={{ width: size, height: size }}
    >
      <MessageCircleIcon
        ref={iconRef}
        size={size}
        duration={1}
        color={color}
        isAnimated={false}
        className="!h-full !w-full !min-h-0 !min-w-0"
      />
    </span>
  );
};

type Post = FeedPost;

type ProfileReply = {
  _id: string;
  content: string;
  createdAt: string;
  parentId?: string | null;
  user: {
    _id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
  post: FeedPost;
};

interface UserProfile {
  _id: string;
  username: string;
  fullName: string;
  bio: string;
  avatar: string;
  banner: string;
  location: string;
  website: string;
  socialLinks?: Partial<SocialLinks>;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: string;
  isFollowing: boolean;
  isBlockedByMe?: boolean;
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
  const [activeTab, setActiveTab] = useState<'posts' | 'reposts' | 'replies' | 'media' | 'bookmarks'>('posts');
  const [reposts, setReposts] = useState<FeedPost[]>([]);
  const [repostsLoading, setRepostsLoading] = useState(false);
  const [replies, setReplies] = useState<ProfileReply[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [mediaPosts, setMediaPosts] = useState<FeedPost[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [bookmarks, setBookmarks] = useState<FeedPost[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [searchFollower, setSearchFollower] = useState('');
  const [connectionsTab, setConnectionsTab] = useState<'followers' | 'following'>('followers');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<{ rect: DOMRect } | null>(null);
  const [followersSheetOpen, setFollowersSheetOpen] = useState(false);
  const [followingSheetOpen, setFollowingSheetOpen] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [styleSaving, setStyleSaving] = useState(false);
  const [hasProPlan, setHasProPlan] = useState(hasProSubscription);
  const [messagingId, setMessagingId] = useState<string | null>(null); // Добавлено для отслеживания загрузки сообщения

  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState<string[]>([]);
  const [newPostLink, setNewPostLink] = useState<PostLinkAttachment | null>(null);
  const [newPostCoin, setNewPostCoin] = useState<PostCoinAttachment | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [showPostCreator, setShowPostCreator] = useState(false);
  const mobileComposerFull = showPostCreator && !isLgUp && activeTab === 'posts';

  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [repostedPosts, setRepostedPosts] = useState<Set<string>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());
  const [menuOpenPostId, setMenuOpenPostId] = useState<string | null>(null);
  const [editPostTarget, setEditPostTarget] = useState<{ postId: string; content: string } | null>(null);
  const [editPostSaving, setEditPostSaving] = useState(false);
  const [quoteTarget, setQuoteTarget] = useState<FeedPost | null>(null);
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);

  // Inline / modal "bio / location / website / social" edit (own profile only)
  const [editingProfileInfo, setEditingProfileInfo] = useState(false);
  const [profileDetailsModalOpen, setProfileDetailsModalOpen] = useState(false);
  const [profileInfoDraft, setProfileInfoDraft] = useState({ bio: '', location: '', website: '' });
  const [socialLinksDraft, setSocialLinksDraft] = useState<SocialLinks>({ ...EMPTY_SOCIAL_LINKS });
  const [profileInfoSaving, setProfileInfoSaving] = useState(false);

  const postDetail = usePostDetail(posts, reposts, setPosts, setReposts, mediaPosts, setMediaPosts);
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

  // Функция для начала сообщения (полностью как в Users.tsx)
  const startMessage = async (targetUsername: string) => {
    if (!token) {
      window.dispatchEvent(new CustomEvent('openLogin'));
      return;
    }
    setMessagingId(targetUsername);
    try {
      const res = await fetch(`${MESSAGES_API}/dm/${encodeURIComponent(targetUsername)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        navigate(`/messenger?chat=${data.conversationId}`);
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(errorData.message || t('userProfile.menu.openChatFailed'), 'error');
      }
    } catch (e) {
      console.error(e);
      showToast(t('userProfile.menu.openChatFailed'), 'error');
    } finally {
      setMessagingId(null);
    }
  };

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
    if (!profile) return;
    return setDocumentMeta({
      title: profile.fullName || profile.username,
      description: profile.bio || `@${profile.username} on MNOONX`,
      image: profile.avatar ? resolveMediaUrl(profile.avatar) : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      type: 'profile',
    });
  }, [profile?.username, profile?.fullName, profile?.bio, profile?.avatar]);

  useEffect(() => {
    const syncPlan = () => setHasProPlan(hasProSubscription());
    window.addEventListener('planTierChanged', syncPlan);
    window.addEventListener('storage', syncPlan);
    return () => {
      window.removeEventListener('planTierChanged', syncPlan);
      window.removeEventListener('storage', syncPlan);
    };
  }, []);

  const findPostAnywhere = useCallback(
    (postId: string): Post | undefined => {
      const id = String(postId);
      return (
        posts.find((p) => String(p._id) === id) ||
        reposts.find((p) => String(p._id) === id) ||
        mediaPosts.find((p) => String(p._id) === id) ||
        bookmarks.find((p) => String(p._id) === id) ||
        (selectedPost && String(selectedPost._id) === id ? selectedPost : undefined)
      );
    },
    [posts, reposts, mediaPosts, bookmarks, selectedPost],
  );

  const patchBookmarks = useCallback(
    (postId: string, patch: Partial<FeedPost>) => {
      setBookmarks((prev) => prev.map((p) => (String(p._id) === postId ? { ...p, ...patch } : p)));
    },
    [],
  );

  const handleLike = async (postId: string) => {
    if (!token) {
      window.dispatchEvent(new CustomEvent('openLogin'));
      return;
    }
    const id = String(postId);
    const current = findPostAnywhere(id);
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
    patchBookmarks(id, { likesCount: nextCount, isLiked: nextLiked });

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
      patchBookmarks(id, { likesCount: data.likesCount, isLiked: data.liked });
    } catch (err) {
      console.error('Like error:', err);
      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        wasLiked ? newSet.add(id) : newSet.delete(id);
        return newSet;
      });
      patchPostInLists(id, { likesCount: prevCount, isLiked: wasLiked });
      patchBookmarks(id, { likesCount: prevCount, isLiked: wasLiked });
      showToast(t('common.likeFailed'), 'error');
    }
  };

  const handleRepost = async (postId: string) => {
    if (!token) {
      window.dispatchEvent(new CustomEvent('openLogin'));
      return;
    }
    const id = String(postId);
    const current = findPostAnywhere(id);
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
    patchBookmarks(id, { repostsCount: nextCount, isReposted: nextReposted });

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
      patchBookmarks(id, { repostsCount: data.repostsCount, isReposted: data.reposted });
      if (profileSlug) {
        if (data.reposted) {
          fetchReposts(profileSlug);
        } else {
          setReposts((prev) => prev.filter((p) => String(p._id) !== id));
        }
      }
    } catch (err) {
      console.error('Repost error:', err);
      setRepostedPosts((prev) => {
        const newSet = new Set(prev);
        wasReposted ? newSet.add(id) : newSet.delete(id);
        return newSet;
      });
      patchPostInLists(id, { repostsCount: prevCount, isReposted: wasReposted });
      patchBookmarks(id, { repostsCount: prevCount, isReposted: wasReposted });
      showToast(t('common.repostFailed'), 'error');
    }
  };

  const handleBookmark = async (postId: string) => {
    if (!token) {
      window.dispatchEvent(new CustomEvent('openLogin'));
      return;
    }
    const id = String(postId);
    const current = findPostAnywhere(id);
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
    patchBookmarks(id, { bookmarksCount: nextCount, isBookmarked: nextBookmarked });
    if (!nextBookmarked) {
      setBookmarks((prev) => prev.filter((p) => String(p._id) !== id));
    }

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
      patchBookmarks(id, { bookmarksCount: data.bookmarksCount, isBookmarked: data.bookmarked });
      showToast(data.bookmarked ? t('common.bookmarkAdded') : t('common.bookmarkRemoved'));
    } catch (err) {
      console.error('Bookmark error:', err);
      setBookmarkedPosts((prev) => {
        const newSet = new Set(prev);
        wasBookmarked ? newSet.add(id) : newSet.delete(id);
        return newSet;
      });
      patchPostInLists(id, { bookmarksCount: prevCount, isBookmarked: wasBookmarked });
      patchBookmarks(id, { bookmarksCount: prevCount, isBookmarked: wasBookmarked });
      showToast(t('common.bookmarkFailed'), 'error');
    }
  };

  const openQuoteComposer = (postId: string) => {
    if (!token) {
      window.dispatchEvent(new CustomEvent('openLogin'));
      return;
    }
    const post = findPostAnywhere(String(postId));
    if (post) setQuoteTarget(post);
  };

  const closeQuoteComposer = () => {
    if (quoteSubmitting) return;
    setQuoteTarget(null);
  };

  const submitQuote = async (content: string) => {
    if (!quoteTarget || !token || quoteSubmitting) return;
    try {
      setQuoteSubmitting(true);
      const res = await fetch(POSTS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content, quoteOf: String(quoteTarget._id) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { message?: string }).message || t('common.failedToCreatePost'));

      if (profile && user?.username === profile.username) {
        setPosts((prev) => [data, ...prev]);
        setProfile((prev) => (prev ? { ...prev, postsCount: (prev.postsCount || 0) + 1 } : null));
      }
      setQuoteTarget(null);
      showToast(t('common.postPublished'));
    } catch (err: unknown) {
      console.error('Quote post error:', err);
      showToast(err instanceof Error ? err.message : t('common.failedToCreatePost'), 'error');
    } finally {
      setQuoteSubmitting(false);
    }
  };

  const fetchBookmarks = useCallback(async () => {
    if (!token) return;
    try {
      setBookmarksLoading(true);
      const res = await fetch(`${POSTS_API_URL}/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setBookmarks([]);
        return;
      }
      const data = await res.json();
      const list: Post[] = Array.isArray(data) ? data : data.posts || [];
      setBookmarks(list);
      setBookmarkedPosts((prev) => {
        const merged = new Set(prev);
        list.forEach((p) => merged.add(String(p._id)));
        return merged;
      });
    } catch (err) {
      console.error('Fetch bookmarks error:', err);
      setBookmarks([]);
    } finally {
      setBookmarksLoading(false);
    }
  }, [token]);

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
      setMediaPosts((prev) => prev.filter((p) => String(p._id) !== postId));
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
      
      // Загружаем начальное состояние лайков, репостов и закладок
      const likedIds = new Set<string>();
      const repostedIds = new Set<string>();
      const bookmarkedIds = new Set<string>();
      
      (data.posts || []).forEach((post: any) => {
        if (post.isLiked) likedIds.add(post._id);
        if (post.isReposted) repostedIds.add(post._id);
        if (post.isBookmarked) bookmarkedIds.add(String(post._id));
      });
      
      setLikedPosts(likedIds);
      setRepostedPosts(repostedIds);
      setBookmarkedPosts((prev) => {
        const merged = new Set(prev);
        bookmarkedIds.forEach((id) => merged.add(id));
        return merged;
      });
      
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
    const bookmarkedIds = new Set<string>();
    postList.forEach((post) => {
      const pid = String(post._id);
      if (post.isLiked) likedIds.add(pid);
      if (post.isReposted) repostedIds.add(pid);
      if (post.isBookmarked) bookmarkedIds.add(pid);
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
    setBookmarkedPosts((prev) => {
      const merged = new Set(prev);
      bookmarkedIds.forEach((id) => merged.add(id));
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

  const fetchReplies = useCallback(async (cleanUsername: string) => {
    if (!cleanUsername || cleanUsername === 'undefined') return;
    try {
      setRepliesLoading(true);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/${cleanUsername}/replies`, { headers });
      if (!res.ok) {
        setReplies([]);
        return;
      }
      const data = await res.json();
      setReplies((data.replies || []) as ProfileReply[]);
    } catch (err) {
      console.error('Fetch replies error:', err);
      setReplies([]);
    } finally {
      setRepliesLoading(false);
    }
  }, [token]);

  const fetchMedia = useCallback(async (cleanUsername: string) => {
    if (!cleanUsername || cleanUsername === 'undefined') return;
    try {
      setMediaLoading(true);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/${cleanUsername}/media`, { headers });
      if (!res.ok) {
        setMediaPosts([]);
        return;
      }
      const data = await res.json();
      const list: Post[] = data.posts || [];
      setMediaPosts(list);
      syncLikeRepostSets(list);
    } catch (err) {
      console.error('Fetch media error:', err);
      setMediaPosts([]);
    } finally {
      setMediaLoading(false);
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
    setActiveTab('posts');
    setBookmarks([]);
    setEditingProfileInfo(false);
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
    if (activeTab === 'replies' && profileSlug) {
      fetchReplies(profileSlug);
    }
    if (activeTab === 'media' && profileSlug) {
      fetchMedia(profileSlug);
    }
    if (activeTab === 'bookmarks' && user?.username === profileSlug) {
      fetchBookmarks();
    }
  }, [activeTab, profileSlug, fetchReposts, fetchReplies, fetchMedia, fetchBookmarks, user?.username]);

  const handlePullRefresh = useCallback(async () => {
    if (!profileSlug || profileSlug === 'undefined') return;
    const tasks: Promise<unknown>[] = [
      fetchProfile(profileSlug),
      fetchFollowers(profileSlug),
      fetchFollowing(profileSlug),
    ];
    if (activeTab === 'reposts') tasks.push(fetchReposts(profileSlug));
    if (activeTab === 'replies') tasks.push(fetchReplies(profileSlug));
    if (activeTab === 'media') tasks.push(fetchMedia(profileSlug));
    if (activeTab === 'bookmarks' && user?.username === profileSlug) tasks.push(fetchBookmarks());
    await Promise.all(tasks);
  }, [
    profileSlug,
    activeTab,
    fetchProfile,
    fetchFollowers,
    fetchFollowing,
    fetchReposts,
    fetchReplies,
    fetchMedia,
    fetchBookmarks,
    user?.username,
  ]);

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
      if (Array.isArray(newPost.media) && newPost.media.length > 0) {
        setMediaPosts((prev) => [newPost, ...prev]);
      }
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
    const wasFollowing = isFollowing;
    const action = wasFollowing ? 'unfollow' : 'follow';
    const prevFollowersCount = profile.followersCount || 0;
    const optimisticCount = Math.max(0, prevFollowersCount + (wasFollowing ? -1 : 1));

    setIsFollowing(!wasFollowing);
    setProfile((prev) => (prev ? { ...prev, followersCount: optimisticCount } : null));

    try {
      setFollowLoading(true);
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
      setIsFollowing(wasFollowing);
      setProfile((prev) => (prev ? { ...prev, followersCount: prevFollowersCount } : null));
      showToast(t('common.followFailed'), 'error');
    } finally {
      setFollowLoading(false);
    }
  };

  const openProfileDetailsEditor = () => {
    if (!profile) return;
    setProfileInfoDraft({
      bio: profile.bio || '',
      location: profile.location || '',
      website: profile.website || '',
    });
    setSocialLinksDraft(normalizeSocialLinksInput(profile.socialLinks));
    if (isLgUp) {
      setEditingProfileInfo(true);
    } else {
      setProfileDetailsModalOpen(true);
    }
  };

  const cancelEditProfileInfo = () => {
    if (profileInfoSaving) return;
    setEditingProfileInfo(false);
    setProfileDetailsModalOpen(false);
  };

  const handleSocialDraftChange = (platform: SocialPlatform, next: string) => {
    setSocialLinksDraft((prev) => ({ ...prev, [platform]: next }));
  };

  const saveProfileInfo = async () => {
    if (!token || profileInfoSaving) return;
    try {
      setProfileInfoSaving(true);
      const res = await fetch(`${API_URL}/me/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bio: profileInfoDraft.bio.trim(),
          location: profileInfoDraft.location.trim(),
          website: profileInfoDraft.website.trim(),
          socialLinks: socialLinksDraft,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { message?: string }).message || t('userProfile.profileUpdateFailed'));
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              bio: data.bio ?? profileInfoDraft.bio.trim(),
              location: data.location ?? profileInfoDraft.location.trim(),
              website: data.website ?? profileInfoDraft.website.trim(),
              socialLinks: normalizeSocialLinksInput(data.socialLinks ?? socialLinksDraft),
            }
          : null
      );
      setEditingProfileInfo(false);
      setProfileDetailsModalOpen(false);
      showToast(t('userProfile.profileUpdated'));
    } catch (err: unknown) {
      console.error('Update profile info error:', err);
      showToast(err instanceof Error ? err.message : t('userProfile.profileUpdateFailed'), 'error');
    } finally {
      setProfileInfoSaving(false);
    }
  };

  const profileDetailsForm = (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-semibold text-neutral-500">
          {t('userProfile.bioLabel')}
        </label>
        <textarea
          value={profileInfoDraft.bio}
          onChange={(e) => setProfileInfoDraft((prev) => ({ ...prev, bio: e.target.value.slice(0, 280) }))}
          placeholder={t('userProfile.bioPlaceholder')}
          rows={3}
          maxLength={280}
          disabled={profileInfoSaving}
          className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-3 py-2 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/5 disabled:opacity-60"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-neutral-500">
          {t('userProfile.locationLabel')}
        </label>
        <input
          type="text"
          value={profileInfoDraft.location}
          onChange={(e) => setProfileInfoDraft((prev) => ({ ...prev, location: e.target.value.slice(0, 100) }))}
          placeholder={t('userProfile.locationPlaceholder')}
          disabled={profileInfoSaving}
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/5 disabled:opacity-60"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-neutral-500">
          {t('userProfile.websiteLabel')}
        </label>
        <input
          type="text"
          value={profileInfoDraft.website}
          onChange={(e) => setProfileInfoDraft((prev) => ({ ...prev, website: e.target.value.slice(0, 200) }))}
          placeholder={t('userProfile.websitePlaceholder')}
          disabled={profileInfoSaving}
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/5 disabled:opacity-60"
        />
      </div>
      <div className="border-t border-neutral-100 pt-3">
        <p className="mb-3 text-sm font-semibold text-neutral-900">{t('settings.connectedAccounts')}</p>
        <SocialLinksEditor value={socialLinksDraft} onChange={handleSocialDraftChange} />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={cancelEditProfileInfo}
          disabled={profileInfoSaving}
          className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-50"
        >
          {t('common.cancel')}
        </button>
        <button
          type="button"
          onClick={() => void saveProfileInfo()}
          disabled={profileInfoSaving}
          className="rounded-full bg-black px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {profileInfoSaving ? t('common.saving') : t('common.save')}
        </button>
      </div>
    </div>
  );

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
      bookmarks: 'userProfile.bookmarks',
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

  // Рендер пользователя в списке подписчиков/подписок с кнопкой сообщения
  const renderConnectionUser = (person: FollowerUser) => (
    <Link
      key={person._id || person.username}
      to={`/@${person.username}`}
      className="group flex items-center gap-2 rounded-xl py-2 px-3 transition-colors hover:bg-neutral-50"
    >
      <img
        src={
          person.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(person.fullName || person.username)}&background=000&color=fff&size=40&bold=true`
        }
        alt={person.fullName || person.username}
        className="h-8 w-8 shrink-0 rounded-full"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold group-hover:underline">
          {person.fullName || person.username}
        </p>
        <p className="truncate text-sm text-neutral-500">@{person.username}</p>
      </div>
      {user && person.username !== user?.username && (
        <button
          type="button"
          disabled={messagingId === person.username}
          onClick={() => void startMessage(person.username)}
          className="inline-flex items-center rounded-full p-2 text-neutral-500 transition-colors hover:text-black"
        >
          <ProfileMessengerIcon size={16} />
        </button>
      )}
    </Link>
  );

  const openProfileMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    setProfileMenuAnchor({ rect: e.currentTarget.getBoundingClientRect() });
    setProfileMenuOpen(true);
  };

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
    async (action: ProfileUserActionId) => {
      if (!profile) return;
      if (action === 'copyLink') {
        void copyProfileLink();
        return;
      }
      if (action === 'report') {
        if (!token) {
          showToast(t('userProfile.menu.signInToMessage'), 'error');
          return;
        }
        const ok = await reportUser(token, profile._id, `Reported from profile @${profile.username}`);
        showToast(
          ok ? t('userProfile.menu.reportSent') : t('userProfile.menu.reportFailed'),
          ok ? 'info' : 'error'
        );
        return;
      }
      if (action === 'block') {
        if (!token) {
          showToast(t('userProfile.menu.signInToMessage'), 'error');
          return;
        }
        if (profile.isBlockedByMe) {
          const ok = await unblockUser(token, profile.username);
          if (!ok) {
            showToast(t('userProfile.menu.unblockFailed'), 'error');
            return;
          }
          setProfile((prev) => (prev ? { ...prev, isBlockedByMe: false } : null));
          showToast(t('userProfile.menu.unblocked'), 'info');
          return;
        }
        const okConfirm = await confirm({
          title: t('userProfile.menu.blockTitle'),
          message: t('userProfile.menu.blockMessage', { name: profile.username }),
          confirmLabel: t('userProfile.menu.blockConfirm'),
          variant: 'danger',
        });
        if (!okConfirm) return;
        const ok = await blockUser(token, profile.username);
        if (!ok) {
          showToast(t('userProfile.menu.blockFailed'), 'error');
          return;
        }
        setProfile((prev) =>
          prev ? { ...prev, isBlockedByMe: true, isFollowing: false } : null
        );
        setIsFollowing(false);
        showToast(t('userProfile.menu.blocked'), 'info');
      }
    },
    [profile, copyProfileLink, showToast, t, token, confirm]
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
        className={`post-feed-card max-w-full overflow-x-hidden p-4 transition-colors border-b border-neutral-200 group/article cursor-pointer ${
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
                  className={`post-feed-card-menu flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all ${menuOpenPostId === postId ? 'bg-black/10 text-black opacity-100' : 'text-neutral-500 opacity-60 hover:bg-black/5 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/article:opacity-100'}`}
                >
                  <AnimatedPostMenuIcon kind="ellipsis" size={16} />
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
                      <AnimatedPostMenuIcon kind="link" size={12} />
                      {t('home.copyLink')}
                    </button>
                    {isPostOwner(post) && (
                      <>
                        <button
                          onClick={() => openEditPost(postId, post.content)}
                          className="w-full text-left py-1 px-3 text-[14px] rounded hover:bg-black/5 transition-colors flex items-center gap-2"
                        >
                          <AnimatedPostMenuIcon kind="edit" size={12} />
                          {t('common.edit')}
                        </button>
                        <div className="h-px bg-neutral-100 my-1" />
                        <button
                          onClick={() => handleDeletePost(postId)}
                          className="w-full text-left px-3 py-1 text-[14px] rounded hover:bg-red-50 transition-colors flex items-center gap-2 text-red-600"
                        >
                          <AnimatedPostMenuIcon kind="trash" size={12} color="#dc2626" />
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
            {post.quotedPost ? <QuotedPostCard quotedPost={post.quotedPost} /> : null}
            <PostFeedActionButtons
              postId={postId}
              likesCount={post.likesCount || 0}
              commentsCount={post.commentsCount || 0}
              repostsCount={post.repostsCount || 0}
              liked={likedPosts.has(postId)}
              reposted={repostedPosts.has(postId)}
              bookmarked={bookmarkedPosts.has(postId)}
              commentsExpanded={expandedCommentsPostId === postId}
              formatCount={formatCount}
              onLike={handleLike}
              onToggleComments={toggleFeedComments}
              onRepost={handleRepost}
              onBookmark={handleBookmark}
              onQuote={openQuoteComposer}
            />

            {expandedCommentsPostId === postId && (
              <PostCommentsSection
                post={post}
                variant="feed"
                text={inlineCommentText}
                onTextChange={setInlineCommentText}
                onSubmit={() => void handleSubmitComment(postId, 'inline')}
                onSubmitReply={(parentId, content) =>
                  void handleSubmitComment(postId, 'inline', { parentId, content })
                }
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
      <div className="mx-auto flex h-full min-h-0 w-full min-w-0 max-w-[1200px] gap-0 overflow-x-hidden">
        <div className="flex h-full min-h-0 min-w-0 max-w-[600px] flex-1 flex-col overflow-hidden border-x border-neutral-200 bg-white">
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
            <ProfileHeaderSkeleton />
            <FeedSkeleton count={4} />
          </div>
        </div>
        <div className="hidden h-full min-h-0 w-[400px] min-w-0 shrink-0 border-r border-neutral-200 lg:block" />
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
        <PullToRefresh
          onRefresh={handlePullRefresh}
          scrollRef={profileScrollRef}
          className="min-h-0 min-w-0 flex-1 overflow-x-hidden"
          labels={{
            pull: t('common.pullToRefresh'),
            release: t('common.releaseToRefresh'),
            refreshing: t('common.refreshing'),
          }}
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
                @{displayName}
              </span>
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
                    onClick={() => void startMessage(profile.username)}
                    disabled={messagingId === profile.username}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#315efb] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2547c4] disabled:opacity-60"
                  >
                    <ProfileMessengerIcon size={16} color="#ffffff" />
                    {messagingId === profile.username ? t('users.opening') : t('users.message')}
                  </button>
                  <button
                    type="button"
                    onClick={openProfileMenu}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-300 transition-colors hover:bg-neutral-100"
                    aria-label={t('userProfile.menu.title')}
                    aria-haspopup="menu"
                    aria-expanded={profileMenuOpen}
                  >
                    <AnimatedPostMenuIcon kind="ellipsis" size={16} />
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
                  onClick={() => void startMessage(profile.username)}
                  disabled={messagingId === profile.username}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#315efb] px-5 py-2 text-sm font-medium text-white hover:bg-[#2547c4] disabled:opacity-60"
                >
                  <ProfileMessengerIcon size={16} color="#ffffff" />
                  {messagingId === profile.username ? t('users.opening') : t('users.message')}
                </button>
                <button
                  type="button"
                  onClick={openProfileMenu}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-300 transition-colors hover:bg-neutral-100"
                  aria-label={t('userProfile.menu.title')}
                  aria-haspopup="menu"
                  aria-expanded={profileMenuOpen}
                >
                  <AnimatedPostMenuIcon kind="ellipsis" size={18} />
                </button>
              </>
            )}
          </div>
          {editingProfileInfo && isLgUp ? (
            <div className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50/60 p-3">
              {profileDetailsForm}
            </div>
          ) : (
            <>
              {profile.bio ? (
                <div className="mt-3">
                  <div className="flex items-start gap-1.5">
                    <p className="break-words text-[15px] leading-relaxed text-neutral-900 sm:text-base">
                      {profile.bio}
                    </p>
                    {isOwnProfile ? (
                      <button
                        type="button"
                        onClick={openProfileDetailsEditor}
                        aria-label={t('userProfile.editBioDetails')}
                        className="mt-0.5 shrink-0 rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                      >
                        <Pencil size={14} aria-hidden />
                      </button>
                    ) : null}
                  </div>
                  {isOwnProfile && !hasAnySocialLink(profile.socialLinks) ? (
                    <button
                      type="button"
                      onClick={openProfileDetailsEditor}
                      className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition-colors hover:underline"
                    >
                      <LinkIcon size={14} aria-hidden />
                      {t('userProfile.addSocialLinks')}
                    </button>
                  ) : null}
                </div>
              ) : isOwnProfile ? (
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <button
                    type="button"
                    onClick={openProfileDetailsEditor}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition-colors hover:underline"
                  >
                    <Pencil size={14} aria-hidden />
                    {t('userProfile.addBioDetails')}
                  </button>
                </div>
              ) : null}
            </>
          )}
          
          <div className="my-2 flex gap-4 text-md">
            <div
              className="cursor-default"
            >
              <span className="font-bold text-neutral-900">{formatCount(profile.followingCount || 0)}</span>
              <span className="ml-1 text-neutral-500">{t('userProfile.following')}</span>
            </div>
            <div
              className="cursor-default"
            >
              <span className="font-bold text-neutral-900">{formatCount(profile.followersCount || 0)}</span>
              <span className="ml-1 text-neutral-500">{t('userProfile.followers')}</span>
            </div>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-neutral-600">
            <span className="inline-flex items-center gap-1">
              <Calendar size={14} className="shrink-0 text-neutral-400" aria-hidden />
              <span>{t('userProfile.joinedLine', { date: formatDate(profile.createdAt) })}</span>
            </span>
            {profile.location ? (
              <>
                <span className="text-neutral-300" aria-hidden>
                  ·
                </span>
                <span className="inline-flex min-w-0 items-center gap-1">
                  <MapPin size={14} className="shrink-0 text-neutral-400" aria-hidden />
                  <span className="min-w-0 break-words">{profile.location}</span>
                </span>
              </>
            ) : null}
            {profile.website ? (
              <>
                <span className="text-neutral-300" aria-hidden>
                  ·
                </span>
                <span className="inline-flex min-w-0 items-center gap-1">
                  <LinkIcon size={14} className="shrink-0 text-neutral-400" aria-hidden />
                  <ExternalLink
                    href={
                      profile.website.startsWith('http')
                        ? profile.website
                        : `https://${profile.website}`
                    }
                    className="min-w-0 break-all text-blue-600 hover:underline"
                  >
                    {profile.website.replace(/^https?:\/\//, '')}
                  </ExternalLink>
                </span>
              </>
            ) : null}
          </div>
          </div>

          {hasAnySocialLink(profile.socialLinks) ? (
            <div className="mt-3 min-w-0 space-y-1 rounded-2xl border border-neutral-100 bg-neutral-50/80 p-1">
              <div className="flex items-center justify-between gap-2 px-2 pt-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  {t('settings.connectedAccounts')}
                </span>
                {isOwnProfile ? (
                  <button
                    type="button"
                    onClick={openProfileDetailsEditor}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                  >
                    <Pencil size={12} aria-hidden />
                    {t('common.edit')}
                  </button>
                ) : null}
              </div>
              <ProfileSocialLinks links={profile.socialLinks} />
            </div>
          ) : null}
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
            ...(isOwnProfile ? [{ id: 'bookmarks', label: t('userProfile.bookmarks') }] : []),
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

        {activeTab === 'replies' && (
          <div>
            {repliesLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-300 border-t-black" />
              </div>
            ) : replies.length > 0 ? (
              replies.map((reply) => {
                const parent = reply.post;
                const parentAuthor = parent.author?.username || 'unknown';
                const snippet = (parent.content || '').trim().slice(0, 140);
                return (
                  <article
                    key={`${reply.post._id}-${reply._id}`}
                    onClick={() => setSelectedPost(reply.post)}
                    className="cursor-pointer border-b border-neutral-200 p-4 transition-colors hover:bg-neutral-50/80"
                  >
                    <p className="mb-2 text-xs text-neutral-500">
                      {t('userProfile.replyingTo', { name: parentAuthor })}
                    </p>
                    <div className="flex gap-3">
                      <img
                        src={
                          reply.user.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.user.fullName || reply.user.username)}&background=000&color=fff&size=40&bold=true`
                        }
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1 text-sm">
                          <span className="font-bold text-neutral-900">{reply.user.fullName}</span>
                          <span className="text-neutral-500">@{reply.user.username}</span>
                          <span className="text-neutral-400">·</span>
                          <span className="text-neutral-500">{formatPostDate(reply.createdAt)}</span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap break-words text-[15px] text-neutral-900">
                          {reply.content}
                        </p>
                        {snippet ? (
                          <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
                            <p className="line-clamp-2">
                              <span className="font-medium text-neutral-800">@{parentAuthor}</span>
                              {': '}
                              {snippet}
                              {(parent.content || '').length > 140 ? '…' : ''}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="px-4 py-20 text-center">
                <h2 className="mb-2 text-2xl font-bold text-neutral-900">{t('userProfile.noReplies')}</h2>
                <p className="text-neutral-500">
                  {t('userProfile.noRepliesHint', { name: profile.username })}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'media' && (
          <div>
            {mediaLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-300 border-t-black" />
              </div>
            ) : mediaPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-0.5 p-0.5 sm:gap-1 sm:p-1">
                {mediaPosts.map((post) => {
                  const urls = (post.media || []).map((u) => resolveMediaUrl(u)).filter(Boolean);
                  const cover = urls[0];
                  if (!cover) return null;
                  const extra = urls.length - 1;
                  const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(cover);
                  return (
                    <button
                      key={post._id}
                      type="button"
                      onClick={() => setSelectedPost(post)}
                      className="relative aspect-square overflow-hidden bg-neutral-100 transition-opacity hover:opacity-90"
                    >
                      {isVideo ? (
                        <video
                          src={cover}
                          className="h-full w-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <img src={cover} alt="" className="h-full w-full object-cover" />
                      )}
                      {extra > 0 ? (
                        <span className="absolute right-1.5 top-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          +{extra}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-20 text-center">
                <h2 className="mb-2 text-2xl font-bold text-neutral-900">{t('userProfile.noMedia')}</h2>
                <p className="text-neutral-500">
                  {t('userProfile.noMediaHint', { name: profile.username })}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bookmarks' && isOwnProfile && (
          <div>
            {bookmarksLoading ? (
              <FeedSkeleton count={3} />
            ) : bookmarks.length > 0 ? (
              bookmarks.map((post) => renderPostCard(post))
            ) : (
              <div className="text-center py-20 px-4">
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">{t('userProfile.noBookmarks')}</h2>
                <p className="text-neutral-500">{t('userProfile.noBookmarksHint')}</p>
              </div>
            )}
          </div>
        )}
        </div>
        </PullToRefresh>

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

      <MobileBottomSheet
        open={profileDetailsModalOpen}
        onClose={cancelEditProfileInfo}
        title={t('userProfile.editBioDetails')}
        padded
        dismissible={!profileInfoSaving}
      >
        {profileDetailsForm}
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
            copyLink: t('userProfile.menu.copyLink'),
            report: t('userProfile.menu.report'),
            block: profile.isBlockedByMe ? t('userProfile.menu.unblock') : t('userProfile.menu.block'),
          }}
          isBlocked={Boolean(profile.isBlockedByMe)}
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

      <QuoteComposerModal
        open={quoteTarget !== null}
        quotedPost={quoteTarget}
        submitting={quoteSubmitting}
        onClose={closeQuoteComposer}
        onSubmit={(content) => void submitQuote(content)}
      />
    </div>
  );
};

export default UserProfileComponent;