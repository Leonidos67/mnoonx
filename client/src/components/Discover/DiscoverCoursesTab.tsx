import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, BookOpen, Search, Users, X } from 'lucide-react';
import { SkeletonPulse } from '../Common/Skeleton';
import { COMMUNITIES_API } from '../../config/api';
import { useTranslation } from '../../i18n/useTranslation';
import { resolveMediaUrl } from '../../utils/mediaUrl';

export interface DiscoverCourseItem {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  tags: string[];
  lessonCount: number;
  updatedAt?: string;
  appInstanceId: string;
  community: {
    id: string;
    name: string;
    handle: string;
    avatar: string;
    memberCount: number;
  };
}

function courseCover(course: DiscoverCourseItem): string {
  if (course.coverUrl) {
    return resolveMediaUrl(course.coverUrl) || course.coverUrl;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(course.name)}&background=315efb&color=fff&size=256&bold=true`;
}

function communityAvatar(course: DiscoverCourseItem, size = 40): string {
  const raw =
    course.community.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(course.community.name)}&background=111827&color=fff&size=${size}&bold=true`;
  return resolveMediaUrl(raw) || raw;
}

const CourseRowSkeleton: React.FC = () => (
  <div className="flex gap-3 rounded-2xl border border-neutral-200 bg-white p-3 sm:gap-4 sm:p-4">
    <SkeletonPulse className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-xl sm:h-24 sm:w-24" />
    <div className="min-w-0 flex-1 space-y-2 py-0.5">
      <SkeletonPulse className="h-4 w-2/3" />
      <SkeletonPulse className="h-3 w-full" />
      <SkeletonPulse className="h-3 w-1/3" />
    </div>
  </div>
);

const DiscoverCoursesTab: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [courses, setCourses] = useState<DiscoverCourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = useCallback(
    async (search: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('limit', '48');
        if (search.trim()) params.set('q', search.trim());
        const res = await fetch(`${COMMUNITIES_API}/discover-courses?${params}`);
        if (!res.ok) throw new Error(t('discover.coursesTab.loadFailed'));
        const data = (await res.json()) as DiscoverCourseItem[];
        setCourses(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : t('discover.coursesTab.loadFailed'));
        setCourses([]);
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCourses(query), 280);
    return () => window.clearTimeout(timer);
  }, [query, loadCourses]);

  useEffect(() => {
    setActiveTag(null);
  }, [query]);

  const tagOptions = useMemo(() => {
    const counts = new Map<string, number>();
    courses.forEach((c) => {
      (c.tags || []).forEach((tag) => {
        const key = String(tag || '').trim();
        if (!key) return;
        counts.set(key, (counts.get(key) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(([tag]) => tag);
  }, [courses]);

  const visibleCourses = useMemo(() => {
    if (!activeTag) return courses;
    return courses.filter((c) => (c.tags || []).includes(activeTag));
  }, [courses, activeTag]);

  const openCourse = (course: DiscoverCourseItem) => {
    navigate(`/community/${encodeURIComponent(course.community.handle)}`, {
      state: {
        focusCourses: true,
        coursesInstanceId: course.appInstanceId,
        courseId: course.id,
      },
    });
  };

  return (
    <div className="mx-auto w-full pb-14 pt-2 sm:pt-4">
      {/* Catalog header — left-aligned, unlike Discover’s centered hero */}
      <header className="mb-6 border-b border-neutral-200 pb-5 sm:mb-8 sm:pb-6">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              {t('discover.courses')}
            </h1>
            <p className="mt-1 text-sm text-neutral-500 sm:text-[15px]">
              {t('discover.coursesTab.tagline')}
            </p>
          </div>
        </div>

        <div className="relative mt-4">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('discover.coursesTab.searchPlaceholder')}
            aria-label={t('discover.coursesTab.searchPlaceholder')}
            className={`w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-[#315efb]/40 focus:bg-white focus:ring-2 focus:ring-[#315efb]/15 ${
              query ? 'pr-10' : 'pr-3.5'
            }`}
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-neutral-400 hover:bg-neutral-200/60 hover:text-neutral-600"
              aria-label={t('discover.clearSearch')}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>

        {!loading && tagOptions.length > 0 ? (
          <div className="mt-3.5 flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                activeTag == null
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80'
              }`}
            >
              {t('discover.coursesTab.filterAll')}
            </button>
            {tagOptions.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag((prev) => (prev === tag ? null : tag))}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  activeTag === tag
                    ? 'bg-[#315efb] text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        ) : null}
      </header>

      {loading ? (
        <div className="flex flex-col gap-2.5 sm:gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CourseRowSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-5 text-center text-sm text-red-700">
          {error}
          <button
            type="button"
            onClick={() => void loadCourses(query)}
            className="ml-2 font-semibold underline"
          >
            {t('discover.coursesTab.retry')}
          </button>
        </div>
      ) : visibleCourses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 px-4 py-14 text-center">
          <BookOpen className="mx-auto h-9 w-9 text-neutral-300" aria-hidden />
          <p className="mt-3 text-sm text-neutral-500">
            {query.trim() || activeTag
              ? t('discover.coursesTab.noResults')
              : t('discover.coursesTab.empty')}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:gap-2.5">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-400">
            {t('discover.coursesTab.resultsCount', { count: visibleCourses.length })}
          </p>
          {visibleCourses.map((course, index) => (
            <button
              key={course.id}
              type="button"
              onClick={() => openCourse(course)}
              className="group flex w-full items-stretch gap-3 rounded-2xl border border-neutral-200/90 bg-white p-2.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-[border-color,box-shadow,transform] hover:border-neutral-300 hover:shadow-md active:scale-[0.995] sm:gap-4 sm:p-3"
            >
              <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:h-24 sm:w-24 sm:rounded-[0.9rem]">
                <img
                  src={courseCover(course)}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                />
                <span className="absolute left-1.5 top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-md bg-black/55 px-1 text-[10px] font-bold tabular-nums text-white backdrop-blur-sm">
                  {index + 1}
                </span>
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5">
                <div className="flex items-start gap-2">
                  <p className="min-w-0 flex-1 line-clamp-2 text-sm font-semibold leading-snug text-neutral-900 sm:text-[15px]">
                    {course.name}
                  </p>
                  <ArrowUpRight
                    className="mt-0.5 h-4 w-4 shrink-0 text-neutral-300 transition-colors group-hover:text-[#315efb]"
                    aria-hidden
                  />
                </div>
                {course.description ? (
                  <p className="mt-1 line-clamp-1 text-xs text-neutral-500 sm:line-clamp-2 sm:text-[13px]">
                    {course.description}
                  </p>
                ) : null}

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
                    <img
                      src={communityAvatar(course)}
                      alt=""
                      className="h-5 w-5 shrink-0 rounded-full object-cover ring-1 ring-neutral-200"
                    />
                    <span className="truncate text-[11px] font-medium text-neutral-700 sm:text-xs">
                      {course.community.name}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 sm:text-xs">
                    <BookOpen className="h-3 w-3" aria-hidden />
                    {t('discover.coursesTab.lessonsCount', { count: course.lessonCount })}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 sm:text-xs">
                    <Users className="h-3 w-3" aria-hidden />
                    {(course.community.memberCount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiscoverCoursesTab;
