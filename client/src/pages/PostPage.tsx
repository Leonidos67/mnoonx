// pages/PostPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft } from 'lucide-react';
import PostMediaGallery from '../components/Posts/PostMediaGallery';
import { buildPostLightboxMeta } from '../utils/buildPostLightboxMeta';

const API_URL = 'http://localhost:5000/api/posts';

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
  viewsCount: number;
  media: string[];
  createdAt: string;
  isLiked: boolean;
  isReposted: boolean;
}

const PostPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (postId) {
      fetchPost(postId);
    }
  }, [postId]);

  // В PostPage.tsx, после получения данных:
    const fetchPost = async (id: string) => {
    try {
        setLoading(true);
        const headers: Record<string, string> = {};
        if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_URL}/${id}`, { headers });
        
        if (!res.ok) {
        if (res.status === 404) {
            setError('Post not found');
        } else {
            setError('Failed to load post');
        }
        return;
        }

        const data = await res.json();
        
        // Если author - это строка (ID), подгружаем данные пользователя
        if (typeof data.author === 'string') {
        try {
            const userRes = await fetch(`http://localhost:5000/api/users/${data.author}`, { headers });
            if (userRes.ok) {
            const userData = await userRes.json();
            data.author = {
                _id: userData._id,
                username: userData.username,
                fullName: userData.fullName,
                avatar: userData.avatar
            };
            }
        } catch (err) {
            console.error('Failed to fetch author:', err);
            data.author = {
            _id: data.author,
            username: 'unknown',
            fullName: 'Unknown User',
            avatar: ''
            };
        }
        }
        
        setPost(data);
    } catch (err) {
        console.error('Fetch post error:', err);
        setError('Failed to load post');
    } finally {
        setLoading(false);
    }
    };

  const formatPostDate = (dateString: string) => {
    if (!dateString) return '';
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-300 border-t-black"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-xl text-neutral-500 mb-4">{error || 'Post not found'}</p>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-black text-white rounded-full">
          Back to Home
        </button>
      </div>
    );
  }

  // Защита от отсутствия данных автора
  const author = post.author || { username: 'unknown', fullName: 'Unknown User', avatar: '', _id: '' };
  const authorUsername = author.username || 'unknown';
  const authorFullName = author.fullName || authorUsername;
  const authorAvatar = author.avatar || `https://ui-avatars.com/api/?name=${authorFullName}&background=000&color=fff&size=40&bold=true`;

  return (
    <div className="max-w-[600px] mx-auto border-x border-neutral-200 min-h-screen">
      {/* Header с логотипом */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-neutral-200">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="https://img.icons8.com/?size=100&id=ck3ZwyamgGAW&format=png&color=000000"
              className="w-8 h-8"
              alt="MNOONX"
            />
            <span className="text-xl font-bold text-gray-900 pixelify-logo">
              MNOONX
            </span>
          </Link>
          
          <div className="w-10"></div>
        </div>
      </div>

      {/* Post Content */}
      <article className="p-4 border-b border-neutral-200">
        {/* Author Info */}
        <div className="flex space-x-3 mb-3">
          <Link to={`/@${authorUsername}`}>
            <img
              src={authorAvatar}
              alt={authorFullName}
              className="w-10 h-10 rounded-full hover:opacity-90 transition-opacity"
            />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              <Link 
                to={`/@${authorUsername}`} 
                className="font-bold hover:underline truncate text-neutral-900"
              >
                {authorFullName}
              </Link>
              <span className="text-neutral-500 truncate">@{authorUsername}</span>
              <span className="text-neutral-500">·</span>
              <span className="text-neutral-500 whitespace-nowrap">{formatPostDate(post.createdAt)}</span>
            </div>

            {/* Content */}
            {post.content?.trim() ? (
              <p className="mt-2 text-neutral-900 leading-relaxed whitespace-pre-wrap break-words text-[15px]">
                {post.content}
              </p>
            ) : null}

            {post.media && post.media.length > 0 && (
              <PostMediaGallery media={post.media} meta={buildPostLightboxMeta(post)} />
            )}

            {/* Stats - только цифры без иконок и кнопок */}
            <div className="flex items-center gap-6 mt-4 pt-3 border-t border-neutral-100 text-sm">
              <div>
                <span className="font-bold text-neutral-900">{formatCount(post.repostsCount || 0)}</span>
                <span className="text-neutral-500 ml-1">Reposts</span>
              </div>
              <div>
                <span className="font-bold text-neutral-900">{formatCount(post.likesCount || 0)}</span>
                <span className="text-neutral-500 ml-1">Likes</span>
              </div>
              <div>
                <span className="font-bold text-neutral-900">{formatCount(post.commentsCount || 0)}</span>
                <span className="text-neutral-500 ml-1">Comments</span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};

export default PostPage;