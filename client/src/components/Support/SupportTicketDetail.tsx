import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bot,
  Bug,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Plus,
  Send,
  Tag,
  User,
  X,
} from 'lucide-react';
import { SUPPORT_API } from '../../config/api';
import { DOCS_SUPPORT_PATH } from '../../docs/docsNav';
import type { SupportTicket, SupportTicketMessage } from '../../types/support';
import { formatMessageTime, formatRelativeTime } from './supportUtils';

interface SupportTicketDetailProps {
  ticketId: string;
  token: string;
  initialTicket?: SupportTicket | null;
  initialMessages?: SupportTicketMessage[];
}

const SupportTicketDetail: React.FC<SupportTicketDetailProps> = ({
  ticketId,
  token,
  initialTicket = null,
  initialMessages,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    ticket?: SupportTicket;
    messages?: SupportTicketMessage[];
  } | null;

  const seedTicket = initialTicket ?? state?.ticket ?? null;
  const seedMessages = initialMessages ?? state?.messages ?? null;

  const [ticket, setTicket] = useState<SupportTicket | null>(seedTicket);
  const [messages, setMessages] = useState<SupportTicketMessage[]>(seedMessages ?? []);
  const [loading, setLoading] = useState(!seedTicket);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fetchedIdRef = useRef<string | null>(seedTicket ? ticketId : null);

  const load = useCallback(
    async (silent: boolean) => {
      if (!silent) setLoading(true);
      try {
        const res = await fetch(`${SUPPORT_API}/tickets/${ticketId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('not found');
        const data = (await res.json()) as {
          ticket: SupportTicket;
          messages: SupportTicketMessage[];
        };
        setTicket(data.ticket);
        setMessages(data.messages);
        fetchedIdRef.current = ticketId;
      } catch {
        if (!silent) setTicket(null);
      } finally {
        setLoading(false);
      }
    },
    [ticketId, token]
  );

  useEffect(() => {
    if (fetchedIdRef.current === ticketId) return;

    if (seedTicket && seedMessages) {
      setTicket(seedTicket);
      setMessages(seedMessages);
      setLoading(false);
      fetchedIdRef.current = ticketId;
      return;
    }

    void load(false);
  }, [ticketId, seedTicket, seedMessages, load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendReply = async () => {
    const text = reply.trim();
    if (!text || !ticket || ticket.status === 'closed' || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${SUPPORT_API}/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body: text }),
      });
      if (!res.ok) throw new Error('send failed');
      const data = (await res.json()) as { message: SupportTicketMessage };
      setMessages((prev) => [...prev, data.message]);
      setReply('');
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  };

  const closeTicket = async () => {
    if (!ticket || ticket.status === 'closed' || closing) return;
    setClosing(true);
    try {
      const res = await fetch(`${SUPPORT_API}/tickets/${ticketId}/close`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('close failed');
      const data = (await res.json()) as { ticket: SupportTicket };
      setTicket(data.ticket);
    } catch {
      /* ignore */
    } finally {
      setClosing(false);
    }
  };

  if (loading && !ticket) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-orange-500" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex h-full items-center justify-center py-12 text-center">
        <div>
          <p className="font-semibold text-neutral-900">Ticket not found</p>
          <Link
            to={DOCS_SUPPORT_PATH}
            className="mt-4 inline-block text-sm text-orange-600 hover:underline"
          >
            Back to tickets
          </Link>
        </div>
      </div>
    );
  }

  const isOpen = ticket.status === 'open';

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col">
      {/* Header — fixed top */}
      <header className="shrink-0 bg-white pb-3 pt-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(DOCS_SUPPORT_PATH)}
            className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-stone-100"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-neutral-800">{ticket.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
              <span className="rounded-md bg-stone-100 px-1.5 py-0.5 font-mono text-neutral-600">
                #{ticket.shortId}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" aria-hidden />
                {formatRelativeTime(ticket.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-700">
                <Bug className="h-3 w-3" aria-hidden />
                {ticket.categoryLabel}
              </span>
              {(ticket.communityId || ticket.appLink) && (
                <span className="inline-flex items-center gap-1 text-sky-700">
                  <Tag className="h-3 w-3" aria-hidden />
                  App
                  {ticket.appLink ? (
                    <a
                      href={ticket.appLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-neutral-900">{ticket.title}</p>
            <p className="text-xs text-neutral-500">{ticket.categoryLabel}</p>
          </div>
          {isOpen ? (
            <button
              type="button"
              onClick={() => void closeTicket()}
              disabled={closing}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-teal-400 px-3 py-1.5 text-sm font-medium text-teal-700 hover:bg-teal-50 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              {closing ? 'Closing...' : 'Close Ticket'}
            </button>
          ) : (
            <span className="shrink-0 rounded-lg bg-stone-200/80 px-3 py-1.5 text-xs font-medium text-neutral-600">
              Closed
            </span>
          )}
        </div>
      </header>

      {/* Scrollable messages */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-stone-50/50 border border-ston-200 rounded-xl px-1 py-2 sm:px-2">
        <div className="space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isSupport = msg.sender === 'support';
            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser ? (
                  <span
                    className={`mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      isSupport ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {isSupport ? (
                      <User className="h-4 w-4" aria-hidden />
                    ) : (
                      <Bot className="h-4 w-4" aria-hidden />
                    )}
                  </span>
                ) : null}
                <div className={`max-w-[85%] ${isUser ? 'text-right' : ''}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-neutral-900 text-white'
                        : isSupport
                          ? 'border border-violet-200 bg-violet-50 text-violet-950'
                          : 'border border-stone-200 bg-white text-neutral-800'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <p className="mt-1 text-xs text-neutral-400">
                    {formatMessageTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Fixed bottom: hints + input */}
      <footer className="shrink-0 mt-4 pb-[env(safe-area-inset-bottom)]">
        
        {isOpen ? (
          <div className="flex items-end gap-2 px-3 pb-3">
            {/* <button
              type="button"
              className="mb-1 rounded-lg p-2 text-neutral-400 hover:bg-stone-50"
              aria-label="Attach"
            >
              <Plus className="h-5 w-5" />
            </button> */}
            <div className="flex min-h-[48px] flex-1 items-end gap-2 rounded-3xl border border-stone-200 bg-stone-50 px-3 py-2 shadow-sm">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="Type your message..."
                className="max-h-32 min-h-[28px] flex-1 resize-none border-0 bg-transparent py-1 text-sm focus:outline-none focus:ring-0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void sendReply();
                  }
                }}
              />
              <span className="shrink-0 pb-1 text-[10px] text-neutral-400">{reply.length}/500</span>
            </div>
            <button
              type="button"
              onClick={() => void sendReply()}
              disabled={!reply.trim() || sending}
              className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white transition-colors hover:bg-neutral-800 disabled:bg-stone-200 disabled:text-stone-400"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <p className="px-4 pb-4 text-center text-sm text-neutral-500">
            This ticket is closed. Open a new ticket if you need more help.
          </p>
        )}
      </footer>
    </div>
  );
};

export default SupportTicketDetail;
