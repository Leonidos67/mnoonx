import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  Home,
  Loader2,
  Lock,
  MoreHorizontal,
  RotateCw,
  Trash2,
  X,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n/useTranslation';
import { BROWSE_API } from '../../config/api';
import { getExternalHostname } from '../../utils/externalLinks';
import {
  clearBrowseRecent,
  getBrowseRecent,
  rememberBrowseVisit,
  removeBrowseRecent,
  type BrowseRecentItem,
} from '../../utils/browseRecent';

interface InAppBrowserProps {
  open: boolean;
  url: string;
  onClose: () => void;
}

const iconBtn =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-300/80 bg-white/55 text-neutral-900 shadow-sm backdrop-blur-md transition-colors active:bg-white/75 disabled:opacity-35';

function formatVisitedAt(ts: number, locale: string): string {
  try {
    return new Date(ts).toLocaleString(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return new Date(ts).toLocaleString();
  }
}

const InAppBrowser: React.FC<InAppBrowserProps> = ({ open, url, onClose }) => {
  const { t, locale } = useTranslation();
  const { showToast } = useToast();
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [iframeKey, setIframeKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [recent, setRecent] = useState<BrowseRecentItem[]>([]);
  const historyIndexRef = useRef(0);
  const skipPushRef = useRef(false);

  const currentUrl = history[historyIndex] || url;
  const host = getExternalHostname(currentUrl);
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  const proxySrc = useMemo(() => {
    if (!currentUrl) return '';
    return `${BROWSE_API}?url=${encodeURIComponent(currentUrl)}`;
  }, [currentUrl]);

  const recordVisit = useCallback((visitUrl: string) => {
    setRecent(rememberBrowseVisit(visitUrl));
  }, []);

  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);

  useEffect(() => {
    if (!open || !url) return;
    setHistory([url]);
    setHistoryIndex(0);
    historyIndexRef.current = 0;
    setIframeKey(0);
    setLoading(true);
    setMenuOpen(false);
    setHistoryOpen(false);
    skipPushRef.current = false;
    recordVisit(url);
  }, [open, url, recordVisit]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (historyOpen) setHistoryOpen(false);
        else if (menuOpen) setMenuOpen(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, menuOpen, historyOpen]);

  const pushUrl = useCallback(
    (next: string) => {
      if (!next) return;
      setHistory((prev) => {
        const idx = historyIndexRef.current;
        if (prev[idx] === next) return prev;
        const trimmed = prev.slice(0, idx + 1);
        const nextHist = [...trimmed, next];
        const nextIdx = nextHist.length - 1;
        historyIndexRef.current = nextIdx;
        setHistoryIndex(nextIdx);
        setLoading(true);
        recordVisit(next);
        return nextHist;
      });
    },
    [recordVisit],
  );

  useEffect(() => {
    if (!open) return;
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { source?: string; type?: string; url?: string } | null;
      if (!data || data.source !== 'mnoonx-browse' || data.type !== 'navigate') return;
      const next = String(data.url || '').trim();
      if (!next) return;
      if (skipPushRef.current) {
        skipPushRef.current = false;
        return;
      }
      pushUrl(next);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [open, pushUrl]);

  if (!open) return null;

  const goBack = () => {
    if (!canGoBack) return;
    skipPushRef.current = true;
    const nextIdx = historyIndex - 1;
    historyIndexRef.current = nextIdx;
    setHistoryIndex(nextIdx);
    setLoading(true);
  };

  const goForward = () => {
    if (!canGoForward) return;
    skipPushRef.current = true;
    const nextIdx = historyIndex + 1;
    historyIndexRef.current = nextIdx;
    setHistoryIndex(nextIdx);
    setLoading(true);
  };

  const reload = () => {
    setIframeKey((k) => k + 1);
    setLoading(true);
  };

  const openNewTab = () => {
    window.open(currentUrl, '_blank', 'noopener,noreferrer');
    setMenuOpen(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      showToast(t('common.linkCopied'));
    } catch {
      showToast(t('common.copyLinkFailed'), 'error');
    }
    setMenuOpen(false);
  };

  const goHomeTab = () => {
    if (historyIndex === 0) {
      reload();
      return;
    }
    skipPushRef.current = true;
    historyIndexRef.current = 0;
    setHistoryIndex(0);
    setLoading(true);
  };

  const openHistory = () => {
    setRecent(getBrowseRecent());
    setHistoryOpen(true);
  };

  const openFromRecent = (item: BrowseRecentItem) => {
    setHistoryOpen(false);
    pushUrl(item.url);
  };

  const clearRecent = () => {
    clearBrowseRecent();
    setRecent([]);
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex flex-col bg-transparent"
      role="dialog"
      aria-modal="true"
      aria-label={t('inAppBrowser.browserTitle')}
    >
      {/* Top chrome — fixed */}
      <header
        className="relative z-[155] flex shrink-0 items-center gap-1.5 border-b border-neutral-200/80 bg-white/70 px-2 pb-2 text-neutral-900 backdrop-blur-xl"
        style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))' }}
      >
        <button type="button" onClick={onClose} className={iconBtn} aria-label={t('common.close')}>
          <X className="h-5 w-5" strokeWidth={2} aria-hidden />
        </button>

        <div className="min-w-0 flex-1 px-1 text-center">
          <div className="flex items-center justify-center gap-1">
            <Lock className="h-3 w-3 shrink-0 text-neutral-500" aria-hidden />
            <p className="truncate text-[13px] font-semibold leading-tight text-neutral-900">{host}</p>
          </div>
          <p className="truncate text-[11px] leading-tight text-neutral-500">{t('inAppBrowser.poweredBy')}</p>
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className={iconBtn}
            aria-label={t('inAppBrowser.more')}
            aria-expanded={menuOpen}
          >
            <MoreHorizontal className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
          {menuOpen ? (
            <>
              <button
                type="button"
                className="fixed inset-0 z-[151]"
                aria-label={t('common.close')}
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-12 z-[152] w-52 overflow-hidden rounded-2xl border border-neutral-200 bg-white py-1 shadow-xl">
                <button
                  type="button"
                  onClick={openNewTab}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-neutral-900 active:bg-neutral-50"
                >
                  <ExternalLink className="h-4 w-4 text-neutral-700" aria-hidden />
                  {t('inAppBrowser.openNewTab')}
                </button>
                <button
                  type="button"
                  onClick={() => void copyLink()}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-neutral-900 active:bg-neutral-50"
                >
                  <Copy className="h-4 w-4 text-neutral-700" aria-hidden />
                  {t('common.copyLink')}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </header>

      {/* Page scrolls under floating chrome */}
      <div className="relative min-h-0 flex-1 bg-transparent">
        {loading ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/80">
            <Loader2 className="h-7 w-7 animate-spin text-neutral-400" aria-hidden />
          </div>
        ) : null}
        <iframe
          key={`${iframeKey}-${currentUrl}`}
          title={t('inAppBrowser.browserTitle')}
          src={proxySrc}
          className="h-full w-full border-0 bg-transparent"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
          referrerPolicy="no-referrer"
          onLoad={() => setLoading(false)}
        />
      </div>

      {/* Bottom chrome — fixed over content */}
      <footer
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[155] flex justify-center px-5"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="pointer-events-auto flex w-fit items-center gap-4 rounded-2xl border border-neutral-200/70 bg-white/45 px-2.5 py-1.5 shadow-sm backdrop-blur-2xl">
          <button
            type="button"
            onClick={goBack}
            disabled={!canGoBack}
            className={iconBtn}
            aria-label={t('inAppBrowser.back')}
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
          <button
            type="button"
            onClick={goForward}
            disabled={!canGoForward}
            className={iconBtn}
            aria-label={t('inAppBrowser.forward')}
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
          <button type="button" onClick={goHomeTab} className={iconBtn} aria-label={t('inAppBrowser.home')}>
            <Home className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
          <button
            type="button"
            onClick={openHistory}
            className={iconBtn}
            aria-label={t('inAppBrowser.history')}
          >
            <Clock className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
          <button type="button" onClick={reload} className={iconBtn} aria-label={t('inAppBrowser.reload')}>
            <RotateCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={2} aria-hidden />
          </button>
        </div>
      </footer>

      {/* Full-height recent history modal */}
      {historyOpen ? (
        <div
          className="absolute inset-0 z-[160] flex flex-col bg-white"
          role="dialog"
          aria-modal="true"
          aria-label={t('inAppBrowser.historyTitle')}
        >
          <header
            className="flex shrink-0 items-center gap-2 border-b border-neutral-200 px-3 pb-3"
            style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}
          >
            <button
              type="button"
              onClick={() => setHistoryOpen(false)}
              className={iconBtn}
              aria-label={t('common.close')}
            >
              <X className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-bold text-neutral-900">
                {t('inAppBrowser.historyTitle')}
              </h2>
              <p className="truncate text-xs text-neutral-500">
                {t('inAppBrowser.historySubtitle', { count: recent.length })}
              </p>
            </div>
            {recent.length > 0 ? (
              <button
                type="button"
                onClick={clearRecent}
                className="rounded-full border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-700 active:bg-neutral-100"
              >
                {t('inAppBrowser.historyClear')}
              </button>
            ) : null}
          </header>

          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
          >
            {recent.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50">
                  <Clock className="h-6 w-6 text-neutral-400" aria-hidden />
                </div>
                <p className="text-sm font-medium text-neutral-900">{t('inAppBrowser.historyEmpty')}</p>
                <p className="max-w-xs text-xs leading-relaxed text-neutral-500">
                  {t('inAppBrowser.historyEmptyHint')}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {recent.map((item) => (
                  <li key={`${item.url}-${item.visitedAt}`} className="flex items-stretch">
                    <button
                      type="button"
                      onClick={() => openFromRecent(item)}
                      className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5 text-left active:bg-neutral-50"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700">
                        <Globe className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-neutral-900">
                          {item.host}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-neutral-500">{item.url}</span>
                        <span className="mt-1 block text-[11px] text-neutral-400">
                          {formatVisitedAt(item.visitedAt, locale === 'ru' ? 'ru-RU' : 'en-US')}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecent(removeBrowseRecent(item.url))}
                      className="flex w-24 shrink-0 items-center justify-center text-neutral-400 active:bg-neutral-50 active:text-red-500"
                      aria-label={t('common.delete')}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default InAppBrowser;
