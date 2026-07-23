import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  CloudDownload,
  Download,
  Info,
  LayoutGrid,
  LayoutList,
  Link2,
  Lock,
  MoreVertical,
  Pencil,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useTranslation } from '../../i18n/useTranslation';
import {
  FileUpload,
  getReadableFileSize,
  type UploadedFileItem,
} from '../Common/FileUpload/fileUploadBase';

import { COMMUNITIES_API as API } from '../../config/api';

const MAX_COMMUNITY_FILE_BYTES = 50 * 1024 * 1024;

export interface CommunityFileRow {
  _id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

interface CommunityFilesPanelProps {
  handle: string;
  instanceId: string;
  instanceTitle?: string;
  isOwner: boolean;
  onBackToCommunity: () => void;
}

function fileExtLabel(name: string): string {
  const i = name.lastIndexOf('.');
  if (i <= 0 || i === name.length - 1) return 'FILE';
  return name.slice(i + 1, i + 5).toUpperCase();
}

function formatFileMeta(f: CommunityFileRow): string {
  const ext = fileExtLabel(f.originalName);
  const when = new Date(f.createdAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  return `${ext} • ${when} • ${getReadableFileSize(f.size)}`;
}

function newUploadId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `up_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function uploadCommunityFile(
  url: string,
  token: string,
  formData: FormData,
  onProgress: (progress: number) => void
): Promise<{ ok: boolean; status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const pct = Math.max(0, Math.min(99, Math.round((event.loaded / event.total) * 100)));
      onProgress(pct);
    };
    xhr.onload = () => {
      let body: unknown = {};
      try {
        body = xhr.responseText ? JSON.parse(xhr.responseText) : {};
      } catch {
        body = {};
      }
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, body });
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(formData);
  });
}

const CommunityFilesPanel: React.FC<CommunityFilesPanelProps> = ({
  handle,
  instanceId,
  instanceTitle,
  isOwner,
  onBackToCommunity,
}) => {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [files, setFiles] = useState<CommunityFileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortKey, setSortKey] = useState<'nameAsc' | 'nameDesc' | 'dateDesc'>('nameAsc');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [uploadQueue, setUploadQueue] = useState<UploadedFileItem[]>([]);
  const fileRetryMap = useRef<Map<string, File>>(new Map());
  const menuRef = useRef<HTMLDivElement | null>(null);

  const headerName = instanceTitle?.trim() || t('community.filesPanel.titleFallback');
  const uploading = uploadQueue.some((f) => !f.failed && f.progress < 100);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 320);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    if (!token || !handle || !instanceId) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const q = new URLSearchParams({ instanceId, sort: sortKey });
      const s = debouncedSearch.trim();
      if (s) q.set('q', s);
      const res = await fetch(`${API}/${encodeURIComponent(handle)}/files?${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { message?: string }).message || t('community.filesPanel.loadFailed'));
        setFiles([]);
        return;
      }
      setFiles(Array.isArray(data) ? data : []);
    } catch {
      setError(t('community.filesPanel.networkError'));
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [token, handle, instanceId, sortKey, debouncedSearch]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  useEffect(() => {
    if (!menuOpenId) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpenId]);

  const copyPageLink = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (url) void navigator.clipboard.writeText(url).catch(() => {});
  };

  const downloadFile = async (f: CommunityFileRow) => {
    if (!token || !handle || !instanceId) return;
    try {
      const q = new URLSearchParams({ instanceId });
      const res = await fetch(
        `${API}/${encodeURIComponent(handle)}/files/${encodeURIComponent(f._id)}/download?${q}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = f.originalName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  };

  const deleteFile = async (id: string) => {
    if (!token || !handle || !instanceId) return;
    const confirmed = await confirm({
      title: t('community.filesPanel.deleteTitle'),
      message: t('community.filesPanel.deleteMessage'),
      confirmLabel: t('community.filesPanel.deleteConfirm'),
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      const q = new URLSearchParams({ instanceId });
      const res = await fetch(
        `${API}/${encodeURIComponent(handle)}/files/${encodeURIComponent(id)}?${q}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast((data as { message?: string }).message || t('community.filesPanel.deleteFailed'), 'error');
        return;
      }
      setMenuOpenId(null);
      void load();
      showToast(t('community.filesPanel.deletedToast'));
    } catch {
      showToast(t('community.filesPanel.networkError'), 'error');
    }
  };

  const runUpload = useCallback(
    async (id: string, file: File) => {
      if (!token || !handle || !instanceId) return;
      fileRetryMap.current.set(id, file);
      const fd = new FormData();
      fd.append('instanceId', instanceId);
      fd.append('file', file);
      try {
        const result = await uploadCommunityFile(
          `${API}/${encodeURIComponent(handle)}/files`,
          token,
          fd,
          (progress) => {
            setUploadQueue((prev) =>
              prev.map((item) => (item.id === id ? { ...item, progress, failed: false } : item))
            );
          }
        );
        if (!result.ok) {
          const message =
            (result.body as { message?: string })?.message || t('community.filesPanel.uploadFailed');
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, failed: true, progress: 0 } : item
            )
          );
          showToast(message, 'error');
          return;
        }
        setUploadQueue((prev) =>
          prev.map((item) => (item.id === id ? { ...item, progress: 100, failed: false } : item))
        );
        window.setTimeout(() => {
          setUploadQueue((prev) => prev.filter((item) => item.id !== id));
          fileRetryMap.current.delete(id);
        }, 800);
        void load();
      } catch {
        setUploadQueue((prev) =>
          prev.map((item) => (item.id === id ? { ...item, failed: true, progress: 0 } : item))
        );
        showToast(t('community.filesPanel.networkError'), 'error');
      }
    },
    [token, handle, instanceId, load, showToast]
  );

  const handleDropFiles = (fileList: FileList) => {
    if (!token || !isOwner) return;
    const incoming = Array.from(fileList).map((file) => {
      const id = newUploadId();
      fileRetryMap.current.set(id, file);
      return {
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        fileObject: file,
      } satisfies UploadedFileItem;
    });
    setUploadQueue((prev) => [...incoming, ...prev]);
    setEditing(true);
    incoming.forEach((item) => {
      if (item.fileObject) void runUpload(item.id, item.fileObject);
    });
  };

  const handleDeleteUpload = (id: string) => {
    setUploadQueue((prev) => prev.filter((file) => file.id !== id));
    fileRetryMap.current.delete(id);
  };

  const handleRetryUpload = (id: string) => {
    const file = fileRetryMap.current.get(id);
    if (!file) return;
    setUploadQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, failed: false, progress: 0 } : item))
    );
    void runUpload(id, file);
  };

  const filteredLocal = files;
  const emptyAll =
    !loading &&
    !error &&
    filteredLocal.length === 0 &&
    !debouncedSearch.trim() &&
    uploadQueue.length === 0;
  const emptySearch = !loading && !error && filteredLocal.length === 0 && debouncedSearch.trim();

  if (!token) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center rounded-xl border border-[#e7e7e7] bg-white p-10 text-center text-[#666]">
        <Lock className="mx-auto mb-3 h-10 w-10 text-[#999]" />
        <p className="text-[17px]">{t('community.filesPanel.signIn')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center rounded-xl border border-[#e7e7e7] bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-sky-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center rounded-xl border border-[#e7e7e7] bg-white p-8 text-center">
        <p className="mb-2 text-[#e5484d]">{error}</p>
        <p className="text-sm text-[#888]">{t('community.filesPanel.accessHint')}</p>
      </div>
    );
  }

  const uploadSection =
    isOwner && editing ? (
      <div className="shrink-0 border-b border-neutral-200 bg-white px-4 py-4">
        <FileUpload.Root>
          <FileUpload.DropZone
            isDisabled={false}
            allowsMultiple
            maxSize={MAX_COMMUNITY_FILE_BYTES}
            hint={t('community.fileUpload.hintCommunity')}
            onDropFiles={handleDropFiles}
            onSizeLimitExceed={() =>
              showToast(t('community.filesPanel.tooLarge'), 'error')
            }
            onDropUnacceptedFiles={() => showToast(t('community.filesPanel.typeRejected'), 'error')}
          />
          {uploadQueue.length > 0 ? (
            <FileUpload.List>
              {uploadQueue.map((file) => (
                <FileUpload.ListItemProgressFill
                  key={file.id}
                  name={file.name}
                  size={file.size}
                  progress={file.progress}
                  failed={file.failed}
                  type={file.type}
                  onDelete={() => handleDeleteUpload(file.id)}
                  onRetry={() => handleRetryUpload(file.id)}
                />
              ))}
            </FileUpload.List>
          ) : null}
        </FileUpload.Root>
      </div>
    ) : null;

  const controlsRow = (
    <div className="shrink-0 space-y-3 border-b border-neutral-200 bg-white px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('community.filesPanel.searchPlaceholder')}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-3 text-sm text-neutral-900 outline-none ring-0 placeholder:text-neutral-400 focus:border-sky-300 focus:bg-white"
          />
        </div>
        {editing && isOwner && uploading ? (
          <span className="shrink-0 text-sm font-medium text-neutral-500">{t('community.filesPanel.uploading')}</span>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-2">
        <label className="inline-flex items-center gap-1 text-sm text-neutral-700">
          <span className="sr-only">{t('community.filesPanel.sortAria')}</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
            className="cursor-pointer rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm font-medium text-neutral-800 outline-none focus:border-sky-300"
          >
            <option value="nameAsc">{t('community.filesPanel.sortNameAsc')}</option>
            <option value="nameDesc">{t('community.filesPanel.sortNameDesc')}</option>
            <option value="dateDesc">{t('community.filesPanel.sortNewest')}</option>
          </select>
        </label>
        <div className="flex rounded-lg border border-neutral-200 p-0.5">
          <button
            type="button"
            title={t('community.filesPanel.listView')}
            onClick={() => setView('list')}
            className={`rounded-md p-1.5 ${view === 'list' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400 hover:text-neutral-700'}`}
          >
            <LayoutList className="h-4 w-4" />
          </button>
          <button
            type="button"
            title={t('community.filesPanel.gridView')}
            onClick={() => setView('grid')}
            className={`rounded-md p-1.5 ${view === 'grid' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400 hover:text-neutral-700'}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const fileCardInner = (f: CommunityFileRow, compact: boolean) => (
    <div
      className={`flex w-full ${compact ? 'flex-col gap-2 p-3' : 'items-center gap-3 px-4 py-3'} ${
        view === 'list' && !compact ? 'border-b border-neutral-100 last:border-b-0' : ''
      }`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-xs font-bold text-sky-600">
          {fileExtLabel(f.originalName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-neutral-900">{f.originalName}</p>
          <p className="mt-0.5 text-xs text-neutral-500">{formatFileMeta(f)}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 self-end sm:self-center">
        {editing && isOwner ? (
          <div className="relative" ref={menuOpenId === f._id ? menuRef : undefined}>
            <button
              type="button"
              aria-label={t('community.filesPanel.fileActions')}
              onClick={() => setMenuOpenId((v) => (v === f._id ? null : f._id))}
              className="rounded-full p-2 hover:bg-neutral-100"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpenId === f._id && (
              <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-neutral-200 bg-white p-1 shadow-md">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
                  onClick={() => void deleteFile(f._id)}
                >
                  <Trash2 className="h-4 w-4 shrink-0" />
                  {t('community.filesPanel.delete')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            title={t('community.filesPanel.download')}
            onClick={() => void downloadFile(f)}
            className="rounded-full p-2 hover:bg-neutral-100"
          >
            <Download className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[#e7e7e7] bg-white">
      {editing && isOwner ? (
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100"
              aria-label={t('community.filesPanel.back')}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="truncate text-lg font-semibold text-neutral-900">{t('community.filesPanel.editingTitle')}</h1>
            <span
              className="text-neutral-400"
              title={t('community.filesPanel.editingHint')}
            >
              <Info className="h-4 w-4" />
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-xl bg-[#315efb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2547c4]"
            >
              {t('community.filesPanel.done')}
            </button>
            <span className="text-neutral-400" title={t('community.filesPanel.ownerOnlyHint')}>
              <Lock className="h-5 w-5" />
            </span>
          </div>
        </div>
      ) : (
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={onBackToCommunity}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100"
              aria-label={t('community.filesPanel.backToCommunity')}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
              <CloudDownload className="h-5 w-5" strokeWidth={2} aria-hidden />
            </div>
            <h1 className="min-w-0 truncate text-lg font-semibold text-neutral-900">{headerName}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={copyPageLink}
              className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
              title={t('community.filesPanel.copyLink')}
            >
              <Link2 className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
              title={t('community.filesPanel.members')}
            >
              <Users className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
              title={t('community.filesPanel.notifications')}
            >
              <Bell className="h-5 w-5" />
            </button>
            {isOwner && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="ml-1 flex items-center gap-1.5 rounded-xl bg-[#315efb] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2547c4]"
              >
                <Pencil className="h-4 w-4" strokeWidth={2} />
                {t('common.edit')}
              </button>
            )}
          </div>
        </div>
      )}

      {uploadSection}
      {controlsRow}

      <div className="min-h-0 flex-1 overflow-y-auto bg-white">
        {emptyAll && (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-6 text-neutral-300">
              <CloudDownload className="h-12 w-12" strokeWidth={1.25} />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900">{t('community.filesPanel.emptyTitle')}</h2>
            <p className="mt-2 max-w-sm text-sm text-neutral-500">
              {t('community.filesPanel.emptyHint')}
            </p>
            {/* {isOwner && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="mt-6 rounded-xl bg-[#315efb] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2547c4]"
              >
                Add File
              </button>
            )} */}
          </div>
        )}

        {emptySearch && (
          <div className="px-6 py-12 text-center text-sm text-neutral-500">
            {t('community.filesPanel.emptySearch')}
          </div>
        )}

        {!emptyAll && !emptySearch && view === 'list' && (
          <div className="divide-y divide-neutral-100">
            {filteredLocal.map((f) => (
              <React.Fragment key={f._id}>{fileCardInner(f, false)}</React.Fragment>
            ))}
          </div>
        )}

        {!emptyAll && !emptySearch && view === 'grid' && (
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
            {filteredLocal.map((f) => (
              <div key={f._id} className="rounded-xl border border-neutral-200 bg-neutral-50/50">
                {fileCardInner(f, true)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityFilesPanel;
