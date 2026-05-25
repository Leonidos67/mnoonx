import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Database,
  FileText,
  MessageCircle,
  Server,
  UserPlus,
  Users,
  UsersRound,
  AlertCircle,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ADMIN_API } from '../../config/api';
import { adminAuthHeaders, useAdminAuth } from '../../context/AdminAuthContext';
import { useAdminAnalytics } from '../../hooks/useAdminAnalytics';
import AdminChartCard from '../../components/Admin/AdminChartCard';
import { formatChartDateRu, formatDateTimeRu, formatRelativeTimeRu } from '../../utils/adminFormat';

interface AdminStats {
  server: {
    status: string;
    statusLabel: string;
    uptimeSec: number;
    nodeVersion: string;
    mongo: { code: string; label: string };
  };
  usersCount: number;
  communitiesCount: number;
  supportThreads: number;
  supportTicketsOpen?: number;
  postsCount: number;
  messagesCount: number;
  notificationsCount: number;
  newUsers7d: number;
  newPosts7d: number;
  activeUsers7d: number;
  needsReplyCount: number;
}

interface LogEvent {
  id: string;
  type: string;
  action: string;
  title: string;
  subtitle: string;
  at: string;
}

const chartTooltipStyle = {
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.1)',
  background: '#1a1f2a',
  color: '#e5e5e5',
  fontSize: 12,
};

const eventTypeLabel: Record<string, string> = {
  user: 'Регистрация',
  post: 'Пост',
  community: 'Сообщество',
  message: 'Сообщение',
};

