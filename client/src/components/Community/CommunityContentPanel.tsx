import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Bell, Link2, Users, Quote, Pencil, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import { COMMUNITIES_API as API } from '../../config/api';

interface CommunityContentPanelProps {
  handle: string;
  instanceId: string;
  instanceTitle?: string;
  isOwner: boolean;
  onBackToCommunity: () => void;
}

const CommunityContentPanel: React.FC<CommunityContentPanelProps> = ({
  handle,
  instanceId,
  instanceTitle,
  isOwner,
  onBackToCommunity,
}) => {
  const { token } = useAuth();
  const [title, setTitle] = useState('Unnamed document');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const debounceRef = useRef<number | null>(null);
  const lastSentRef = useRef<{ title: string; body: string } | null>(null);

  const load = useCallback(async () => {
    if (!token || !handle || !instanceId) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const q = new URLSearchParams({ instanceId });
      const res = await fetch(`${API}/${encodeURIComponent(handle)}/content?${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { message?: string }).message || 'Could not load document');
        return;
      }
      const t = typeof (data as { title?: string }).title === 'string' ? (data as { title: string }).title : 'Unnamed document';
      const b = typeof (data as { body?: string }).body === 'string' ? (data as { body: string }).body : '';
      setTitle(t.trim() || 'Unnamed document');
      setBody(b);
      lastSentRef.current = { title: t.trim() || 'Unnamed document', body: b };
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [token, handle, instanceId]);

  useEffect(() => {
    setLoading(true);
    setEditing(false);
    void load();
  }, [load]);

  const flushSave = useCallback(async () => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (!token || !handle || !instanceId || !isOwner) return;
    const prev = lastSentRef.current;
    const nextTitle = title.trim() || 'Unnamed document';
    const nextBody = body;
    if (prev && prev.title === nextTitle && prev.body === nextBody) return;
    setSaveState('saving');
    try {
      const res = await fetch(`${API}/${encodeURIComponent(handle)}/content`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ instanceId, title: nextTitle, body: nextBody }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveState('error');
        return;
      }
      const t = typeof (data as { title?: string }).title === 'string' ? (data as { title: string }).title : nextTitle;
      const b = typeof (data as { body?: string }).body === 'string' ? (data as { body: string }).body : nextBody;
      lastSentRef.current = { title: t, body: b };
      setSaveState('saved');
      window.setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 1500);
    } catch {
      setSaveState('error');
    }
  }, [token, handle, instanceId, isOwner, title, body]);

  const scheduleSave = useCallback(() => {
    if (!isOwner || !editing) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      debounceRef.current = null;
      void flushSave();
    }, 650);
  }, [isOwner, editing, flushSave]);

  useEffect(() => {
    if (!isOwner || !editing) return;
    scheduleSave();
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [title, body, isOwner, editing, scheduleSave]);

  const copyPageLink = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (!url) return;
    void navigator.clipboard.writeText(url).catch(() => {
      /* ignore */
    });
  };

  const headerTitle = instanceTitle?.trim() || 'Content';

  if (!token) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center rounded-xl border border-[#e7e7e7] bg-white p-10 text-center text-[#666]">
        <Lock className="mx-auto mb-3 h-10 w-10 text-[#999]" />
        <p className="text-[17px]">Sign in to view this document.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center rounded-xl border border-[#e7e7e7] bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center rounded-xl border border-[#e7e7e7] bg-white p-8 text-center">
        <p className="mb-2 text-[#e5484d]">{error}</p>
        <p className="text-sm text-[#888]">You may need to join this community or the app may be hidden.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[#e7e7e7] bg-white">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={() => {
              void (async () => {
                if (isOwner && editing) await flushSave();
                setEditing(false);
                onBackToCommunity();
              })();
            }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100"
            aria-label="Back to community"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white">
            <Quote className="h-5 w-5" strokeWidth={2} aria-hidden />
          </div>
          <h1 className="min-w-0 truncate text-lg font-semibold text-neutral-900">{headerTitle}</h1>
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
              onClick={() => {
                void (async () => {
                  if (editing) await flushSave();
                  setEditing((v) => !v);
                })();
              }}
              className="ml-1 flex items-center gap-1.5 rounded-xl bg-[#315efb] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2547c4]"
            >
              <Pencil className="h-4 w-4" strokeWidth={2} />
              {editing ? 'Done' : 'Edit'}
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-white px-8 py-8">
        <div className="mx-auto max-w-3xl">
          {editing && isOwner && (
            <p className="mb-4 text-right text-xs text-neutral-400">
              {saveState === 'saving' && 'Saving…'}
              {saveState === 'saved' && 'Saved'}
              {saveState === 'error' && 'Save failed'}
              {saveState === 'idle' && '\u00a0'}
            </p>
          )}
          {editing && isOwner ? (
            <>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mb-6 w-full border-0 border-b border-transparent bg-transparent text-3xl font-bold tracking-tight text-neutral-900 outline-none ring-0 placeholder:text-neutral-300 focus:border-neutral-200"
                placeholder="Unnamed document"
                maxLength={500}
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[min(60vh,520px)] w-full resize-y border-0 bg-transparent text-[17px] leading-relaxed text-neutral-800 outline-none ring-0 placeholder:text-neutral-300"
                placeholder="Start writing…"
              />
            </>
          ) : (
            <>
              <h2 className="mb-6 text-3xl font-bold tracking-tight text-neutral-900">{title || 'Unnamed document'}</h2>
              <div className="whitespace-pre-wrap text-[17px] leading-relaxed text-neutral-800">
                {body.trim() ? body : <span className="text-neutral-300">Empty document</span>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityContentPanel;
