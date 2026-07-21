import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, MessageCircle, Lock, Check, CheckCheck } from 'lucide-react';
import AnimatedSendIcon, { type AnimatedSendIconHandle } from '../Common/AnimatedSendIcon';
import { useAuth } from '../../context/AuthContext';

import { COMMUNITIES_API as API } from '../../config/api';

interface ChatAuthor {
  _id: string;
  username: string;
  fullName: string;
  avatar?: string;
}

interface ChatMessage {
  _id: string;
  content: string;
  createdAt: string;
  author: ChatAuthor;
  readByOthers?: number;
  otherMembersCount?: number;
  isAiBot?: boolean;
  aiBotName?: string;
}

interface CommunityChatPanelProps {
  handle: string;
  instanceId: string;
  title?: string;
  onBackToCommunity?: () => void;
}

const CommunityChatPanel: React.FC<CommunityChatPanelProps> = ({
  handle,
  instanceId,
  title,
  onBackToCommunity,
}) => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const sendIconRef = useRef<AnimatedSendIconHandle>(null);
  const lastReadPostedRef = useRef<string | null>(null);

  const tryMarkRead = useCallback(
    async (lastId: string) => {
      if (!token || !handle || !instanceId || !lastId) return;
      if (lastReadPostedRef.current === lastId) return;
      lastReadPostedRef.current = lastId;
      try {
        await fetch(`${API}/${encodeURIComponent(handle)}/chat/read`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ instanceId, lastReadMessageId: lastId }),
        });
      } catch {
        lastReadPostedRef.current = null;
      }
    },
    [token, handle, instanceId]
  );

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!token || !handle || !instanceId) {
        setLoading(false);
        return;
      }
      if (!opts?.silent) setError(null);
      try {
        const q = new URLSearchParams({ instanceId });
        const res = await fetch(`${API}/${encodeURIComponent(handle)}/chat/messages?${q}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (!opts?.silent) {
            setError((data as { message?: string }).message || 'Could not load chat');
            setMessages([]);
          }
          return;
        }
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      } catch {
        if (!opts?.silent) {
          setError('Network error');
          setMessages([]);
        }
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [handle, token, instanceId]
  );

  useEffect(() => {
    lastReadPostedRef.current = null;
  }, [instanceId]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const pollMessages = useCallback(async () => {
    if (!token || !handle || !instanceId || loading) return;
    try {
      const q = new URLSearchParams({ instanceId });
      const res = await fetch(`${API}/${encodeURIComponent(handle)}/chat/messages?${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data)) return;
      setMessages(data);
      const last = data[data.length - 1]?._id;
      if (last) void tryMarkRead(last);
    } catch {
      /* ignore */
    }
  }, [token, handle, instanceId, loading, tryMarkRead]);

  useEffect(() => {
    if (!token || !handle || !instanceId || loading) return;
    const id = window.setInterval(() => void pollMessages(), 2500);
    return () => clearInterval(id);
  }, [token, handle, instanceId, loading, pollMessages]);

  useEffect(() => {
    if (!token || loading || error || messages.length === 0) return;
    const last = messages[messages.length - 1]?._id;
    if (!last) return;
    const t = window.setTimeout(() => void tryMarkRead(last), 300);
    return () => clearTimeout(t);
  }, [messages, token, loading, error, tryMarkRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || !token || sending || !instanceId) return;
    sendIconRef.current?.startAnimation();
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`${API}/${encodeURIComponent(handle)}/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: text, instanceId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { message?: string }).message || 'Failed to send');
        return;
      }
      setMessages((prev) => [...prev, data as ChatMessage]);
      setInput('');
      const mid = (data as ChatMessage)._id;
      if (mid) void tryMarkRead(mid);
    } catch {
      setError('Network error');
    } finally {
      setSending(false);
    }
  };

  const readReceipt = (m: ChatMessage) => {
    const mine = user?.id === m.author?._id;
    if (!mine) return null;
    const total = m.otherMembersCount ?? 0;
    const read = m.readByOthers ?? 0;
    if (total <= 0) {
      return <Check className="h-3 w-3 text-white/60" aria-hidden />;
    }
    if (read >= total) {
      return (
        <span className="inline-flex" title="Read by everyone">
          <CheckCheck className="h-3 w-3 text-sky-200" aria-hidden />
        </span>
      );
    }
    if (read > 0) {
      return (
        <span className="inline-flex" title="Read by some members">
          <CheckCheck className="h-3 w-3 text-white/60" aria-hidden />
        </span>
      );
    }
    return (
      <span title="Sent">
        <Check className="h-3 w-3 text-white/60" aria-hidden />
      </span>
    );
  };

  if (!token) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center rounded-[32px] border border-[#e7e7e7] bg-white p-10 text-center text-[#666]">
        <Lock className="mx-auto mb-3 h-10 w-10 text-[#999]" />
        <p className="text-[17px]">Sign in to use community chat.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center rounded-[32px] border border-[#e7e7e7] bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-[#315efb]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center rounded-[32px] border border-[#e7e7e7] bg-white p-8 text-center">
        <p className="mb-2 text-[#e5484d]">{error}</p>
        <p className="text-sm text-[#888]">Join this community to read and post messages.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[#e7e7e7] bg-white max-lg:rounded-none max-lg:border-x-0">
      <div className="flex shrink-0 items-center gap-2 border-b border-[#ececec] px-3 py-3 sm:px-6 sm:py-4">
        {onBackToCommunity && (
          <button
            type="button"
            onClick={onBackToCommunity}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 lg:hidden"
            aria-label="Back to community"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <MessageCircle className="h-5 w-5 shrink-0 text-[#315efb]" />
        <h2 className="min-w-0 truncate text-lg font-semibold text-neutral-900">
          {title?.trim() || 'Community chat'}
        </h2>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#fafafa] px-4 py-4">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-[#999]">No messages yet. Say hello!</p>
        )}
        {messages.map((m) => {
          const isBot = Boolean(m.isAiBot);
          const mine = !isBot && user?.id === m.author?._id;
          const displayName = isBot
            ? m.aiBotName || 'Community AI'
            : m.author?.fullName || m.author?.username;
          return (
            <div key={m._id} className={`flex gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
              <img
                src={
                  isBot
                    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'AI')}&background=059669&color=fff&size=40&bold=true`
                    : m.author?.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(m.author?.fullName || m.author?.username || '?')}&background=315efb&color=fff&size=40&bold=true`
                }
                alt=""
                className="h-9 w-9 shrink-0 rounded-full object-cover"
              />
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
                  mine
                    ? 'bg-[#315efb] text-white'
                    : isBot
                      ? 'border border-emerald-200 bg-emerald-50 text-neutral-900 shadow-sm'
                      : 'border border-[#ececec] bg-white text-neutral-900 shadow-sm'
                }`}
              >
                {!mine && (
                  <p className={`mb-1 text-xs font-semibold ${isBot ? 'text-emerald-700' : 'text-[#315efb]'}`}>
                    {displayName}
                    {isBot ? ' · AI' : ''}
                  </p>
                )}
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <div
                  className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${mine ? 'text-white/70' : 'text-neutral-400'}`}
                >
                  <span>
                    {new Date(m.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                  {mine && <span className="flex shrink-0 items-center">{readReceipt(m)}</span>}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-[#ececec] bg-white p-0">
        <div className="flex items-center gap-2">  {/* ← items-end заменили на items-center */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Write a message…"
            rows={1}
            className="flex-1 resize-none px-4 py-3 text-[15px] outline-none focus:border-[#315efb] focus:ring-[#315efb]/30"
            maxLength={4000}
          />
          <button
            type="button"
            onClick={send}
            disabled={sending || !input.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl mr-2 bg-[#315efb] text-white transition-colors hover:bg-[#2547c4] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send"
          >
            <AnimatedSendIcon ref={sendIconRef} size={18} color="#ffffff" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunityChatPanel;
