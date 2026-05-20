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
} from 'lucide-react';
import MobileBottomSheet from '../components/Common/MobileBottomSheet';
import FloatingMenu from '../components/Common/FloatingMenu';
import PostDetailPanel from '../components/Posts/PostDetailPanel';
import { PostCommentsSection } from '../components/Posts/PostCommentsSection';
import { usePostDetail } from '../hooks/usePostDetail';
import type { FeedPost } from '../types/postFeed';
import PostMediaGallery from '../components/Posts/PostMediaGallery';
import PostComposer from '../components/Posts/PostComposer';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { buildPostLightboxMeta } from '../utils/buildPostLightboxMeta';

import { USERS_API as API_URL, POSTS_API as POSTS_API_URL } from '../config/api';

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
  const menuRef = useRef<HTMLDivElement>(null);
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

  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState<string[]>([]);
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
      showToast('Link copied to clipboard!');
    }).catch(() => {
      showToast('Could not copy link automatically', 'error');
    });
  };

  const handleDeletePost = async (postId: string) => {
    setMenuOpenPostId(null);
    if (!token) return;
    const confirmed = await confirm({
      title: 'Delete post?',
      message: 'This post will be permanently removed from your profile.',
      confirmLabel: 'Delete',
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
        throw new Error(data.message || 'Failed to delete post');
      }

      setPosts((prev) => prev.filter((p) => String(p._id) !== postId));
      setReposts((prev) => prev.filter((p) => String(p._id) !== postId));
      onPostDeleted(postId);
      
      // Обновляем счетчик
      setProfile(prev => prev ? {
        ...prev,
        postsCount: Math.max(0, (prev.postsCount || 1) - 1)
      } : null);
      
      showToast('Post deleted');
    } catch (err: unknown) {
      console.error('Delete post error:', err);
      showToast(err instanceof Error ? err.message : 'Failed to delete post', 'error');
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
        throw new Error(data.message || 'Failed to update post');
      }

      const updatedPost = await res.json();
      patchPostInLists(postId, updatedPost);
      setEditPostTarget(null);
      showToast('Post updated');
    } catch (err: unknown) {
      console.error('Edit post error:', err);
      showToast(err instanceof Error ? err.message : 'Failed to edit post', 'error');
    } finally {
      setEditPostSaving(false);
    }
  };

  const fetchProfile = useCallback(async (cleanUsername: string) => {
    if (!cleanUsername || cleanUsername === 'undefined') {
      setLoading(false);
      setError('Invalid username');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`${API_URL}/${cleanUsername}`, { headers });
      if (!res.ok) {
        setError(res.status === 404 ? 'User not found' : 'Failed to load profile');
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
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [token]);

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
      setError('Invalid username');
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
  }, []);

  const handleCreatePost = async () => {
    if ((!newPostContent.trim() && newPostMedia.length === 0) || !token || isPosting) return;
    try {
      setIsPosting(true);
      const res = await fetch(POSTS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newPostContent, media: newPostMedia })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create post');
      }
      const newPost = await res.json();
      
      console.log('New post created:', newPost); // Проверь что author заполнен
      
      setPosts(prev => [newPost, ...prev]);
      setProfile(prev => prev ? { ...prev, postsCount: (prev.postsCount || 0) + 1 } : null);
      setNewPostContent('');
      setNewPostMedia([]);
      closeComposer();
      showToast('Post published');
    } catch (err: unknown) {
      console.error('Create post error:', err);
      showToast(err instanceof Error ? err.message : 'Failed to create post', 'error');
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
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
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

  const filteredFollowers = followers.filter(f => 
    f.fullName?.toLowerCase().includes(searchFollower.toLowerCase()) ||
    f.username?.toLowerCase().includes(searchFollower.toLowerCase())
  );

  const renderPostCard = (post: Post, options?: { showRepostBanner?: boolean }) => {
    const postId = String(post._id);
    const showRepostBanner = options?.showRepostBanner ?? false;

    return (
      <article
        key={postId}
        onClick={() => setSelectedPost(post)}
        className={`p-4 hover:bg-neutral-50 transition-colors border-b border-neutral-200 group/article cursor-pointer ${
          selectedPost?._id === post._id ? 'bg-neutral-50' : ''
        }`}
      >
        {showRepostBanner && profile && (
          <div className="flex items-center gap-2 mb-2 text-sm text-neutral-500">
            <Repeat2 size={14} className="text-green-600 shrink-0" />
            <Link to={`/@${profile.username}`} className="font-medium hover:underline text-neutral-700">
              {profile.fullName} reposted
            </Link>
          </div>
        )}
        <div className="flex space-x-3">
          <Link to={`/@${post.author.username}`} onClick={(e) => e.stopPropagation()}>
            <img
              src={post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.fullName}&background=000&color=fff&size=40&bold=true`}
              alt={post.author.fullName}
              className="h-6 w-6 rounded-full object-cover transition-opacity hover:opacity-90"
            />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              <Link to={`/@${post.author.username}`} className="font-bold hover:underline truncate" onClick={(e) => e.stopPropagation()}>
                {post.author.fullName}
              </Link>
              <span className="text-neutral-500 truncate">@{post.author.username}</span>
              <span className="text-neutral-500">·</span>
              <span className="text-neutral-500 whitespace-nowrap">{formatPostDate(post.createdAt)}</span>

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
                      Copy link
                    </button>
                    {isPostOwner(post) && (
                      <>
                        <button
                          onClick={() => openEditPost(postId, post.content)}
                          className="w-full text-left py-1 px-3 text-[14px] rounded hover:bg-black/5 transition-colors flex items-center gap-2"
                        >
                          <Pen className="h-3 w-3" />
                          Edit
                        </button>
                        <div className="h-px bg-neutral-100 my-1" />
                        <button
                          onClick={() => handleDeletePost(postId)}
                          className="w-full text-left px-3 py-1 text-[14px] rounded hover:bg-red-50 transition-colors flex items-center gap-2 text-red-600"
                        >
                          <Trash className="h-3 w-3" />
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
        <p className="text-xl text-neutral-500 mb-4">{error || 'Profile not found'}</p>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-black text-white rounded-full hover:bg-neutral-800 transition-colors">Back to Home</button>
      </div>
    );
  }

  const isOwnProfile = user?.username === profile.username;

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[1200px] gap-6">
      <div className="flex h-full min-h-0 max-w-[600px] flex-1 flex-col overflow-hidden border-x border-neutral-200 bg-white">
        <div className="shrink-0">
        {/* Profile Info */}
        <div className="px-4 pb-4 mt-4">
          <div className="flex justify-between items-start">
            <div className="relative">
              <img 
                src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.fullName}&background=000&color=fff&size=140&bold=true`}
                alt={profile.fullName}
                className="w-[80px] h-[80px] rounded-full border-4 border-white bg-white"
                onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${profile.fullName}&background=000&color=fff&size=140&bold=true`; }}
              />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold">{profile.fullName}</h1>
            <p className="text-neutral-500">@{profile.username}</p>
          </div>
          <div className="flex gap-2 mt-2">
            {isOwnProfile ? (
              <button onClick={() => navigate('/settings')} className="px-5 py-2 border border-neutral-300 hover:bg-neutral-100 text-neutral-900 rounded-full font-semibold text-sm transition-colors">Edit profile</button>
            ) : (
              <>
                <button onClick={handleFollow} disabled={followLoading}
                  className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${isFollowing ? 'bg-white border border-neutral-300 text-neutral-900 hover:border-red-300 hover:text-red-600 hover:bg-red-50' : 'bg-black text-white hover:bg-neutral-800'} ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {followLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
                </button>
                <button className="p-2 border border-neutral-300 hover:bg-neutral-100 rounded-full transition-colors"><MessageCircle size={18} /></button>
                <button className="p-2 border border-neutral-300 hover:bg-neutral-100 rounded-full transition-colors"><MoreHorizontal size={18} /></button>
              </>
            )}
          </div>
          {profile.bio && <p className="mt-3 text-neutral-900 leading-relaxed">{profile.bio}</p>}
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-neutral-500">
            {profile.location && (<div className="flex items-center gap-1"><MapPin size={16} /><span>{profile.location}</span></div>)}
            {profile.website && (<div className="flex items-center gap-1"><LinkIcon size={16} /><a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{profile.website.replace(/^https?:\/\//, '')}</a></div>)}
          </div>
          <div className="flex gap-5 mb-2 text-md">
            <button className="hover:underline"><span className="font-bold text-neutral-900">{formatCount(profile.followingCount || 0)}</span><span className="text-neutral-500 ml-1">Following</span></button>
            <button className="hover:underline"><span className="font-bold text-neutral-900">{formatCount(profile.followersCount || 0)}</span><span className="text-neutral-500 ml-1">Followers</span></button>
          </div>
          <div className="flex text-sm items-center gap-1"><Calendar size={14} /><span>Joined {formatDate(profile.createdAt)}</span></div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200">
          {[
            { id: 'posts', label: 'Posts' },
            { id: 'reposts', label: 'Reposts' },
            { id: 'replies', label: 'Replies' },
            { id: 'media', label: 'Media' },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 text-sm font-medium text-center hover:bg-neutral-50 transition-colors relative ${activeTab === tab.id ? 'text-neutral-900 bg-neutral-50' : 'text-neutral-500'}`}>
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-14 h-0.5 bg-black rounded-full" />}
            </button>
          ))}
        </div>

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
            onCancel={closeComposer}
            onSubmit={() => void handleCreatePost()}
            isPosting={isPosting}
            userAvatar={user?.avatar}
            userFullName={user?.fullName}
            token={token}
          />
        )}

        <div className={`min-h-0 flex-1 ${mobileComposerFull ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {/* Posts */}
        {activeTab === 'posts' && (
          <div className={mobileComposerFull ? 'hidden' : ''}>
            {posts.length > 0 ? (
              posts.map((post) => renderPostCard(post))
            ) : (
              <div className="text-center py-20 px-4">
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">No posts yet</h2>
                <p className="text-neutral-500">When @{profile.username} posts, those posts will show up here.</p>
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
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">No reposts yet</h2>
                <p className="text-neutral-500">
                  When @{profile.username} reposts something, it will show up here.
                </p>
              </div>
            )}
          </div>
        )}

        {(activeTab === 'replies' || activeTab === 'media') && (
          <div className="text-center py-20 px-4">
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">No {activeTab} yet</h2>
            <p className="text-neutral-500">When @{profile.username} has {activeTab}, they&apos;ll show up here.</p>
          </div>
        )}
        </div>

      </div>

      <div className="hidden h-full min-h-0 w-[400px] shrink-0 flex-col py-4 pr-4 lg:flex">
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
            <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto">
          <div className="rounded-2xl bg-neutral-50 p-4">
            <h2 className="text-xl font-bold mb-4">Followers ({followers.length})</h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input type="text" value={searchFollower} onChange={(e) => setSearchFollower(e.target.value)} placeholder="Search followers..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-black/10 transition-all" />
            </div>
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {filteredFollowers.length > 0 ? filteredFollowers.map(follower => (
                <Link key={follower._id || follower.username} to={`/@${follower.username}`} className="flex items-center justify-between p-3 hover:bg-white rounded-xl transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={follower.avatar || `https://ui-avatars.com/api/?name=${follower.fullName || follower.username}&background=000&color=fff&size=40&bold=true`}
                      alt={follower.fullName || follower.username} className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate group-hover:underline">{follower.fullName || follower.username}</p>
                      <p className="text-sm text-neutral-500 truncate">@{follower.username}</p>
                    </div>
                  </div>
                </Link>
              )) : (
                <div className="text-center py-8"><p className="text-neutral-500 text-sm">{searchFollower ? 'No followers found' : 'No followers yet'}</p></div>
              )}
            </div>
          </div>
          <div className="bg-neutral-50 rounded-2xl p-4">
            <h2 className="text-xl font-bold mb-4">Following ({following.length})</h2>
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {following.length > 0 ? following.slice(0, 5).map(follow => (
                <Link key={follow._id || follow.username} to={`/@${follow.username}`} className="flex items-center justify-between p-3 hover:bg-white rounded-xl transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={follow.avatar || `https://ui-avatars.com/api/?name=${follow.fullName || follow.username}&background=000&color=fff&size=40&bold=true`}
                      alt={follow.fullName || follow.username} className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate group-hover:underline">{follow.fullName || follow.username}</p>
                      <p className="text-sm text-neutral-500 truncate">@{follow.username}</p>
                    </div>
                  </div>
                </Link>
              )) : (
                <div className="text-center py-8"><p className="text-neutral-500 text-sm">Not following anyone yet</p></div>
              )}
            </div>
          </div>
            </div>
          )}
        </div>
      </div>

      <MobileBottomSheet
        open={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        title="Post"
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
          Edit
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
          Delete
        </button>
      </FloatingMenu>

      <EditTextModal
        isOpen={editPostTarget !== null}
        title="Edit post"
        description="Update your post text. Media attachments are not changed here."
        initialValue={editPostTarget?.content ?? ''}
        placeholder="What's on your mind?"
        maxLength={5000}
        submitLabel="Save post"
        saving={editPostSaving}
        onClose={() => {
          if (!editPostSaving) setEditPostTarget(null);
        }}
        onSubmit={(value) => void submitEditPost(value)}
      />

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

export default UserProfileComponent;