function formatUptime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h} ч ${m} мин`;
  if (m > 0) return `${m} мин ${s} с`;
  return `${s} с`;
}

const AdminDashboard: React.FC = () => {
  const { token } = useAdminAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<LogEvent[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: analytics, loading: analyticsLoading, error: analyticsError } =
    useAdminAnalytics(token);

  const load = useCallback(async () => {
    if (!token) return;
    setStatsLoading(true);
    setError(null);
    try {
      const [statsRes, logsRes] = await Promise.all([
        fetch(`${ADMIN_API}/stats`, { headers: adminAuthHeaders(token) }),
        fetch(`${ADMIN_API}/logs?limit=12`, { headers: adminAuthHeaders(token) }),
      ]);
      if (!statsRes.ok) throw new Error('Не удалось загрузить статистику');
      setStats(await statsRes.json());
      if (logsRes.ok) {
        const logsBody = await logsRes.json();
        setRecentEvents(Array.isArray(logsBody.events) ? logsBody.events : []);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setStatsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 30000);
    return () => clearInterval(id);
  }, [load]);

  const userChartData = useMemo(
    () =>
      (analytics?.userRegistrations ?? []).map((row) => ({
        ...row,
        label: formatChartDateRu(row.date),
      })),
    [analytics?.userRegistrations]
  );

  const cumulativeChartData = useMemo(
    () =>
      (analytics?.userRegistrationsCumulative ?? []).map((row) => ({
        ...row,
        label: formatChartDateRu(row.date),
      })),
    [analytics?.userRegistrationsCumulative]
  );

  const postsChartData = useMemo(
    () =>
      (analytics?.postsActivity ?? []).map((row) => ({
        ...row,
        label: formatChartDateRu(row.date),
      })),
    [analytics?.postsActivity]
  );

  const communitiesChartData = useMemo(
    () =>
      (analytics?.communitiesCreated ?? []).map((row) => ({
        ...row,
        label: formatChartDateRu(row.date),
      })),
    [analytics?.communitiesCreated]
  );

  const messagesChartData = useMemo(
    () =>
      (analytics?.messagesActivity ?? []).map((row) => ({
        ...row,
        label: formatChartDateRu(row.date),
      })),
    [analytics?.messagesActivity]
  );

  const summary = analytics?.summary;

  if (statsLoading && !stats) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-600 border-t-violet-400" />
      </div>
    );
  }

  if (error && !stats) {
    return <p className="text-red-400">{error}</p>;
  }

  if (!stats) return null;

  const mongoOk = stats.server.mongo.code === 'online';

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold text-white">Обзор системы</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Метрики платформы, графики за 30 дней и последние события в базе
      </p>

      {(stats.needsReplyCount ?? 0) > 0 ? (
        <Link
          to="/admin/support"
          className="mt-6 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 hover:bg-amber-500/15"
        >
          <AlertCircle size={18} />
          <span>
            Ожидают ответа в поддержке:{' '}
            <strong className="text-white">{stats.needsReplyCount}</strong>
          </span>
        </Link>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Server} label="Сервер" value={stats.server.statusLabel} hint={`Аптайм ${formatUptime(stats.server.uptimeSec)}`} />
        <MetricCard
          icon={Database}
          label="MongoDB"
          value={stats.server.mongo.label}
          valueClass={mongoOk ? 'text-emerald-300' : 'text-amber-300'}
        />
        <MetricCard icon={Users} label="Пользователи" value={String(stats.usersCount)} hint={`+${stats.newUsers7d} за 7 дн.`} />
        <MetricCard icon={UsersRound} label="Сообщества" value={String(stats.communitiesCount)} />
        <MetricCard icon={FileText} label="Посты" value={String(stats.postsCount)} hint={`+${stats.newPosts7d} за 7 дн.`} />
        <MetricCard icon={MessageCircle} label="Сообщения" value={String(stats.messagesCount)} />
        <MetricCard
          icon={Activity}
          label="Тикеты"
          value={String(stats.supportTicketsOpen ?? stats.supportThreads)}
          hint={`Ждут ответа: ${stats.needsReplyCount}`}
        />
        <MetricCard icon={TrendingUp} label="Активные (7 дн.)" value={String(stats.activeUsers7d)} hint="по lastSeen" />
      </div>

      {analyticsError ? (
        <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {analyticsError}
        </p>
      ) : null}

      {analyticsLoading ? (
        <div className="mt-10 flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-600 border-t-violet-400" />
        </div>
      ) : (
        <>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MiniMetric label="Новые пользователи (7 дн.)" value={summary?.newUsers7d ?? 0} icon={UserPlus} />
            <MiniMetric label="Новые посты (7 дн.)" value={summary?.newPosts7d ?? 0} icon={FileText} />
            <MiniMetric label="Новые сообщества (7 дн.)" value={summary?.newCommunities7d ?? 0} icon={UsersRound} />
            <MiniMetric label="Bulk-аккаунты" value={summary?.bulkUsersCount ?? 0} icon={Users} />
            <MiniMetric label="Ожидают ответа" value={summary?.needsReplyCount ?? 0} icon={AlertCircle} />
            <MiniMetric label="Уведомления в БД" value={stats.notificationsCount} icon={Activity} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <AdminChartCard title="Регистрации" subtitle="Новые пользователи по дням">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={userChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#737373' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#737373' }} allowDecimals={false} width={32} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Пользователи" />
                </BarChart>
              </ResponsiveContainer>
            </AdminChartCard>

            <AdminChartCard title="Накопительно" subtitle="Всего пользователей на конец дня">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={cumulativeChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#737373' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#737373' }} allowDecimals={false} width={40} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Area type="monotone" dataKey="total" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.2} name="Всего" />
                </AreaChart>
              </ResponsiveContainer>
            </AdminChartCard>

            <AdminChartCard title="Посты" subtitle="Активность ленты">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={postsChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#737373' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#737373' }} allowDecimals={false} width={32} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="count" fill="#34d399" radius={[4, 4, 0, 0]} name="Посты" />
                </BarChart>
              </ResponsiveContainer>
            </AdminChartCard>

            <AdminChartCard title="Сообщества" subtitle="Новые за период">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={communitiesChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#737373' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#737373' }} allowDecimals={false} width={32} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="count" fill="#f472b6" radius={[4, 4, 0, 0]} name="Сообщества" />
                </BarChart>
              </ResponsiveContainer>
            </AdminChartCard>

            <div className="lg:col-span-2">
            <AdminChartCard title="Сообщения" subtitle="DM и системные">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={messagesChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#737373' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#737373' }} allowDecimals={false} width={32} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Area type="monotone" dataKey="count" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.15} name="Сообщения" />
                </AreaChart>
              </ResponsiveContainer>
            </AdminChartCard>
            </div>
          </div>
        </>
      )}

      <div className="mt-10 rounded-2xl border border-white/10 bg-[#141820] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-white">Последние события в БД</h2>
            <p className="mt-0.5 text-xs text-neutral-500">Регистрации, посты, сообщества, сообщения</p>
          </div>
          <Link to="/admin/logs" className="text-sm text-violet-400 hover:text-violet-300">
            Все логи →
          </Link>
        </div>
        <ul className="mt-4 divide-y divide-white/5">
          {recentEvents.length === 0 ? (
            <li className="py-6 text-center text-sm text-neutral-500">Нет событий</li>
          ) : (
            recentEvents.map((ev) => (
              <li key={ev.id} className="flex flex-wrap items-start justify-between gap-2 py-3 text-sm">
                <div className="min-w-0">
                  <span className="mr-2 rounded-md bg-white/5 px-2 py-0.5 text-xs text-violet-300">
                    {eventTypeLabel[ev.type] || ev.type}
                  </span>
                  <span className="font-medium text-neutral-200">{ev.title}</span>
                  <p className="mt-0.5 truncate text-xs text-neutral-500">{ev.subtitle}</p>
                </div>
                <span className="shrink-0 text-xs text-neutral-500" title={formatDateTimeRu(ev.at)}>
                  {formatRelativeTimeRu(ev.at)}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="mt-6 flex flex-wrap gap-4">
        <Link
          to="/admin/users"
          className="rounded-xl border border-violet-500/40 bg-violet-600/20 px-4 py-2 text-sm font-medium text-violet-200 hover:bg-violet-600/30"
        >
          Все пользователи
        </Link>
        <button
          type="button"
          onClick={() => void load()}
          className="text-sm text-neutral-500 hover:text-neutral-300"
        >
          Обновить данные
        </button>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  valueClass?: string;
}> = ({ icon: Icon, label, value, hint, valueClass }) => (
  <div className="rounded-2xl border border-white/10 bg-[#141820] p-5">
    <div className="flex items-center gap-2 text-neutral-500">
      <Icon size={18} />
      <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
    </div>
    <p className={`mt-3 text-2xl font-bold ${valueClass || 'text-white'}`}>{value}</p>
    {hint ? <p className="mt-1 text-xs text-neutral-500">{hint}</p> : null}
  </div>
);

const MiniMetric: React.FC<{
  label: string;
  value: number;
  icon: LucideIcon;
}> = ({ label, value, icon: Icon }) => (
  <div className="rounded-xl border border-white/10 bg-[#141820]/80 px-4 py-3">
    <div className="flex items-center gap-2 text-neutral-500">
      <Icon size={14} />
      <span className="text-xs">{label}</span>
    </div>
    <p className="mt-1 text-xl font-bold text-white">{value}</p>
  </div>
);

export default AdminDashboard;
