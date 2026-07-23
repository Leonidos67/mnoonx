import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  Bell,
  Link2,
  Users,
  GraduationCap,
  Plus,
  X,
  GripVertical,
  Video,
  Link as LinkIcon,
  ClipboardPaste,
  Lock,
  ChevronDown,
  ChevronRight,
  Trash2,
  Film,
  MoreVertical,
  Copy,
  Image as ImageIcon,
  Files,
  Settings,
  EyeOff,
  Save,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useTranslation } from '../../i18n/useTranslation';
import ResponsiveDialogShell from '../Common/ResponsiveDialogShell';
import { communityPath } from '../../constants/communityRoutes';
import { DRIP_OPTIONS, dripLabelForDays, lessonShowsLocked } from '../../utils/courseAccess';
import { parseYoutubeEmbedUrl, youtubeThumbnailUrl } from '../../utils/courseYoutube';

import { COMMUNITIES_API as API } from '../../config/api';

// const Z_OVERLAY = 10000;
const Z_MENU = 10001;

export interface CourseListItem {
  _id: string;
  name: string;
  description: string;
  isHidden: boolean;
  coverUrl: string;
  updatedAt: string;
}

interface Lesson {
  _id: string;
  title: string;
  lessonType: string;
  videoEmbedUrl: string;
  content: string;
  images: string[];
  attachments: string[];
  dripLabel: string;
  isLocked?: boolean;
  unlockAfterDays?: number;
  isAccessible?: boolean;
}

interface Chapter {
  _id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface CourseFull extends CourseListItem {
  chapters: Chapter[];
  welcomeMessage?: string;
  completionMessage?: string;
  sequentialUnlock?: boolean;
  defaultLessonUnlockDays?: number;
  tags?: string[];
  createdAt?: string;
}

function isTempCourseId(id: unknown): boolean {
  return String(id).startsWith('temp-');
}

function chaptersForSave(chapters: Chapter[]): Chapter[] {
  return chapters.map((ch, chIdx) => {
    const lessons = ch.lessons.map((ls) => {
      if (isTempCourseId(ls._id)) {
        const { _id: _omit, ...rest } = ls;
        return rest as Lesson;
      }
      return ls;
    });
    if (isTempCourseId(ch._id)) {
      const { _id: _omit, ...rest } = ch;
      return { ...rest, order: chIdx, lessons } as Chapter;
    }
    return { ...ch, order: chIdx, lessons };
  });
}

function coursePatchPayload(course: CourseFull, instanceId: string) {
  return {
    instanceId,
    name: course.name,
    description: course.description,
    isHidden: course.isHidden,
    coverUrl: course.coverUrl,
    welcomeMessage: course.welcomeMessage ?? '',
    completionMessage: course.completionMessage ?? '',
    sequentialUnlock: Boolean(course.sequentialUnlock),
    defaultLessonUnlockDays: Math.max(0, Number(course.defaultLessonUnlockDays) || 0),
    tags: course.tags ?? [],
    chapters: chaptersForSave(course.chapters),
  };
}

function normalizeCourseFull(data: CourseFull, tr: (k: string) => string): CourseFull {
  return {
    ...data,
    welcomeMessage: data.welcomeMessage ?? '',
    completionMessage: data.completionMessage ?? '',
    sequentialUnlock: Boolean(data.sequentialUnlock),
    defaultLessonUnlockDays: Math.max(0, Number(data.defaultLessonUnlockDays) || 0),
    tags: Array.isArray(data.tags) ? data.tags : [],
    chapters: (data.chapters || []).map((ch) => ({
      ...ch,
      lessons: (ch.lessons || []).map((ls) => normalizeLesson(ls, tr)),
    })),
  };
}

interface CommunityCoursesPanelProps {
  handle: string;
  instanceId: string;
  instanceTitle?: string;
  isOwner: boolean;
  onBackToCommunity: () => void;
}

interface ConfirmDialogState {
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
}

interface StructureMenuState {
  kind: 'chapter' | 'lesson';
  chapterId: string;
  lessonId?: string;
  x: number;
  y: number;
}

function sameId(a: unknown, b: unknown): boolean {
  return String(a) === String(b);
}

function normalizeLesson(ls: Lesson, t: (k: string) => string): Lesson {
  const isLocked = Boolean(ls.isLocked);
  const unlockAfterDays = Math.max(0, Number(ls.unlockAfterDays) || 0);
  return {
    ...ls,
    images: Array.isArray(ls.images) ? ls.images : [],
    attachments: Array.isArray(ls.attachments) ? ls.attachments : [],
    isLocked,
    unlockAfterDays,
    dripLabel: ls.dripLabel || dripLabelForDays(unlockAfterDays, isLocked, t),
  };
}

function reorderChapters(chapters: Chapter[], fromId: string, toId: string): Chapter[] {
  const fromIdx = chapters.findIndex((c) => sameId(c._id, fromId));
  const toIdx = chapters.findIndex((c) => sameId(c._id, toId));
  if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return chapters;
  const next = [...chapters];
  const [removed] = next.splice(fromIdx, 1);
  next.splice(toIdx, 0, removed);
  return next.map((c, i) => ({ ...c, order: i }));
}

function reorderLessons(lessons: Lesson[], fromId: string, toId: string): Lesson[] {
  const fromIdx = lessons.findIndex((l) => sameId(l._id, fromId));
  const toIdx = lessons.findIndex((l) => sameId(l._id, toId));
  if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return lessons;
  const next = [...lessons];
  const [removed] = next.splice(fromIdx, 1);
  next.splice(toIdx, 0, removed);
  return next;
}

let tempCourseIdSeq = 0;

function tempCourseId(kind: 'chapter' | 'lesson'): string {
  tempCourseIdSeq += 1;
  return `temp-${kind}-${Date.now()}-${tempCourseIdSeq}`;
}

const emptyLesson = (tr: (k: string) => string, defaultDays = 0): Omit<Lesson, '_id'> => ({
  title: tr('community.coursesPanel.newLesson'),
  lessonType: 'multimedia',
  videoEmbedUrl: '',
  content: '',
  images: [],
  attachments: [],
  isLocked: false,
  unlockAfterDays: defaultDays,
  dripLabel: dripLabelForDays(defaultDays, false, tr),
});

const CommunityCoursesPanel: React.FC<CommunityCoursesPanelProps> = ({
  handle,
  instanceId,
  instanceTitle = 'Courses',
  isOwner,
  onBackToCommunity,
}) => {
  const { token } = useAuth();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const { t } = useTranslation();
  const [view, setView] = useState<'list' | 'editor' | 'settings'>('list');
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [editorCourseId, setEditorCourseId] = useState<string | null>(null);
  const [courseFull, setCourseFull] = useState<CourseFull | null>(null);
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createHidden, setCreateHidden] = useState(false);
  const [createCover, setCreateCover] = useState('');
  const [createBusy, setCreateBusy] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle');
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const lessonImageInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [structureMenu, setStructureMenu] = useState<StructureMenuState | null>(null);
  const structureMenuRef = useRef<HTMLDivElement | null>(null);
  const [chapterDragId, setChapterDragId] = useState<string | null>(null);
  const [lessonDragKey, setLessonDragKey] = useState<string | null>(null);
  const [lessonImageUrlDraft, setLessonImageUrlDraft] = useState('');
  const [quickCreateBusy, setQuickCreateBusy] = useState(false);
  const editorCoverInputRef = useRef<HTMLInputElement | null>(null);

  const markCourseDirty = useCallback(() => {
    setSaveState((s) => (s === 'saving' ? s : 'dirty'));
  }, []);

