import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Ban, Check, Flag, RefreshCw, Trash2, X } from 'lucide-react';
import { ADMIN_API } from '../../config/api';
import { adminAuthHeaders, useAdminAuth } from '../../context/AdminAuthContext';
import { profilePath } from '../../constants/paths';
import { formatDateTimeRu, formatRelativeTimeRu } from '../../utils/adminFormat';

type ReportStatus = 'open' | 'reviewed' | 'dismissed' | 'actioned';
type ReportTargetType = 'post' | 'user' | 'community' | 'comment';

interface ReportRow {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details: string;
  status: ReportStatus;
  adminNote: string;
  reviewedBy: string;
  reviewedAt: string | null;
  createdAt: string;
  preview: { content?: string; authorId?: string; username?: string; fullName?: string } | null;
}

const STATUS_TABS: { id: ReportStatus | 'all'; label: string }[] = [
  { id: 'open', label: 'Открытые' },
  { id: 'reviewed', label: 'Просмотренные' },
  { id: 'dismissed', label: 'Отклонённые' },
  { id: 'actioned', label: 'С действием' },
  { id: 'all', label: 'Все' },
];

const targetTypeLabel: Record<ReportTargetType, string> = {
  post: 'Пост',
  user: 'Пользователь',
  community: 'Сообщество',
  comment: 'Комментарий',
};

const reasonLabel: Record<string, string> = {
  spam: 'Спам',
  harassment: 'Травля',
  hate: 'Ненависть',
  scam: 'Мошенничество',
  nsfw: 'NSFW',
  other: 'Другое',
};

const statusBadgeClass: Record<ReportStatus, string> = {
  open: 'bg-amber-500/15 text-amber-300',
  reviewed: 'bg-sky-500/15 text-sky-300',
  dismissed: 'bg-white/10 text-neutral-400',
  actioned: 'bg-red-500/15 text-red-300',
};

const statusLabel: Record<ReportStatus, string> = {
  open: 'Открыта',
  reviewed: 'Просмотрена',
  dismissed: 'Отклонена',
  actioned: 'Действие применено',
};

const AdminModeration: React.FC = () => {
  const { token } = useAdminAuth();
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('open');
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${ADMIN_API}/reports?status=${statusFilter}`, {
        headers: adminAuthHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { message?: string }).message || 'Не удалось загрузить жалобы');
        setReports([]);
        return;
      }
      setReports(Array.isArray((data as { reports?: ReportRow[] }).reports) ? (data as { reports: ReportRow[] }).reports : []);
    } catch {
      setError('Не удалось загрузить жалобы');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchReport = async (
    id: string,
    body: { status?: ReportStatus; action?: 'delete_post' | 'ban_user' }
  ) => {
    if (!token) return;
    setBusyId(id);
    try {
      const res = await fetch(`${ADMIN_API}/reports/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { ...adminAuthHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) return;
      await load();
    } catch {
      /* ignore */
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Flag size={22} className="text-red-400" />
            Модерация
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Жалобы пользователей на посты, аккаунты и сообщества
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-neutral-300 hover:bg-white/5"
        >
          <RefreshCw size={16} />
          Обновить
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-1.5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
              statusFilter === tab.id
                ? 'bg-violet-600/20 text-violet-200'
                : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-600 border-t-violet-400" />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-white/10 bg-[#141820] p-6 text-sm text-red-400">
            {error}
          </p>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#141820] py-20 text-center">
            <AlertTriangle className="mb-3 h-10 w-10 text-neutral-600" />
            <p className="text-sm text-neutral-500">Жалоб не найдено</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {reports.map((r) => (
              <li key={r.id} className="rounded-2xl border border-white/10 bg-[#141820] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${statusBadgeClass[r.status]}`}>
                      {statusLabel[r.status]}
                    </span>
                    <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs font-medium text-neutral-300">
                      {targetTypeLabel[r.targetType] || r.targetType}
                    </span>
                    <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs font-medium text-neutral-300">
                      {reasonLabel[r.reason] || r.reason}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500" title={formatDateTimeRu(r.createdAt)}>
                    {formatRelativeTimeRu(r.createdAt)}
                  </p>
                </div>

                {r.preview ? (
                  <div className="mt-3 rounded-xl bg-white/[0.03] p-3">
                    {r.targetType === 'post' && r.preview.content ? (
                      <p className="line-clamp-3 text-sm text-neutral-300">{r.preview.content}</p>
                    ) : null}
                    {r.targetType === 'user' && r.preview.username ? (
                      <a
                        href={profilePath(r.preview.username)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-violet-300 hover:underline"
                      >
                        @{r.preview.username}
                      </a>
                    ) : null}
                  </div>
                ) : null}

                {r.details ? (
                  <p className="mt-3 text-sm text-neutral-400">
                    <span className="text-neutral-500">Комментарий жалобщика: </span>
                    {r.details}
                  </p>
                ) : null}

                <p className="mt-2 font-mono text-xs text-neutral-600">
                  ID цели: {r.targetId} · Жалобщик: {r.reporterId}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {r.status !== 'reviewed' && (
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => void patchReport(r.id, { status: 'reviewed' })}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-white/5 disabled:opacity-40"
                    >
                      <Check size={14} />
                      Отметить как просмотренную
                    </button>
                  )}
                  {r.status !== 'dismissed' && (
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => void patchReport(r.id, { status: 'dismissed' })}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-white/5 disabled:opacity-40"
                    >
                      <X size={14} />
                      Отклонить
                    </button>
                  )}
                  {r.targetType === 'post' && (
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => void patchReport(r.id, { action: 'delete_post' })}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-40"
                    >
                      <Trash2 size={14} />
                      Удалить пост
                    </button>
                  )}
                  {r.targetType === 'user' && (
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => void patchReport(r.id, { action: 'ban_user' })}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-40"
                    >
                      <Ban size={14} />
                      Заблокировать пользователя
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminModeration;
