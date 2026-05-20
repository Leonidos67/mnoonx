import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Heart, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCommunityDashboard } from '../../context/CommunityDashboardContext';
import { communityPath } from '../../constants/communityRoutes';
import { profilePath } from '../../constants/paths';
import { useTranslation } from '../../i18n/useTranslation';

import { COMMUNITIES_API as API_URL } from '../../config/api';

interface FeedPost {
  _id: string;
  content: string;
  author: {
    _id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
  likesCount?: number;
  commentsCount?: number;
  createdAt: string;
}

function formatDate(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function excerpt(text: string, max = 120): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

const CommunityDashboardContent: React.FC = () => {
  const { handle, community } = useCommunityDashboard();
  const { token } = useAuth();
  const { t, locale } = useTranslation();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!handle || !token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/${encodeURIComponent(handle)}/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { message?: string }).message || t('communityDashboard.content.loadFailed'));
        setPosts([]);
        return;
      }
      setPosts(Array.isArray(data) ? data : []);
    } catch {
      setError(t('communityDashboard.content.loadFailed'));
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [handle, token, t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex min-h-full flex-col bg-white">
      <div className="border-b border-neutral-200 px-4 py-4 lg:px-8 lg:py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{t('communityDashboard.content.title')}</h1>
            <p className="mt-1 text-sm text-neutral-500">
              {t('communityDashboard.content.subtitle', { name: community?.name ?? 'community' })}
            </p>
          </div>
          <Link
            to={communityPath(handle)}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 px-4 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            {t('communityDashboard.content.openFeed')}
          </Link>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 lg:px-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
          </div>
        ) : error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg font-medium text-neutral-800">{t('communityDashboard.content.noPosts')}</p>
            <p className="mt-2 text-sm text-neutral-500">{t('communityDashboard.content.publishHint')}</p>
            <Link
              to={communityPath(handle)}
              className="mt-4 inline-block text-sm font-medium text-[#315efb] hover:underline"
            >
              {t('communityDashboard.content.goToCommunity')}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-neutral-500">{t('communityDashboard.content.colAuthor')}</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-neutral-500">{t('communityDashboard.content.colPost')}</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-neutral-500">{t('communityDashboard.content.colEngagement')}</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-neutral-500">{t('communityDashboard.content.colDate')}</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-neutral-500">{t('communityDashboard.content.colLink')}</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post._id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-4">
                      <Link
                        to={profilePath(post.author.username)}
                        className="font-medium text-neutral-900 hover:underline"
                      >
                        {post.author.fullName || post.author.username}
                      </Link>
                      <p className="text-xs text-neutral-500">@{post.author.username}</p>
                    </td>
                    <td className="max-w-md px-4 py-4 text-neutral-700">{excerpt(post.content)}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-neutral-600">
                      <span className="inline-flex items-center gap-3">
                        <span className="inline-flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5" aria-hidden />
                          {post.likesCount ?? 0}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                          {post.commentsCount ?? 0}
                        </span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-neutral-600">
                      {formatDate(post.createdAt, locale)}
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        to={`/post/${post._id}`}
                        className="text-sm font-medium text-[#315efb] hover:underline"
                      >
                        {t('communityDashboard.content.view')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-sm text-neutral-500">
              {t(
                posts.length === 1
                  ? 'communityDashboard.content.showingPosts'
                  : 'communityDashboard.content.showingPostsMany',
                { count: posts.length }
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityDashboardContent;
