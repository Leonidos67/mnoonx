import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  X,
  Globe, Lock, Search, Users, Calendar, ArrowLeft
} from 'lucide-react';
import PostMediaGallery from '../components/Posts/PostMediaGallery';
import PostComposer from '../components/Posts/PostComposer';
import PostContentBody from '../components/Posts/PostContentBody';
import { AnimatedPostMenuIcon } from '../components/Posts/PostMenuAnimatedIcons';
import PostFeedActionButtons from '../components/Posts/PostFeedActionButtons';
import { PostCommentsSection } from '../components/Posts/PostCommentsSection';
import type { PostCoinAttachment } from '../types/postCoin';
import type { PostLinkAttachment } from '../types/postLink';
import { buildPostLightboxMeta } from '../utils/buildPostLightboxMeta';
import HomeSidebarPromoCarousel from '../components/Home/HomeSidebarPromoCarousel';
import HomeRecommendedCommunities from '../components/Home/HomeRecommendedCommunities';
import PixelTrail from '../components/Home/PixelTrail';
import FloatingMenu from '../components/Common/FloatingMenu';
import EditTextModal from '../components/Common/EditTextModal';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import MobileBottomSheet from '../components/Common/MobileBottomSheet';
import { useMediaQuery } from '../hooks/useMediaQuery';

import { POSTS_API as API_URL, USERS_API } from '../config/api';
import { useTranslation } from '../i18n/useTranslation';

/** Temporary: hide home feed while under construction */
const HOME_FEED_UNDER_MAINTENANCE = true;

interface PostComment {
  _id: string;
  content: string;
  createdAt: string;
  likesCount?: number;
  parentId?: string | null;
  user: {
    _id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
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
  community?: {
    _id: string;
    name: string;
    handle: string;
    avatar: string;
  } | null;
  likesCount: number;
  commentsCount: number;
  comments?: PostComment[];
  repostsCount: number;
  viewsCount: number;
  media: string[];
  linkAttachment?: import('../types/postLink').PostLinkAttachment | null;
  coinAttachment?: PostCoinAttachment | null;
  createdAt: string;
  isLiked?: boolean;
  isReposted?: boolean;
  isPrivate?: boolean;
}

interface SuggestedUser {
  _id: string;
  username: string;
  fullName: string;
  avatar: string;
  followersCount: number;
}

const Home: React.FC = () => {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [repostedPosts, setRepostedPosts] = useState<Set<string>>(new Set());
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState('');
  const [inlineCommentText, setInlineCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentsLoadingPostId, setCommentsLoadingPostId] = useState<string | null>(null);
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [menuOpenPostId, setMenuOpenPostId] = useState<string | null>(null);
  const [openCommentMenu, setOpenCommentMenu] = useState<{
    commentId: string;
    postId: string;
    content: string;
    rect: DOMRect;
  } | null>(null);
  const [editCommentTarget, setEditCommentTarget] = useState<{
    postId: string;
    commentId: string;
    content: string;
  } | null>(null);
  const [editCommentSaving, setEditCommentSaving] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState<string[]>([]);
  const [newPostLink, setNewPostLink] = useState<PostLinkAttachment | null>(null);
  const [newPostCoin, setNewPostCoin] = useState<PostCoinAttachment | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const isLgUp = useMediaQuery('(min-width: 1024px)');
  const mobileComposerFull = isCreateOpen && !isLgUp;

  // Закрытие меню поста при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenPostId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCommentsForPost = useCallback(async (postId: string) => {
    setCommentsLoadingPostId(postId);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/${postId}`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      const comments: PostComment[] = data.comments || [];
      setPosts((prev) =>
        prev.map((p) =>
          String(p._id) === postId
            ? { ...p, comments, commentsCount: data.commentsCount ?? p.commentsCount }
            : p
        )
      );
      setSelectedPost((prev) =>
        prev && String(prev._id) === postId
          ? { ...prev, ...data, comments }
          : prev
      );
    } catch (err) {
      console.error('Fetch post details error:', err);
    } finally {
      setCommentsLoadingPostId((cur) => (cur === postId ? null : cur));
    }
  }, [token]);

  useEffect(() => {
    const postId = selectedPost?._id;
    if (!postId) {
      setCommentText('');
      setOpenCommentMenu(null);
      return;
    }
    setCommentText('');
    void loadCommentsForPost(String(postId));
  }, [selectedPost?._id, loadCommentsForPost]);

  // Загрузка постов
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}?feed=ranked&limit=60`, { headers });
      if (!res.ok) throw new Error(t('common.failedToFetchPosts'));

