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
  Upload,
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import ResponsiveDialogShell from '../Common/ResponsiveDialogShell';
import { communityPath } from '../../constants/communityRoutes';

import { COMMUNITIES_API as API } from '../../config/api';

const Z_OVERLAY = 10000;
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
}

interface Chapter {
  _id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface CourseFull extends CourseListItem {
  chapters: Chapter[];
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

/** Returns YouTube embed URL or null */
function parseYoutubeEmbedUrl(url: string): string | null {
  const u = url.trim();
  if (!u) return null;
  if (/^[\w-]{11}$/.test(u)) return `https://www.youtube.com/embed/${u}`;
  try {
    const parsed = new URL(u);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (parsed.pathname.startsWith('/embed/')) {
        const id = parsed.pathname.split('/')[2];
        if (id) return `https://www.youtube.com/embed/${id}`;
      }
      const v = parsed.searchParams.get('v');
      if (v && /^[\w-]{11}$/.test(v)) return `https://www.youtube.com/embed/${v}`;
      const shorts = parsed.pathname.match(/^\/shorts\/([\w-]+)/);
      if (shorts?.[1]) return `https://www.youtube.com/embed/${shorts[1]}`;
    }
    if (host === 'youtu.be') {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0];
      if (id && /^[\w-]{11}$/.test(id)) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    return null;
  }
  return null;
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

const emptyLesson = (): Omit<Lesson, '_id'> => ({
  title: 'New lesson',
  lessonType: 'multimedia',
  videoEmbedUrl: '',
  content: '',
  images: [],
  attachments: [],
  dripLabel: 'Unlocks immediately',
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
  const [view, setView] = useState<'list' | 'editor'>('list');
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
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimerRef = useRef<number | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const lessonImageInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [structureMenu, setStructureMenu] = useState<StructureMenuState | null>(null);
  const structureMenuRef = useRef<HTMLDivElement | null>(null);
  const [chapterDragId, setChapterDragId] = useState<string | null>(null);
  const [lessonDragKey, setLessonDragKey] = useState<string | null>(null);
  const [lessonImageUrlDraft, setLessonImageUrlDraft] = useState('');

  const cancelScheduledSave = useCallback(() => {
    if (saveTimerRef.current != null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
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
      cancelScheduledSave();
      setSaveState('saving');
      try {
        const res = await fetch(`${API}/${encodeURIComponent(handle)}/courses/${editorCourseId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            instanceId,
            name: next.name,
            description: next.description,
            isHidden: next.isHidden,
            coverUrl: next.coverUrl,
            chapters: next.chapters,
          }),
        });
        if (!res.ok) {
          setSaveState('error');
          return null;
        }
        const saved = (await res.json()) as CourseFull;
        setCourseFull(saved);
        setSaveState('saved');
        window.setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 2000);
        return saved;
      } catch {
        setSaveState('error');
        return null;
      }
    },
    [isOwner, token, handle, instanceId, editorCourseId, cancelScheduledSave]
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
        const normalized: CourseFull = {
          ...data,
          chapters: (data.chapters || []).map((ch) => ({
            ...ch,
            lessons: (ch.lessons || []).map((ls) => ({
              ...ls,
              images: Array.isArray(ls.images) ? ls.images : [],
              attachments: Array.isArray(ls.attachments) ? ls.attachments : [],
            })),
          })),
        };
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
      } finally {
        setLoadingCourse(false);
      }
    },
    [token, handle, instanceId]
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

  const scheduleSave = useCallback(
    (next: CourseFull) => {
      if (!isOwner || !token || !handle || !instanceId || !editorCourseId) return;
      setSaveState('saving');
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(async () => {
        saveTimerRef.current = null;
        try {
          const res = await fetch(`${API}/${encodeURIComponent(handle)}/courses/${editorCourseId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              instanceId,
              name: next.name,
              description: next.description,
              isHidden: next.isHidden,
              coverUrl: next.coverUrl,
              chapters: next.chapters,
            }),
          });
          if (!res.ok) {
            setSaveState('error');
            return;
          }
          const saved = (await res.json()) as CourseFull;
          setCourseFull(saved);
          setSaveState('saved');
          window.setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 2000);
        } catch {
          setSaveState('error');
        }
      }, 650);
    },
    [isOwner, token, handle, instanceId, editorCourseId]
  );

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
      scheduleSave(next);
    },
    [courseFull, activeChapterId, activeLessonId, isOwner, scheduleSave]
  );

  const addChapter = useCallback(() => {
    if (!courseFull || !isOwner) return;
    const order = courseFull.chapters.length;
    const newChapter = {
      title: `Chapter ${order + 1}`,
      order,
      lessons: [{ ...emptyLesson(), title: 'Lesson 1' }],
    };
    const next = { ...courseFull, chapters: [...courseFull.chapters, newChapter as unknown as Chapter] };
    void (async () => {
      const saved = await persistCourseNow(next);
      if (!saved?.chapters?.length) return;
      const last = saved.chapters[saved.chapters.length - 1];
      const firstL = last.lessons?.[0];
      if (last._id) setExpandedChapters((e) => ({ ...e, [String(last._id)]: true }));
      if (last._id && firstL?._id) {
        setActiveChapterId(String(last._id));
        setActiveLessonId(String(firstL._id));
      }
    })();
  }, [courseFull, isOwner, persistCourseNow]);

  const addLesson = useCallback(
    (chapterId: string) => {
      if (!courseFull || !isOwner) return;
      const chapters = courseFull.chapters.map((ch) => {
        if (!sameId(ch._id, chapterId)) return ch;
        return {
          ...ch,
          lessons: [...ch.lessons, { ...emptyLesson() } as unknown as Lesson],
        };
      });
      const next = { ...courseFull, chapters };
      void (async () => {
        const saved = await persistCourseNow(next);
        if (!saved) return;
        const ch = saved.chapters.find((c) => sameId(c._id, chapterId));
        const last = ch?.lessons[ch.lessons.length - 1];
        if (last?._id) {
          setActiveChapterId(String(chapterId));
          setActiveLessonId(String(last._id));
        }
      })();
    },
    [courseFull, isOwner, persistCourseNow]
  );

  const requestDeleteChapter = useCallback(
    (chapterId: string) => {
      if (!courseFull || !isOwner) return;
      if (courseFull.chapters.length <= 1) {
        showToast('You must keep at least one chapter in this course.', 'info');
        return;
      }
      setStructureMenu(null);
      setConfirmDialog({
        title: 'Delete chapter',
        message: 'Are you sure you want to delete this chapter? This action cannot be undone.',
        confirmLabel: 'Delete chapter',
        destructive: true,
        onConfirm: async () => {
          setConfirmDialog(null);
          const chapters = courseFull.chapters
            .filter((c) => !sameId(c._id, chapterId))
            .map((c, i) => ({ ...c, order: i }));
          const next = { ...courseFull, chapters };
          const saved = await persistCourseNow(next);
          if (saved && sameId(activeChapterId, chapterId)) {
            const first = saved.chapters[0];
            setActiveChapterId(first ? String(first._id) : null);
            setActiveLessonId(first?.lessons?.[0]?._id != null ? String(first.lessons[0]._id) : null);
          }
        },
      });
    },
    [courseFull, isOwner, persistCourseNow, activeChapterId]
  );

  const requestDeleteLesson = useCallback(
    (chapterId: string, lessonId: string) => {
      if (!courseFull || !isOwner) return;
      const ch = courseFull.chapters.find((c) => sameId(c._id, chapterId));
      if (!ch || ch.lessons.length <= 1) {
        showToast(
          'Each chapter must have at least one lesson. Add another lesson before deleting this one.',
          'info'
        );
        return;
      }
      setStructureMenu(null);
      setConfirmDialog({
        title: 'Delete lesson',
        message: 'Are you sure you want to delete this lesson? This action cannot be undone.',
        confirmLabel: 'Delete lesson',
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
          const saved = await persistCourseNow(next);
          if (saved && sameId(activeChapterId, chapterId) && sameId(activeLessonId, lessonId)) {
            const updatedCh = saved.chapters.find((c) => sameId(c._id, chapterId));
            const first = updatedCh?.lessons[0];
            if (first?._id) setActiveLessonId(String(first._id));
          }
        },
      });
    },
    [courseFull, isOwner, persistCourseNow, activeChapterId, activeLessonId]
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
        const copy = {
          title: `${src.title} (copy)`,
          lessonType: src.lessonType,
          videoEmbedUrl: src.videoEmbedUrl,
          content: src.content,
          images: [...(src.images || [])],
          attachments: [...(src.attachments || [])],
          dripLabel: src.dripLabel,
        };
        const lessons = [...ch.lessons.slice(0, idx + 1), copy as unknown as Lesson, ...ch.lessons.slice(idx + 1)];
        return { ...ch, lessons };
      });
      void persistCourseNow({ ...courseFull, chapters });
    },
    [courseFull, isOwner, persistCourseNow]
  );

  const onChapterDrop = useCallback(
    (targetChapterId: string, e: React.DragEvent) => {
      e.preventDefault();
      setChapterDragId(null);
      const fromId = e.dataTransfer.getData('text/x-chapter-id');
      if (!fromId || !courseFull || !isOwner || sameId(fromId, targetChapterId)) return;
      const chapters = reorderChapters(courseFull.chapters, fromId, targetChapterId);
      void persistCourseNow({ ...courseFull, chapters });
    },
    [courseFull, isOwner, persistCourseNow]
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
        void persistCourseNow({ ...courseFull, chapters });
      } catch {
        /* ignore */
      }
    },
    [courseFull, isOwner, persistCourseNow]
  );

  useEffect(() => {
    if (!structureMenu && !confirmDialog) return;
    const close = (ev: MouseEvent) => {
      const t = ev.target as Node;
      if (structureMenuRef.current?.contains(t)) return;
      setStructureMenu(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [structureMenu, confirmDialog]);

  const deleteCourse = async (courseId: string) => {
    if (!token || !handle || !instanceId || !isOwner) return;
    const confirmed = await confirm({
      title: 'Delete course?',
      message: 'All chapters and lessons in this course will be permanently removed.',
      confirmLabel: 'Delete',
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
        showToast((d as { message?: string }).message || 'Could not create course', 'error');
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
    const url = `${window.location.origin}${communityPath(handle)}`;
    void navigator.clipboard.writeText(url);
  };

  const readCoverFile = (file: File | null) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const r = String(reader.result || '');
      if (r.length > 400_000) {
        showToast('Image is too large. Use a smaller file or paste an image URL instead.', 'info');
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
        showToast('Image is too large.', 'info');
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
        const next = { ...prev, chapters };
        scheduleSave(next);
        return next;
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
        showToast('File is too large for inline storage.', 'info');
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
        const next = { ...prev, chapters };
        scheduleSave(next);
        return next;
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
      const next = { ...prev, chapters };
      scheduleSave(next);
      return next;
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
          aria-label={view === 'editor' ? 'Back to courses' : 'Back to community'}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white">
          <GraduationCap className="h-5 w-5" strokeWidth={2} />
        </div>
        <h1 className="truncate text-lg font-semibold text-neutral-900">{instanceTitle}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button type="button" className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100" title="Copy link">
          <Link2 className="h-5 w-5" />
        </button>
        <button type="button" className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100" title="Members">
          <Users className="h-5 w-5" />
        </button>
        <button type="button" className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100" title="Notifications">
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
            Cancel
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
              Add lesson
            </button>
            <div className="my-0.5 h-px bg-neutral-100" />
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              onClick={() => requestDeleteChapter(structureMenu.chapterId)}
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              Delete chapter
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
              Duplicate lesson
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
              Delete lesson
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
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-neutral-500">Sign in to use Courses.</div>
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
                  onClick={() => setCreateOpen(true)}
                  className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-white px-4 py-8 text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-neutral-300">
                    <Plus className="h-7 w-7 text-neutral-400" strokeWidth={1.25} />
                  </span>
                  <span className="mt-4 text-sm font-medium text-neutral-700">Add course</span>
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
                      {c.isHidden && <span className="mt-1 text-xs text-amber-600">Hidden</span>}
                    </div>
                  </button>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => void deleteCourse(c._id)}
                      className="absolute right-2 top-2 rounded-lg bg-white/90 p-1.5 text-neutral-500 opacity-0 shadow-sm transition-opacity hover:text-red-600 group-hover:opacity-100"
                      title="Delete course"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
              title="Create course module"
              disableClose={createBusy}
              zIndexClass="z-[200]"
              panelClassName="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl"
            >
                <button
                  type="button"
                  disabled={createBusy}
                  onClick={() => setCreateOpen(false)}
                  className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="border-b border-neutral-100 px-6 py-5 text-center">
                  <h2 id="create-course-modal-title" className="text-lg font-semibold text-neutral-900">
                    Create course module
                  </h2>
                </div>
                <div className="space-y-4 px-6 py-5">
                  <label className="block text-sm font-medium text-neutral-800">
                    Name
                    <input
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      placeholder="Enter a name"
                      className="mt-1.5 w-full rounded-lg border border-[#315efb] px-3 py-2 text-sm outline-none ring-2 ring-[#315efb]/15"
                    />
                  </label>
                  <label className="block text-sm font-medium text-neutral-800">
                    Description
                    <textarea
                      value={createDesc}
                      onChange={(e) => setCreateDesc(e.target.value)}
                      placeholder="Enter a description"
                      rows={3}
                      className="mt-1.5 w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#315efb] focus:ring-2 focus:ring-[#315efb]/20"
                    />
                  </label>
                  <div className="flex items-center justify-between gap-3 py-1">
                    <span className="text-sm text-neutral-800">Set course to hidden</span>
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
                        <p className="text-sm font-medium text-neutral-800">Cover</p>
                        <p className="mt-1 text-xs text-neutral-500">1500 × 840 px recommended</p>
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
                          Change
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
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={createBusy || !createName.trim()}
                    onClick={() => void submitCreate()}
                    className="rounded-lg bg-[#315efb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2547c4] disabled:opacity-45"
                  >
                    {createBusy ? 'Creating…' : 'Create'}
                  </button>
                </div>
            </ResponsiveDialogShell>,
            document.body
          )}
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
            aria-label="Back to courses"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white">
            <GraduationCap className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs text-neutral-500">{activeChapter?.title ?? 'Chapter'}</p>
            <h1 className="truncate text-lg font-semibold text-neutral-900">{activeLesson?.title ?? 'Lesson'}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-neutral-400 sm:inline">
            {saveState === 'saving' && 'Saving…'}
            {saveState === 'saved' && 'Saved'}
            {saveState === 'error' && 'Save failed'}
            {saveState === 'idle' && '\u00a0'}
          </span>
          <button
            type="button"
            onClick={copyCourseLink}
            className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
          >
            <span className="inline-flex items-center gap-1.5">
              <Copy className="h-3.5 w-3.5" />
              Copy link
            </span>
          </button>
        </div>
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
                Back
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
                        className={`shrink-0 rounded p-0.5 text-neutral-400 ${isOwner ? 'cursor-grab active:cursor-grabbing hover:bg-neutral-100' : ''}`}
                        draggable={isOwner}
                        onDragStart={(e) => {
                          if (!isOwner) return;
                          e.dataTransfer.setData('text/x-chapter-id', String(ch._id));
                          e.dataTransfer.effectAllowed = 'move';
                          setChapterDragId(String(ch._id));
                        }}
                        onDragEnd={() => setChapterDragId(null)}
                        title={isOwner ? 'Drag to reorder' : undefined}
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
                            title="Add lesson"
                            onClick={() => addLesson(String(ch._id))}
                            className="shrink-0 rounded p-1 text-neutral-500 hover:bg-neutral-100"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Chapter options"
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
                              title={isOwner ? 'Drag to reorder' : undefined}
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
                              <Video className="h-3.5 w-3.5 shrink-0 opacity-60" />
                              <span className="min-w-0 flex-1 truncate">{ls.title}</span>
                            </button>
                            {isOwner && (
                              <button
                                type="button"
                                className="shrink-0 rounded p-1 text-neutral-400 hover:bg-black/5 hover:text-neutral-700"
                                title="Lesson options"
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
                  Add new chapter
                </button>
              </div>
            )}
          </aside>

          <main className="min-h-0 overflow-y-auto bg-white p-6">
            {activeLesson && (
              <div className="mx-auto max-w-2xl space-y-8">
                {!isOwner ? (
                  <>
                    <p className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                      Lesson viewer — only the community owner can edit this course.
                    </p>
                    <section className="rounded-xl border border-neutral-200 p-6">
                      <h3 className="text-base font-semibold text-neutral-900">Video</h3>
                      {youtubeEmbed ? (
                        <div className="mt-3 aspect-video overflow-hidden rounded-lg border border-neutral-200 bg-black">
                          <iframe
                            title="Lesson video"
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
                          Open video link
                        </a>
                      ) : (
                        <p className="mt-3 text-sm text-neutral-400">No video for this lesson.</p>
                      )}
                    </section>
                    <section>
                      <h3 className="text-sm font-semibold text-neutral-900">Images</h3>
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
                        <p className="mt-2 text-sm text-neutral-400">No images in this lesson.</p>
                      )}
                    </section>
                    <section>
                      <h3 className="text-sm font-semibold text-neutral-900">Attachments</h3>
                      {(activeLesson.attachments || []).length > 0 ? (
                        <ul className="mt-3 space-y-2">
                          {(activeLesson.attachments || []).map((att, idx) => (
                            <li
                              key={idx}
                              className="flex items-center justify-between gap-2 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 text-xs"
                            >
                              <span className="truncate text-neutral-700">Attachment {idx + 1}</span>
                              <a
                                href={att}
                                target="_blank"
                                rel="noreferrer"
                                className="shrink-0 text-[#315efb] hover:underline"
                              >
                                Open
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-neutral-400">No attachments.</p>
                      )}
                    </section>
                    <section>
                      <h3 className="text-sm font-semibold text-neutral-900">Availability</h3>
                      <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-800">
                        <Lock className="h-4 w-4 text-neutral-500" aria-hidden />
                        {activeLesson.dripLabel}
                      </div>
                    </section>
                    <section>
                      <h3 className="text-sm font-semibold text-neutral-900">Content</h3>
                      <div className="mt-2 min-h-[120px] whitespace-pre-wrap rounded-lg border border-neutral-200 bg-neutral-50/80 px-3 py-3 text-sm leading-relaxed text-neutral-800">
                        {activeLesson.content?.trim() ? activeLesson.content : '—'}
                      </div>
                    </section>
                  </>
                ) : (
                  <>
                <section className="rounded-xl border border-neutral-200 p-6">
                  <h3 className="text-base font-semibold text-neutral-900">Add a video to this lesson</h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    Paste a YouTube link (watch, youtu.be, Shorts) — preview appears below. Other hosts: paste direct
                    embed URL if supported.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-neutral-100 bg-neutral-50/80 p-4 text-center">
                      <Upload className="mx-auto h-6 w-6 text-neutral-400" />
                      <p className="mt-2 text-sm font-medium text-neutral-800">Upload video</p>
                      <p className="mt-1 text-xs text-neutral-500">Host file elsewhere, paste URL</p>
                    </div>
                    <div className="rounded-lg border border-neutral-100 bg-neutral-50/80 p-4 text-center">
                      <LinkIcon className="mx-auto h-6 w-6 text-neutral-400" />
                      <p className="mt-2 text-sm font-medium text-neutral-800">YouTube</p>
                      <p className="mt-1 text-xs text-neutral-500">youtube.com or youtu.be</p>
                    </div>
                    <div className="rounded-lg border border-neutral-100 bg-neutral-50/80 p-4 text-center">
                      <ClipboardPaste className="mx-auto h-6 w-6 text-neutral-400" />
                      <p className="mt-2 text-sm font-medium text-neutral-800">Paste video</p>
                      <p className="mt-1 text-xs text-neutral-500">From another lesson</p>
                    </div>
                  </div>
                  <label className="mt-4 block text-sm font-medium text-neutral-700">
                    Video URL
                    <input
                      value={activeLesson.videoEmbedUrl}
                      onChange={(e) => updateLesson({ videoEmbedUrl: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=…"
                      className="mt-1.5 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                    />
                  </label>
                  {youtubeEmbed && (
                    <div className="mt-4 aspect-video overflow-hidden rounded-lg border border-neutral-200 bg-black">
                      <iframe
                        title="Lesson video preview"
                        src={youtubeEmbed}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  )}
                  {activeLesson.videoEmbedUrl.trim() && !youtubeEmbed && (
                    <p className="mt-2 text-xs text-amber-700">
                      Preview is available for YouTube links. For other providers, paste a direct embed URL or open the
                      link in a new tab.
                    </p>
                  )}
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-neutral-900">Images</h3>
                  <p className="mt-1 text-xs text-neutral-500">Add images to this lesson (stored with the course).</p>
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
                      Upload photos
                    </button>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                    <label className="min-w-0 flex-1 text-sm font-medium text-neutral-700">
                      Or paste image URL (https)
                      <input
                        value={lessonImageUrlDraft}
                        onChange={(e) => setLessonImageUrlDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addLessonImagesFromUrls([lessonImageUrlDraft]);
                          }
                        }}
                        placeholder="https://example.com/image.jpg"
                        className="mt-1.5 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => addLessonImagesFromUrls([lessonImageUrlDraft])}
                      disabled={!lessonImageUrlDraft.trim()}
                      className="shrink-0 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Add from URL
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
                              title="Remove image"
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
                  <h3 className="text-sm font-semibold text-neutral-900">File attachments</h3>
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
                    Upload attachment
                  </button>
                  {(activeLesson.attachments || []).length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {(activeLesson.attachments || []).map((att, idx) => (
                        <li
                          key={idx}
                          className="flex items-center justify-between gap-2 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 text-xs"
                        >
                          <span className="truncate text-neutral-700">Attachment {idx + 1}</span>
                          <div className="flex shrink-0 items-center gap-1">
                            <a
                              href={att}
                              download={`attachment-${idx + 1}`}
                              className="text-[#315efb] hover:underline"
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open
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
                                Remove
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-neutral-900">Drip feeding settings</h3>
                  <button
                    type="button"
                    onClick={() => {
                      const next =
                        activeLesson.dripLabel === 'Unlocks immediately'
                          ? 'Unlocks 7 days after join'
                          : 'Unlocks immediately';
                      updateLesson({ dripLabel: next });
                    }}
                    className="mt-2 inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-50"
                  >
                    <Lock className="h-4 w-4 text-neutral-500" />
                    {activeLesson.dripLabel}
                  </button>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-neutral-900">Content</h3>
                  <textarea
                    value={activeLesson.content}
                    onChange={(e) => updateLesson({ content: e.target.value })}
                    placeholder="Lesson text, notes, instructions…"
                    rows={10}
                    className="mt-2 w-full resize-y rounded-lg border border-neutral-200 px-3 py-2 text-sm leading-relaxed text-neutral-800 placeholder:text-neutral-400"
                  />
                </section>

                <div className="flex flex-wrap gap-3 border-t border-neutral-100 pt-6">
                    <label className="text-sm text-neutral-600">
                      Lesson title
                      <input
                        value={activeLesson.title}
                        onChange={(e) => updateLesson({ title: e.target.value })}
                        className="mt-1 block w-full min-w-[200px] rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-sm text-neutral-600">
                      Chapter title
                      <input
                        value={activeChapter?.title ?? ''}
                        onChange={(e) => {
                          if (!courseFull || !activeChapterId) return;
                          const chapters = courseFull.chapters.map((c) =>
                            sameId(c._id, activeChapterId) ? { ...c, title: e.target.value } : c
                          );
                          const next = { ...courseFull, chapters };
                          setCourseFull(next);
                          scheduleSave(next);
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
