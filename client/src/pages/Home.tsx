import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  MessageCircle, Repeat2, Heart, 
  Smile, Send, X,
  MoreHorizontal, Pen, Trash, Unlink2,
  Globe, Lock, Search, Users, Calendar, ArrowLeft
} from 'lucide-react';
import PostMediaUpload from '../components/Posts/PostMediaUpload';
import PostMediaGallery from '../components/Posts/PostMediaGallery';
import { buildPostLightboxMeta } from '../utils/buildPostLightboxMeta';
import HomeSidebarPromoCarousel from '../components/Home/HomeSidebarPromoCarousel';
import FloatingMenu from '../components/Common/FloatingMenu';
import EditTextModal from '../components/Common/EditTextModal';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import MobileBottomSheet from '../components/Common/MobileBottomSheet';

import { POSTS_API as API_URL, USERS_API } from '../config/api';


interface PostComment {
  _id: string;
  content: string;
  createdAt: string;
  likesCount?: number;
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
  const [isPosting, setIsPosting] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

      const res = await fetch(API_URL, { headers });
      if (!res.ok) throw new Error('Failed to fetch posts');

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
  }, [token]);

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
    fetchPosts();
    fetchSuggestedUsers();
  }, [fetchPosts, fetchSuggestedUsers]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [newPostContent]);

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

  const handleSubmitComment = async (postId: string, source: 'inline' | 'sidebar') => {
    if (!token) {
      window.dispatchEvent(new CustomEvent('openLogin'));
      return;
    }
    const text = source === 'inline' ? inlineCommentText : commentText;
    if (!text.trim() || commentSubmitting) return;

    const id = String(postId);
    const current = getPostFromState(id);
    try {
      setCommentSubmitting(true);
      const res = await fetch(`${API_URL}/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to post comment');

      if (source === 'inline') setInlineCommentText('');
      else setCommentText('');

      const nextComments = [...(current?.comments || []), data.comment];
      updateCommentsOnPost(id, nextComments, data.commentsCount);
    } catch (err: unknown) {
      console.error('Comment error:', err);
      showToast(err instanceof Error ? err.message : 'Failed to post comment', 'error');
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
      showToast('Link copied to clipboard!');
    }).catch(() => {
      showToast('Could not copy link automatically', 'error');
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
      if (!res.ok) throw new Error(data.message || 'Failed to update comment');

      const nextComments = (current.comments || []).map((c) =>
        String(c._id) === commentId ? data.comment : c
      );
      updateCommentsOnPost(id, nextComments, data.commentsCount ?? current.commentsCount);
      setEditCommentTarget(null);
      showToast('Comment updated');
    } catch (err: unknown) {
      console.error('Edit comment error:', err);
      showToast(err instanceof Error ? err.message : 'Failed to edit comment', 'error');
    } finally {
      setEditCommentSaving(false);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    setOpenCommentMenu(null);
    if (!token) return;
    const confirmed = await confirm({
      title: 'Delete comment?',
      message: 'This cannot be undone. The comment will be removed from the post.',
      confirmLabel: 'Delete',
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
      if (!res.ok) throw new Error(data.message || 'Failed to delete comment');

      const nextComments = (current.comments || []).filter(
        (c) => String(c._id) !== commentId
      );
      updateCommentsOnPost(id, nextComments, data.commentsCount);
      showToast('Comment deleted');
    } catch (err: unknown) {
      console.error('Delete comment error:', err);
      showToast(err instanceof Error ? err.message : 'Failed to delete comment', 'error');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!token) return;
    const confirmed = await confirm({
      title: 'Delete post?',
      message: 'This post will be permanently removed from your feed and profile.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_URL}/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to delete post');

      setPosts(prev => prev.filter(p => p._id !== postId));
      if (selectedPost?._id === postId) setSelectedPost(null);
      if (String(expandedCommentsPostId) === String(postId)) setExpandedCommentsPostId(null);
      setMenuOpenPostId(null);
      showToast('Post deleted');
    } catch (err: unknown) {
      console.error('Delete post error:', err);
      showToast(err instanceof Error ? err.message : 'Failed to delete post', 'error');
    }
  };

  const handleCreatePost = async () => {
    if ((!newPostContent.trim() && newPostMedia.length === 0) || !token || isPosting) return;
    try {
      setIsPosting(true);
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newPostContent, media: newPostMedia })
      });
      if (!res.ok) throw new Error('Failed to create post');
      
      const newPost = await res.json();
      setPosts(prev => [newPost, ...prev]);
      setNewPostContent('');
      setNewPostMedia([]);
      setIsCreateOpen(false);
      showToast('Post published');
    } catch (err: unknown) {
      console.error('Create post error:', err);
      showToast(err instanceof Error ? err.message : 'Failed to create post', 'error');
    } finally {
      setIsPosting(false);
    }
  };

  const renderCommentComposer = (options: {
    variant: 'feed' | 'sidebar';
    text: string;
    onTextChange: (value: string) => void;
    onSubmit: () => void;
  }) => (
    <div
      className={options.variant === 'feed' ? 'flex gap-2 border-t border-neutral-100 pt-3' : 'flex gap-2'}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="text"
        value={options.text}
        onChange={(e) => options.onTextChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            options.onSubmit();
          }
        }}
        onClick={(e) => e.stopPropagation()}
        placeholder={token ? 'Write a comment…' : 'Sign in to comment'}
        disabled={!token || commentSubmitting}
        className="min-w-0 flex-1 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm outline-none focus:border-black/30 focus:ring-2 focus:ring-black/5 disabled:opacity-60"
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          options.onSubmit();
        }}
        disabled={!token || !options.text.trim() || commentSubmitting}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {commentSubmitting ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <Send size={16} />
        )}
      </button>
    </div>
  );

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
    const isLoading = commentsLoadingPostId === postId;
    const part = options.part ?? 'all';

    if (part === 'composer') {
      return renderCommentComposer({
        variant: options.variant,
        text: options.text,
        onTextChange: options.onTextChange,
        onSubmit: options.onSubmit,
      });
    }

    const listMaxHeight = options.variant === 'feed' ? 'max-h-[240px]' : '';

    return (
      <div
        className={options.variant === 'feed' ? 'mt-3 pt-3 border-t border-neutral-200' : ''}
        onClick={(e) => e.stopPropagation()}
      >
        {options.variant === 'sidebar' && (
          <p className="text-sm font-semibold text-neutral-900 mb-3">Comments</p>
        )}
        <div className={`overflow-y-auto ${listMaxHeight} pr-1 -mr-1`}>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-neutral-300 border-t-black" />
            </div>
          ) : (
            <>
              {(!post.comments || post.comments.length === 0) && (
                <p className="py-4 text-center cursor-default text-sm text-neutral-500">
                  No comments yet. Be the first to comment!
                </p>
              )}
              <ul className={`space-y-3 ${options.variant === 'feed' ? 'mb-2' : 'mb-4'}`}>
                {(post.comments || []).map((c) => (
                  <li key={c._id} className="flex gap-2 text-sm group/comment">
                    <Link to={`/@${c.user.username}`} className="shrink-0" onClick={(e) => e.stopPropagation()}>
                      <img
                        src={
                          c.user.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user.fullName || c.user.username)}&background=000&color=fff&size=${options.variant === 'feed' ? 32 : 24}&bold=true`
                        }
                        alt={c.user.fullName}
                        className={`${options.variant === 'feed' ? 'w-8 h-8' : 'w-6 h-6'} rounded-full object-cover`}
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-1">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-neutral-900">
                            <Link
                              to={`/@${c.user.username}`}
                              className="hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {c.user.fullName}
                            </Link>
                            {options.variant === 'sidebar' ? (
                              <>
                                <span className="text-neutral-500 px-1">·</span>
                                <span className="text-neutral-500 font-normal">{formatPostDate(c.createdAt)}</span>
                              </>
                            ) : (
                              <span className="text-neutral-500 font-normal ml-1">@{c.user.username}</span>
                            )}
                          </p>
                          {options.variant === 'feed' && (
                            <p className="mt-0.5 text-xs text-neutral-400">{formatPostDate(c.createdAt)}</p>
                          )}
                          <p className="text-neutral-800 whitespace-pre-wrap break-words">{c.content}</p>
                        </div>
                        {isCommentOwner(c) && (
                          <div
                            className="relative shrink-0"
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const btn = e.currentTarget;
                                setOpenCommentMenu((prev) =>
                                  prev?.commentId === c._id
                                    ? null
                                    : {
                                        commentId: c._id,
                                        postId,
                                        content: c.content,
                                        rect: btn.getBoundingClientRect(),
                                      }
                                );
                              }}
                              className={`p-1 rounded-full transition-all ${
                                openCommentMenu?.commentId === c._id
                                  ? 'bg-black/10 text-black opacity-100'
                                  : 'text-neutral-500 opacity-0 group-hover/comment:opacity-100 hover:bg-black/5'
                              }`}
                              aria-expanded={openCommentMenu?.commentId === c._id}
                              aria-haspopup="menu"
                            >
                              <MoreHorizontal size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        {part === 'all' &&
          renderCommentComposer({
            text: options.text,
            onTextChange: options.onTextChange,
            onSubmit: options.onSubmit,
            variant: options.variant,
          })}
      </div>
    );
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
            <span>Back</span>
          </button>
          <button
            type="button"
            onClick={() => copyPostLink(String(post._id))}
            className="rounded-full p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-black"
            aria-label="Copy post link"
            title="Copy link"
          >
            <Unlink2 size={18} />
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
                  {new Date(post.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {post.content?.trim() ? (
              <p className="whitespace-pre-wrap break-words text-base leading-relaxed text-neutral-900">
                {post.content}
              </p>
            ) : null}

            {post.media && post.media.length > 0 && (
              <div className="mt-3">
                <PostMediaGallery media={post.media} meta={buildPostLightboxMeta(post)} className="!mt-0" />
              </div>
            )}

            <div className="mt-4 flex items-center gap-4 border-t border-neutral-100 py-4 text-sm">
              <span>
                <span className="font-bold text-neutral-900">{formatCount(post.repostsCount)}</span>
                <span className="ml-1 text-neutral-500">Reposts</span>
              </span>
              <span>
                <span className="font-bold text-neutral-900">{formatCount(post.likesCount)}</span>
                <span className="ml-1 text-neutral-500">Likes</span>
              </span>
              <span>
                <span className="font-bold text-neutral-900">{formatCount(post.commentsCount || 0)}</span>
                <span className="ml-1 text-neutral-500">Comments</span>
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
            <h1 className="text-xl font-bold">Home</h1>
          </div>
        </div>

        {/* Create Post */}
        {!isCreateOpen ? (
          <div
            onClick={() => setIsCreateOpen(true)}
            className="shrink-0 cursor-pointer border-b border-neutral-200 p-4 transition-colors hover:bg-neutral-50"
          >
            <div className="flex gap-3">
              <img 
                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.fullName || 'User'}&background=000&color=fff&size=40&bold=true`}
                alt=""
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <p className="text-neutral-500 text-base">What's on your mind?</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="shrink-0 border-b border-neutral-200 bg-neutral-50 p-4">
            <div className="flex gap-3">
              <img 
                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.fullName || 'User'}&background=000&color=fff&size=40&bold=true`}
                alt=""
                className="w-10 h-10 rounded-full flex-shrink-0"
              />
              <div className="flex-1">
                <textarea 
                  ref={textareaRef}
                  value={newPostContent} 
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="What's on your mind?" 
                  className="w-full resize-none outline-none text-neutral-900 bg-transparent placeholder:text-neutral-500 min-h-[100px] text-base"
                  maxLength={2000} 
                  autoFocus 
                />
                <PostMediaUpload
                  urls={newPostMedia}
                  onUrlsChange={setNewPostMedia}
                  token={token}
                />
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-200">
                  <div className="flex items-center gap-2">
                    <button type="button" className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-500">
                      <Smile size={18} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setIsCreateOpen(false); setNewPostContent(''); setNewPostMedia([]); }} 
                      className="px-4 py-2 rounded-full text-sm font-semibold hover:bg-neutral-100 transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleCreatePost} disabled={(!newPostContent.trim() && newPostMedia.length === 0) || isPosting}
                      className="px-5 py-2 bg-black text-white rounded-full text-sm font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center gap-2">
                      {isPosting ? (
                        <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>Posting...</>
                      ) : (
                        <>Post</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Posts Feed */}
        <div className="min-h-0 flex-1 overflow-y-auto">
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
                className={`p-4 hover:bg-neutral-50 transition-colors border-b border-neutral-200 group/article cursor-pointer
                  ${selectedPost?._id === post._id ? 'bg-neutral-50' : ''}
                `}
              >
                <div className="flex space-x-3">
                  <Link to={profileLink} onClick={(e) => e.stopPropagation()}>
                    <img 
                      src={displayAvatar}
                      alt={displayName} 
                      className="w-10 h-10 rounded-full hover:opacity-90 transition-opacity object-cover"
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
                          Private
                        </span>
                      )}
                      
                      {!displayAsCommunity && post.community && (
                        <span className="ml-2 flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                          <Globe size={10} />
                          via {post.community.name}
                        </span>
                      )}
                      
                      <div className="ml-auto relative" ref={menuOpenPostId === post._id ? menuRef : null}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setMenuOpenPostId(menuOpenPostId === post._id ? null : post._id); }}
                          className={`p-1 rounded-full transition-all ${
                            menuOpenPostId === post._id 
                              ? 'bg-black/10 text-black opacity-100' 
                              : 'text-neutral-500 opacity-0 group-hover/article:opacity-100 hover:bg-black/5'
                          }`}
                        >
                          <MoreHorizontal size={16} />
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
                              <Unlink2 size={14} />
                              Copy link
                            </button>
                            {isPostOwner(post) && !displayAsCommunity && (
                              <>
                                <div className="h-px bg-neutral-100 my-1"></div>
                                <button
                                  onClick={() => handleDeletePost(post._id)}
                                  className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 text-red-600"
                                >
                                  <Trash size={14} />
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {post.content?.trim() ? (
                      <p className="mt-1 text-neutral-900 leading-relaxed whitespace-pre-wrap break-words text-[15px]">
                        {post.content}
                      </p>
                    ) : null}

                    {post.media && post.media.length > 0 && (
                      <PostMediaGallery
                        media={post.media}
                        meta={buildPostLightboxMeta(post)}
                      />
                    )}

                    <div className="flex items-center gap-1 mt-1 max-w-md">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleLike(String(post._id)); }}
                        className={`flex items-center transition-colors group ${likedPosts.has(String(post._id)) ? 'text-red-500' : 'text-neutral-500 hover:text-red-500'}`}
                      >
                        <div className="p-2 rounded-full group-hover:bg-red-50 transition-colors">
                          <Heart size={16} fill={likedPosts.has(String(post._id)) ? 'currentColor' : 'none'} />
                        </div>
                        <span className="text-xs">{formatCount(post.likesCount || 0)}</span>
                      </button>

                      <button 
                        onClick={(e) => toggleFeedComments(String(post._id), e)} 
                        className={`flex items-center transition-colors group ${
                          expandedCommentsPostId === String(post._id)
                            ? 'text-black'
                            : 'text-neutral-500 hover:text-black'
                        }`}
                      >
                        <div className="p-2 rounded-full group-hover:bg-black/5 transition-colors">
                          <MessageCircle size={16} />
                        </div>
                        <span className="text-xs">{formatCount(post.commentsCount || 0)}</span>
                      </button>

                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRepost(String(post._id)); }}
                        className={`flex items-center transition-colors group ${
                          repostedPosts.has(String(post._id)) 
                          ? 'text-black'
                          : 'text-neutral-500 hover:text-black'
                        }`}
                      >
                        <div className="p-2 rounded-full group-hover:bg-black/5 transition-colors">
                          <Repeat2 size={16} fill={repostedPosts.has(String(post._id)) ? 'currentColor' : 'none'} />
                        </div>
                        <span className="text-xs">{formatCount(post.repostsCount || 0)}</span>
                      </button>
                    </div>

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
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">No posts yet</h2>
              <p className="text-neutral-500">Be the first to create a post!</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN — post details + market promo */}
      <div className="hidden h-full min-h-0 w-[400px] shrink-0 flex-col gap-4 py-4 pr-4 lg:flex">
        <div className="flex min-h-0 flex-1 flex-col">
        {selectedPost ? (
          renderSelectedPostDetail(selectedPost)
        ) : (
          <div className="flex h-full min-h-0 items-center justify-center rounded-2xl border border-neutral-200 bg-white px-6 text-neutral-500 shadow-sm">
            <p className="text-center">Select a post to view details</p>
          </div>
        )}
        </div>
        <HomeSidebarPromoCarousel />
      </div>

      <MobileBottomSheet
        open={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        title="Post"
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
          <Pen size={14} />
          Edit
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
          <Trash size={14} />
          Delete
        </button>
      </FloatingMenu>

      <EditTextModal
        isOpen={editCommentTarget !== null}
        title="Edit comment"
        description="Update your comment. Changes are visible to everyone."
        initialValue={editCommentTarget?.content ?? ''}
        placeholder="Write your comment…"
        maxLength={2000}
        submitLabel="Save comment"
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
