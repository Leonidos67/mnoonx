import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { ADMIN_API } from '../../config/api';
import { adminAuthHeaders, useAdminAuth } from '../../context/AdminAuthContext';

interface SupportTicket {
  userId: string;
  conversationId: string;
  username: string;
  fullName: string;
  avatar: string;
  email: string;
  lastMessageText: string;
  lastMessageAt: string;
  userMessagesCount: number;
  needsReply: boolean;
}

interface SupportMessage {
  id: string;
  text: string;
  sender: 'user' | 'support';
  timestamp: string;
}

const AdminSupport: React.FC = () => {
  const { token } = useAdminAuth();
  const location = useLocation();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [needsReplyCount, setNeedsReplyCount] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [selectedUser, setSelectedUser] = useState<{
    username: string;
    fullName: string;
    email: string;
  } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadTickets = useCallback(async () => {
    if (!token) return;
    setLoadingTickets(true);
    try {
      const res = await fetch(`${ADMIN_API}/support/tickets`, {
        headers: adminAuthHeaders(token),
      });
      if (!res.ok) throw new Error('Ошибка загрузки');
      const data = await res.json();
      setTickets(data.tickets || []);
      setNeedsReplyCount(data.needsReplyCount || 0);
    } catch {
      setTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  }, [token]);

  const loadMessages = useCallback(
    async (userId: string) => {
      if (!token) return;
      setLoadingMessages(true);
      try {
        const res = await fetch(`${ADMIN_API}/support/tickets/${userId}/messages`, {
          headers: adminAuthHeaders(token),
        });
        if (!res.ok) throw new Error('Ошибка');
        const data = await res.json();
        setMessages(data.messages || []);
        setSelectedUser(
          data.user
            ? {
                username: data.user.username,
                fullName: data.user.fullName,
                email: data.user.email,
              }
            : null,
        );
      } catch {
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void loadTickets();
    const id = window.setInterval(() => void loadTickets(), 15000);
    return () => clearInterval(id);
  }, [loadTickets]);

  useEffect(() => {
    const userId = (location.state as { userId?: string } | null)?.userId;
    if (userId) {
      setSelectedUserId(userId);
      setMobileShowThread(true);
    }
  }, [location.state]);

  useEffect(() => {
    if (!selectedUserId) return;
    void loadMessages(selectedUserId);
    const id = window.setInterval(() => void loadMessages(selectedUserId), 8000);
    return () => clearInterval(id);
  }, [selectedUserId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectTicket = (ticket: SupportTicket) => {
    setSelectedUserId(ticket.userId);
    setMobileShowThread(true);
  };

  const handleSend = async () => {
    if (!token || !selectedUserId || !replyText.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${ADMIN_API}/support/tickets/${selectedUserId}/reply`, {
        method: 'POST',
        headers: {
          ...adminAuthHeaders(token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body: replyText.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message || 'Ошибка отправки');
      }
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setReplyText('');
      void loadTickets();
    } catch {
      /* ignore */
    } finally {
      setSending(false);
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

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[480px] flex-col lg:h-[calc(100vh-4rem)]">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-white">Поддержка</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Сообщения пользователей в чат «Mnoonx Support»
          {needsReplyCount > 0 ? (
            <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300">
              ждут ответа: {needsReplyCount}
            </span>
          ) : null}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#141820]">
        {/* Список обращений */}
        <div
          className={`flex w-full shrink-0 flex-col border-white/10 lg:w-[300px] lg:border-r ${
            mobileShowThread ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Обращения
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {loadingTickets ? (
              <p className="p-4 text-sm text-neutral-500">Загрузка…</p>
            ) : tickets.length === 0 ? (
              <p className="p-4 text-sm text-neutral-500">Пока нет диалогов</p>
            ) : (
              tickets.map((t) => (
                <button
                  key={t.userId}
                  type="button"
                  onClick={() => selectTicket(t)}
                  className={`flex w-full gap-3 border-b border-white/5 px-4 py-3 text-left transition-colors hover:bg-white/5 ${
                    selectedUserId === t.userId ? 'bg-violet-600/10' : ''
                  }`}
                >
                  <img
                    src={
                      t.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(t.fullName)}&background=6366f1&color=fff&bold=true`
                    }
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-semibold text-white">{t.fullName}</span>
                      {t.needsReply ? (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" title="Ждёт ответа" />
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-neutral-500">@{t.username}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-neutral-400">{t.lastMessageText}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Переписка */}
        <div
          className={`flex min-w-0 flex-1 flex-col ${
            mobileShowThread ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {selectedUserId ? (
            <>
              <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setMobileShowThread(false)}
                  className="rounded-lg p-2 text-neutral-400 hover:bg-white/5 lg:hidden"
                  aria-label="Назад к списку"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">
                    {selectedUser?.fullName || 'Пользователь'}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    @{selectedUser?.username}
                    {selectedUser?.email ? ` · ${selectedUser.email}` : ''}
                  </p>
                </div>
                <Link
                  to={`/@${selectedUser?.username}`}
                  className="shrink-0 text-xs text-violet-400 hover:text-violet-300"
                  target="_blank"
                  rel="noreferrer"
                >
                  Профиль
                </Link>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                {loadingMessages ? (
                  <p className="text-center text-sm text-neutral-500">Загрузка сообщений…</p>
                ) : messages.length === 0 ? (
                  <p className="text-center text-sm text-neutral-500">Сообщений пока нет</p>
                ) : (
                  <ul className="space-y-3">
                    {messages.map((m) => (
                      <li
                        key={m.id}
                        className={`flex ${m.sender === 'support' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                            m.sender === 'support'
                              ? 'bg-violet-600 text-white'
                              : 'bg-[#1e2430] text-neutral-100'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.text}</p>
                          <p
                            className={`mt-1 text-[10px] ${
                              m.sender === 'support' ? 'text-violet-200/70' : 'text-neutral-500'
                            }`}
                          >
                            {formatDate(m.timestamp)}
                            {m.sender === 'support' ? ' · Поддержка' : ' · Пользователь'}
                          </p>
                        </div>
                      </li>
                    ))}
                    <div ref={messagesEndRef} />
                  </ul>
                )}
              </div>

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
                    placeholder="Ответ пользователю…"
                    className="min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-[#0b0d12] px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={sending || !replyText.trim()}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
                    aria-label="Отправить"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-neutral-500">
              Выберите обращение из списка слева
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSupport;
