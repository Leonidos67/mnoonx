import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  RotateCcw,
  Send,
  Ticket,
} from 'lucide-react';
import { ADMIN_API } from '../../config/api';
import { adminAuthHeaders, useAdminAuth } from '../../context/AdminAuthContext';

type FilterTab = 'all' | 'open' | 'closed' | 'needs_reply';

interface AdminTicket {
  id: string;
  shortId: string;
  status: 'open' | 'closed';
  categoryLabel: string;
  title: string;
  communityName: string;
  appLink: string;
  userId: string;
  username: string;
  email: string;
  lastMessageText: string;
  needsReply: boolean;
}

interface AdminTicketMessage {
  id: string;
  sender: 'user' | 'assistant' | 'support';
  text: string;
  timestamp: string;
}

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'needs_reply', label: 'Ждут ответа' },
  { id: 'open', label: 'Открытые' },
  { id: 'closed', label: 'Закрытые' },
  { id: 'all', label: 'Все' },
];

const AdminSupportTickets: React.FC = () => {
  const { token } = useAdminAuth();
  const [filter, setFilter] = useState<FilterTab>('needs_reply');
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [counts, setCounts] = useState({ open: 0, closed: 0, all: 0, needsReply: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailTicket, setDetailTicket] = useState<AdminTicket | null>(null);
  const [messages, setMessages] = useState<AdminTicketMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listLoadedOnce = useRef(false);

  const loadTickets = useCallback(
    async (silent = false) => {
      if (!token) return;
      if (!silent && !listLoadedOnce.current) setLoadingList(true);
      try {
        const res = await fetch(`${ADMIN_API}/support-tickets?status=${filter}`, {
          headers: adminAuthHeaders(token),
        });
        if (!res.ok) throw new Error('load failed');
        const data = await res.json();
        setTickets(data.tickets || []);
        setCounts(data.counts || { open: 0, closed: 0, all: 0, needsReply: 0 });
        listLoadedOnce.current = true;
      } catch {
        if (!listLoadedOnce.current) setTickets([]);
      } finally {
        setLoadingList(false);
      }
    },
    [token, filter],
  );

  const loadDetail = useCallback(
    async (ticketId: string, silent = false) => {
      if (!token) return;
      if (!silent) setLoadingDetail(true);
      try {
        const res = await fetch(`${ADMIN_API}/support-tickets/${ticketId}`, {
          headers: adminAuthHeaders(token),
        });
        if (!res.ok) throw new Error('detail failed');
        const data = await res.json();
        setDetailTicket(data.ticket);
        setMessages(data.messages || []);
      } catch {
        setDetailTicket(null);
        setMessages([]);
      } finally {
        setLoadingDetail(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void loadTickets();
    const id = window.setInterval(() => void loadTickets(true), 20000);
    return () => clearInterval(id);
  }, [loadTickets]);

  useEffect(() => {
    if (!selectedId) return;
    void loadDetail(selectedId);
    const id = window.setInterval(() => void loadDetail(selectedId, true), 10000);
    return () => clearInterval(id);
  }, [selectedId, loadDetail]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectTicket = (t: AdminTicket) => {
    setSelectedId(t.id);
    setDetailTicket(t);
    setMessages([]);
    setMobileShowThread(true);
    void loadDetail(t.id);
  };

  const handleSend = async () => {
    if (!token || !selectedId || !replyText.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${ADMIN_API}/support-tickets/${selectedId}/reply`, {
        method: 'POST',
        headers: {
          ...adminAuthHeaders(token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body: replyText.trim() }),
      });
      if (!res.ok) throw new Error('send failed');
      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      setReplyText('');
      void loadTickets(true);
      void loadDetail(selectedId, true);
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  };

  const patchStatus = async (action: 'close' | 'reopen') => {
    if (!token || !selectedId || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${ADMIN_API}/support-tickets/${selectedId}/${action}`, {
        method: 'PATCH',
        headers: adminAuthHeaders(token),
      });
      if (!res.ok) throw new Error('action failed');
      const data = await res.json();
      setDetailTicket(data.ticket);
      void loadTickets(true);
    } catch {
      /* ignore */
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const senderLabel = (s: string) => {
    if (s === 'support') return 'Поддержка';
    if (s === 'assistant') return 'AI assistant';
    return 'Пользователь';
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => {
          const count =
            tab.id === 'open'
              ? counts.open
              : tab.id === 'closed'
                ? counts.closed
                : tab.id === 'needs_reply'
                  ? counts.needsReply
                  : counts.all;
          const active = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-violet-600 text-white'
                  : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-neutral-200'
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#141820]">
        <div
          className={`flex w-full shrink-0 flex-col border-white/10 lg:w-[340px] lg:border-r ${
            mobileShowThread ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Список тикетов
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {loadingList && tickets.length === 0 ? (
              <p className="p-4 text-sm text-neutral-500">Загрузка…</p>
            ) : tickets.length === 0 ? (
              <p className="p-4 text-sm text-neutral-500">Тикетов нет</p>
            ) : (
              tickets.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTicket(t)}
                  className={`flex w-full flex-col gap-2 border-b border-white/5 px-4 py-3 text-left transition-colors hover:bg-white/5 ${
                    selectedId === t.id ? 'bg-violet-600/10' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="line-clamp-2 text-sm font-semibold text-white">{t.title}</span>
                    {t.needsReply ? (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" title="Ждёт ответа" />
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-neutral-400">
                      {t.categoryLabel}
                    </span>
                    <span className="font-mono text-[10px] text-neutral-500">#{t.shortId}</span>
                  </div>
                  <p className="line-clamp-1 text-xs text-neutral-500">@{t.username}</p>
                </button>
              ))
            )}
          </div>
        </div>

        <div
          className={`flex min-h-0 min-w-0 flex-1 flex-col ${
            mobileShowThread ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {selectedId && detailTicket ? (
            <>
              <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/10 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setMobileShowThread(false)}
                  className="rounded-lg p-2 text-neutral-400 hover:bg-white/5 lg:hidden"
                  aria-label="Назад"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">{detailTicket.title}</p>
                  <p className="text-xs text-neutral-500">
                    #{detailTicket.shortId} · @{detailTicket.username}
                  </p>
                </div>
                <Link
                  to={`/@${detailTicket.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-violet-400 hover:text-violet-300"
                >
                  Профиль
                </Link>
                {detailTicket.appLink ? (
                  <a
                    href={detailTicket.appLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-sky-400"
                  >
                    App <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
                {detailTicket.status === 'open' ? (
                  <button
                    type="button"
                    onClick={() => void patchStatus('close')}
                    disabled={actionLoading}
                    className="rounded-lg border border-teal-500/40 px-3 py-1.5 text-xs text-teal-300 hover:bg-teal-500/10"
                  >
                    Закрыть
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void patchStatus('reopen')}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1 rounded-lg border border-violet-500/40 px-3 py-1.5 text-xs text-violet-300"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Открыть
                  </button>
                )}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                {loadingDetail && messages.length === 0 ? (
                  <p className="text-center text-sm text-neutral-500">Загрузка…</p>
                ) : (
                  <ul className="space-y-3">
                    {messages.map((m) => {
                      const isStaff = m.sender === 'support' || m.sender === 'assistant';
                      return (
                        <li key={m.id} className={`flex ${isStaff ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm ${
                              m.sender === 'support'
                                ? 'bg-violet-600 text-white'
                                : m.sender === 'assistant'
                                  ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-50'
                                  : 'bg-[#1e2430] text-neutral-100'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{m.text}</p>
                            <p className="mt-1 text-[10px] opacity-60">
                              {formatDate(m.timestamp)} · {senderLabel(m.sender)}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </ul>
                )}
              </div>

              {detailTicket.status === 'open' ? (
                <div className="shrink-0 border-t border-white/10 p-4">
                  <div className="flex gap-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          void handleSend();
                        }
                      }}
                      rows={2}
                      placeholder="Ответ от поддержки…"
                      className="min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-[#0b0d12] px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => void handleSend()}
                      disabled={sending || !replyText.trim()}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white disabled:opacity-50"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="shrink-0 border-t border-white/10 p-4 text-center text-sm text-neutral-500">
                  Тикет закрыт
                </p>
              )}
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-neutral-500">
              <Ticket className="mr-2 h-8 w-8 opacity-30" />
              <span className="text-sm">Выберите тикет</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSupportTickets;