      const data = await res.json();
      setPosts(data);
      
      // ВАЖНО: Загружаем начальное состояние лайков и репостов из данных с сервера
      const likedIds = new Set<string>();
      const repostedIds = new Set<string>();
      data.forEach((post: Post) => {
        const pid = String(post._id);
        if (post.isLiked) likedIds.add(pid);
        if (post.isReposted) repostedIds.add(pid);
      });
      
      console.log('Loaded liked posts from server:', Array.from(likedIds));
      console.log('Loaded reposted posts from server:', Array.from(repostedIds));
      
      setLikedPosts(likedIds);
      setRepostedPosts(repostedIds);
    } catch (err) {
      console.error('Fetch posts error:', err);
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  // Загрузка suggested users
  const fetchSuggestedUsers = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${USERS_API}/suggested`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestedUsers(data.users || []);
      }
    } catch (err) {
      console.error('Fetch suggested users error:', err);
    }
  }, [token]);

  useEffect(() => {
    if (HOME_FEED_UNDER_MAINTENANCE) {
      setLoading(false);
      return;
    }
    fetchPosts();
    fetchSuggestedUsers();
  }, [fetchPosts, fetchSuggestedUsers]);

  const closeComposer = useCallback(() => {
    setIsCreateOpen(false);
    setNewPostContent('');
    setNewPostMedia([]);
    setNewPostLink(null);
    setNewPostCoin(null);
  }, []);

  const handleLike = async (postId: string) => {
    if (!token) {
      window.dispatchEvent(new CustomEvent('openLogin'));
      return;
    }
    const id = String(postId);
    try {
      const res = await fetch(`${API_URL}/${id}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          if (data.liked) {
            newSet.add(id);
          } else {
            newSet.delete(id);
          }
          return newSet;
        });
        setPosts(prev => prev.map(post => 
          String(post._id) === id ? { ...post, likesCount: data.likesCount, isLiked: data.liked } : post
        ));
        if (selectedPost && String(selectedPost._id) === id) {
          setSelectedPost(prev => prev ? { ...prev, likesCount: data.likesCount, isLiked: data.liked } : null);
        }
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
      const res = await fetch(`${API_URL}/${id}/repost`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRepostedPosts(prev => {
          const newSet = new Set(prev);
          if (data.reposted) {
            newSet.add(id);
          } else {
            newSet.delete(id);
          }
          return newSet;
        });
        setPosts(prev => prev.map(post => 
          String(post._id) === id ? { ...post, repostsCount: data.repostsCount, isReposted: data.reposted } : post
        ));
        if (selectedPost && String(selectedPost._id) === id) {
          setSelectedPost(prev => prev ? { ...prev, repostsCount: data.repostsCount, isReposted: data.reposted } : null);
        }
      }
    } catch (err) {
      console.error('Repost error:', err);
    }
  };

  const getPostFromState = (postId: string): Post | undefined => {
    const fromFeed = posts.find((p) => String(p._id) === postId);
    if (fromFeed) return fromFeed;
    if (selectedPost && String(selectedPost._id) === postId) return selectedPost;
    return undefined;
  };

  const updateCommentsOnPost = (postId: string, comments: PostComment[], commentsCount: number) => {
    setSelectedPost((prev) =>
      prev && String(prev._id) === postId
        ? { ...prev, comments, commentsCount }
        : prev
    );
    setPosts((prev) =>
      prev.map((p) => (String(p._id) === postId ? { ...p, comments, commentsCount } : p))
    );
  };

  const handleSubmitComment = async (
    postId: string,
    source: 'inline' | 'sidebar',
    options?: { parentId?: string | null; content?: string },
  ) => {
    if (!token) {
      window.dispatchEvent(new CustomEvent('openLogin'));
      return;
    }
    const text =
      options?.content ?? (source === 'inline' ? inlineCommentText : commentText);
    if (!text.trim() || commentSubmitting) return;

    const id = String(postId);
    const current = getPostFromState(id);
    const parentId = options?.parentId ? String(options.parentId) : undefined;
    try {
      setCommentSubmitting(true);
      const res = await fetch(`${API_URL}/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: text.trim(),
          ...(parentId ? { parentId } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t('common.failedToPostComment'));

      if (!options?.content) {
        if (source === 'inline') setInlineCommentText('');
        else setCommentText('');
      }

      const nextComments = [...(current?.comments || []), data.comment];
      updateCommentsOnPost(id, nextComments, data.commentsCount);
    } catch (err: unknown) {
      console.error('Comment error:', err);
      showToast(err instanceof Error ? err.message : t('common.failedToPostComment'), 'error');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const toggleFeedComments = (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const id = String(postId);
    if (expandedCommentsPostId === id) {
      setExpandedCommentsPostId(null);
      setInlineCommentText('');
      return;
    }
    setExpandedCommentsPostId(id);
    setInlineCommentText('');
    void loadCommentsForPost(id);
  };

  const copyPostLink = (postId: string) => {
    const link = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(link).then(() => {
      showToast(t('common.linkCopied'));
    }).catch(() => {
      showToast(t('common.copyLinkFailed'), 'error');
    });
  };

  const isPostOwner = (post: Post) => {
    if (!user) return false;
    return user.username === post.author.username || user.id === post.author._id;
  };

  const isCommentOwner = (comment: PostComment) => {
    if (!user) return false;
    if (user.username === comment.user.username) return true;
    if (user.id && comment.user._id && String(user.id) === String(comment.user._id)) return true;
    if ((user as { _id?: string })._id && String((user as { _id?: string })._id) === String(comment.user._id)) {
      return true;
    }
    return false;
  };

  const submitEditComment = async (newContent: string) => {
    if (!editCommentTarget || !token) return;

    const { postId, commentId } = editCommentTarget;
    const current = getPostFromState(String(postId));
    if (!current) return;

    const id = String(postId);
    setEditCommentSaving(true);
    try {
      const res = await fetch(`${API_URL}/${id}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newContent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t('common.failedToEditComment'));

      const nextComments = (current.comments || []).map((c) =>
        String(c._id) === commentId ? data.comment : c
      );
      updateCommentsOnPost(id, nextComments, data.commentsCount ?? current.commentsCount);
      setEditCommentTarget(null);
      showToast(t('common.commentUpdated'));
    } catch (err: unknown) {
      console.error('Edit comment error:', err);
      showToast(err instanceof Error ? err.message : t('common.failedToEditComment'), 'error');
    } finally {
      setEditCommentSaving(false);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    setOpenCommentMenu(null);
    if (!token) return;
    const confirmed = await confirm({
      title: t('common.deleteCommentTitle'),
      message: t('common.deleteCommentMessage'),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!confirmed) return;

    const current = getPostFromState(String(postId));
    if (!current) return;

    const id = String(postId);
    try {
      const res = await fetch(`${API_URL}/${id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t('common.failedToDeleteComment'));

      const nextComments = (current.comments || []).filter(
        (c) =>
          String(c._id) !== commentId &&
          String(c.parentId || '') !== commentId,
      );
      updateCommentsOnPost(id, nextComments, data.commentsCount);
      showToast(t('common.commentDeleted'));
    } catch (err: unknown) {
      console.error('Delete comment error:', err);
      showToast(err instanceof Error ? err.message : t('common.failedToDeleteComment'), 'error');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!token) return;
    const confirmed = await confirm({
      title: t('common.deletePostTitle'),
      message: t('common.deletePostMessage'),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_URL}/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error(t('common.failedToDeletePost'));

      setPosts(prev => prev.filter(p => p._id !== postId));
      if (selectedPost?._id === postId) setSelectedPost(null);
      if (String(expandedCommentsPostId) === String(postId)) setExpandedCommentsPostId(null);
      setMenuOpenPostId(null);
      showToast(t('common.postDeleted'));
    } catch (err: unknown) {
      console.error('Delete post error:', err);
      showToast(err instanceof Error ? err.message : t('common.failedToDeletePost'), 'error');
    }
  };

  const handleCreatePost = async () => {
    const hasLink = Boolean(newPostLink?.title?.trim() && newPostLink?.url?.trim());
    const hasCoin = Boolean(
      newPostCoin?.coinId?.trim() && newPostCoin?.name?.trim() && newPostCoin?.symbol?.trim()
    );
    if ((!newPostContent.trim() && newPostMedia.length === 0 && !hasLink && !hasCoin) || !token || isPosting) return;
    try {
      setIsPosting(true);
      const res = await fetch(API_URL, {
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
      if (res.status === 401) {
        window.dispatchEvent(new CustomEvent('openLogin'));
        throw new Error(t('common.signInRequired'));
      }
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(
          (errBody as { message?: string }).message || t('common.failedToCreatePost'),
        );
      }
      
      const newPost = await res.json();
      setPosts(prev => [newPost, ...prev]);
      setNewPostContent('');
      setNewPostMedia([]);
      setNewPostLink(null);
      setNewPostCoin(null);
      setIsCreateOpen(false);
      showToast(t('common.postPublished'));
    } catch (err: unknown) {
      console.error('Create post error:', err);
      showToast(err instanceof Error ? err.message : t('common.failedToCreatePost'), 'error');
    } finally {
      setIsPosting(false);
    }
  };

  const renderCommentsPanel = (
    post: Post,
    options: {
      variant: 'feed' | 'sidebar';
      part?: 'all' | 'list' | 'composer';
      text: string;
      onTextChange: (value: string) => void;
      onSubmit: () => void;
    }
  ) => {
    const postId = String(post._id);
    return (
      <PostCommentsSection
        post={post}
        variant={options.variant}
        part={options.part}
        text={options.text}
        onTextChange={options.onTextChange}
        onSubmit={options.onSubmit}
        onSubmitReply={(parentId, content) =>
          void handleSubmitComment(postId, options.variant === 'feed' ? 'inline' : 'sidebar', {
            parentId,
            content,
          })
        }
        token={token}
        commentSubmitting={commentSubmitting}
        commentsLoading={commentsLoadingPostId === postId}
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
    );
  };

  const formatPostDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const loc = locale === 'ru' ? 'ru-RU' : 'en-US';
    if (diff < 0) {
      return date.toLocaleDateString(loc, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
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

  const renderSelectedPostDetail = (post: Post) => {
    const isCommunityPost = post.community && !post.isPrivate;
    const displayName = isCommunityPost ? post.community!.name : post.author.fullName;
    const displayAvatar = isCommunityPost
      ? post.community!.avatar ||
        `https://ui-avatars.com/api/?name=${post.community!.name}&background=315efb&color=fff&size=48&bold=true`
      : post.author.avatar ||
        `https://ui-avatars.com/api/?name=${post.author.fullName}&background=000&color=fff&size=48&bold=true`;
    const profileLink = isCommunityPost
      ? `/community/${post.community!.handle}`
      : `/@${post.author.username}`;

    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white lg:rounded-2xl lg:border lg:border-neutral-200 lg:shadow-sm">
        <div className="hidden lg:flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 bg-white/80 p-4 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setSelectedPost(null)}
            className="group flex items-center gap-1 font-medium text-neutral-500 transition-colors hover:text-black"
          >
            <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-0.5" />
            <span>{t('common.back')}</span>
          </button>
          <button
            type="button"
            onClick={() => copyPostLink(String(post._id))}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-black"
            aria-label={t('home.copyPostLinkAria')}
            title={t('home.copyLinkTitle')}
          >
            <AnimatedPostMenuIcon kind="link" size={18} />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-2">
            <div className="mb-4 flex items-center gap-3">
              <Link to={profileLink} onClick={() => setSelectedPost(null)}>
                <img src={displayAvatar} alt={displayName} className="h-12 w-12 rounded-full object-cover" />
              </Link>
              <div>
                <Link
                  to={profileLink}
                  onClick={() => setSelectedPost(null)}
                  className="font-bold hover:underline"
                >
                  {displayName}
                </Link>
                <p className="text-xs text-neutral-500">
                  {new Date(post.createdAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            <PostContentBody
              content={post.content}
              linkAttachment={post.linkAttachment}
              coinAttachment={post.coinAttachment}
            />

            {post.media && post.media.length > 0 && (
              <div className="mt-3">
                <PostMediaGallery media={post.media} meta={buildPostLightboxMeta(post)} className="!mt-0" />
              </div>
            )}

            <div className="mt-4 flex items-center gap-4 border-t border-neutral-100 py-4 text-sm">
              <span>
                <span className="font-bold text-neutral-900">{formatCount(post.repostsCount)}</span>
                <span className="ml-1 text-neutral-500">{t('home.reposts')}</span>
              </span>
              <span>
                <span className="font-bold text-neutral-900">{formatCount(post.likesCount)}</span>
                <span className="ml-1 text-neutral-500">{t('home.likesLabel')}</span>
              </span>
              <span>
                <span className="font-bold text-neutral-900">{formatCount(post.commentsCount || 0)}</span>
                <span className="ml-1 text-neutral-500">{t('home.commentsLabel')}</span>
              </span>
            </div>

            <div className="mt-2 border-t border-neutral-100 pt-4">
              {renderCommentsPanel(post, {
                variant: 'sidebar',
                part: 'list',
                text: commentText,
                onTextChange: setCommentText,
                onSubmit: () => void handleSubmitComment(String(post._id), 'sidebar'),
              })}
            </div>
          </div>
          <div className="shrink-0 border-t border-neutral-200 bg-white px-4 py-3">
            {renderCommentsPanel(post, {
              variant: 'sidebar',
              part: 'composer',
              text: commentText,
              onTextChange: setCommentText,
              onSubmit: () => void handleSubmitComment(String(post._id), 'sidebar'),
            })}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-300 border-t-black"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[1200px] gap-6">
      {/* LEFT COLUMN — feed */}
      <div className="flex h-full min-h-0 max-w-[600px] flex-1 flex-col border-x border-neutral-200 bg-white">
        {/* Header */}
        <div className="z-10 shrink-0 border-b border-neutral-200 bg-white/80 backdrop-blur-md">
          <div className="px-4 py-3">
            <h1 className="text-xl font-bold">{t('home.title')}</h1>
          </div>
        </div>

        {!HOME_FEED_UNDER_MAINTENANCE && (
          <PostComposer
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

        {/* Posts Feed */}
        <div
          className={`min-h-0 flex-1 ${
            HOME_FEED_UNDER_MAINTENANCE ? 'overflow-hidden' : `overflow-y-auto ${mobileComposerFull ? 'hidden' : ''}`
          }`}
        >
          {HOME_FEED_UNDER_MAINTENANCE ? (
            <div className="flex h-full min-h-0 flex-col items-center px-4 py-6 text-center sm:px-8 sm:py-8">
              <p className="max-w-md shrink-0 text-lg font-semibold text-neutral-900 sm:text-xl">
                {t('home.feedMaintenanceTitle')}
              </p>
              <p className="mt-2 max-w-md shrink-0 text-sm text-neutral-500 sm:text-base">
                {t('home.feedMaintenanceBody')}
              </p>
              <div className="mt-6 flex min-h-0 w-full max-w-lg flex-1 items-center justify-center">
                <video
                  className="max-h-full max-w-full object-contain"
                  src="/edit-video.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              </div>
            </div>
          ) : (
            <>
          <HomeRecommendedCommunities />
          {posts.length > 0 ? posts.map(post => {
            // Определяем, отображать ли от имени сообщества
            const displayAsCommunity = post.community && !post.isPrivate;
            const displayName = displayAsCommunity ? post.community!.name : post.author.fullName;
            const displayUsername = displayAsCommunity ? `@${post.community!.handle}` : `@${post.author.username}`;
            const displayAvatar = displayAsCommunity 
              ? (post.community!.avatar || `https://ui-avatars.com/api/?name=${post.community!.name}&background=315efb&color=fff&size=40&bold=true`)
              : (post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.fullName}&background=000&color=fff&size=40&bold=true`);
            const profileLink = displayAsCommunity ? `/community/${post.community!.handle}` : `/@${post.author.username}`;
            
            return (
              <article 
                key={post._id}
                onClick={() => setSelectedPost(post)}
                className={`post-feed-card p-4 transition-colors border-b border-neutral-200 group/article cursor-pointer
                  ${selectedPost?._id === post._id ? 'bg-neutral-50' : ''}
                `}
              >
                <div className="flex space-x-3">
                  <Link to={profileLink} onClick={(e) => e.stopPropagation()}>
                    <img 
                      src={displayAvatar}
                      alt={displayName} 
                      className="w-6 h-6 rounded-full hover:opacity-90 transition-opacity object-cover"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <Link 
                        to={profileLink} 
                        className="font-bold hover:underline truncate text-neutral-900"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {displayName}
                      </Link>
                      <span className="text-neutral-500 truncate">{displayUsername}</span>
                      <span className="text-neutral-500">·</span>
                      <span className="text-neutral-500 whitespace-nowrap">{formatPostDate(post.createdAt)}</span>
                      
                      {post.isPrivate && (
                        <span className="ml-2 flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          <Lock size={10} />
                          {t('home.private')}
                        </span>
                      )}
                      
                      {!displayAsCommunity && post.community && (
                        <span className="ml-2 flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                          <Globe size={10} />
                          {t('common.via')} {post.community.name}
                        </span>
                      )}
                      
                      <div className="ml-auto relative" ref={menuOpenPostId === post._id ? menuRef : null}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setMenuOpenPostId(menuOpenPostId === post._id ? null : post._id); }}
                          className={`post-feed-card-menu flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all ${
                            menuOpenPostId === post._id 
                              ? 'bg-black/10 text-black opacity-100' 
                              : 'text-neutral-500 opacity-60 hover:bg-black/5 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/article:opacity-100'
                          }`}
                        >
                          <AnimatedPostMenuIcon kind="ellipsis" size={16} />
                        </button>
                        
                        {menuOpenPostId === post._id && (
                          <div 
                            className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-neutral-200 p-1 z-50 shadow-lg"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                copyPostLink(post._id);
                                setMenuOpenPostId(null);
                              }}
                              className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-2"
                            >
                              <AnimatedPostMenuIcon kind="link" size={14} />
                              {t('home.copyLink')}
                            </button>
                            {isPostOwner(post) && !displayAsCommunity && (
                              <>
                                <div className="h-px bg-neutral-100 my-1"></div>
                                <button
                                  onClick={() => handleDeletePost(post._id)}
                                  className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 text-red-600"
                                >
                                  <AnimatedPostMenuIcon kind="trash" size={14} color="#dc2626" />
                                  {t('home.delete')}
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
                      <PostMediaGallery
                        media={post.media}
                        meta={buildPostLightboxMeta(post)}
                      />
                    )}

                    <PostFeedActionButtons
                      postId={String(post._id)}
                      likesCount={post.likesCount || 0}
                      commentsCount={post.commentsCount || 0}
                      repostsCount={post.repostsCount || 0}
                      liked={likedPosts.has(String(post._id))}
                      reposted={repostedPosts.has(String(post._id))}
                      commentsExpanded={expandedCommentsPostId === String(post._id)}
                      formatCount={formatCount}
                      onLike={handleLike}
                      onToggleComments={toggleFeedComments}
                      onRepost={handleRepost}
                    />

                    {expandedCommentsPostId === String(post._id) &&
                      renderCommentsPanel(post, {
                        variant: 'feed',
                        text: inlineCommentText,
                        onTextChange: setInlineCommentText,
                        onSubmit: () => void handleSubmitComment(String(post._id), 'inline'),
                      })}
                  </div>
                </div>
              </article>
            );
          }) : (
            <div className="text-center py-20 px-4">
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">{t('home.emptyFeedTitle')}</h2>
              <p className="text-neutral-500">{t('home.emptyFeedSubtitle')}</p>
            </div>
          )}
            </>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN — post details + market promo */}
      <div className="hidden h-full min-h-0 w-[400px] shrink-0 flex-col gap-4 py-4 pr-4 lg:flex">
        <div className="flex min-h-0 flex-1 flex-col">
          {HOME_FEED_UNDER_MAINTENANCE ? (
            <div className="relative h-full min-h-0 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <video
                className="absolute inset-0 h-full w-full object-cover"
                src="/error-video.mp4"
                autoPlay
                muted
                loop
                playsInline
              />
              <div className="absolute inset-0">
                <PixelTrail
                  gridSize={50}
                  trailSize={0.1}
                  maxAge={250}
                  interpolate={5}
                  color="#5227FF"
                  gooeyFilter={{ id: 'home-maintenance-goo-filter', strength: 2 }}
                />
              </div>
            </div>
          ) : selectedPost ? (
            renderSelectedPostDetail(selectedPost)
          ) : (
            <div className="flex h-full min-h-0 items-center justify-center rounded-2xl border border-neutral-200 bg-white px-6 text-neutral-500 shadow-sm">
              <p className="text-center">{t('home.selectPostDetails')}</p>
            </div>
          )}
        </div>
        <HomeSidebarPromoCarousel />
      </div>

      <MobileBottomSheet
        open={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        title={t('postPage.title')}
      >
        {selectedPost ? renderSelectedPostDetail(selectedPost) : null}
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
            setOpenCommentMenu(null);
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
        >
          <AnimatedPostMenuIcon kind="trash" size={14} color="#dc2626" />
          {t('common.delete')}
        </button>
      </FloatingMenu>

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

export default Home;
