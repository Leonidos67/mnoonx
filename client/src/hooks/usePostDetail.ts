import { useCallback, useEffect, useState } from 'react';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { POSTS_API } from '../config/api';
import type { FeedPost, PostComment } from '../types/postFeed';

export function usePostDetail(
  posts: FeedPost[],
  reposts: FeedPost[],
  setPosts: React.Dispatch<React.SetStateAction<FeedPost[]>>,
  setReposts?: React.Dispatch<React.SetStateAction<FeedPost[]>>,
) {
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [commentText, setCommentText] = useState('');
  const [inlineCommentText, setInlineCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentsLoadingPostId, setCommentsLoadingPostId] = useState<string | null>(null);
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
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

  const patchPostInLists = useCallback(
    (postId: string, patch: Partial<FeedPost>) => {
      const id = String(postId);
      const apply = (p: FeedPost) => (String(p._id) === id ? { ...p, ...patch } : p);
      setPosts((prev) => prev.map(apply));
      setReposts?.((prev) => prev.map(apply));
      setSelectedPost((prev) => (prev && String(prev._id) === id ? { ...prev, ...patch } : prev));
    },
    [setPosts, setReposts],
  );

  const getPostFromState = useCallback(
    (postId: string): FeedPost | undefined => {
      const id = String(postId);
      return (
        posts.find((p) => String(p._id) === id) ||
        reposts.find((p) => String(p._id) === id) ||
        (selectedPost && String(selectedPost._id) === id ? selectedPost : undefined)
      );
    },
    [posts, reposts, selectedPost],
  );

  const updateCommentsOnPost = useCallback(
    (postId: string, comments: PostComment[], commentsCount: number) => {
      patchPostInLists(postId, { comments, commentsCount });
    },
    [patchPostInLists],
  );

  const loadCommentsForPost = useCallback(
    async (postId: string) => {
      setCommentsLoadingPostId(postId);
      try {
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(`${POSTS_API}/${postId}`, { headers });
        if (!res.ok) return;
        const data = await res.json();
        const comments: PostComment[] = data.comments || [];
        patchPostInLists(postId, {
          comments,
          commentsCount: data.commentsCount ?? data.comments?.length ?? 0,
        });
      } catch (err) {
        console.error('Fetch post details error:', err);
      } finally {
        setCommentsLoadingPostId((cur) => (cur === postId ? null : cur));
      }
    },
    [token, patchPostInLists],
  );

  useEffect(() => {
    const postId = selectedPost?._id;
    if (!postId) {
      setCommentText('');
      return;
    }
    void loadCommentsForPost(String(postId));
  }, [selectedPost?._id, loadCommentsForPost]);

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
      const res = await fetch(`${POSTS_API}/${id}/comments`, {
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
      const res = await fetch(`${POSTS_API}/${id}/comments/${commentId}`, {
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
        String(c._id) === commentId ? data.comment : c,
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
      const res = await fetch(`${POSTS_API}/${id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete comment');

      const nextComments = (current.comments || []).filter((c) => String(c._id) !== commentId);
      updateCommentsOnPost(id, nextComments, data.commentsCount);
      showToast('Comment deleted');
    } catch (err: unknown) {
      console.error('Delete comment error:', err);
      showToast(err instanceof Error ? err.message : 'Failed to delete comment', 'error');
    }
  };

  const clearSelectedPost = () => setSelectedPost(null);

  const onPostDeleted = (postId: string) => {
    if (selectedPost && String(selectedPost._id) === postId) setSelectedPost(null);
    if (String(expandedCommentsPostId) === String(postId)) setExpandedCommentsPostId(null);
  };

  return {
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
    loadCommentsForPost,
    handleSubmitComment,
    toggleFeedComments,
    isCommentOwner,
    submitEditComment,
    handleDeleteComment,
    clearSelectedPost,
    onPostDeleted,
    patchPostInLists,
  };
}
