import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users } from 'lucide-react';
import DiscoverTabHeader from './DiscoverTabHeader';
import { DiscoverCardSkeleton } from '../Common/Skeleton';
import { COMMUNITIES_API } from '../../config/api';
import { useTranslation } from '../../i18n/useTranslation';

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
  if (course.coverUrl) return course.coverUrl;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(course.name)}&background=315efb&color=fff&size=256&bold=true`;
}

function communityAvatar(course: DiscoverCourseItem, size = 40): string {
  return (
    course.community.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(course.community.name)}&background=111827&color=fff&size=${size}&bold=true`
  );
}

const DiscoverCoursesTab: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [courses, setCourses] = useState<DiscoverCourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = useCallback(async (search: string) => {
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
  }, [t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCourses(query), 280);
    return () => window.clearTimeout(timer);
  }, [query, loadCourses]);

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
    <div className="w-full pb-12">
      <DiscoverTabHeader
        title={t('discover.courses')}
        tagline={t('discover.coursesTab.tagline')}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder={t('discover.coursesTab.searchPlaceholder')}
        clearSearchAriaLabel={t('discover.clearSearch')}
      />

      {loading ? (
        <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2 sm:gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <DiscoverCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
          {error}
          <button
            type="button"
            onClick={() => void loadCourses(query)}
            className="ml-2 font-semibold underline"
          >
            {t('discover.coursesTab.retry')}
          </button>
        </div>
      ) : courses.length === 0 ? (
        <div className="py-16 text-center sm:py-20">
          <BookOpen className="mx-auto h-10 w-10 text-gray-300" aria-hidden />
          <p className="mt-4 text-gray-500">
            {query.trim() ? t('discover.coursesTab.noResults') : t('discover.coursesTab.empty')}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {courses.map((course) => (
            <button
              key={course.id}
              type="button"
              onClick={() => openCourse(course)}
              className="group overflow-hidden rounded-2xl border border-gray-200 bg-white text-left transition-all hover:border-gray-300 hover:shadow-sm active:scale-[0.99] sm:rounded-3xl"
            >
              <div className="aspect-[16/10] overflow-hidden bg-neutral-100">
                <img
                  src={courseCover(course)}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <div className="p-4">
                <p className="line-clamp-2 text-[15px] font-semibold text-gray-900 sm:text-base">
                  {course.name}
                </p>
                {course.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">{course.description}</p>
                ) : null}
                <div className="mt-3 flex items-center gap-2">
                  <img
                    src={communityAvatar(course)}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-gray-800">{course.community.name}</p>
                    <p className="truncate text-[11px] text-gray-400">@{course.community.handle}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                    <BookOpen className="h-3 w-3" aria-hidden />
                    {t('discover.coursesTab.lessonsCount', { count: course.lessonCount })}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                    <Users className="h-3 w-3" aria-hidden />
                    {t('discover.membersCount', {
                      count: (course.community.memberCount || 0).toLocaleString(),
                    })}
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
