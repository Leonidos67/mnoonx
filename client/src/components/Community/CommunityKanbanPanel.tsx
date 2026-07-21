import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Columns3, Loader2, Plus, Trash2, Pencil } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/useTranslation';
import { COMMUNITIES_API as API } from '../../config/api';

interface KanbanColumn {
  id: string;
  title: string;
  order: number;
}

interface KanbanCard {
  _id: string;
  columnId: string;
  title: string;
  description: string;
  order: number;
}

interface CommunityKanbanPanelProps {
  handle: string;
  instanceId: string;
  instanceTitle?: string;
  isOwner: boolean;
  onBackToCommunity: () => void;
}

const CommunityKanbanPanel: React.FC<CommunityKanbanPanelProps> = ({
  handle,
  instanceId,
  instanceTitle,
  isOwner,
  onBackToCommunity,
}) => {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newTitles, setNewTitles] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [editCard, setEditCard] = useState<KanbanCard | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const load = useCallback(async () => {
    if (!token || !handle || !instanceId) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const q = new URLSearchParams({ instanceId });
      const res = await fetch(`${API}/${encodeURIComponent(handle)}/kanban?${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { message?: string }).message || t('community.kanbanPanel.loadFailed'));
        return;
      }
      setColumns(Array.isArray((data as { columns?: KanbanColumn[] }).columns) ? data.columns : []);
      setCards(Array.isArray((data as { cards?: KanbanCard[] }).cards) ? data.cards : []);
    } catch {
      setError(t('community.networkError'));
    } finally {
      setLoading(false);
    }
  }, [token, handle, instanceId, t]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const byColumn = useMemo(() => {
    const map: Record<string, KanbanCard[]> = {};
    for (const col of columns) map[col.id] = [];
    for (const card of cards) {
      if (!map[card.columnId]) map[card.columnId] = [];
      map[card.columnId].push(card);
    }
    for (const id of Object.keys(map)) {
      map[id].sort((a, b) => a.order - b.order);
    }
    return map;
  }, [columns, cards]);

  const addCard = async (columnId: string) => {
    const title = (newTitles[columnId] || '').trim();
    if (!isOwner || !token || !title || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API}/${encodeURIComponent(handle)}/kanban/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ instanceId, columnId, title }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { message?: string }).message || t('community.kanbanPanel.saveFailed'));
        return;
      }
      setCards((prev) => [...prev, data as KanbanCard]);
      setNewTitles((prev) => ({ ...prev, [columnId]: '' }));
    } catch {
      setError(t('community.networkError'));
    } finally {
      setBusy(false);
    }
  };

  const moveCard = async (card: KanbanCard, columnId: string) => {
    if (!isOwner || !token || card.columnId === columnId || busy) return;
    setBusy(true);
    try {
      const res = await fetch(
        `${API}/${encodeURIComponent(handle)}/kanban/cards/${encodeURIComponent(card._id)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ instanceId, columnId }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { message?: string }).message || t('community.kanbanPanel.saveFailed'));
        return;
      }
      setCards((prev) => prev.map((c) => (c._id === card._id ? (data as KanbanCard) : c)));
    } catch {
      setError(t('community.networkError'));
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async () => {
    if (!isOwner || !token || !editCard || !editTitle.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(
        `${API}/${encodeURIComponent(handle)}/kanban/cards/${encodeURIComponent(editCard._id)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            instanceId,
            title: editTitle.trim(),
            description: editDesc,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { message?: string }).message || t('community.kanbanPanel.saveFailed'));
        return;
      }
      setCards((prev) => prev.map((c) => (c._id === editCard._id ? (data as KanbanCard) : c)));
      setEditCard(null);
    } catch {
      setError(t('community.networkError'));
    } finally {
      setBusy(false);
    }
  };

  const deleteCard = async (cardId: string) => {
    if (!isOwner || !token) return;
    try {
      const q = new URLSearchParams({ instanceId });
      const res = await fetch(
        `${API}/${encodeURIComponent(handle)}/kanban/cards/${encodeURIComponent(cardId)}?${q}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { message?: string }).message || t('community.kanbanPanel.deleteFailed'));
        return;
      }
      setCards((prev) => prev.filter((c) => c._id !== cardId));
      if (editCard?._id === cardId) setEditCard(null);
    } catch {
      setError(t('community.networkError'));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {t('community.kanbanPanel.loading')}
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#e7e7e7] bg-white max-lg:rounded-none max-lg:border-x-0">
      <div className="flex shrink-0 items-center gap-2 border-b border-[#ececec] px-3 py-3 sm:px-6 sm:py-4">
        <button
          type="button"
          onClick={onBackToCommunity}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 lg:hidden"
          aria-label={t('community.kanbanPanel.back')}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Columns3 className="h-5 w-5 shrink-0 text-sky-600" />
        <h1 className="min-w-0 truncate text-lg font-semibold text-neutral-900">
          {instanceTitle || t('community.defaultKanbanTitle')}
        </h1>
      </div>

      {error && (
        <div className="mx-3 mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden p-3">
        <div className="flex h-full min-h-[320px] gap-3">
          {columns.map((col) => (
            <div
              key={col.id}
              className="flex w-72 shrink-0 flex-col rounded-xl border border-neutral-200 bg-neutral-50"
            >
              <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2">
                <h3 className="text-[13px] font-semibold text-neutral-800">{col.title}</h3>
                <span className="rounded-full bg-white px-1.5 text-[11px] text-neutral-500 tabular-nums">
                  {(byColumn[col.id] || []).length}
                </span>
              </div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
                {(byColumn[col.id] || []).map((card) => (
                  <div
                    key={card._id}
                    className="rounded-lg border border-neutral-200 bg-white p-2.5 shadow-sm"
                  >
                    <div className="flex items-start gap-1">
                      <p className="min-w-0 flex-1 text-[13px] font-medium text-neutral-900">
                        {card.title}
                      </p>
                      {isOwner && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditCard(card);
                              setEditTitle(card.title);
                              setEditDesc(card.description || '');
                            }}
                            className="rounded p-0.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteCard(card._id)}
                            className="rounded p-0.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      )}
                    </div>
                    {card.description ? (
                      <p className="mt-1 line-clamp-3 text-[12px] text-neutral-500">
                        {card.description}
                      </p>
                    ) : null}
                    {isOwner && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {columns
                          .filter((c) => c.id !== col.id)
                          .map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => void moveCard(card, c.id)}
                              className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600 hover:bg-sky-100 hover:text-sky-800"
                            >
                              → {c.title}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {isOwner && (
                <div className="border-t border-neutral-200 p-2">
                  <div className="flex gap-1">
                    <input
                      value={newTitles[col.id] || ''}
                      onChange={(e) =>
                        setNewTitles((prev) => ({ ...prev, [col.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void addCard(col.id);
                      }}
                      placeholder={t('community.kanbanPanel.addCardPh')}
                      className="min-w-0 flex-1 rounded-md border border-neutral-200 px-2 py-1.5 text-[12px]"
                    />
                    <button
                      type="button"
                      onClick={() => void addCard(col.id)}
                      disabled={busy || !(newTitles[col.id] || '').trim()}
                      className="rounded-md bg-sky-600 px-2 text-white disabled:opacity-40"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {isOwner && editCard && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl">
            <h3 className="text-sm font-semibold">{t('community.kanbanPanel.editCard')}</h3>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="mt-3 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={4}
              placeholder={t('community.kanbanPanel.descPh')}
              className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditCard(null)}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm"
              >
                {t('community.kanbanPanel.cancel')}
              </button>
              <button
                type="button"
                onClick={() => void saveEdit()}
                disabled={busy || !editTitle.trim()}
                className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {t('community.kanbanPanel.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityKanbanPanel;
