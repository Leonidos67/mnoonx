import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  BarChart2,
  Bell,
  Calendar,
  ChevronRight,
  FileText,
  LayoutGrid,
  Link2,
  Megaphone,
  MessageCircle,
  MoreVertical,
  Pencil,
  Plus,
  Send,
  Smile,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useTranslation } from '../../i18n/useTranslation';

import { COMMUNITIES_API as API } from '../../config/api';

const WIZARD_TEMPLATE_IDS = ['trading', 'sports', 'clipping', 'course', 'general'] as const;
type WizardTemplateId = (typeof WIZARD_TEMPLATE_IDS)[number];

const AUDIENCE_OPTION_IDS = ['under100', '100-500', '500-2000', '2000plus'] as const;

function resolveTemplateKey(key: string): WizardTemplateId {
  return WIZARD_TEMPLATE_IDS.includes(key as WizardTemplateId) ? (key as WizardTemplateId) : 'general';
}

interface Author {
  _id?: string;
  username: string;
  fullName: string;
  avatar?: string;
}

interface AnnouncementListItem {
  _id: string;
  title: string;
  body: string;
  createdAt: string;
  author: Author;
  commentsCount: number;
  viewsCount: number;
}

interface AnnouncementComment {
  _id: string;
  content: string;
  createdAt: string;
  user: Author;
}

interface AnnouncementDetail extends AnnouncementListItem {
  comments: AnnouncementComment[];
}

interface MetaState {
  wizardComplete: boolean;
  templateKey: string;
  audienceSize: string;
}

interface CommunityAnnouncementsPanelProps {
  handle: string;
  instanceId: string;
  instanceTitle?: string;
  isOwner: boolean;
  onBackToCommunity: () => void;
}