  const loadList = useCallback(async () => {
    if (!token || !handle || !instanceId) {
      setLoadingList(false);
      return;
    }
    setLoadingList(true);
    try {
      const q = new URLSearchParams({ instanceId });
      const res = await fetch(`${API}/${encodeURIComponent(handle)}/courses?${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setCourses([]);
        return;
      }
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
    } finally {
      setLoadingList(false);
    }
  }, [token, handle, instanceId]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    setView('list');
    setEditorCourseId(null);
    setCourseFull(null);
    setActiveChapterId(null);
    setActiveLessonId(null);
    setStructureMenu(null);
    setConfirmDialog(null);
  }, [instanceId]);

  const persistCourseNow = useCallback(
    async (next: CourseFull): Promise<CourseFull | null> => {
      if (!isOwner || !token || !handle || !instanceId || !editorCourseId) return null;
      setSaveState('saving');
      try {
        const res = await fetch(`${API}/${encodeURIComponent(handle)}/courses/${editorCourseId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(coursePatchPayload(next, instanceId)),
        });
        if (!res.ok) {
          setSaveState('error');
          return null;
        }
        const saved = (await res.json()) as CourseFull;
        const normalized = normalizeCourseFull(saved, t);
        setCourseFull(normalized);
        setSaveState('saved');
        window.setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 2000);
        return normalized;
      } catch {
        setSaveState('error');
        return null;
      }
    },
    [isOwner, token, handle, instanceId, editorCourseId, t]
  );

  const openEditor = useCallback(
    async (courseId: string) => {
      if (!token || !handle || !instanceId) return;
      setEditorCourseId(courseId);
      setView('editor');
      setLoadingCourse(true);
      try {
        const q = new URLSearchParams({ instanceId });
        const res = await fetch(`${API}/${encodeURIComponent(handle)}/courses/${courseId}?${q}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setCourseFull(null);
          setView('list');
          return;
        }
        const data = (await res.json()) as CourseFull;
        const normalized = normalizeCourseFull(data, t);
        setCourseFull(normalized);
        const firstCh = normalized.chapters?.[0];
        const firstLs = firstCh?.lessons?.[0];
        setActiveChapterId(firstCh?._id ?? null);
        setActiveLessonId(firstLs?._id ?? null);
        const exp: Record<string, boolean> = {};
        (normalized.chapters || []).forEach((c) => {
          exp[String(c._id)] = true;
        });
        setExpandedChapters(exp);
        setSaveState('idle');
      } finally {
        setLoadingCourse(false);
      }
    },
    [token, handle, instanceId, t]
  );

  const activeLesson = useMemo(() => {
    if (!courseFull || !activeChapterId || !activeLessonId) return null;
    const ch = courseFull.chapters.find((c) => sameId(c._id, activeChapterId));
    return ch?.lessons.find((l) => sameId(l._id, activeLessonId)) ?? null;
  }, [courseFull, activeChapterId, activeLessonId]);

  const activeChapter = useMemo(() => {
    if (!courseFull || !activeChapterId) return null;
    return courseFull.chapters.find((c) => sameId(c._id, activeChapterId)) ?? null;
  }, [courseFull, activeChapterId]);

  const youtubeEmbed = useMemo(
    () => (activeLesson?.videoEmbedUrl ? parseYoutubeEmbedUrl(activeLesson.videoEmbedUrl) : null),
    [activeLesson?.videoEmbedUrl]
  );

  const youtubeThumb = useMemo(
    () => (activeLesson?.videoEmbedUrl ? youtubeThumbnailUrl(activeLesson.videoEmbedUrl) : null),
    [activeLesson?.videoEmbedUrl]
  );

  const activeLessonLocked = useMemo(
    () => (activeLesson ? lessonShowsLocked(activeLesson, isOwner) : false),
    [activeLesson, isOwner]
  );

  const lessonCount = useMemo(() => {
    if (!courseFull) return 0;
    return courseFull.chapters.reduce((n, ch) => n + (ch.lessons?.length || 0), 0);
  }, [courseFull]);

  const updateLesson = useCallback(
    (patch: Partial<Lesson>) => {
      if (!courseFull || !activeChapterId || !activeLessonId || !isOwner) return;
      const chapters = courseFull.chapters.map((ch) => {
        if (!sameId(ch._id, activeChapterId)) return ch;
        return {
          ...ch,
          lessons: ch.lessons.map((l) => (sameId(l._id, activeLessonId) ? { ...l, ...patch } : l)),
        };
      });
      const next = { ...courseFull, chapters };
      setCourseFull(next);
      markCourseDirty();
    },
    [courseFull, activeChapterId, activeLessonId, isOwner, markCourseDirty]
  );

  const handleSaveNow = useCallback(async () => {
    if (!courseFull || !isOwner) return;
    const chIdx = activeChapterId
      ? courseFull.chapters.findIndex((c) => sameId(c._id, activeChapterId))
      : -1;
    const lsIdx =
      chIdx >= 0 && activeLessonId
        ? courseFull.chapters[chIdx].lessons.findIndex((l) => sameId(l._id, activeLessonId))
        : -1;
    const saved = await persistCourseNow(courseFull);
    if (saved) {
      if (chIdx >= 0 && saved.chapters[chIdx]) {
        setActiveChapterId(String(saved.chapters[chIdx]._id));
        if (lsIdx >= 0 && saved.chapters[chIdx].lessons[lsIdx]) {
          setActiveLessonId(String(saved.chapters[chIdx].lessons[lsIdx]._id));
        }
      }
      void loadList();
      showToast(t('community.coursesPanel.saved'), 'success');
    } else {
      showToast(t('community.coursesPanel.saveFailed'), 'error');
    }
  }, [
    courseFull,
    isOwner,
    activeChapterId,
    activeLessonId,
    persistCourseNow,
    loadList,
    showToast,
    t,
  ]);

  const updateCourseMeta = useCallback(
    (
      patch: Partial<
        Pick<
          CourseFull,
          | 'name'
          | 'description'
          | 'isHidden'
          | 'coverUrl'
          | 'welcomeMessage'
          | 'completionMessage'
          | 'sequentialUnlock'
          | 'defaultLessonUnlockDays'
          | 'tags'
        >
      >
    ) => {
      if (!courseFull || !isOwner) return;
      const next = { ...courseFull, ...patch };
      setCourseFull(next);
      markCourseDirty();
    },
    [courseFull, isOwner, markCourseDirty]
  );

  const applyLessonPrivacy = useCallback(
    (patch: { isLocked?: boolean; unlockAfterDays?: number }) => {
      if (!activeLesson) return;
      const isLocked = patch.isLocked ?? activeLesson.isLocked ?? false;
      const unlockAfterDays =
        patch.unlockAfterDays ?? Math.max(0, Number(activeLesson.unlockAfterDays) || 0);
      updateLesson({
        isLocked,
        unlockAfterDays: isLocked ? 0 : unlockAfterDays,
        dripLabel: dripLabelForDays(isLocked ? 0 : unlockAfterDays, isLocked, t),
      });
    },
    [activeLesson, updateLesson, t]
  );

  const addChapter = useCallback(() => {
    if (!courseFull || !isOwner) return;
    const order = courseFull.chapters.length;
    const chapterId = tempCourseId('chapter');
    const lessonId = tempCourseId('lesson');
    const newChapter: Chapter = {
      _id: chapterId,
      title: t('community.coursesPanel.chapterNumber', { n: order + 1 }),
      order,
      lessons: [
        {
          _id: lessonId,
          ...emptyLesson(t, courseFull.defaultLessonUnlockDays ?? 0),
          title: t('community.coursesPanel.lessonNumber', { n: 1 }),
        },
      ],
    };
    const next = { ...courseFull, chapters: [...courseFull.chapters, newChapter] };
    setCourseFull(next);
    markCourseDirty();
    setExpandedChapters((e) => ({ ...e, [chapterId]: true }));
    setActiveChapterId(chapterId);
    setActiveLessonId(lessonId);
  }, [courseFull, isOwner, markCourseDirty, t]);

  const addLesson = useCallback(
    (chapterId: string) => {
      if (!courseFull || !isOwner) return;
      const lessonId = tempCourseId('lesson');
      const chapters = courseFull.chapters.map((ch) => {
        if (!sameId(ch._id, chapterId)) return ch;
        return {
          ...ch,
          lessons: [
            ...ch.lessons,
            { _id: lessonId, ...emptyLesson(t, courseFull.defaultLessonUnlockDays ?? 0) },
          ],
        };
      });
      const next = { ...courseFull, chapters };
      setCourseFull(next);
      markCourseDirty();
      setActiveChapterId(String(chapterId));
      setActiveLessonId(lessonId);
    },
    [courseFull, isOwner, markCourseDirty, t]
  );

  const requestDeleteChapter = useCallback(
    (chapterId: string) => {
      if (!courseFull || !isOwner) return;
      if (courseFull.chapters.length <= 1) {
        showToast(t('community.coursesPanel.keepOneChapter'), 'info');
        return;
      }
      setStructureMenu(null);
      setConfirmDialog({
        title: t('community.coursesPanel.deleteChapterTitle'),
        message: t('community.coursesPanel.deleteChapterBody'),
        confirmLabel: t('community.coursesPanel.deleteChapter'),
        destructive: true,
        onConfirm: async () => {
          setConfirmDialog(null);
          const chapters = courseFull.chapters
            .filter((c) => !sameId(c._id, chapterId))
            .map((c, i) => ({ ...c, order: i }));
          const next = { ...courseFull, chapters };
          setCourseFull(next);
          markCourseDirty();
          if (sameId(activeChapterId, chapterId)) {
            const first = next.chapters[0];
            setActiveChapterId(first ? String(first._id) : null);
            setActiveLessonId(first?.lessons?.[0]?._id != null ? String(first.lessons[0]._id) : null);
          }
        },
      });
    },
    [courseFull, isOwner, markCourseDirty, activeChapterId, showToast, t]
  );

  const requestDeleteLesson = useCallback(
    (chapterId: string, lessonId: string) => {
      if (!courseFull || !isOwner) return;
      const ch = courseFull.chapters.find((c) => sameId(c._id, chapterId));
      if (!ch || ch.lessons.length <= 1) {
        showToast(t('community.coursesPanel.keepOneLesson'), 'info');
        return;
      }
      setStructureMenu(null);
      setConfirmDialog({
        title: t('community.coursesPanel.deleteLessonTitle'),
        message: t('community.coursesPanel.deleteLessonBody'),
        confirmLabel: t('community.coursesPanel.deleteLesson'),
        destructive: true,
        onConfirm: async () => {
          setConfirmDialog(null);
          const chapters = courseFull.chapters.map((c) => {
            if (!sameId(c._id, chapterId)) return c;
            return {
              ...c,
              lessons: c.lessons.filter((l) => !sameId(l._id, lessonId)),
            };
          });
          const next = { ...courseFull, chapters };
          setCourseFull(next);
          markCourseDirty();
          if (sameId(activeChapterId, chapterId) && sameId(activeLessonId, lessonId)) {
            const updatedCh = next.chapters.find((c) => sameId(c._id, chapterId));
            const first = updatedCh?.lessons[0];
            if (first?._id) setActiveLessonId(String(first._id));
          }
        },
      });
    },
    [courseFull, isOwner, markCourseDirty, activeChapterId, activeLessonId, showToast, t]
  );

  const duplicateLesson = useCallback(
    (chapterId: string, lessonId: string) => {
      if (!courseFull || !isOwner) return;
      setStructureMenu(null);
      const chapters = courseFull.chapters.map((ch) => {
        if (!sameId(ch._id, chapterId)) return ch;
        const idx = ch.lessons.findIndex((l) => sameId(l._id, lessonId));
        if (idx < 0) return ch;
        const src = ch.lessons[idx];
        const copy: Lesson = {
          _id: tempCourseId('lesson'),
          title: `${src.title} (copy)`,
          lessonType: src.lessonType,
          videoEmbedUrl: src.videoEmbedUrl,
          content: src.content,
          images: [...(src.images || [])],
          attachments: [...(src.attachments || [])],
          isLocked: Boolean(src.isLocked),
          unlockAfterDays: Math.max(0, Number(src.unlockAfterDays) || 0),
          dripLabel: src.dripLabel,
        };
        const lessons = [...ch.lessons.slice(0, idx + 1), copy, ...ch.lessons.slice(idx + 1)];
        return { ...ch, lessons };
      });
      const next = { ...courseFull, chapters };
      setCourseFull(next);
      markCourseDirty();
    },
    [courseFull, isOwner, markCourseDirty]
  );

  const onChapterDrop = useCallback(
    (targetChapterId: string, e: React.DragEvent) => {
      e.preventDefault();
      setChapterDragId(null);
      const fromId = e.dataTransfer.getData('text/x-chapter-id');
      if (!fromId || !courseFull || !isOwner || sameId(fromId, targetChapterId)) return;
      const chapters = reorderChapters(courseFull.chapters, fromId, targetChapterId);
      setCourseFull({ ...courseFull, chapters });
      markCourseDirty();
    },
    [courseFull, isOwner, markCourseDirty]
  );

  const onLessonDrop = useCallback(
    (chapterId: string, targetLessonId: string, e: React.DragEvent) => {
      e.preventDefault();
      setLessonDragKey(null);
      const raw = e.dataTransfer.getData('application/json');
      if (!raw || !courseFull || !isOwner) return;
      try {
        const { chapterId: fromCh, lessonId: fromLs } = JSON.parse(raw) as {
          chapterId: string;
          lessonId: string;
        };
        if (!sameId(fromCh, chapterId) || sameId(fromLs, targetLessonId)) return;
        const chapters = courseFull.chapters.map((ch) => {
          if (!sameId(ch._id, chapterId)) return ch;
          return { ...ch, lessons: reorderLessons(ch.lessons, fromLs, targetLessonId) };
        });
        setCourseFull({ ...courseFull, chapters });
        markCourseDirty();
      } catch {
        /* ignore */
      }
    },
    [courseFull, isOwner, markCourseDirty]
  );

  useEffect(() => {
    if (!structureMenu && !confirmDialog) return;
    const close = (ev: MouseEvent) => {
      const target = ev.target as Node;
      if (structureMenuRef.current?.contains(target)) return;
      setStructureMenu(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [structureMenu, confirmDialog]);

  const deleteCourse = async (courseId: string) => {
    if (!token || !handle || !instanceId || !isOwner) return;
    const confirmed = await confirm({
      title: t('community.coursesPanel.deleteCourseTitle'),
      message: t('community.coursesPanel.deleteCourseBody'),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      const q = new URLSearchParams({ instanceId });
      const res = await fetch(`${API}/${encodeURIComponent(handle)}/courses/${courseId}?${q}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) void loadList();
    } catch {
      /* ignore */
    }
  };

  const quickCreateCourse = async () => {
    if (!token || !handle || !instanceId || !isOwner || quickCreateBusy) return;
    setQuickCreateBusy(true);
    try {
      const res = await fetch(`${API}/${encodeURIComponent(handle)}/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          instanceId,
          name: t('community.coursesPanel.newCourse'),
          description: '',
          isHidden: true,
          coverUrl: '',
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showToast((d as { message?: string }).message || t('community.coursesPanel.quickCreateFailed'), 'error');
        return;
      }
      const created = (await res.json()) as CourseFull;
      void loadList();
      await openEditor(created._id);
    } finally {
      setQuickCreateBusy(false);
    }
  };

  const duplicateCourse = async (courseId: string) => {
    if (!token || !handle || !instanceId || !isOwner) return;
    try {
      const q = new URLSearchParams({ instanceId });
      const res = await fetch(`${API}/${encodeURIComponent(handle)}/courses/${courseId}?${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const src = (await res.json()) as CourseFull;
      const createRes = await fetch(`${API}/${encodeURIComponent(handle)}/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          instanceId,
          name: `${src.name} (copy)`,
          description: src.description,
          isHidden: true,
          coverUrl: src.coverUrl,
        }),
      });
      if (!createRes.ok) return;
      const created = (await createRes.json()) as CourseFull;
      const patchRes = await fetch(`${API}/${encodeURIComponent(handle)}/courses/${created._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          instanceId,
          chapters: src.chapters,
        }),
      });
      if (patchRes.ok) {
        void loadList();
        showToast(t('community.coursesPanel.saved'), 'success');
      }
    } catch {
      /* ignore */
    }
  };

  const submitCreate = async () => {
    if (!token || !handle || !instanceId || !createName.trim()) return;
    setCreateBusy(true);
    try {
      const res = await fetch(`${API}/${encodeURIComponent(handle)}/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          instanceId,
          name: createName.trim(),
          description: createDesc.trim(),
          isHidden: createHidden,
          coverUrl: createCover,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showToast((d as { message?: string }).message || t('community.coursesPanel.quickCreateFailed'), 'error');
        return;
      }
      const created = (await res.json()) as CourseFull;
      setCreateOpen(false);
      setCreateName('');
      setCreateDesc('');
      setCreateHidden(false);
      setCreateCover('');
      void loadList();
      setEditorCourseId(created._id);
      setView('editor');
      setCourseFull(created);
      const firstCh = created.chapters?.[0];
      const firstLs = firstCh?.lessons?.[0];
      setActiveChapterId(firstCh?._id != null ? String(firstCh._id) : null);
      setActiveLessonId(firstLs?._id != null ? String(firstLs._id) : null);
      const exp: Record<string, boolean> = {};
      (created.chapters || []).forEach((c) => {
        exp[String(c._id)] = true;
      });
      setExpandedChapters(exp);
    } finally {
      setCreateBusy(false);
    }
  };

  const copyCourseLink = () => {
    if (!editorCourseId) return;
    const url = `${window.location.origin}${communityPath(handle)}?courses=${editorCourseId}`;
    void navigator.clipboard.writeText(url).then(() => {
      showToast(t('community.coursesPanel.linkCopied'), 'success');
    });
  };

  const readEditorCoverFile = (file: File | null) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const r = String(reader.result || '');
      if (r.length > 400_000) {
        showToast(t('community.coursesPanel.imageTooLarge'), 'info');
        return;
      }
      updateCourseMeta({ coverUrl: r });
    };
    reader.readAsDataURL(file);
  };

  const pasteYoutubeFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) return;
      updateLesson({ videoEmbedUrl: text.trim(), lessonType: 'video' });
    } catch {
      showToast(t('community.coursesPanel.youtubeInvalid'), 'info');
    }
  };

  const readCoverFile = (file: File | null) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const r = String(reader.result || '');
      if (r.length > 400_000) {
        showToast(t('community.coursesPanel.imageTooLarge'), 'info');
        return;
      }
      setCreateCover(r);
    };
    reader.readAsDataURL(file);
  };

  const readLessonImage = (file: File | null) => {
    if (!file || !file.type.startsWith('image/') || !activeChapterId || !activeLessonId || !isOwner) return;
    const chId = activeChapterId;
    const lsId = activeLessonId;
    const reader = new FileReader();
    reader.onload = () => {
      const r = String(reader.result || '');
      if (r.length > 900_000) {
        showToast(t('community.coursesPanel.imageTooLargeShort'), 'info');
        return;
      }
      setCourseFull((prev) => {
        if (!prev) return prev;
        const chapters = prev.chapters.map((ch) => {
          if (!sameId(ch._id, chId)) return ch;
          return {
            ...ch,
            lessons: ch.lessons.map((l) => {
              if (!sameId(l._id, lsId)) return l;
              return { ...l, images: [...(l.images || []), r] };
            }),
          };
        });
        markCourseDirty();
        return { ...prev, chapters };
      });
    };
    reader.readAsDataURL(file);
  };

  const readAttachment = (file: File | null) => {
    if (!file || !activeChapterId || !activeLessonId || !isOwner) return;
    const chId = activeChapterId;
    const lsId = activeLessonId;
    const reader = new FileReader();
    reader.onload = () => {
      const r = String(reader.result || '');
      if (r.length > 2_000_000) {
        showToast(t('community.coursesPanel.fileTooLargeInline'), 'info');
        return;
      }
      setCourseFull((prev) => {
        if (!prev) return prev;
        const chapters = prev.chapters.map((ch) => {
          if (!sameId(ch._id, chId)) return ch;
          return {
            ...ch,
            lessons: ch.lessons.map((l) => {
              if (!sameId(l._id, lsId)) return l;
              return { ...l, attachments: [...(l.attachments || []), r] };
            }),
          };
        });
        markCourseDirty();
        return { ...prev, chapters };
      });
    };
    reader.readAsDataURL(file);
  };

  const addLessonImagesFromUrls = (urls: string[]) => {
    if (!activeChapterId || !activeLessonId || !isOwner) return;
    const cleaned = urls.map((u) => u.trim()).filter(Boolean);
    if (!cleaned.length) return;
    const chId = activeChapterId;
    const lsId = activeLessonId;
    const allowed = cleaned.filter((u) => {
      if (u.startsWith('data:image/')) return u.length <= 900_000;
      try {
        const p = new URL(u);
        return p.protocol === 'http:' || p.protocol === 'https:';
      } catch {
        return false;
      }
    });
    if (!allowed.length) return;
    setCourseFull((prev) => {
      if (!prev) return prev;
      const chapters = prev.chapters.map((ch) => {
        if (!sameId(ch._id, chId)) return ch;
        return {
          ...ch,
          lessons: ch.lessons.map((l) => {
            if (!sameId(l._id, lsId)) return l;
            return { ...l, images: [...(l.images || []), ...allowed] };
          }),
        };
      });
      markCourseDirty();
      return { ...prev, chapters };
    });
    setLessonImageUrlDraft('');
  };

  const openChapterMenu = (e: React.MouseEvent, chapterId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setStructureMenu({
      kind: 'chapter',
      chapterId,
      x: Math.min(r.right - 8, window.innerWidth - 200),
      y: r.bottom + 4,
    });
  };

  const openLessonMenu = (e: React.MouseEvent, chapterId: string, lessonId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setStructureMenu({
      kind: 'lesson',
      chapterId,
      lessonId,
      x: Math.min(r.right - 8, window.innerWidth - 200),
      y: r.bottom + 4,
    });
  };

  const headerChrome = (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() => (view === 'editor' ? setView('list') : onBackToCommunity())}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100"
          aria-label={
            view === 'editor'
              ? t('community.coursesPanel.backToCourses')
              : t('community.coursesPanel.backToCommunity')
          }
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white">
          <GraduationCap className="h-5 w-5" strokeWidth={2} />
        </div>
        <h1 className="truncate text-lg font-semibold text-neutral-900">
          {instanceTitle === 'Courses' ? t('community.defaultCoursesTitle') : instanceTitle}
        </h1>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button type="button" className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100" title={t('community.coursesPanel.copyLink')}>
          <Link2 className="h-5 w-5" />
        </button>
        <button type="button" className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100" title={t('community.membersLabel')}>
          <Users className="h-5 w-5" />
        </button>
        <button type="button" className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100" title={t('community.coursesPanel.notifications')}>
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  const confirmPortal =
    confirmDialog &&
    typeof document !== 'undefined' &&
    createPortal(
      <ResponsiveDialogShell
        open
        onClose={() => setConfirmDialog(null)}
        title={confirmDialog.title}
        role="alertdialog"
        zIndexClass="z-[250]"
        panelClassName="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl"
      >
        <h2 id="confirm-title" className="text-lg font-semibold text-neutral-900">
          {confirmDialog.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">{confirmDialog.message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
            onClick={() => setConfirmDialog(null)}
          >
            {t('community.coursesPanel.cancel')}
          </button>
          <button
            type="button"
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
              confirmDialog.destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-[#315efb] hover:bg-[#2547c4]'
            }`}
            onClick={() => void Promise.resolve(confirmDialog.onConfirm())}
          >
            {confirmDialog.confirmLabel}
          </button>
        </div>
      </ResponsiveDialogShell>,
      document.body
    );

  const structureMenuPortal =
    structureMenu &&
    isOwner &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        ref={structureMenuRef}
        className="fixed w-52 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg"
        style={{ zIndex: Z_MENU, left: structureMenu.x, top: structureMenu.y }}
        role="menu"
      >
        {structureMenu.kind === 'chapter' ? (
          <>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-neutral-900 hover:bg-black/5"
              onClick={() => {
                addLesson(structureMenu.chapterId);
                setStructureMenu(null);
              }}
            >
              <Plus className="h-4 w-4 shrink-0" />
              {t('community.coursesPanel.addLesson')}
            </button>
            <div className="my-0.5 h-px bg-neutral-100" />
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              onClick={() => requestDeleteChapter(structureMenu.chapterId)}
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              {t('community.coursesPanel.deleteChapter')}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-neutral-900 hover:bg-black/5"
              onClick={() => {
                if (structureMenu.lessonId)
                  duplicateLesson(structureMenu.chapterId, structureMenu.lessonId);
              }}
            >
              <Copy className="h-4 w-4 shrink-0" />
              {t('community.coursesPanel.duplicateLesson')}
            </button>
            <div className="my-0.5 h-px bg-neutral-100" />
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              onClick={() => {
                if (structureMenu.lessonId)
                  requestDeleteLesson(structureMenu.chapterId, structureMenu.lessonId);
              }}
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              {t('community.coursesPanel.deleteLesson')}
            </button>
          </>
        )}
      </div>,
      document.body
    );

  if (!token) {
    return (
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[#e7e7e7] bg-white">
        {headerChrome}
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-neutral-500">
          {t('community.coursesPanel.signIn')}
        </div>
      </div>
    );
  }

  if (view === 'list') {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[#e7e7e7] bg-white">
        {headerChrome}
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {loadingList ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-purple-600" />
            </div>
          ) : (
            <div className="mx-auto grid max-w-5xl grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
              {isOwner && (
                <button
                  type="button"
                  disabled={quickCreateBusy}
                  onClick={() => void quickCreateCourse()}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setCreateOpen(true);
                  }}
                  title={t('community.coursesPanel.addCourse')}
                  className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-white px-4 py-8 text-neutral-600 transition-colors hover:border-[#315efb]/40 hover:bg-[#f8faff] disabled:opacity-50"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-neutral-300 bg-white">
                    {quickCreateBusy ? (
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-200 border-t-[#315efb]" />
                    ) : (
                      <Plus className="h-7 w-7 text-[#315efb]" strokeWidth={1.25} />
                    )}
                  </span>
                  <span className="mt-4 text-sm font-medium text-neutral-800">
                    {quickCreateBusy ? t('community.coursesPanel.creating') : t('community.coursesPanel.addCourse')}
                  </span>
                </button>
              )}
              {courses.map((c) => (
                <div
                  key={c._id}
                  className="group relative flex min-h-[160px] flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => void openEditor(c._id)}
                    className="flex flex-1 flex-col text-left"
                  >
                    <div className="aspect-[5/3] w-full bg-neutral-100">
                      {c.coverUrl ? (
                        <img src={c.coverUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-neutral-300">
                          <Film className="h-10 w-10" strokeWidth={1} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-3">
                      <p className="line-clamp-2 font-semibold text-neutral-900">{c.name}</p>
                      {c.isHidden && (
                        <span className="mt-1 inline-flex items-center gap-1 text-xs text-amber-700">
                          <EyeOff className="h-3 w-3" />
                          {t('community.coursesPanel.hidden')}
                        </span>
                      )}
                    </div>
                  </button>
                  {isOwner && (
                    <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void duplicateCourse(c._id);
                        }}
                        className="rounded-lg bg-white/90 p-1.5 text-neutral-500 shadow-sm hover:text-[#315efb]"
                        title={t('community.coursesPanel.duplicateCourse')}
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void deleteCourse(c._id);
                        }}
                        className="rounded-lg bg-white/90 p-1.5 text-neutral-500 shadow-sm hover:text-red-600"
                        title={t('community.coursesPanel.deleteCourse')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {createOpen &&
          typeof document !== 'undefined' &&
          createPortal(
            <ResponsiveDialogShell
              open={createOpen}
              onClose={() => !createBusy && setCreateOpen(false)}
              title={t('community.coursesPanel.createModuleTitle')}
              disableClose={createBusy}
              zIndexClass="z-[200]"
              panelClassName="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl"
            >
                <button
                  type="button"
                  disabled={createBusy}
                  onClick={() => setCreateOpen(false)}
                  className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
                  aria-label={t('common.close')}
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="border-b border-neutral-100 px-6 py-5 text-center">
                  <h2 id="create-course-modal-title" className="text-lg font-semibold text-neutral-900">
                    {t('community.coursesPanel.createModuleTitle')}
                  </h2>
                </div>
                <div className="space-y-4 px-6 py-5">
                  <label className="block text-sm font-medium text-neutral-800">
                    {t('community.coursesPanel.courseName')}
                    <input
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      placeholder={t('community.coursesPanel.enterNamePh')}
                      className="mt-1.5 w-full rounded-lg border border-[#315efb] px-3 py-2 text-sm outline-none ring-2 ring-[#315efb]/15"
                    />
                  </label>
                  <label className="block text-sm font-medium text-neutral-800">
                    {t('community.coursesPanel.description')}
                    <textarea
                      value={createDesc}
                      onChange={(e) => setCreateDesc(e.target.value)}
                      placeholder={t('community.coursesPanel.enterDescriptionPh')}
                      rows={3}
                      className="mt-1.5 w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#315efb] focus:ring-2 focus:ring-[#315efb]/20"
                    />
                  </label>
                  <div className="flex items-center justify-between gap-3 py-1">
                    <span className="text-sm text-neutral-800">{t('community.coursesPanel.setHiddenToggle')}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={createHidden}
                      onClick={() => setCreateHidden((v) => !v)}
                      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                        createHidden ? 'bg-[#315efb]' : 'bg-neutral-200'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                          createHidden ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>
                  <div className="border-t border-neutral-100 pt-4">
                    <div className="flex gap-4">
                      <div className="flex h-24 w-36 shrink-0 items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50">
                        {createCover ? (
                          <img src={createCover} alt="" className="h-full w-full rounded-lg object-cover" />
                        ) : (
                          <Film className="h-8 w-8 text-neutral-300" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-800">{t('community.coursesPanel.cover')}</p>
                        <p className="mt-1 text-xs text-neutral-500">{t('community.coursesPanel.coverHint')}</p>
                        <input
                          ref={coverInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => readCoverFile(e.target.files?.[0] ?? null)}
                        />
                        <button
                          type="button"
                          onClick={() => coverInputRef.current?.click()}
                          className="mt-3 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
                        >
                          {t('community.coursesPanel.changeCover')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 border-t border-neutral-100 px-6 py-4">
                  <button
                    type="button"
                    disabled={createBusy}
                    onClick={() => setCreateOpen(false)}
                    className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
                  >
                    {t('community.coursesPanel.cancel')}
                  </button>
                  <button
                    type="button"
                    disabled={createBusy || !createName.trim()}
                    onClick={() => void submitCreate()}
                    className="rounded-lg bg-[#315efb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2547c4] disabled:opacity-45"
                  >
                    {createBusy ? t('community.coursesPanel.creating') : t('community.coursesPanel.create')}
                  </button>
                </div>
            </ResponsiveDialogShell>,
            document.body
          )}
        {confirmPortal}
      </div>
    );
  }

  const editorActionBar = (
    <div className="flex items-center gap-2">
      <span className="hidden text-sm text-neutral-400 sm:inline">
        {saveState === 'saving' && t('community.coursesPanel.saving')}
        {saveState === 'saved' && t('community.coursesPanel.saved')}
        {saveState === 'error' && t('community.coursesPanel.saveFailed')}
        {saveState === 'dirty' && t('community.coursesPanel.unsavedChanges')}
        {saveState === 'idle' && '\u00a0'}
      </span>
      {isOwner && (
        <button
          type="button"
          onClick={() => setView('settings')}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            view === 'settings'
              ? 'border-[#315efb] bg-[#eef2ff] text-[#315efb]'
              : 'border-neutral-200 text-neutral-800 hover:bg-neutral-50'
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            <Settings className="h-3.5 w-3.5" />
            {t('community.coursesPanel.settings')}
          </span>
        </button>
      )}
      <button
        type="button"
        onClick={copyCourseLink}
        className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
      >
        <span className="inline-flex items-center gap-1.5">
          <Copy className="h-3.5 w-3.5" />
          {t('community.coursesPanel.copyLink')}
        </span>
      </button>
      {isOwner && (
        <button
          type="button"
          onClick={() => void handleSaveNow()}
          disabled={saveState === 'saving'}
          className="rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/80 disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-1.5">
            {/* <Save className="h-3.5 w-3.5" /> */}
            {t('community.coursesPanel.save')}
          </span>
        </button>
      )}
    </div>
  );

  if (view === 'settings' && courseFull && isOwner) {
    const formattedUpdated = courseFull.updatedAt
      ? new Date(courseFull.updatedAt).toLocaleString()
      : '—';

    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[#e7e7e7] bg-white">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setView('editor')}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100"
              aria-label={t('community.coursesPanel.backToEditor')}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white">
              <Settings className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-neutral-500">{courseFull.name}</p>
              <h1 className="truncate text-lg font-semibold text-neutral-900">
                {t('community.coursesPanel.settingsPageTitle')}
              </h1>
            </div>
          </div>
          {editorActionBar}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-neutral-50/60 p-4 sm:p-6">
          <div className="mx-auto max-w-3xl space-y-5">
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                {t('community.coursesPanel.settingsGeneral')}
              </h2>
              <div className="mt-4 space-y-4">
                <label className="block text-sm font-medium text-neutral-800">
                  {t('community.coursesPanel.courseName')}
                  <input
                    value={courseFull.name}
                    onChange={(e) => updateCourseMeta({ name: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm font-medium text-neutral-800">
                  {t('community.coursesPanel.description')}
                  <textarea
                    value={courseFull.description}
                    onChange={(e) => updateCourseMeta({ description: e.target.value })}
                    placeholder={t('community.coursesPanel.descriptionPlaceholder')}
                    rows={4}
                    className="mt-1.5 w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm font-medium text-neutral-800">
                  {t('community.coursesPanel.tags')}
                  <p className="text-xs font-normal text-neutral-500">{t('community.coursesPanel.tagsHint')}</p>
                  <input
                    value={(courseFull.tags ?? []).join(', ')}
                    onChange={(e) =>
                      updateCourseMeta({
                        tags: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .slice(0, 20),
                      })
                    }
                    placeholder={t('community.coursesPanel.tagsPlaceholder')}
                    className="mt-1.5 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                {t('community.coursesPanel.settingsMessages')}
              </h2>
              <div className="mt-4 space-y-4">
                <label className="block text-sm font-medium text-neutral-800">
                  {t('community.coursesPanel.welcomeMessage')}
                  <p className="text-xs font-normal text-neutral-500">{t('community.coursesPanel.welcomeMessageHint')}</p>
                  <textarea
                    value={courseFull.welcomeMessage ?? ''}
                    onChange={(e) => updateCourseMeta({ welcomeMessage: e.target.value })}
                    placeholder={t('community.coursesPanel.welcomeMessagePlaceholder')}
                    rows={3}
                    className="mt-1.5 w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm font-medium text-neutral-800">
                  {t('community.coursesPanel.completionMessage')}
                  <p className="text-xs font-normal text-neutral-500">{t('community.coursesPanel.completionMessageHint')}</p>
                  <textarea
                    value={courseFull.completionMessage ?? ''}
                    onChange={(e) => updateCourseMeta({ completionMessage: e.target.value })}
                    placeholder={t('community.coursesPanel.completionMessagePlaceholder')}
                    rows={3}
                    className="mt-1.5 w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                {t('community.coursesPanel.settingsAppearance')}
              </h2>
              <div className="mt-4 flex flex-wrap gap-4">
                <div className="flex h-32 w-48 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-neutral-200 bg-neutral-50">
                  {courseFull.coverUrl ? (
                    <img src={courseFull.coverUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Film className="h-10 w-10 text-neutral-300" />
                  )}
                </div>
                <div className="min-w-[200px] flex-1">
                  <p className="text-sm font-medium text-neutral-800">{t('community.coursesPanel.cover')}</p>
                  <p className="mt-1 text-xs text-neutral-500">{t('community.coursesPanel.coverHint')}</p>
                  <input
                    ref={editorCoverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => readEditorCoverFile(e.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    onClick={() => editorCoverInputRef.current?.click()}
                    className="mt-3 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
                  >
                    {t('community.coursesPanel.changeCover')}
                  </button>
                  {courseFull.coverUrl ? (
                    <button
                      type="button"
                      onClick={() => updateCourseMeta({ coverUrl: '' })}
                      className="ml-2 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                    >
                      {t('community.coursesPanel.remove')}
                    </button>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                {t('community.coursesPanel.settingsAccess')}
              </h2>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{t('community.coursesPanel.publishCourse')}</p>
                    <p className="text-xs text-neutral-500">{t('community.coursesPanel.publishCourseHint')}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!courseFull.isHidden}
                    onClick={() => updateCourseMeta({ isHidden: !courseFull.isHidden })}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                      !courseFull.isHidden ? 'bg-[#315efb]' : 'bg-neutral-200'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                        !courseFull.isHidden ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{t('community.coursesPanel.sequentialUnlock')}</p>
                    <p className="text-xs text-neutral-500">{t('community.coursesPanel.sequentialUnlockHint')}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(courseFull.sequentialUnlock)}
                    onClick={() => updateCourseMeta({ sequentialUnlock: !courseFull.sequentialUnlock })}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                      courseFull.sequentialUnlock ? 'bg-[#315efb]' : 'bg-neutral-200'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                        courseFull.sequentialUnlock ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>
                {!courseFull.isHidden ? (
                  <p className="flex items-center gap-2 text-xs text-emerald-700">
                    <Eye className="h-3.5 w-3.5" />
                    {t('community.coursesPanel.publishCourseHint')}
                  </p>
                ) : (
                  <p className="flex items-center gap-2 text-xs text-amber-700">
                    <EyeOff className="h-3.5 w-3.5" />
                    {t('community.coursesPanel.hiddenCourseHint')}
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                {t('community.coursesPanel.settingsDefaults')}
              </h2>
              <label className="mt-4 block text-sm font-medium text-neutral-800">
                {t('community.coursesPanel.defaultLessonUnlock')}
                <p className="text-xs font-normal text-neutral-500">{t('community.coursesPanel.defaultLessonUnlockHint')}</p>
                <select
                  value={String(courseFull.defaultLessonUnlockDays ?? 0)}
                  onChange={(e) =>
                    updateCourseMeta({ defaultLessonUnlockDays: Number(e.target.value) })
                  }
                  className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
                >
                  {DRIP_OPTIONS.map((opt) => (
                    <option key={opt.key} value={String(opt.days)}>
                      {t(`community.coursesPanel.drip.${opt.key}`)}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                {t('community.coursesPanel.settingsOverview')}
              </h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-neutral-50 px-4 py-3">
                  <dt className="text-xs text-neutral-500">{t('community.coursesPanel.chaptersLabel')}</dt>
                  <dd className="mt-1 text-2xl font-semibold text-neutral-900">{courseFull.chapters.length}</dd>
                </div>
                <div className="rounded-xl bg-neutral-50 px-4 py-3">
                  <dt className="text-xs text-neutral-500">{t('community.coursesPanel.lessonsLabel')}</dt>
                  <dd className="mt-1 text-2xl font-semibold text-neutral-900">{lessonCount}</dd>
                </div>
                <div className="rounded-xl bg-neutral-50 px-4 py-3">
                  <dt className="text-xs text-neutral-500">{t('community.coursesPanel.lastUpdated')}</dt>
                  <dd className="mt-1 text-sm font-medium text-neutral-900">{formattedUpdated}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-red-200 bg-red-50/50 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-red-700">
                {t('community.coursesPanel.settingsDanger')}
              </h2>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => editorCourseId && void duplicateCourse(editorCourseId)}
                  className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
                >
                  {t('community.coursesPanel.duplicateCourse')}
                </button>
                <button
                  type="button"
                  onClick={() => editorCourseId && void deleteCourse(editorCourseId).then(() => setView('list'))}
                  className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  {t('community.coursesPanel.deleteFromSettings')}
                </button>
              </div>
            </section>

            <div className="flex justify-end pb-4">
              <button
                type="button"
                onClick={() => void handleSaveNow()}
                disabled={saveState === 'saving'}
                className="inline-flex items-center gap-2 rounded-xl bg-[#315efb] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2547c4] disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {t('community.coursesPanel.save')}
              </button>
            </div>
          </div>
        </div>
        {confirmPortal}
      </div>
    );
  }

  /* editor */
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[#e7e7e7] bg-white">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setView('list')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100"
            aria-label={t('community.coursesPanel.backToCourses')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white">
            <GraduationCap className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs text-neutral-500">
              {activeChapter?.title ?? t('community.coursesPanel.chapterNumber', { n: 1 })}
            </p>
            <h1 className="truncate text-lg font-semibold text-neutral-900">
              {activeLesson?.title ?? t('community.coursesPanel.lessonNumber', { n: 1 })}
            </h1>
          </div>
        </div>
        {editorActionBar}
      </div>

      {loadingCourse || !courseFull ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-purple-600" />
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[280px_1fr]">
          <aside className="flex min-h-0 flex-col border-b border-neutral-200 bg-neutral-50/80 md:border-b-0 md:border-r">
            <div className="shrink-0 border-b border-neutral-200 p-3">
              <button
                type="button"
                onClick={() => setView('list')}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-neutral-600 hover:bg-white"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" />
                {t('community.coursesPanel.back')}
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
              {courseFull.chapters.map((ch) => {
                const open = expandedChapters[String(ch._id)] !== false;
                const dragging = chapterDragId && sameId(chapterDragId, ch._id);
                return (
                  <div
                    key={String(ch._id)}
                    className={`rounded-lg bg-white p-1 shadow-sm ${dragging ? 'ring-2 ring-[#315efb]/40' : ''}`}
                    onDragOver={(e) => {
                      if (!isOwner) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => onChapterDrop(String(ch._id), e)}
                  >
                    <div className="flex items-center gap-1">
                      <span
                        role="button"
                        tabIndex={0}
                        className={`shrink-0 rounded p-0.5 text-neutral-300 ${isOwner ? 'cursor-grab active:cursor-grabbing hover:bg-neutral-100' : ''}`}
                        draggable={isOwner}
                        onDragStart={(e) => {
                          if (!isOwner) return;
                          e.dataTransfer.setData('text/x-chapter-id', String(ch._id));
                          e.dataTransfer.effectAllowed = 'move';
                          setChapterDragId(String(ch._id));
                        }}
                        onDragEnd={() => setChapterDragId(null)}
                        title={isOwner ? t('community.coursesPanel.dragToReorder') : undefined}
                      >
                        <GripVertical className="h-4 w-4" aria-hidden />
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedChapters((ex) => ({
                            ...ex,
                            [String(ch._id)]: !open,
                          }))
                        }
                        className="flex min-w-0 flex-1 items-center gap-1 rounded-md px-1 py-1 text-left text-sm font-medium text-neutral-900"
                      >
                        {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                        <span className="truncate">{ch.title}</span>
                      </button>
                      {isOwner && (
                        <>
                          <button
                            type="button"
                            title={t('community.coursesPanel.addLesson')}
                            onClick={() => addLesson(String(ch._id))}
                            className="shrink-0 rounded p-1 text-neutral-500 hover:bg-neutral-100"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title={t('community.coursesPanel.chapterOptions')}
                            className="shrink-0 rounded p-1 text-neutral-500 hover:bg-neutral-100"
                            onClick={(e) => openChapterMenu(e, String(ch._id))}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                    {open &&
                      ch.lessons.map((ls) => {
                        const sel = sameId(activeChapterId, ch._id) && sameId(activeLessonId, ls._id);
                        const lk = `${String(ch._id)}:${String(ls._id)}`;
                        const ldrag = lessonDragKey === lk;
                        return (
                          <div
                            key={String(ls._id)}
                            className={`mt-0.5 flex items-center gap-0.5 rounded-md py-0.5 pl-1 pr-0.5 ${
                              sel ? 'bg-[#eef2ff] font-medium text-[#315efb]' : 'text-neutral-700 hover:bg-neutral-50'
                            } ${ldrag ? 'ring-1 ring-[#315efb]/50' : ''}`}
                            onDragOver={(e) => {
                              if (!isOwner) return;
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                            }}
                            onDrop={(e) => onLessonDrop(String(ch._id), String(ls._id), e)}
                          >
                            <span
                              className={`shrink-0 rounded p-0.5 text-neutral-300 ${isOwner ? 'cursor-grab active:cursor-grabbing' : ''}`}
                              draggable={isOwner}
                              onDragStart={(e) => {
                                if (!isOwner) return;
                                e.stopPropagation();
                                e.dataTransfer.setData(
                                  'application/json',
                                  JSON.stringify({ chapterId: String(ch._id), lessonId: String(ls._id) })
                                );
                                e.dataTransfer.effectAllowed = 'move';
                                setLessonDragKey(lk);
                              }}
                              onDragEnd={() => setLessonDragKey(null)}
                              title={isOwner ? t('community.coursesPanel.dragToReorder') : undefined}
                            >
                              <GripVertical className="h-3.5 w-3.5" aria-hidden />
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveChapterId(String(ch._id));
                                setActiveLessonId(String(ls._id));
                              }}
                              className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-1.5 pl-1 pr-1 text-left text-sm"
                            >
                              {lessonShowsLocked(ls, isOwner) ? (
                                <Lock className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                              ) : ls.videoEmbedUrl ? (
                                <Video className="h-3.5 w-3.5 shrink-0 opacity-60" />
                              ) : (
                                <Files className="h-3.5 w-3.5 shrink-0 opacity-50" />
                              )}
                              <span className="min-w-0 flex-1 truncate">{ls.title}</span>
                            </button>
                            {isOwner && (
                              <button
                                type="button"
                                className="shrink-0 rounded p-1 text-neutral-400 hover:bg-black/5 hover:text-neutral-700"
                                title={t('community.coursesPanel.lessonOptions')}
                                onClick={(e) => openLessonMenu(e, String(ch._id), String(ls._id))}
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                  </div>
                );
              })}
            </div>
            {isOwner && (
              <div className="shrink-0 border-t border-neutral-200 p-2">
                <button
                  type="button"
                  onClick={addChapter}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 py-2.5 text-sm font-medium text-neutral-700 hover:bg-white"
                >
                  <Plus className="h-4 w-4" />
                  {t('community.coursesPanel.addChapter')}
                </button>
              </div>
            )}
          </aside>

          <main className="min-h-0 overflow-y-auto bg-white p-6">
            {!isOwner && courseFull?.welcomeMessage?.trim() ? (
              <div className="mx-auto mb-6 max-w-2xl rounded-xl border border-[#315efb]/15 bg-[#f8faff] px-4 py-3 text-sm leading-relaxed text-neutral-800">
                {courseFull.welcomeMessage.trim()}
              </div>
            ) : null}

            {activeLesson && (
              <div className="mx-auto max-w-2xl space-y-8">
                {!isOwner ? (
                  <>
                    <p className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                      {t('community.coursesPanel.viewerNotice')}
                    </p>
                    {activeLessonLocked ? (
                      <section className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-14 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-200/80">
                          <Lock className="h-7 w-7 text-neutral-500" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-neutral-900">
                          {t('community.coursesPanel.lockedTitle')}
                        </h3>
                        <p className="mt-2 max-w-sm text-sm text-neutral-600">
                          {activeLesson.isLocked
                            ? t('community.coursesPanel.lockedPrivate')
                            : t('community.coursesPanel.lockedDrip')}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">{activeLesson.dripLabel}</p>
                        <p className="mt-4 text-xs text-neutral-400">{t('community.coursesPanel.lockedCta')}</p>
                      </section>
                    ) : (
                      <>
                    <section className="rounded-xl border border-neutral-200 p-6">
                      <h3 className="text-base font-semibold text-neutral-900">{t('community.coursesPanel.video')}</h3>
                      {youtubeEmbed ? (
                        <div className="mt-3 aspect-video overflow-hidden rounded-lg border border-neutral-200 bg-black">
                          <iframe
                            title={t('community.coursesPanel.lessonVideo')}
                            src={youtubeEmbed}
                            className="h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        </div>
                      ) : activeLesson.videoEmbedUrl.trim() ? (
                        <a
                          href={activeLesson.videoEmbedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex text-sm font-medium text-[#315efb] hover:underline"
                        >
                          {t('community.coursesPanel.openVideo')}
                        </a>
                      ) : (
                        <p className="mt-3 text-sm text-neutral-400">{t('community.coursesPanel.noVideo')}</p>
                      )}
                    </section>
                    <section>
                      <h3 className="text-sm font-semibold text-neutral-900">{t('community.coursesPanel.images')}</h3>
                      {(activeLesson.images || []).length > 0 ? (
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {(activeLesson.images || []).map((src, idx) => (
                            <div
                              key={`view-img-${idx}`}
                              className="aspect-video overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100"
                            >
                              <img src={src} alt="" className="h-full w-full object-cover" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-neutral-400">{t('community.coursesPanel.noImages')}</p>
                      )}
                    </section>
                    <section>
                      <h3 className="text-sm font-semibold text-neutral-900">{t('community.coursesPanel.attachments')}</h3>
                      {(activeLesson.attachments || []).length > 0 ? (
                        <ul className="mt-3 space-y-2">
                          {(activeLesson.attachments || []).map((att, idx) => (
                            <li
                              key={idx}
                              className="flex items-center justify-between gap-2 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 text-xs"
                            >
                              <span className="truncate text-neutral-700">
                                {t('community.coursesPanel.attachmentN', { n: idx + 1 })}
                              </span>
                              <a
                                href={att}
                                target="_blank"
                                rel="noreferrer"
                                className="shrink-0 text-[#315efb] hover:underline"
                              >
                                {t('community.coursesPanel.open')}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-neutral-400">{t('community.coursesPanel.noAttachments')}</p>
                      )}
                    </section>
                    <section>
                      <h3 className="text-sm font-semibold text-neutral-900">{t('community.coursesPanel.availability')}</h3>
                      <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-800">
                        <Lock className="h-4 w-4 text-neutral-500" aria-hidden />
                        {activeLesson.dripLabel}
                      </div>
                    </section>
                    <section>
                      <h3 className="text-sm font-semibold text-neutral-900">{t('community.coursesPanel.content')}</h3>
                      <div className="mt-2 min-h-[120px] whitespace-pre-wrap rounded-lg border border-neutral-200 bg-neutral-50/80 px-3 py-3 text-sm leading-relaxed text-neutral-800">
                        {activeLesson.content?.trim() ? activeLesson.content : '—'}
                      </div>
                    </section>
                      </>
                    )}
                  </>
                ) : (
                  <>
                <section className="rounded-xl border border-neutral-200 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-neutral-900">{t('community.coursesPanel.youtubeTitle')}</h3>
                      <p className="mt-1 text-xs text-neutral-500">{t('community.coursesPanel.youtubeHint')}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void pasteYoutubeFromClipboard()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
                      >
                        <ClipboardPaste className="h-3.5 w-3.5" />
                        {t('community.coursesPanel.pasteYoutube')}
                      </button>
                      {activeLesson.videoEmbedUrl.trim() ? (
                        <button
                          type="button"
                          onClick={() => updateLesson({ videoEmbedUrl: '', lessonType: 'multimedia' })}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                        >
                          <X className="h-3.5 w-3.5" />
                          {t('community.coursesPanel.clearVideo')}
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <label className="mt-4 block text-sm font-medium text-neutral-700">
                    <span className="inline-flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 text-red-600" />
                      YouTube
                    </span>
                    <input
                      value={activeLesson.videoEmbedUrl}
                      onChange={(e) =>
                        updateLesson({
                          videoEmbedUrl: e.target.value,
                          lessonType: e.target.value.trim() ? 'video' : 'multimedia',
                        })
                      }
                      onPaste={(e) => {
                        const text = e.clipboardData.getData('text');
                        if (!text.trim()) return;
                        window.setTimeout(() => {
                          updateLesson({ videoEmbedUrl: text.trim(), lessonType: 'video' });
                        }, 0);
                      }}
                      placeholder={t('community.coursesPanel.youtubePlaceholder')}
                      className="mt-1.5 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-[#315efb] focus:outline-none focus:ring-2 focus:ring-[#315efb]/15"
                    />
                  </label>
                  {youtubeEmbed ? (
                    <div className="mt-4 aspect-video overflow-hidden rounded-lg border border-neutral-200 bg-black">
                      <iframe
                        title={t('community.coursesPanel.lessonVideoPreview')}
                        src={youtubeEmbed}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  ) : youtubeThumb ? (
                    <div className="relative mt-4 aspect-video overflow-hidden rounded-lg border border-neutral-200">
                      <img src={youtubeThumb} alt="" className="h-full w-full object-cover opacity-80" />
                    </div>
                  ) : null}
                  {activeLesson.videoEmbedUrl.trim() && !youtubeEmbed && (
                    <p className="mt-2 text-xs text-amber-700">{t('community.coursesPanel.youtubeInvalid')}</p>
                  )}
                </section>

                <section className="rounded-xl border border-neutral-200 p-5">
                  <h3 className="text-sm font-semibold text-neutral-900">{t('community.coursesPanel.privacy')}</h3>
                  <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{t('community.coursesPanel.privateLesson')}</p>
                      <p className="text-xs text-neutral-500">{t('community.coursesPanel.privateLessonHint')}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(activeLesson.isLocked)}
                      onClick={() => applyLessonPrivacy({ isLocked: !activeLesson.isLocked })}
                      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                        activeLesson.isLocked ? 'bg-[#315efb]' : 'bg-neutral-200'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                          activeLesson.isLocked ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>
                  <label className="mt-4 block text-sm font-medium text-neutral-800">
                    {t('community.coursesPanel.dripSchedule')}
                    <p className="text-xs font-normal text-neutral-500">{t('community.coursesPanel.dripHint')}</p>
                    <select
                      value={String(activeLesson.isLocked ? -1 : Math.max(0, Number(activeLesson.unlockAfterDays) || 0))}
                      disabled={Boolean(activeLesson.isLocked)}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (v < 0) {
                          applyLessonPrivacy({ isLocked: true });
                          return;
                        }
                        applyLessonPrivacy({ isLocked: false, unlockAfterDays: v });
                      }}
                      className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-neutral-100"
                    >
                      <option value="-1">{t('community.coursesPanel.drip.private')}</option>
                      {DRIP_OPTIONS.map((opt) => (
                        <option key={opt.key} value={String(opt.days)}>
                          {t(`community.coursesPanel.drip.${opt.key}`)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800">
                    <Lock className="h-4 w-4 text-neutral-500" aria-hidden />
                    {activeLesson.dripLabel}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-neutral-900">{t('community.coursesPanel.images')}</h3>
                  <p className="mt-1 text-xs text-neutral-500">{t('community.coursesPanel.imagesHint')}</p>
                  <input
                    ref={lessonImageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files) Array.from(files).forEach((f) => readLessonImage(f));
                      e.target.value = '';
                    }}
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => lessonImageInputRef.current?.click()}
                      className="flex items-center gap-2 rounded-lg border border-dashed border-neutral-200 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
                    >
                      <ImageIcon className="h-4 w-4" />
                      {t('community.coursesPanel.uploadPhotos')}
                    </button>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                    <label className="min-w-0 flex-1 text-sm font-medium text-neutral-700">
                      {t('community.coursesPanel.addImageUrl')}
                      <input
                        value={lessonImageUrlDraft}
                        onChange={(e) => setLessonImageUrlDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addLessonImagesFromUrls([lessonImageUrlDraft]);
                          }
                        }}
                        placeholder={t('community.coursesPanel.imageUrlPlaceholder')}
                        className="mt-1.5 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => addLessonImagesFromUrls([lessonImageUrlDraft])}
                      disabled={!lessonImageUrlDraft.trim()}
                      className="shrink-0 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {t('community.coursesPanel.addImageUrl')}
                    </button>
                  </div>
                  {(activeLesson.images || []).length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {(activeLesson.images || []).map((src, idx) => (
                        <div key={`${idx}-${src.slice(0, 40)}`} className="group/img relative aspect-video overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
                          <img src={src} alt="" className="h-full w-full object-cover" />
                          {isOwner && (
                            <button
                              type="button"
                              className="absolute right-1 top-1 rounded-md bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover/img:opacity-100"
                              title={t('community.coursesPanel.remove')}
                              onClick={() =>
                                updateLesson({
                                  images: (activeLesson.images || []).filter((_, j) => j !== idx),
                                })
                              }
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-neutral-900">{t('community.coursesPanel.attachments')}</h3>
                  <input
                    ref={attachmentInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      readAttachment(e.target.files?.[0] ?? null);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => attachmentInputRef.current?.click()}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-200 py-8 text-sm text-neutral-500 hover:bg-neutral-50"
                  >
                    <Files className="h-5 w-5" />
                    {t('community.coursesPanel.uploadAttachment')}
                  </button>
                  {(activeLesson.attachments || []).length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {(activeLesson.attachments || []).map((att, idx) => (
                        <li
                          key={idx}
                          className="flex items-center justify-between gap-2 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 text-xs"
                        >
                          <span className="truncate text-neutral-700">
                            {t('community.coursesPanel.attachmentN', { n: idx + 1 })}
                          </span>
                          <div className="flex shrink-0 items-center gap-1">
                            <a
                              href={att}
                              download={`attachment-${idx + 1}`}
                              className="text-[#315efb] hover:underline"
                              target="_blank"
                              rel="noreferrer"
                            >
                              {t('community.coursesPanel.open')}
                            </a>
                            {isOwner && (
                              <button
                                type="button"
                                className="text-red-600 hover:underline"
                                onClick={() =>
                                  updateLesson({
                                    attachments: (activeLesson.attachments || []).filter((_, j) => j !== idx),
                                  })
                                }
                              >
                                {t('community.coursesPanel.remove')}
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-neutral-900">{t('community.coursesPanel.content')}</h3>
                  <textarea
                    value={activeLesson.content}
                    onChange={(e) => updateLesson({ content: e.target.value })}
                    placeholder={t('community.coursesPanel.contentPlaceholder')}
                    rows={10}
                    className="mt-2 w-full resize-y rounded-lg border border-neutral-200 px-3 py-2 text-sm leading-relaxed text-neutral-800 placeholder:text-neutral-400"
                  />
                </section>

                <div className="flex flex-wrap gap-3 border-t border-neutral-100 pt-6">
                    <label className="text-sm text-neutral-600">
                      {t('community.coursesPanel.lessonTitle')}
                      <input
                        value={activeLesson.title}
                        onChange={(e) => updateLesson({ title: e.target.value })}
                        className="mt-1 block w-full min-w-[200px] rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-sm text-neutral-600">
                      {t('community.coursesPanel.chapterTitle')}
                      <input
                        value={activeChapter?.title ?? ''}
                        onChange={(e) => {
                          if (!courseFull || !activeChapterId) return;
                          const chapters = courseFull.chapters.map((c) =>
                            sameId(c._id, activeChapterId) ? { ...c, title: e.target.value } : c
                          );
                          const next = { ...courseFull, chapters };
                          setCourseFull(next);
                          markCourseDirty();
                        }}
                        className="mt-1 block w-full min-w-[200px] rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                      />
                    </label>
                  </div>
                  </>
                )}
              </div>
            )}
          </main>
        </div>
      )}
      {confirmPortal}
      {structureMenuPortal}
    </div>
  );
};

export default CommunityCoursesPanel;
