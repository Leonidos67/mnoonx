import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  PenLine,
  RefreshCw,
  Trash2,
  Plus,
  TrendingUp,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../i18n/useTranslation';
import { AI_API, PORTFOLIO_API } from '../config/api';
import { formatUsd, formatPct, pctClass } from '../components/AI/marketFormat';
import { marketCoinPath } from '../constants/marketRoutes';
import type { PortfolioOverview } from '../types/portfolio';
import type { SearchCoinResult } from '../types/ai';
import { useIsConnectionRestored, useTonAddress, useTonConnectModal, useTonWallet } from '@tonconnect/ui-react';
import { isTonFriendlyAddress, shortTonAddress, TON_CONNECT_SITE_URL, tonConnectManifestUrl } from '../utils/tonConnect';

const PortfolioTrackerContent: React.FC = () => {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [overview, setOverview] = useState<PortfolioOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingWalletId, setSyncingWalletId] = useState<string | null>(null);

  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletBusy, setWalletBusy] = useState(false);
  const tonWallet = useTonWallet();
  const tonAddress = useTonAddress();
  const connectionRestored = useIsConnectionRestored();
  const tonConnectModal = useTonConnectModal();

  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualQuery, setManualQuery] = useState('');
  const [manualResults, setManualResults] = useState<SearchCoinResult[]>([]);
  const [manualSelected, setManualSelected] = useState<SearchCoinResult | null>(null);
  const [manualAmount, setManualAmount] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualBusy, setManualBusy] = useState(false);

  const linkedTonAddresses = useRef<Set<string>>(new Set());
  const isLocalDev =
    typeof window !== 'undefined' &&
    /^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(window.location.hostname);

  const authHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const loadOverview = useCallback(async () => {
    if (!token) {
      setOverview(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${PORTFOLIO_API}/overview`, { headers: authHeaders() });
      if (!res.ok) throw new Error('load failed');
      const data = (await res.json()) as PortfolioOverview;
      setOverview(data);
      linkedTonAddresses.current = new Set(
        (data.wallets ?? []).map((w) => w.address.toLowerCase())
      );
    } catch {
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    void fetch(tonConnectManifestUrl())
      .then(async (res) => {
        if (!res.ok) throw new Error('manifest fetch failed');
        const data = (await res.json()) as { url?: string; name?: string; iconUrl?: string };
        const pageOrigin = window.location.origin;
        const manifestOrigin = data.url ? new URL(data.url).origin : '';
        const allowedOrigins = new Set([pageOrigin, TON_CONNECT_SITE_URL]);
        if (manifestOrigin && !allowedOrigins.has(manifestOrigin)) {
          console.warn('[TON Connect] manifest url mismatch:', data.url, pageOrigin);
        }
        if (data.name !== 'MNOONX') {
          console.warn('[TON Connect] unexpected manifest name:', data.name);
        }
      })
      .catch(() => {
        showToast(t('portfolioTracker.manifestError'), 'error');
      });
  }, [showToast, t]);

  const registerWallet = useCallback(
    async (address: string) => {
      if (!token) return false;
      const normalized = address.trim();
      if (!isTonFriendlyAddress(normalized)) return false;
      if (linkedTonAddresses.current.has(normalized.toLowerCase())) return true;

      setWalletBusy(true);
      try {
        const res = await fetch(`${PORTFOLIO_API}/wallets`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ address: normalized }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showToast((data as { message?: string }).message || t('portfolioTracker.walletFailed'), 'error');
          return false;
        }
        setOverview((data as { overview: PortfolioOverview }).overview);
        linkedTonAddresses.current.add(normalized.toLowerCase());
        showToast(t('portfolioTracker.walletConnected'), 'success');
        return true;
      } finally {
        setWalletBusy(false);
      }
    },
    [token, authHeaders, showToast, t]
  );

  useEffect(() => {
    if (!token || !connectionRestored) return;
    const addr = tonWallet?.account?.address;
    if (!addr) return;
    void registerWallet(addr).then((ok) => {
      if (ok) setWalletModalOpen(false);
    });
  }, [token, connectionRestored, tonWallet?.account?.address, registerWallet]);

  useEffect(() => {
    if (!manualModalOpen) return undefined;
    const q = manualQuery.trim();
    if (q.length < 2) {
      setManualResults([]);
      return undefined;
    }
    const timer = window.setTimeout(() => {
      void fetch(`${AI_API}/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => setManualResults(Array.isArray(d.coins) ? d.coins : []))
        .catch(() => setManualResults([]));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [manualModalOpen, manualQuery]);

  const openTonConnect = () => {
    if (!connectionRestored) {
      showToast(t('portfolioTracker.tonConnectRestoring'), 'info');
      return;
    }
    setWalletModalOpen(false);
    try {
      tonConnectModal.open();
    } catch {
      showToast(t('portfolioTracker.tonConnectFailed'), 'error');
    }
  };

  const connectWalletManual = async () => {
    if (!walletAddress.trim()) return;
    const ok = await registerWallet(walletAddress.trim());
    if (ok) {
      setWalletModalOpen(false);
      setWalletAddress('');
    }
  };

  const syncWallet = async (walletId: string) => {
    if (!token) return;
    setSyncingWalletId(walletId);
    try {
      const res = await fetch(`${PORTFOLIO_API}/wallets/${walletId}/sync`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('sync failed');
      setOverview((await res.json()) as PortfolioOverview);
      showToast(t('portfolioTracker.walletSynced'), 'success');
    } catch {
      showToast(t('portfolioTracker.walletSyncFailed'), 'error');
    } finally {
      setSyncingWalletId(null);
    }
  };

  const removeWallet = async (walletId: string) => {
    if (!token) return;
    const res = await fetch(`${PORTFOLIO_API}/wallets/${walletId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (res.ok) void loadOverview();
  };

  const addManualTx = async () => {
    if (!token || !manualSelected) return;
    const amount = Number(manualAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setManualBusy(true);
    try {
      const res = await fetch(`${PORTFOLIO_API}/holdings`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          coinId: manualSelected.id,
          symbol: manualSelected.symbol,
          name: manualSelected.name,
          amount,
          avgBuyPriceUsd: manualPrice.trim() ? Number(manualPrice) : null,
          txType: 'buy',
        }),
      });
      if (!res.ok) throw new Error('create failed');
      setManualModalOpen(false);
      setManualQuery('');
      setManualSelected(null);
      setManualAmount('');
      setManualPrice('');
      void loadOverview();
      showToast(t('portfolioTracker.txAdded'), 'success');
    } catch {
      showToast(t('portfolioTracker.txFailed'), 'error');
    } finally {
      setManualBusy(false);
    }
  };

  const deleteHolding = async (id: string) => {
    if (!token) return;
    await fetch(`${PORTFOLIO_API}/holdings/${id}`, { method: 'DELETE', headers: authHeaders() });
    void loadOverview();
  };

  const hasData =
    (overview?.summary.holdingsCount ?? 0) > 0 || (overview?.wallets.length ?? 0) > 0;

  const shortAddress = (addr: string) =>
    addr.length > 14 ? `${addr.slice(0, 6)}…${addr.slice(-6)}` : addr;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
          {t('portfolioTracker.title')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-600 sm:text-base">
          {t('portfolioTracker.subtitle')}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-neutral-200 border-t-[#315efb]" />
        </div>
      ) : !hasData ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-10">
          <div className="mx-auto max-w-xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef2ff]">
              <TrendingUp className="h-8 w-8 text-[#315efb]" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-neutral-900">
              {t('portfolioTracker.emptyTitle')}
            </h2>
            <p className="mt-2 text-sm text-neutral-600">{t('portfolioTracker.emptySubtitle')}</p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={openTonConnect}
              className="group flex flex-col rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5 text-left transition hover:border-[#315efb]/40 hover:bg-[#f8faff]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white">
                <Wallet className="h-5 w-5" />
              </span>
              <span className="mt-4 text-base font-semibold text-neutral-900">
                {t('portfolioTracker.connectWallet')}
              </span>
              <span className="mt-1 text-sm text-neutral-600">{t('portfolioTracker.connectWalletHint')}</span>
              <span className="mt-3 text-xs font-medium text-[#315efb]">{t('portfolioTracker.supportedNetworks')}</span>
            </button>

            <button
              type="button"
              onClick={() => setManualModalOpen(true)}
              className="group flex flex-col rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5 text-left transition hover:border-[#315efb]/40 hover:bg-[#f8faff]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                <PenLine className="h-5 w-5" />
              </span>
              <span className="mt-4 text-base font-semibold text-neutral-900">
                {t('portfolioTracker.manualTx')}
              </span>
              <span className="mt-1 text-sm text-neutral-600">{t('portfolioTracker.manualTxHint')}</span>
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setWalletModalOpen(true)}
              className="text-sm font-medium text-[#315efb] hover:underline"
            >
              {t('portfolioTracker.orManual')}
            </button>
          </div>

          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-neutral-500">
            <Shield className="h-3.5 w-3.5" />
            {t('portfolioTracker.securityNote')}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                {t('portfolioTracker.totalValue')}
              </p>
              <p className="mt-2 text-2xl font-bold text-neutral-900">
                {formatUsd(overview?.summary.totalValueUsd, true)}
              </p>
              {overview?.summary.change24h != null ? (
                <p className={`mt-1 text-sm font-medium ${pctClass(overview.summary.change24h)}`}>
                  {formatPct(overview.summary.change24h)} {t('portfolioTracker.change24h')}
                </p>
              ) : null}
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                {t('portfolioTracker.totalProfit')}
              </p>
              <p
                className={`mt-2 text-2xl font-bold ${pctClass(overview?.summary.totalProfitUsd ?? null)}`}
              >
                {overview?.summary.totalProfitUsd != null
                  ? formatUsd(overview.summary.totalProfitUsd, true)
                  : '—'}
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                {t('portfolioTracker.holdings')}
              </p>
              <p className="mt-2 text-2xl font-bold text-neutral-900">
                {overview?.summary.holdingsCount ?? 0}
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                {overview?.summary.walletsCount ?? 0} {t('portfolioTracker.wallets')}
              </p>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openTonConnect}
              className="inline-flex items-center gap-2 rounded-xl bg-[#315efb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2547c4]"
            >
              <Wallet className="h-4 w-4" />
              {t('portfolioTracker.connectWallet')}
            </button>
            <button
              type="button"
              onClick={() => setManualModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
            >
              <Plus className="h-4 w-4" />
              {t('portfolioTracker.addTx')}
            </button>
            <button
              type="button"
              onClick={() => setWalletModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
            >
              {t('portfolioTracker.orManual')}
            </button>
          </div>

          {overview?.wallets.length ? (
            <section className="mb-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-neutral-900">{t('portfolioTracker.connectedWallets')}</h2>
              <ul className="mt-3 space-y-2">
                {overview.wallets.map((w) => (
                  <li
                    key={w._id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-neutral-50 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-sm text-neutral-800">{shortAddress(w.address)}</p>
                      <p className="text-xs text-neutral-500">
                        TON
                        {w.lastSyncedAt
                          ? ` · ${t('portfolioTracker.synced')} ${new Date(w.lastSyncedAt).toLocaleString()}`
                          : ''}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => void syncWallet(w._id)}
                        disabled={syncingWalletId === w._id}
                        className="rounded-lg p-2 text-neutral-600 hover:bg-white"
                        title={t('portfolioTracker.resync')}
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${syncingWalletId === w._id ? 'animate-spin' : ''}`}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeWallet(w._id)}
                        className="rounded-lg p-2 text-red-600 hover:bg-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-neutral-900">{t('portfolioTracker.assets')}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/80 text-left text-xs text-neutral-500">
                    <th className="px-4 py-3 font-medium">{t('portfolioTracker.asset')}</th>
                    <th className="px-4 py-3 font-medium">{t('portfolioTracker.amount')}</th>
                    <th className="px-4 py-3 font-medium">{t('portfolioTracker.price')}</th>
                    <th className="px-4 py-3 font-medium">{t('portfolioTracker.value')}</th>
                    <th className="px-4 py-3 font-medium">24h</th>
                    <th className="px-4 py-3 font-medium">{t('portfolioTracker.source')}</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {(overview?.holdings ?? []).map((h) => (
                    <tr key={h._id} className="border-b border-neutral-50 hover:bg-neutral-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {h.imageUrl ? (
                            <img src={h.imageUrl} alt="" className="h-6 w-6 rounded-full" />
                          ) : null}
                          <div>
                            {h.coinId.startsWith('ton-jetton-') ? (
                              <span className="font-medium text-neutral-900">{h.name}</span>
                            ) : (
                              <Link
                                to={marketCoinPath(h.coinId)}
                                className="font-medium text-[#315efb] hover:underline"
                              >
                                {h.name}
                              </Link>
                            )}
                            <span className="ml-1 text-xs text-neutral-500">{h.symbol.toUpperCase()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{h.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 tabular-nums">{formatUsd(h.priceUsd)}</td>
                      <td className="px-4 py-3 font-medium tabular-nums">{formatUsd(h.valueUsd)}</td>
                      <td className={`px-4 py-3 tabular-nums ${pctClass(h.change24h)}`}>
                        {formatPct(h.change24h)}
                      </td>
                      <td className="px-4 py-3 capitalize text-neutral-500">{h.source}</td>
                      <td className="px-4 py-3 text-right">
                        {h.source === 'manual' ? (
                          <button
                            type="button"
                            onClick={() => void deleteHolding(h._id)}
                            className="text-neutral-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {walletModalOpen ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => !walletBusy && setWalletModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-neutral-900">{t('portfolioTracker.connectWallet')}</h3>
            <p className="mt-1 text-sm text-neutral-600">{t('portfolioTracker.connectWalletHint')}</p>

            <button
              type="button"
              onClick={openTonConnect}
              disabled={!connectionRestored || walletBusy}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0098ea] px-4 py-3 text-sm font-semibold text-white hover:bg-[#007bc2] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Wallet className="h-4 w-4" />
              {connectionRestored ? t('portfolioTracker.tonConnect') : t('portfolioTracker.tonConnectRestoring')}
            </button>
            {tonAddress && connectionRestored ? (
              <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-center text-xs font-medium text-emerald-800">
                {t('portfolioTracker.tonConnectedAs', { address: shortTonAddress(tonAddress) })}
              </p>
            ) : null}
            <p className="mt-2 text-center text-xs text-neutral-500">{t('portfolioTracker.tonConnectHint')}</p>
            {isLocalDev ? (
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-800">
                {t('portfolioTracker.tonConnectLocalHint')}
              </p>
            ) : null}

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-neutral-200" />
              <span className="text-xs text-neutral-400">{t('portfolioTracker.orManual')}</span>
              <div className="h-px flex-1 bg-neutral-200" />
            </div>

            <label className="block text-sm font-medium text-neutral-800">
              {t('portfolioTracker.walletAddress')}
              <input
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="UQ… / EQ…"
                className="mt-1.5 w-full rounded-lg border border-neutral-200 px-3 py-2 font-mono text-sm"
              />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={walletBusy}
                onClick={() => setWalletModalOpen(false)}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm"
              >
                {t('portfolioTracker.cancel')}
              </button>
              <button
                type="button"
                disabled={walletBusy || !walletAddress.trim()}
                onClick={() => void connectWalletManual()}
                className="rounded-lg bg-[#315efb] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {walletBusy ? t('portfolioTracker.syncing') : t('portfolioTracker.connect')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {manualModalOpen ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => !manualBusy && setManualModalOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-neutral-900">{t('portfolioTracker.manualTx')}</h3>
            <label className="mt-4 block text-sm font-medium text-neutral-800">
              {t('portfolioTracker.searchCoin')}
              <input
                value={manualQuery}
                onChange={(e) => {
                  setManualQuery(e.target.value);
                  setManualSelected(null);
                }}
                className="mt-1.5 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </label>
            {manualResults.length > 0 && !manualSelected ? (
              <ul className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-neutral-100">
                {manualResults.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setManualSelected(c);
                        setManualQuery(c.name);
                        setManualResults([]);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-50"
                    >
                      {c.thumb ? <img src={c.thumb} alt="" className="h-6 w-6 rounded-full" /> : null}
                      <span>
                        {c.name} ({c.symbol.toUpperCase()})
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {manualSelected ? (
              <>
                <label className="mt-4 block text-sm font-medium text-neutral-800">
                  {t('portfolioTracker.amount')}
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="mt-3 block text-sm font-medium text-neutral-800">
                  {t('portfolioTracker.buyPrice')} ({t('portfolioTracker.optional')})
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                  />
                </label>
              </>
            ) : null}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={manualBusy}
                onClick={() => setManualModalOpen(false)}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm"
              >
                {t('portfolioTracker.cancel')}
              </button>
              <button
                type="button"
                disabled={manualBusy || !manualSelected || !manualAmount}
                onClick={() => void addManualTx()}
                className="rounded-lg bg-[#315efb] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {t('portfolioTracker.addTx')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PortfolioTrackerContent;