function formatRelativeTime(
  iso: string,
  translate: (key: string, vars?: Record<string, string | number>) => string
): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return translate('community.announcementsPanel.lessThanMinute');
  if (m < 60) {
    return translate(m === 1 ? 'community.announcementsPanel.minutesAgo' : 'community.announcementsPanel.minutesAgoMany', {
      count: m,
    });
  }
  const h = Math.floor(m / 60);
  if (h < 24) {
    return translate(h === 1 ? 'community.announcementsPanel.hoursAgo' : 'community.announcementsPanel.hoursAgoMany', {
      count: h,
    });
  }
  const days = Math.floor(h / 24);
  if (days < 7) {
    return translate(days === 1 ? 'community.announcementsPanel.daysAgo' : 'community.announcementsPanel.daysAgoMany', {
      count: days,
    });
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function initials(a: Author | null | undefined, fallback: string): string {
  const n = (a?.fullName || a?.username || fallback || '?').trim();
  const p = n.split(/\s+/).filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase().slice(0, 2);
  return n.slice(0, 2).toUpperCase() || '??';
}

const CommunityAnnouncementsPanel: React.FC<CommunityAnnouncementsPanelProps> = ({
  handle,
  instanceId,
  instanceTitle,
  isOwner,
  onBackToCommunity,
}) => {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<MetaState | null>(null);
  const [list, setList] = useState<AnnouncementListItem[]>([]);
  const [mode, setMode] = useState<'wizard' | 'feed' | 'detail' | 'editor'>('feed');
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedAudience, setSelectedAudience] = useState<string>('');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AnnouncementDetail | null>(null);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorBody, setEditorBody] = useState('');
  /** When set, editor saves via PATCH instead of POST */
  const [editorEditingId, setEditorEditingId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [openMenuForId, setOpenMenuForId] = useState<string | null>(null);

  const headerTitle = instanceTitle?.trim() || t('community.announcementsPanel.titleFallback');

  const defaultPostForTemplate = useCallback(
    (templateKey: string) => {
      const key = resolveTemplateKey(templateKey);
      return {
        title: t(`community.announcementsPanel.defaultPost.${key}.title`),
        body: t(`community.announcementsPanel.defaultPost.${key}.body`),
      };
    },
    [t]
  );

  const loadMeta = useCallback(async () => {
    if (!token || !handle || !instanceId) return null;
    const q = new URLSearchParams({ instanceId });
    const res = await fetch(`${API}/${encodeURIComponent(handle)}/announcements/meta?${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { message?: string }).message || t('community.announcementsPanel.metaFailed'));
    const m: MetaState = {
      wizardComplete: Boolean((data as MetaState).wizardComplete),
      templateKey: String((data as MetaState).templateKey || ''),
      audienceSize: String((data as MetaState).audienceSize || ''),
    };
    setMeta(m);
    return m;
  }, [token, handle, instanceId, t]);

  const loadList = useCallback(async () => {
    if (!token || !handle || !instanceId) return [];
    const q = new URLSearchParams({ instanceId });
    const res = await fetch(`${API}/${encodeURIComponent(handle)}/announcements?${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { message?: string }).message || t('community.announcementsPanel.listFailed'));
    const arr = Array.isArray(data) ? (data as AnnouncementListItem[]) : [];
    setList(arr);
    return arr;
  }, [token, handle, instanceId, t]);

  const refreshAll = useCallback(async () => {
    if (!token || !handle || !instanceId) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const m = await loadMeta();
      const arr = await loadList();
      const incomplete = m && !m.wizardComplete;
      if (incomplete && isOwner) {
        setMode('wizard');
        if (m.audienceSize) {
          setWizardStep(3);
          setSelectedTemplate(m.templateKey || 'general');
          setSelectedAudience(m.audienceSize);
          const d = defaultPostForTemplate(m.templateKey || 'general');
          setDraftTitle(d.title);
          setDraftBody(d.body);
        } else if (m.templateKey) {
          setWizardStep(2);
          setSelectedTemplate(m.templateKey);
        } else {
          setWizardStep(1);
        }
      } else {
        setMode('feed');
        setWizardStep(1);
      }
      if (arr.length === 0 && incomplete && !isOwner) {
        setMode('feed');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('community.announcementsPanel.networkError'));
    } finally {
      setLoading(false);
    }
  }, [token, handle, instanceId, isOwner, loadMeta, loadList, defaultPostForTemplate, t]);

  useEffect(() => {
    setLoading(true);
    setSelectedId(null);
    setDetail(null);
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (!openMenuForId) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('[data-announcement-menu-root]')) return;
      setOpenMenuForId(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [openMenuForId]);

  const copyLink = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (url) void navigator.clipboard.writeText(url).catch(() => {});
  };

  const patchMeta = async (body: Partial<MetaState>) => {
    if (!token) return;
    const res = await fetch(`${API}/${encodeURIComponent(handle)}/announcements/meta`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ instanceId, ...body }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { message?: string }).message || t('community.announcementsPanel.saveFailed'));
    setMeta({
      wizardComplete: Boolean((data as MetaState).wizardComplete),
      templateKey: String((data as MetaState).templateKey || ''),
      audienceSize: String((data as MetaState).audienceSize || ''),
    });
  };

  const goWizardNextFromStep1 = async () => {
    if (!selectedTemplate) return;
    await patchMeta({ templateKey: selectedTemplate });
    setWizardStep(2);
  };

  const goWizardNextFromStep2 = async () => {
    if (!selectedAudience) return;
    await patchMeta({ audienceSize: selectedAudience });
    const d = defaultPostForTemplate(selectedTemplate);
    setDraftTitle(d.title);
    setDraftBody(d.body);
    setWizardStep(3);
  };

  const publishFirst = async () => {
    if (!token || !draftTitle.trim()) return;
    setPublishing(true);
    try {
      const res = await fetch(`${API}/${encodeURIComponent(handle)}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          instanceId,
          title: draftTitle.trim(),
          body: draftBody,
          completeSetup: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { message?: string }).message || t('community.announcementsPanel.publishFailed'));
      await loadMeta();
      await loadList();
      setMode('feed');
      setWizardStep(1);
    } catch (e) {
      showToast(e instanceof Error ? e.message : t('community.announcementsPanel.error'), 'error');
    } finally {
      setPublishing(false);
    }
  };

  const skipWizard = async () => {
    try {
      await patchMeta({ wizardComplete: true });
      await loadList();
      setMode('feed');
    } catch (e) {
      showToast(e instanceof Error ? e.message : t('community.announcementsPanel.error'), 'error');
    }
  };

  const openDetail = async (id: string) => {
    if (!token) return;
    setSelectedId(id);
    setMode('detail');
    try {
      const q = new URLSearchParams({ instanceId });
      const res = await fetch(`${API}/${encodeURIComponent(handle)}/announcements/${encodeURIComponent(id)}?${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDetail(null);
        return;
      }
      setDetail(data as AnnouncementDetail);
    } catch {
      setDetail(null);
    }
  };

  const openEditor = () => {
    setEditorEditingId(null);
    setEditorTitle('');
    setEditorBody('');
    setMode('editor');
  };

  const openEditorForEdit = (id: string, title: string, body: string) => {
    setOpenMenuForId(null);
    setEditorEditingId(id);
    setEditorTitle(title);
    setEditorBody(body);
    setMode('editor');
  };

  const saveEditor = async () => {
    if (!token || !editorTitle.trim()) return;
    setPublishing(true);
    try {
      if (editorEditingId) {
        const res = await fetch(
          `${API}/${encodeURIComponent(handle)}/announcements/${encodeURIComponent(editorEditingId)}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              instanceId,
              title: editorTitle.trim(),
              body: editorBody,
            }),
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((data as { message?: string }).message || t('community.announcementsPanel.saveFailed'));
        await loadList();
        const idAfter = editorEditingId;
        const returnToDetail = selectedId === idAfter;
        setEditorEditingId(null);
        setEditorTitle('');
        setEditorBody('');
        if (returnToDetail && idAfter) {
          await openDetail(idAfter);
          setMode('detail');
        } else {
          setMode('feed');
        }
      } else {
        const res = await fetch(`${API}/${encodeURIComponent(handle)}/announcements`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            instanceId,
            title: editorTitle.trim(),
            body: editorBody,
            completeSetup: false,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((data as { message?: string }).message || t('community.announcementsPanel.publishFailed'));
        await loadList();
        setEditorEditingId(null);
        setMode('feed');
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : t('community.announcementsPanel.error'), 'error');
    } finally {
      setPublishing(false);
    }
  };

  const leaveEditor = useCallback(() => {
    const wasEditingDetail = Boolean(editorEditingId && selectedId === editorEditingId);
    setEditorEditingId(null);
    setEditorTitle('');
    setEditorBody('');
    setMode(wasEditingDetail ? 'detail' : 'feed');
  }, [editorEditingId, selectedId]);

  const postComment = async () => {
    if (!token || !selectedId || !commentText.trim()) return;
    try {
      const res = await fetch(
        `${API}/${encodeURIComponent(handle)}/announcements/${encodeURIComponent(selectedId)}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ instanceId, content: commentText.trim() }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast((data as { message?: string }).message || t('community.announcementsPanel.commentFailed'), 'error');
        return;
      }
      setCommentText('');
      await openDetail(selectedId);
      await loadList();
    } catch {
      showToast(t('community.announcementsPanel.networkError'), 'error');
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!token) return;
    const confirmed = await confirm({
      title: t('community.announcementsPanel.deleteTitle'),
      message: t('community.announcementsPanel.deleteMessage'),
      confirmLabel: t('community.announcementsPanel.deleteConfirm'),
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      const q = new URLSearchParams({ instanceId });
      const res = await fetch(
        `${API}/${encodeURIComponent(handle)}/announcements/${encodeURIComponent(id)}?${q}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast((data as { message?: string }).message || t('community.announcementsPanel.deleteFailed'), 'error');
        return;
      }
      setOpenMenuForId(null);
      setMode('feed');
      setSelectedId(null);
      setDetail(null);
      await loadList();
    } catch {
      showToast(t('community.announcementsPanel.networkError'), 'error');
    }
  };

  const appHeader = (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (mode === 'detail') {
              setMode('feed');
              setDetail(null);
              setSelectedId(null);
            } else if (mode === 'editor') {
              leaveEditor();
            } else {
              onBackToCommunity();
            }
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100"
          aria-label={t('community.announcementsPanel.back')}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white">
          <Megaphone className="h-5 w-5" strokeWidth={2} aria-hidden />
        </div>
        <h1 className="min-w-0 truncate text-lg font-semibold text-neutral-900">{headerTitle}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {mode === 'editor' ? (
          <button
            type="button"
            disabled={publishing || !editorTitle.trim()}
            onClick={() => void saveEditor()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#315efb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2547c4] disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
            {editorEditingId ? t('community.announcementsPanel.save') : t('community.announcementsPanel.publish')}
          </button>
        ) : (
          <>
            <button type="button" onClick={copyLink} className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100" title={t('community.announcementsPanel.copyLink')}>
              <Link2 className="h-5 w-5" />
            </button>
            <button type="button" className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100" title={t('community.announcementsPanel.members')}>
              <Users className="h-5 w-5" />
            </button>
            <button type="button" className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100" title={t('community.announcementsPanel.notifications')}>
              <Bell className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );

  if (!token) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center rounded-xl border border-[#e7e7e7] bg-white p-10 text-center text-neutral-600">
        <p className="text-[17px]">{t('community.announcementsPanel.signIn')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center rounded-xl border border-[#e7e7e7] bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-red-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center rounded-xl border border-[#e7e7e7] bg-white p-8 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const wizardProgress = (step: number) => (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between text-sm text-neutral-600">
        <span>{t('community.announcementsPanel.wizardStep', { step })}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full bg-[#315efb] transition-all"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>
    </div>
  );

  const wizardBody = (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {wizardStep === 1 && (
        <>
          {wizardProgress(1)}
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-6">
            <p className="text-sm font-semibold text-[#315efb]">{t('community.announcementsPanel.wizardWelcome')}</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900">{t('community.announcementsPanel.wizardHeadline')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              {t('community.announcementsPanel.wizardIntro')}
            </p>
          </div>
          <h3 className="mt-8 text-lg font-semibold text-neutral-900">{t('community.announcementsPanel.wizardQuestion')}</h3>
          <p className="mt-1 text-sm text-neutral-500">{t('community.announcementsPanel.wizardQuestionHint')}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {WIZARD_TEMPLATE_IDS.map((templateId) => (
              <button
                key={templateId}
                type="button"
                onClick={() => setSelectedTemplate(templateId)}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  selectedTemplate === templateId
                    ? 'border-[#315efb] bg-[#eef2ff]'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <p className="font-semibold text-neutral-900">{t(`community.announcementsPanel.templates.${templateId}.title`)}</p>
                <p className="mt-1 text-sm text-neutral-600">{t(`community.announcementsPanel.templates.${templateId}.desc`)}</p>
              </button>
            ))}
          </div>
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              disabled={!selectedTemplate}
              onClick={() => void goWizardNextFromStep1()}
              className="rounded-xl bg-[#315efb] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2547c4] disabled:opacity-40"
            >
              {t('community.announcementsPanel.continue')}
            </button>
          </div>
        </>
      )}
      {wizardStep === 2 && (
        <>
          {wizardProgress(2)}
          <button
            type="button"
            onClick={() => setWizardStep(1)}
            className="mb-4 rounded-xl border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {t('community.announcementsPanel.wizardBack')}
          </button>
          <p className="text-sm font-semibold text-[#315efb]">{t('community.announcementsPanel.wizardQuickQuestion')}</p>
          <h2 className="mt-1 text-2xl font-bold text-neutral-900">{t('community.announcementsPanel.wizardAudienceTitle')}</h2>
          <p className="mt-2 text-sm text-neutral-600">
            {t('community.announcementsPanel.wizardAudienceHint')}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {AUDIENCE_OPTION_IDS.map((audienceId) => (
              <button
                key={audienceId}
                type="button"
                onClick={() => setSelectedAudience(audienceId)}
                className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-left ${
                  selectedAudience === audienceId
                    ? 'border-[#315efb] bg-[#eef2ff]'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <div>
                  <p className="font-semibold text-neutral-900">{t(`community.announcementsPanel.audience.${audienceId}.title`)}</p>
                  <p className="mt-1 text-sm text-neutral-600">{t(`community.announcementsPanel.audience.${audienceId}.desc`)}</p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                  <ChevronRight className="h-4 w-4" />
                </span>
              </button>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-neutral-400">{t('community.announcementsPanel.wizardAudienceNote')}</p>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              disabled={!selectedAudience}
              onClick={() => void goWizardNextFromStep2()}
              className="rounded-xl bg-[#315efb] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2547c4] disabled:opacity-40"
            >
              {t('community.announcementsPanel.continue')}
            </button>
          </div>
        </>
      )}
      {wizardStep === 3 && (
        <>
          {wizardProgress(3)}
          <button
            type="button"
            onClick={() => setWizardStep(2)}
            className="mb-4 rounded-xl border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {t('community.announcementsPanel.wizardBack')}
          </button>
          <h2 className="text-2xl font-bold text-neutral-900">{t('community.announcementsPanel.wizardWriteTitle')}</h2>
          <p className="mt-2 text-sm text-neutral-600">
            {t('community.announcementsPanel.wizardWriteHint')}
          </p>
          <div className="mt-6 space-y-4 rounded-2xl border border-neutral-200 bg-white p-5">
            <div>
              <label className="text-xs font-medium text-neutral-500">{t('community.announcementsPanel.titleLabel')}</label>
              <input
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#315efb]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500">{t('community.announcementsPanel.bodyLabel')}</label>
              <textarea
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
                rows={6}
                className="mt-1 w-full resize-y rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#315efb]"
              />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
            <button type="button" onClick={() => void skipWizard()} className="text-sm font-semibold text-[#315efb] hover:underline">
              {t('community.announcementsPanel.skipLater')}
            </button>
            <button
              type="button"
              disabled={publishing || !draftTitle.trim()}
              onClick={() => void publishFirst()}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 disabled:opacity-40"
            >
              <Send className="h-4 w-4 text-[#315efb]" />
              {t('community.announcementsPanel.publishNow')}
            </button>
          </div>
        </>
      )}
    </div>
  );

  const growthCard = (
    <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-semibold text-neutral-900">{t('community.announcementsPanel.growthReach')}</p>
            <p className="text-xs text-neutral-500">{t('community.announcementsPanel.growthSuggested')}</p>
          </div>
        </div>
        <button type="button" className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100" aria-label={t('community.announcementsPanel.growthClose')}>
          <X className="h-4 w-4" />
        </button>
      </div>
      <h3 className="mt-4 text-base font-semibold text-neutral-900">{t('community.announcementsPanel.growthTitle')}</h3>
      <p className="mt-2 text-sm text-neutral-600">
        {t('community.announcementsPanel.growthBody')}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-neutral-100 px-3 py-2 text-xs text-neutral-600">
        <span>{t('community.announcementsPanel.growthTools')}</span>
        <span className="text-neutral-400">{t('community.announcementsPanel.growthRetention')}</span>
      </div>
    </div>
  );

  const feedToolbar = (
    <div className="sticky top-0 z-[1] flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 bg-white px-4 py-3">
      <p className="text-sm text-neutral-600">
        {list.length === 1
          ? t('community.announcementsPanel.announcementOne')
          : t('community.announcementsPanel.announcementMany', { count: list.length })}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          {t('community.announcementsPanel.growthApps')}
        </button>
        <button type="button" className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100" title={t('community.announcementsPanel.notifications')}>
          <Bell className="h-4 w-4" />
        </button>
        {isOwner && (
          <button
            type="button"
            onClick={openEditor}
            className="inline-flex items-center gap-2 rounded-xl bg-[#315efb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2547c4]"
          >
            <Plus className="h-4 w-4" />
            {t('community.announcementsPanel.add')}
          </button>
        )}
      </div>
    </div>
  );

  const renderAnnouncementCard = (a: AnnouncementListItem) => (
    <article key={a._id} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-xs font-bold text-white">
            {initials(a.author, a.author?.username)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-neutral-900">{a.author?.fullName || a.author?.username}</p>
            <p className="truncate text-sm text-neutral-500">
              @{a.author?.username} · {formatRelativeTime(a.createdAt, t)}
            </p>
          </div>
        </div>
        {isOwner && (
          <div className="relative" data-announcement-menu-root>
            <button
              type="button"
              onClick={() => setOpenMenuForId((v) => (v === a._id ? null : a._id))}
              className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
              aria-label={t('community.announcementsPanel.menu')}
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            {openMenuForId === a._id && (
              <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => openEditorForEdit(a._id, a.title, a.body)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50"
                >
                  <Pencil className="h-4 w-4" />
                  {t('community.announcementsPanel.edit')}
                </button>
                <button
                  type="button"
                  onClick={() => void deleteAnnouncement(a._id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('community.announcementsPanel.delete')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <button type="button" onClick={() => void openDetail(a._id)} className="mt-4 w-full text-left">
        <h2 className="text-xl font-bold text-neutral-900">{a.title}</h2>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-neutral-700">{a.body}</p>
      </button>
      <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 text-sm text-neutral-500">
        <button type="button" className="rounded-full p-2 hover:bg-neutral-100">
          <Smile className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            {a.commentsCount === 1
              ? t('community.announcementsPanel.commentOne')
              : t('community.announcementsPanel.commentsMany', { count: a.commentsCount })}
          </span>
          <span className="inline-flex items-center gap-1">
            <BarChart2 className="h-4 w-4" />
            {a.viewsCount}
          </span>
        </div>
      </div>
      <div className="mt-3 flex gap-2 border-t border-neutral-100 pt-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-[10px] font-bold text-white">
          {initials(
            user ? { _id: user.id, username: user.username, fullName: user.fullName, avatar: user.avatar } : null,
            user?.username || ''
          )}
        </div>
        <input
          readOnly
          placeholder={t('community.announcementsPanel.writeComment')}
          className="flex-1 cursor-pointer rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm text-neutral-500"
          onClick={() => void openDetail(a._id)}
        />
      </div>
    </article>
  );

  const editorFormatChips = [
    t('community.announcementsPanel.toolbarUndo'),
    t('community.announcementsPanel.toolbarRedo'),
    t('community.announcementsPanel.toolbarParagraph'),
    t('community.announcementsPanel.toolbarNoList'),
    t('community.announcementsPanel.toolbarQuote'),
    t('community.announcementsPanel.toolbarCode'),
    t('community.announcementsPanel.toolbarEmoji'),
    t('community.announcementsPanel.toolbarBold'),
    t('community.announcementsPanel.toolbarItalic'),
    t('community.announcementsPanel.toolbarStrike'),
    t('community.announcementsPanel.toolbarCodeBlock'),
    t('community.announcementsPanel.toolbarClear'),
    t('community.announcementsPanel.toolbarLink'),
    t('community.announcementsPanel.toolbarAlign'),
    t('community.announcementsPanel.toolbarIndent'),
    t('community.announcementsPanel.toolbarImage'),
    t('community.announcementsPanel.toolbarVideo'),
  ];

  const editorView = (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-neutral-200 px-4">
        <button
          type="button"
          onClick={leaveEditor}
          className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100"
          aria-label={t('community.announcementsPanel.back')}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2 px-2 text-neutral-400">
          <FileText className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate text-sm">{editorTitle.trim() || t('community.announcementsPanel.untitled')}</span>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100" title={t('community.announcementsPanel.schedule')}>
            <Calendar className="h-5 w-5" />
          </button>
          <button
            type="button"
            disabled={publishing || !editorTitle.trim()}
            onClick={() => void saveEditor()}
            className="rounded-full p-2 text-[#315efb] hover:bg-[#eef2ff] disabled:opacity-40"
            title={editorEditingId ? t('community.announcementsPanel.save') : t('community.announcementsPanel.publish')}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="shrink-0 space-y-1 border-b border-neutral-200 bg-neutral-50 px-2 py-2 text-neutral-500">
        <div className="flex flex-wrap gap-1 text-xs">
          {editorFormatChips.map((x, i) => (
            <span
              key={`editor-tb-${i}`}
              className="rounded border border-neutral-200 bg-white px-2 py-1 text-[11px] font-medium text-neutral-600"
            >
              {x}
            </span>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto bg-neutral-100 p-4">
        <div className="mx-auto max-w-3xl space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <input
            value={editorTitle}
            onChange={(e) => setEditorTitle(e.target.value)}
            placeholder={t('community.announcementsPanel.titlePh')}
            className="w-full border-0 bg-transparent text-lg font-semibold text-neutral-900 outline-none placeholder:text-neutral-400"
          />
          <textarea
            value={editorBody}
            onChange={(e) => setEditorBody(e.target.value)}
            placeholder={t('community.announcementsPanel.bodyPh')}
            className="min-h-[min(50vh,420px)] w-full resize-y border-0 bg-transparent text-sm leading-relaxed text-neutral-800 outline-none placeholder:italic placeholder:text-neutral-400"
          />
        </div>
      </div>
    </div>
  );

  const detailView = detail && (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto bg-neutral-100 p-4">
        <div className="mx-auto max-w-2xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-xs font-bold text-white">
                {initials(detail.author, detail.author?.username)}
              </div>
              <div>
                <p className="font-semibold text-neutral-900">{detail.author?.fullName || detail.author?.username}</p>
                <p className="text-sm text-neutral-500">
                  @{detail.author?.username} · {formatRelativeTime(detail.createdAt, t)}
                </p>
              </div>
            </div>
            {isOwner && (
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEditorForEdit(detail._id, detail.title, detail.body)}
                  className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
                  title={t('community.announcementsPanel.edit')}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void deleteAnnouncement(detail._id)}
                  className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
                  title={t('community.announcementsPanel.delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          <h1 className="mt-6 text-2xl font-bold text-neutral-900">{detail.title}</h1>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">{detail.body}</p>
          <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-4 text-sm text-neutral-500">
            <Smile className="h-5 w-5" />
            <span className="inline-flex items-center gap-1">
              <BarChart2 className="h-4 w-4" />
              {detail.viewsCount}
            </span>
          </div>
          <div className="mt-6 border-t border-neutral-100 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-neutral-900">{t('community.announcementsPanel.comments')}</span>
              <span className="text-xs text-neutral-500">{t('community.announcementsPanel.newest')}</span>
            </div>
            {(!detail.comments || detail.comments.length === 0) && (
              <p className="py-6 text-center text-sm text-neutral-500">{t('community.announcementsPanel.noComments')}</p>
            )}
            <ul className="space-y-3">
              {(detail.comments || []).map((c) => (
                <li key={c._id} className="flex gap-2 text-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-600 text-[10px] font-bold text-white">
                    {initials(c.user, c.user?.username)}
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">{c.user?.fullName || c.user?.username}</p>
                    <p className="text-neutral-700">{c.content}</p>
                    <p className="mt-0.5 text-xs text-neutral-400">{formatRelativeTime(c.createdAt, t)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-2 border-t border-neutral-100 pt-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-[10px] font-bold text-white">
                {initials(
                  user ? { _id: user.id, username: user.username, fullName: user.fullName } : null,
                  user?.username || ''
                )}
              </div>
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void postComment();
                  }
                }}
                placeholder={t('community.announcementsPanel.writeComment')}
                className="min-w-0 flex-1 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm outline-none focus:border-[#315efb]"
              />
              <button
                type="button"
                onClick={() => void postComment()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[#e7e7e7] bg-white">
      {appHeader}
      {mode === 'wizard' && isOwner && <div className="min-h-0 flex-1 overflow-y-auto bg-white">{wizardBody}</div>}
      {mode === 'wizard' && !isOwner && (
        <div className="flex flex-1 flex-col items-center justify-center p-10 text-center text-neutral-600">
          <p>{t('community.announcementsPanel.ownerSettingUp')}</p>
        </div>
      )}
      {mode === 'feed' && (
        <div className="min-h-0 flex-1 overflow-y-auto bg-neutral-100">
          {feedToolbar}
          <div className="mx-auto max-w-2xl space-y-4 p-4">
              {!isOwner && meta && !meta.wizardComplete && list.length === 0 && (
                <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-600">
                  {t('community.announcementsPanel.ownerSettingUpSoon')}
                </div>
              )}
              {meta && !meta.wizardComplete && list.length === 0 && isOwner && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
                  {t('community.announcementsPanel.finishSetup')}
                  <button
                    type="button"
                    className="ml-2 font-semibold text-[#315efb] underline"
                    onClick={() => {
                      setMode('wizard');
                      setWizardStep(1);
                    }}
                  >
                    {t('community.announcementsPanel.continueSetup')}
                  </button>
                </div>
              )}
              {list.length === 0 && meta?.wizardComplete && (
                <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500">
                  <p>{t('community.announcementsPanel.noAnnouncements')}</p>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={openEditor}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#315efb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2547c4]"
                    >
                      <Plus className="h-4 w-4" />
                      {t('community.announcementsPanel.add')}
                    </button>
                  )}
                </div>
              )}
              {list.map(renderAnnouncementCard)}
              {list.length > 0 && growthCard}
          </div>
        </div>
      )}
      {mode === 'editor' && editorView}
      {mode === 'detail' && detailView}
    </div>
  );
};

export default CommunityAnnouncementsPanel;
