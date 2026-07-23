import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon, PartyPopper, ShieldCheck, Users } from 'lucide-react';

export interface NotificationActor {
  username: string;
  fullName: string;
  avatar?: string;
}

export interface NotificationItem {
  _id: string;
  type: string;
  kind?: string | null;
  seedKey?: string | null;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
  actor?: NotificationActor | null;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function formatNotificationTimestamp(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const today = startOfDay(now);
  const day = startOfDay(d);
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (day.getTime() === today.getTime()) {
    return `Today, ${time}`;
  }
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  if (day >= weekAgo) {
    return d.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function groupKey(iso: string): 'today' | 'week' | 'earlier' {
  const d = new Date(iso);
  const now = new Date();
  const today = startOfDay(now);
  const day = startOfDay(d);
  if (day.getTime() === today.getTime()) return 'today';
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  if (day >= weekAgo) return 'week';
  return 'earlier';
}

export function groupNotificationItems(
  items: NotificationItem[],
  t: (key: string) => string
) {
  const sectionLabels: Record<'today' | 'week' | 'earlier', string> = {
    today: t('notifications.sectionToday'),
    week: t('notifications.sectionWeek'),
    earlier: t('notifications.sectionEarlier'),
  };
  const order: Array<'today' | 'week' | 'earlier'> = ['today', 'week', 'earlier'];
  const map: Record<string, NotificationItem[]> = { today: [], week: [], earlier: [] };
  for (const n of items) {
    map[groupKey(n.createdAt)].push(n);
  }
  return order
    .filter((k) => map[k].length > 0)
    .map((k) => ({ key: k, label: sectionLabels[k], items: map[k] }));
}

const SEED_ICONS: Record<string, LucideIcon> = {
  welcome: PartyPopper,
  two_factor: ShieldCheck,
  team_onboarding: Users,
};

const TITLE_ICONS: Array<{ match: RegExp; Icon: LucideIcon }> = [
  { match: /^welcome to mnoonx$/i, Icon: PartyPopper },
  { match: /^protect your account$/i, Icon: ShieldCheck },
  { match: /^team mnoonx$/i, Icon: Users },
];

function systemIconFor(n: NotificationItem): LucideIcon | null {
  if (n.seedKey && SEED_ICONS[n.seedKey]) return SEED_ICONS[n.seedKey];
  const title = String(n.title || '').trim();
  for (const row of TITLE_ICONS) {
    if (row.match.test(title)) return row.Icon;
  }
  return null;
}

function avatarUrlFor(n: NotificationItem) {
  if (n.actor?.avatar) return n.actor.avatar;
  const name = n.actor?.fullName || n.title || 'N';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=000&color=fff&bold=true`;
}

const NotificationAvatar: React.FC<{ n: NotificationItem }> = ({ n }) => {
  const Icon = systemIconFor(n);
  if (Icon) {
    return (
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-800">
        <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
      </span>
    );
  }
  return (
    <img
      src={avatarUrlFor(n)}
      alt=""
      className="h-11 w-11 shrink-0 rounded-full object-cover"
    />
  );
};

type NotificationFeedProps = {
  items: NotificationItem[];
  emptyLabel: string;
  onMarkRead: (id: string) => void;
  t: (key: string) => string;
};

export const NotificationFeed: React.FC<NotificationFeedProps> = ({
  items,
  emptyLabel,
  onMarkRead,
  t,
}) => {
  const sections = groupNotificationItems(items, t);

  if (sections.length === 0) {
    return <p className="py-16 text-center text-neutral-500">{emptyLabel}</p>;
  }

  return (
    <div className="mt-2">
      {sections.map((section) => (
        <div key={section.key} className="mb-6">
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-neutral-200" />
            <span className="text-[10px] font-semibold tracking-wide text-neutral-400">
              {section.label}
            </span>
            <div className="h-px flex-1 bg-neutral-200" />
          </div>
          <ul className="divide-y divide-neutral-100">
            {section.items.map((n) => {
              const inner = (
                <div className="flex items-start gap-3 py-4">
                  {!n.read && (
                    <span className="-ml-1 mt-1 h-8 w-2 shrink-0 self-center rounded-full bg-neutral-900" />
                  )}
                  {n.read && <span className="mt-2 h-2 w-2 shrink-0" />}
                  <NotificationAvatar n={n} />
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="truncate text-[15px] font-semibold leading-snug text-neutral-900">
                      {n.title}
                    </p>
                    {n.body ? (
                      <p className="mt-0.5 truncate text-sm font-normal leading-snug text-neutral-600">
                        {n.body}
                      </p>
                    ) : null}
                  </div>
                  <span className="mr-4 shrink-0 text-xs text-neutral-400">
                    {formatNotificationTimestamp(n.createdAt)}
                  </span>
                </div>
              );
              return (
                <li key={n._id}>
                  {n.link ? (
                    <Link
                      to={n.link}
                      onClick={() => !n.read && onMarkRead(n._id)}
                      className="block hover:bg-neutral-50/80"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => !n.read && onMarkRead(n._id)}
                      className="block w-full text-left hover:bg-neutral-50/80"
                    >
                      {inner}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
};
