import React, { useCallback, useEffect, useState } from 'react';
import { Database, HardDrive, RefreshCw } from 'lucide-react';
import { ADMIN_API } from '../../config/api';
import { adminAuthHeaders, useAdminAuth } from '../../context/AdminAuthContext';
import { formatDateTimeRu, formatRelativeTimeRu } from '../../utils/adminFormat';

interface CollectionRow {
  name: string;
  count: number;
}

interface LogEvent {
  id: string;
  type: string;
  action: string;
  title: string;
  subtitle: string;
  at: string;
}

interface AdminLogsResponse {
  database: { name: string; host: string; port: number | null; readyState: number };
  memory: { rssMb: number; heapUsedMb: number; heapTotalMb: number };
  collections: CollectionRow[];
  events: LogEvent[];
}

const eventTypeLabel: Record<string, string> = {
  user: 'Пользователь',
  post: 'Пост',
  community: 'Сообщество',
  message: 'Сообщение',
};

const eventTypeColor: Record<string, string> = {
  user: 'bg-violet-500/20 text-violet-300',
  post: 'bg-emerald-500/20 text-emerald-300',
  community: 'bg-fuchsia-500/20 text-fuchsia-300',
  message: 'bg-amber-500/20 text-amber-300',
};

const mongoStateLabel: Record<number, string> = {
  0: 'Отключено',
  1: 'Подключено',
  2: 'Подключение…',
  3: 'Отключение…',
};

const AdminLogs: React.FC = () => {
  const { token } = useAdminAuth();
  const [data, setData] = useState<AdminLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${ADMIN_API}/logs?limit=80`, { headers: adminAuthHeaders(token) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((body as { message?: string }).message || 'Не удалось загрузить логи');
        setData(null);
        return;
      }
      setData(body as AdminLogsResponse);
    } catch {
      setError('Не удалось загрузить логи');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 60000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Логи базы данных</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Состояние MongoDB, размер коллекций и последние записи
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-neutral-300 hover:bg-white/5"
        >
          <RefreshCw size={16} />
          Обновить
        </button>
      </div>

      {loading && !data ? (
        <div className="mt-12 flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-600 border-t-violet-400" />
        </div>
      ) : error ? (
        <p className="mt-8 text-red-400">{error}</p>
      ) : data ? (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[#141820] p-5">
              <div className="flex items-center gap-2 text-sky-400">
                <Database size={20} />
                <span className="text-sm font-semibold text-white">База данных</span>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500">Имя</dt>
                  <dd className="text-neutral-200">{data.database.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500">Хост</dt>
                  <dd className="text-neutral-200">
                    {data.database.host}
                    {data.database.port ? `:${data.database.port}` : ''}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500">Статус</dt>
                  <dd className="text-emerald-300">
                    {mongoStateLabel[data.database.readyState] ?? '—'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#141820] p-5">
              <div className="flex items-center gap-2 text-violet-400">
                <HardDrive size={20} />
                <span className="text-sm font-semibold text-white">Память процесса</span>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500">RSS</dt>
                  <dd className="text-neutral-200">{data.memory.rssMb} MB</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500">Heap used</dt>
                  <dd className="text-neutral-200">{data.memory.heapUsedMb} MB</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500">Heap total</dt>
                  <dd className="text-neutral-200">{data.memory.heapTotalMb} MB</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-[#141820] p-5">
            <h2 className="text-sm font-semibold text-white">Коллекции</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.collections.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-[#0b0d12]/50 px-4 py-3"
                >
                  <span className="font-mono text-xs text-neutral-400">{c.name}</span>
                  <span className="text-lg font-bold text-white">{c.count.toLocaleString('ru-RU')}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#141820]">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="font-semibold text-white">Журнал событий</h2>
              <p className="text-xs text-neutral-500">Последние изменения в основных коллекциях</p>
            </div>
            <ul className="max-h-[600px] divide-y divide-white/5 overflow-y-auto">
              {data.events.length === 0 ? (
                <li className="py-12 text-center text-sm text-neutral-500">Событий нет</li>
              ) : (
                data.events.map((ev) => (
                  <li key={ev.id} className="flex flex-wrap items-start gap-3 px-5 py-4 text-sm">
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${
                        eventTypeColor[ev.type] || 'bg-white/5 text-neutral-400'
                      }`}
                    >
                      {eventTypeLabel[ev.type] || ev.type}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-neutral-200">{ev.title}</p>
                      <p className="text-xs text-neutral-500">{ev.subtitle}</p>
                    </div>
                    <div className="shrink-0 text-right text-xs text-neutral-500">
                      <p title={formatDateTimeRu(ev.at)}>{formatRelativeTimeRu(ev.at)}</p>
                      <p className="mt-0.5 text-neutral-600">{ev.action}</p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default AdminLogs;
