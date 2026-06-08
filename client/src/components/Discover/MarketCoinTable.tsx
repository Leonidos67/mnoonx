import React from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import MiniSparkline from './MiniSparkline';
import { formatPct, formatSupply, formatUsd, pctClass } from '../AI/marketFormat';
import type { CoinMarketRow } from '../../types/ai';
import { useTranslation } from '../../i18n/useTranslation';

export type MarketSortKey =
  | 'rank'
  | 'price'
  | 'change1h'
  | 'change24h'
  | 'change7d'
  | 'change30d'
  | 'marketCap'
  | 'volume'
  | 'supply';

interface MarketCoinTableProps {
  rows: CoinMarketRow[];
  sortKey: MarketSortKey;
  sortDir: 'asc' | 'desc';
  onToggleSort: (key: MarketSortKey) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSelectCoin: (id: string, symbol: string, name: string) => void;
}

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <ChevronDown className="ml-0.5 inline h-3 w-3 opacity-30" />;
  return dir === 'asc' ? (
    <ChevronUp className="ml-0.5 inline h-3 w-3 text-blue-600" />
  ) : (
    <ChevronDown className="ml-0.5 inline h-3 w-3 text-blue-600" />
  );
}

const thBtn =
  'inline-flex items-center font-semibold text-slate-500 transition-colors hover:text-slate-800';

const MarketCoinTable: React.FC<MarketCoinTableProps> = ({
  rows,
  sortKey,
  sortDir,
  onToggleSort,
  page,
  pageSize,
  onPageChange,
  onSelectCoin,
}) => {
  const { t } = useTranslation();

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const slice = rows.slice(page * pageSize, page * pageSize + pageSize);

  const sortHeader = (key: MarketSortKey, label: string, align: 'left' | 'right' = 'right') => (
    <th className={`px-3 py-2.5 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button type="button" onClick={() => onToggleSort(key)} className={thBtn}>
        {label}
        <SortIcon active={sortKey === key} dir={sortDir} />
      </button>
    </th>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-base font-bold text-slate-900">
          {t('discover.marketTab.cryptocurrencies')}
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm">
            <tr className="border-b border-slate-200 text-xs">
              <th className="w-10 px-3 py-2.5 text-left">
                <button type="button" onClick={() => onToggleSort('rank')} className={thBtn}>
                  #
                  <SortIcon active={sortKey === 'rank'} dir={sortDir} />
                </button>
              </th>
              <th className="min-w-[180px] px-3 py-2.5 text-left font-semibold text-slate-500">
                {t('discover.marketTab.colName')}
              </th>
              {sortHeader('price', t('discover.marketTab.colPrice'))}
              {sortHeader('change1h', t('discover.marketTab.colChange1h'))}
              {sortHeader('change24h', t('discover.marketTab.colChange24h'))}
              {sortHeader('change7d', t('discover.marketTab.colChange7d'))}
              {sortHeader('change30d', t('discover.marketTab.colChange30d'))}
              {sortHeader('marketCap', t('discover.marketTab.colMarketCap'))}
              {sortHeader('volume', t('discover.marketTab.colVolume'))}
              {sortHeader('supply', t('discover.marketTab.colSupply'))}
              <th className="px-3 py-2.5 text-center font-semibold text-slate-500">
                {t('discover.marketTab.colChart7d')}
              </th>
            </tr>
          </thead>
          <tbody>
            {slice.map((coin) => {
              const sparkPositive =
                (coin.sparkline_7d?.length ?? 0) >= 2
                  ? (coin.sparkline_7d![coin.sparkline_7d!.length - 1] ?? 0) >=
                    (coin.sparkline_7d![0] ?? 0)
                  : (coin.price_change_percentage_7d ?? 0) >= 0;

              return (
                <tr
                  key={coin.id}
                  className="cursor-pointer border-b border-slate-50 transition-colors hover:bg-blue-50/40"
                  onClick={() => onSelectCoin(coin.id, coin.symbol, coin.name)}
                >
                  <td className="px-3 py-2.5 text-xs font-medium text-slate-500">
                    {coin.market_cap_rank ?? '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={coin.image}
                        alt=""
                        className="h-7 w-7 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{coin.name}</p>
                        <p className="text-[11px] font-bold uppercase text-slate-400">
                          {coin.symbol}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                    {formatUsd(coin.current_price)}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right text-xs font-semibold tabular-nums ${pctClass(coin.price_change_percentage_1h)}`}
                  >
                    {formatPct(coin.price_change_percentage_1h)}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right text-xs font-semibold tabular-nums ${pctClass(coin.price_change_percentage_24h)}`}
                  >
                    {formatPct(coin.price_change_percentage_24h)}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right text-xs font-semibold tabular-nums ${pctClass(coin.price_change_percentage_7d)}`}
                  >
                    {formatPct(coin.price_change_percentage_7d)}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right text-xs font-semibold tabular-nums ${pctClass(coin.price_change_percentage_30d)}`}
                  >
                    {formatPct(coin.price_change_percentage_30d)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs tabular-nums text-slate-700">
                    {formatUsd(coin.market_cap, true)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs tabular-nums text-slate-700">
                    {formatUsd(coin.total_volume, true)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs tabular-nums text-slate-600">
                    {formatSupply(coin.circulating_supply, coin.symbol)}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex justify-center">
                      {(coin.sparkline_7d?.length ?? 0) >= 2 ? (
                        <MiniSparkline
                          points={coin.sparkline_7d!}
                          positive={sparkPositive}
                          width={120}
                          height={36}
                        />
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('discover.marketTab.prevPage')}
        </button>
        <span className="text-xs font-medium text-slate-500">
          {page + 1} / {pageCount}
        </span>
        <button
          type="button"
          disabled={page >= pageCount - 1}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
        >
          {t('discover.marketTab.nextPage')}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default MarketCoinTable;
