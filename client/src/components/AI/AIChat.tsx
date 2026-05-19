import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PanelRightClose, Sparkles, Trash2, TrendingDown, TrendingUp, BarChart3 } from 'lucide-react';
import MarkdownContent from './MarkdownContent';
import MnoonxAISiriOrb from './MnoonxAISiriOrb';
import {
  buildMarketChatTemplate,
  MARKET_CHAT_QUICK_ACTIONS,
  type MarketChatTemplateId,
} from './marketChatTemplates';
import type { ChatResponse, MarketsResponse } from '../../types/ai';

import { AI_API as API_AI } from '../../config/api';

const QUICK_ICONS: Record<MarketChatTemplateId, React.ReactNode> = {
  gainers: <TrendingUp className="h-3.5 w-3.5 shrink-0 text-emerald-600" />,
  losers: <TrendingDown className="h-3.5 w-3.5 shrink-0 text-red-600" />,
  overview: <BarChart3 className="h-3.5 w-3.5 shrink-0 text-violet-600" />,
};

interface AIChatProps {
  promptSeed?: string;
  onCollapse?: () => void;
}

const AIChat: React.FC<AIChatProps> = ({ promptSeed, onCollapse }) => {
  const [prompt, setPrompt] = useState('');
  const [reply, setReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const marketsCache = useRef<MarketsResponse | null>(null);
  const marketsFetchRef = useRef<Promise<MarketsResponse | null> | null>(null);

  useEffect(() => {
    if (promptSeed) setPrompt(promptSeed);
  }, [promptSeed]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [reply, loading, error]);

  const loadMarketsSnapshot = useCallback(async (): Promise<MarketsResponse | null> => {
    if (marketsCache.current) return marketsCache.current;
    if (marketsFetchRef.current) return marketsFetchRef.current;

    const run = (async () => {
      try {
        const res = await fetch(`${API_AI}/markets?per_page=100`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { message?: string }).message || 'Failed to load market data');
        }
        const data = (await res.json()) as MarketsResponse;
        marketsCache.current = data;
        return data;
      } catch {
        return null;
      } finally {
        marketsFetchRef.current = null;
      }
    })();

    marketsFetchRef.current = run;
    return run;
  }, []);

  useEffect(() => {
    void loadMarketsSnapshot();
  }, [loadMarketsSnapshot]);

  const sendChat = useCallback(async (message: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_AI}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, mode: 'analyze' }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message || 'AI request failed');
      }
      const data = (await res.json()) as ChatResponse;
      setReply(data.reply);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI request failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const applyMarketTemplate = useCallback(
    async (id: MarketChatTemplateId) => {
      setTemplateLoading(true);
      setError(null);
      try {
        const data = await loadMarketsSnapshot();
        if (!data) {
          throw new Error('Could not load market data. Please try again in a moment.');
        }
        setReply(buildMarketChatTemplate(id, data));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load this snapshot');
      } finally {
        setTemplateLoading(false);
      }
    },
    [loadMarketsSnapshot]
  );

  const handleAnalyze = () => {
    const text = prompt.trim();
    if (!text || loading || templateLoading) return;
    void sendChat(text);
  };

  const handleClear = () => {
    setPrompt('');
    setReply(null);
    setError(null);
  };

  const showEmptyState = !reply && !error;
  const busy = loading || templateLoading;

  return (
    <aside className="flex h-full min-h-0 w-full flex-col bg-white">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center gap-2 border-b border-[#ececec] px-3 py-2">
          {onCollapse && (
            <button
              type="button"
              onClick={onCollapse}
              className="flex h-6 w-7 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              aria-label="Collapse MNOONX AI"
            >
              <PanelRightClose className="h-4 w-4" />
            </button>
          )}
          <h2 className="text-base font-bold text-neutral-900">MNOONX AI</h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {showEmptyState && (
            <div className="flex min-h-[min(280px,45vh)] flex-col items-center justify-center py-4">
              <MnoonxAISiriOrb loading={busy} />
              {busy && (
                <p className="mt-4 text-sm font-medium text-[#315efb]">
                  {templateLoading ? 'Loading market data…' : 'Thinking…'}
                </p>
              )}
              {!busy && (
                <div className="mt-5 flex w-full max-w-[320px] flex-col gap-2 px-1">
                  {MARKET_CHAT_QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => void applyMarketTemplate(action.id)}
                      className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm font-semibold text-neutral-800 transition hover:border-[#315efb]/40 hover:bg-white"
                    >
                      {QUICK_ICONS[action.id]}
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {error && !busy && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          {reply && !busy && <MarkdownContent content={reply} variant="light" />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="shrink-0 border-t border-[#ececec] bg-white p-0">
        <div className="flex items-center gap-1">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAnalyze();
              }
            }}
            placeholder="Analyze $SOL…"
            rows={1}
            className="max-h-32 flex-1 resize-none px-4 py-3 text-[15px] outline-none"
            maxLength={4000}
          />
          <button
            type="button"
            onClick={handleClear}
            disabled={busy || (!prompt.trim() && !reply && !error)}
            className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Clear"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={busy || !prompt.trim()}
            className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#315efb] text-white transition-colors hover:bg-[#2547c4] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Analyze"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AIChat;
