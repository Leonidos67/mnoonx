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

import { COMMUNITIES_API as API } from '../../config/api';

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

function formatBytes(n: number): string {
  if (!n || n < 0) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v < 10 && i > 0 ? v.toFixed(1) : Math.round(v)} ${u[i]}`;
}

function formatFileMeta(f: CommunityFileRow): string {
  const ext = fileExtLabel(f.originalName);
  const when = new Date(f.createdAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  return `${ext} • ${when}`;
}

const CommunityFilesPanel: React.FC<CommunityFilesPanelProps> = ({
  handle,
  instanceId,
  instanceTitle,
  isOwner,
  onBackToCommunity,
}) => {
  const { token } = useAuth();
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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const headerName = instanceTitle?.trim() || 'Files';

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 320);
    return () => window.clearTimeout(t);
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
        setError((data as { message?: string }).message || 'Could not load files');
        setFiles([]);
        return;
      }
      setFiles(Array.isArray(data) ? data : []);
    } catch {
      setError('Network error');
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
      title: 'Delete file?',
      message: 'This file will be permanently removed from the community.',
      confirmLabel: 'Delete',
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
        showToast((data as { message?: string }).message || 'Could not delete', 'error');
        return;
      }
      setMenuOpenId(null);
      void load();
      showToast('File deleted');
    } catch {
      showToast('Network error', 'error');
    }
  };

  const onPickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length || !token || !handle || !instanceId) return;
    setUploading(true);
    try {
      for (let i = 0; i < list.length; i += 1) {
        const file = list[i];
        const fd = new FormData();
        fd.append('instanceId', instanceId);
        fd.append('file', file);
        const res = await fetch(`${API}/${encodeURIComponent(handle)}/files`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          showToast((data as { message?: string }).message || 'Upload failed', 'error');
          break;
        }
      }
      void load();
      showToast('Upload complete');
    } catch {
      showToast('Network error', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const filteredLocal = files;
  const emptyAll = !loading && !error && filteredLocal.length === 0 && !debouncedSearch.trim();
  const emptySearch = !loading && !error && filteredLocal.length === 0 && debouncedSearch.trim();

  if (!token) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center rounded-xl border border-[#e7e7e7] bg-white p-10 text-center text-[#666]">
        <Lock className="mx-auto mb-3 h-10 w-10 text-[#999]" />
        <p className="text-[17px]">Sign in to browse community files.</p>
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
        <p className="text-sm text-[#888]">Join this community or check app visibility.</p>
      </div>
    );
  }

  const controlsRow = (
    <div className="shrink-0 space-y-3 border-b border-neutral-200 bg-white px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files"
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-3 text-sm text-neutral-900 outline-none ring-0 placeholder:text-neutral-400 focus:border-sky-300 focus:bg-white"
          />
        </div>
        {editing && isOwner && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 rounded-xl bg-[#315efb] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2547c4] disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : 'Add File'}
          </button>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <label className="inline-flex items-center gap-1 text-sm text-neutral-700">
          <span className="sr-only">Sort</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
            className="cursor-pointer rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm font-medium text-neutral-800 outline-none focus:border-sky-300"
          >
            <option value="nameAsc">Name (A-Z)</option>
            <option value="nameDesc">Name (Z-A)</option>
            <option value="dateDesc">Newest first</option>
          </select>
        </label>
        <div className="flex rounded-lg border border-neutral-200 p-0.5">
          <button
            type="button"
            title="List view"
            onClick={() => setView('list')}
            className={`rounded-md p-1.5 ${view === 'list' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400 hover:text-neutral-700'}`}
          >
            <LayoutList className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Grid view"
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
          {compact && <p className="mt-1 text-[11px] text-neutral-400">{formatBytes(f.size)}</p>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 self-end sm:self-center">
        {editing && isOwner ? (
          <div className="relative" ref={menuOpenId === f._id ? menuRef : undefined}>
            <button
              type="button"
              aria-label="File actions"
              onClick={() => setMenuOpenId((v) => (v === f._id ? null : f._id))}
              className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            {menuOpenId === f._id && (
              <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  onClick={() => void deleteFile(f._id)}
                >
                  <Trash2 className="h-4 w-4 shrink-0" />
                  Delete
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            title="Download"
            onClick={() => void downloadFile(f)}
            className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
          >
            <Download className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[#e7e7e7] bg-white">
      <input ref={fileInputRef} type="file" className="hidden" multiple onChange={onPickFiles} />
      {editing && isOwner ? (
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="truncate text-lg font-semibold text-neutral-900">Editing Files</h1>
            <span className="text-neutral-400" title="Members see files you publish here. Only you can add or remove files.">
              <Info className="h-4 w-4" />
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-xl bg-[#315efb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2547c4]"
            >
              Done
            </button>
            <span className="text-neutral-400" title="Only the community owner can manage files">
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
              aria-label="Back to community"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
              <CloudDownload className="h-5 w-5" strokeWidth={2} aria-hidden />
            </div>
            <h1 className="min-w-0 truncate text-lg font-semibold text-neutral-900">{headerName}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={copyPageLink} className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100" title="Copy link">
              <Link2 className="h-5 w-5" />
            </button>
            <button type="button" className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100" title="Members">
              <Users className="h-5 w-5" />
            </button>
            <button type="button" className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100" title="Notifications">
              <Bell className="h-5 w-5" />
            </button>
            {isOwner && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="ml-1 flex items-center gap-1.5 rounded-xl bg-[#315efb] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2547c4]"
              >
                <Pencil className="h-4 w-4" strokeWidth={2} />
                Edit12
              </button>
            )}
          </div>
        </div>
      )}

      {controlsRow}

      <div className="min-h-0 flex-1 overflow-y-auto bg-white">
        {emptyAll && (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-6 text-neutral-300">
              <CloudDownload className="h-12 w-12" strokeWidth={1.25} />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900">No files here</h2>
            <p className="mt-2 max-w-sm text-sm text-neutral-500">
              You can upload images, videos, documents, whatever you want!
            </p>
            {isOwner && (
              <button
                type="button"
                disabled={uploading}
                onClick={() => {
                  setEditing(true);
                  window.setTimeout(() => fileInputRef.current?.click(), 0);
                }}
                className="mt-6 rounded-xl bg-[#315efb] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2547c4] disabled:opacity-50"
              >
                {uploading ? 'Uploading…' : 'Add File'}
              </button>
            )}
          </div>
        )}

        {emptySearch && (
          <div className="px-6 py-12 text-center text-sm text-neutral-500">No files match your search.</div>
        )}

        {!emptyAll && !emptySearch && view === 'list' && (
          <div className="divide-y divide-neutral-100">{filteredLocal.map((f) => fileCardInner(f, false))}</div>
        )}

        {!emptyAll && !emptySearch && view === 'grid' && (
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">{filteredLocal.map((f) => (
            <div key={f._id} className="rounded-xl border border-neutral-200 bg-neutral-50/50">
              {fileCardInner(f, true)}
            </div>
          ))}</div>
        )}
      </div>
    </div>
  );
};

export default CommunityFilesPanel;
