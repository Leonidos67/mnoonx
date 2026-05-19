import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  Search,
  ChevronDown,
  Download,
  MessagesSquare,
  FileText,
  GraduationCap,
  FolderOpen,
  Megaphone,
  Calendar,
} from 'lucide-react';
import { communityPath } from '../constants/communityRoutes';
import { isCommunityOwner } from '../utils/communityOwner';
import { COMMUNITY_APP_IDS } from '../constants/communityApps';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ResponsiveDialogShell from '../components/Common/ResponsiveDialogShell';

import { COMMUNITIES_API as API } from '../config/api';

type AppCategory =
  | 'All'
  | 'Community'
  | 'Business & productivity'
  | 'Social media'
  | 'Trading'
  | 'AI'
  | 'Education';

interface InstalledAppInstance {
  id: string;
  appId: string;
  title: string;
  visibleToMembers: boolean;
  note?: string;
}

interface StoreApp {
  id: string;
  name: string;
  vendor: string;
  vendorBadge: 'mnoonx' | 'brand' | 'user';
  priceLabel: string;
  description: string;
  longDescription: string;
  installs: string;
  category: AppCategory;
  Icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

const CATEGORIES: AppCategory[] = [
  'All',
  'Community',
  'Business & productivity',
  'Social media',
  'Trading',
  'AI',
  'Education',
];

const APPS: StoreApp[] = [
  {
    id: COMMUNITY_APP_IDS.CHAT,
    name: 'Chat',
    vendor: 'MNOONX',
    vendorBadge: 'mnoonx',
    priceLabel: 'Free to install',
    description: 'Allow your users to talk to each other.',
    longDescription:
      'Real-time chat helps members coordinate trades, share quick updates, and build relationships without leaving your community hub. It is ideal for time-sensitive signals, casual banter, and onboarding questions that do not need a full forum thread. Messages are scoped to your community so conversations stay relevant and moderated under your rules. When paired with your feed and forums, chat becomes the “live layer” that keeps people coming back daily.',
    installs: '8,963',
    category: 'Community',
    Icon: MessagesSquare,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    id: COMMUNITY_APP_IDS.CONTENT,
    name: 'Content',
    vendor: 'MNOONX',
    vendorBadge: 'mnoonx',
    priceLabel: 'Free to install',
    description: 'Easily share written documents and free-form text content with your users.',
    longDescription:
      'The Content app is built for long-form writeups: research notes, newsletters, playbooks, and structured updates that deserve more than a single post. You can publish rich text resources members can revisit, quote, and share—perfect for education-heavy communities. It helps creators package expertise into evergreen pages while still benefiting from community distribution and discussion elsewhere.',
    installs: '6,754',
    category: 'Community',
    Icon: FileText,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
  },
  {
    id: COMMUNITY_APP_IDS.COURSES,
    name: 'Courses',
    vendor: 'MNOONX',
    vendorBadge: 'mnoonx',
    priceLabel: 'Free to install',
    description: 'Create and sell online courses, coaching, and educational content.',
    longDescription:
      'Courses turn your expertise into structured learning paths: modules, lessons, and progress that members can follow at their own pace. It is a strong fit for communities teaching trading, on-chain analysis, or workflow skills where outcomes improve with sequencing and repetition. You can combine free previews with paid sections as you grow, and keep students engaged with community discussion tied to each lesson.',
    installs: '3,437',
    category: 'Education',
    Icon: GraduationCap,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    id: COMMUNITY_APP_IDS.FILES,
    name: 'Files',
    vendor: 'MNOONX',
    vendorBadge: 'mnoonx',
    priceLabel: 'Free to install',
    description: 'Sell access to exclusive files, templates, and more.',
    longDescription:
      'Files unlocks a simple way to distribute templates, indicators, spreadsheets, PDFs, and other downloads to members—either as a perk or a paid add-on. It reduces friction for communities that repeatedly share the same resources and need a clean permission model. You can organize bundles for different tiers and keep sensitive materials out of public channels while still staying inside your community experience.',
    installs: '3,135',
    category: 'Business & productivity',
    Icon: FolderOpen,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: COMMUNITY_APP_IDS.ANNOUNCEMENTS,
    name: 'Announcements',
    vendor: 'MNOONX',
    vendorBadge: 'mnoonx',
    priceLabel: 'Free to install',
    description:
      'Your announcements deserve better than a feed post. Reach members instantly via text and email with 98%+ open rates. Schedule, send, and know they actually saw it.',
    longDescription:
      'Announcements is built for moments when reach and certainty matter: launches, policy changes, security notices, and time-critical updates. Instead of hoping members see a feed post, you can deliver a dedicated announcement experience designed for high visibility and optional multi-channel delivery. Scheduling and read signals help admins operate confidently, while members get fewer missed-critical updates and less noise in day-to-day browsing.',
    installs: '861',
    category: 'Community',
    Icon: Megaphone,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  {
    id: COMMUNITY_APP_IDS.EVENTS,
    name: 'Events',
    vendor: 'MNOONX',
    vendorBadge: 'mnoonx',
    priceLabel: 'Free to install',
    description: 'Sell access to virtual or in person events',
    longDescription:
      'Events helps you publish a clear calendar for your community: launches, AMAs, meetups, and paid sessions in one place. Members see what is coming next, share links easily, and you can keep everything aligned with your MNOONX-style monetization story. It is a strong fit for creators who run recurring calls, office hours, or ticketed virtual events alongside chat and announcements.',
    installs: '847 installs in last 7 days',
    category: 'Community',
    Icon: Calendar,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
];

const VendorMark: React.FC<{ type: StoreApp['vendorBadge'] }> = ({ type }) => {
  if (type === 'mnoonx') {
    return <img src="https://img.icons8.com/?size=100&id=ck3ZwyamgGAW&format=png&color=000000" alt="" className='w-4 h-4' />;
  }
  if (type === 'brand') {
    return <span className="h-4 w-4 shrink-0 rounded bg-amber-500" aria-hidden />;
  }
  return (
    <span
      className="h-4 w-4 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-[9px] font-bold text-white flex items-center justify-center"
      aria-hidden
    >
      a
    </span>
  );
};

const CommunityStore: React.FC = () => {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [activeCategory, setActiveCategory] = useState<AppCategory>('All');
  const [search, setSearch] = useState('');
  const [sortLabel] = useState('Most weekly installs');
  const [installedInstances, setInstalledInstances] = useState<InstalledAppInstance[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [installModalApp, setInstallModalApp] = useState<StoreApp | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalVisible, setModalVisible] = useState(true);
  const [modalNote, setModalNote] = useState('');

  const isOwner = Boolean(
    user?.id && ownerId && String(user.id) === String(ownerId)
  );

  const loadCommunity = useCallback(async () => {
    if (!handle) return;
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API}/${encodeURIComponent(handle)}`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      setInstalledInstances(Array.isArray(data.installedAppInstances) ? data.installedAppInstances : []);
      setOwnerId(data.owner?._id != null ? String(data.owner._id) : null);
      if (!user || !isCommunityOwner(data, user.id)) {
        navigate(communityPath(handle), { replace: true });
      }
    } catch {
      setInstalledInstances([]);
    }
  }, [handle, token, user, navigate]);

  useEffect(() => {
    loadCommunity();
  }, [loadCommunity]);

  const openInstallModal = (app: StoreApp) => {
    setInstallModalApp(app);
    setModalTitle(app.name);
    setModalVisible(true);
    setModalNote('');
  };

  const closeInstallModal = () => {
    setInstallModalApp(null);
    setInstallingId(null);
  };

  const submitInstall = async () => {
    const app = installModalApp;
    if (!token || !handle || !isOwner || !app) return;
    setInstallingId(app.id);
    try {
      const res = await fetch(`${API}/${encodeURIComponent(handle)}/apps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          appId: app.id,
          title: modalTitle.trim() || app.name,
          visibleToMembers: modalVisible,
          note: modalNote.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast((data as { message?: string }).message || 'Could not install app', 'error');
        return;
      }
      setInstalledInstances(Array.isArray(data.installedAppInstances) ? data.installedAppInstances : []);
      const newId = typeof (data as { newInstanceId?: string }).newInstanceId === 'string' ? (data as { newInstanceId: string }).newInstanceId : undefined;
      closeInstallModal();
      if (app.id === COMMUNITY_APP_IDS.CHAT) {
        navigate(communityPath(handle), {
          replace: false,
          state: { focusChat: true, chatInstanceId: newId },
        });
      } else if (app.id === COMMUNITY_APP_IDS.COURSES) {
        navigate(communityPath(handle), {
          replace: false,
          state: { focusCourses: true, coursesInstanceId: newId },
        });
      } else if (app.id === COMMUNITY_APP_IDS.CONTENT) {
        navigate(communityPath(handle), {
          replace: false,
          state: { focusContent: true, contentInstanceId: newId },
        });
      } else if (app.id === COMMUNITY_APP_IDS.FILES) {
        navigate(communityPath(handle), {
          replace: false,
          state: { focusFiles: true, filesInstanceId: newId },
        });
      } else if (app.id === COMMUNITY_APP_IDS.ANNOUNCEMENTS) {
        navigate(communityPath(handle), {
          replace: false,
          state: { focusAnnouncements: true, announcementsInstanceId: newId },
        });
      } else if (app.id === COMMUNITY_APP_IDS.EVENTS) {
        navigate(communityPath(handle), {
          replace: false,
          state: { focusEvents: true, eventsInstanceId: newId },
        });
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setInstallingId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return APPS.filter((app) => {
      const catOk = activeCategory === 'All' || app.category === activeCategory;
      if (!catOk) return false;
      if (!q) return true;
      return (
        app.name.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q) ||
        app.longDescription.toLowerCase().includes(q) ||
        app.vendor.toLowerCase().includes(q)
      );
    });
  }, [activeCategory, search]);

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <div className="max-w-full mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <Link
          to={handle ? communityPath(handle) : '/discover'}
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to community
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">App store</h1>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto lg:min-w-[420px]">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search apps..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-neutral-200 bg-neutral-50/80 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#315efb]/25 focus:border-[#315efb] transition-shadow"
              />
            </div>
            <button
              type="button"
              className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-full border border-neutral-200 bg-white text-sm font-medium text-neutral-800 hover:bg-neutral-50 min-w-[200px] sm:min-w-[220px]"
            >
              <span className="truncate">{sortLabel}</span>
              <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0" />
            </button>
          </div>
        </div>

        <div className="border-b border-neutral-200 mb-8 -mx-1">
          <div className="flex gap-1 overflow-x-auto pb-0 scrollbar-thin scrollbar-thumb-neutral-200">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors relative ${
                    active ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  {cat}
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-[#315efb]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {filtered.map((app) => {
            const chatCount = installedInstances.filter((i) => i.appId === app.id).length;
            const installed = chatCount > 0;
            const canInstall =
              app.id === COMMUNITY_APP_IDS.CHAT ||
              app.id === COMMUNITY_APP_IDS.COURSES ||
              app.id === COMMUNITY_APP_IDS.CONTENT ||
              app.id === COMMUNITY_APP_IDS.FILES ||
              app.id === COMMUNITY_APP_IDS.ANNOUNCEMENTS ||
              app.id === COMMUNITY_APP_IDS.EVENTS;
            const busy = installingId === app.id;

            return (
              <article
                key={app.id}
                className="flex flex-col rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-neutral-300/80 transition-shadow"
              >
                <div className="flex gap-3">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${app.iconBg} ${app.iconColor}`}
                  >
                    <app.Icon className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-base font-bold text-neutral-900 leading-tight">{app.name}</h2>
                      {canInstall ? (
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            disabled={installed || !isOwner || !token || busy}
                            onClick={() => openInstallModal(app)}
                            title={
                              !token
                                ? 'Sign in'
                                : !isOwner
                                  ? 'Only the community owner can install apps'
                                  : installed
                                    ? 'Already added'
                                    : 'Add to community'
                            }
                            className="rounded-full bg-[#315efb] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#2547c4] disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            {busy && installModalApp?.id === app.id ? '…' : installed ? 'Added' : 'Add'}
                          </button>
                          {installed && isOwner && token && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => openInstallModal(app)}
                              className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 disabled:opacity-45"
                              title="Add another instance"
                            >
                              Add more
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="shrink-0 rounded-full border border-neutral-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                          Soon
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-neutral-500">
                      <VendorMark type={app.vendorBadge} />
                      <span className="font-medium text-neutral-700">{app.vendor}</span>
                      <span className="text-neutral-300">•</span>
                      <span>{app.priceLabel}</span>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">{app.description}</p>
                <details className="mt-2 group">
                  <summary className="cursor-pointer text-xs font-semibold text-[#315efb] list-none [&::-webkit-details-marker]:hidden flex items-center gap-1">
                    <span className="group-open:rotate-90 transition-transform inline-block">▸</span>
                    Read more
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600 border-t border-neutral-100 pt-2">
                    {app.longDescription}
                  </p>
                </details>
                <div className="mt-auto pt-4 flex items-center gap-1.5 text-xs text-neutral-400">
                  <Download className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                  <span>{app.installs}</span>
                </div>
              </article>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-neutral-500 text-sm">No apps match your filters.</div>
        )}

        {installModalApp && (
          <ResponsiveDialogShell
            open={!!installModalApp}
            onClose={closeInstallModal}
            title={`Add ${installModalApp.name}`}
            sheetPadded
            disableClose={!!installingId}
            zIndexClass="z-[200]"
            panelClassName="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl"
          >
            <div aria-labelledby="install-modal-title">
              <h2 id="install-modal-title" className="text-lg font-semibold text-neutral-900">
                Add {installModalApp.name}
              </h2>
              <p className="mt-1 text-sm text-neutral-500">Configure this app before adding it to your community.</p>

              <label className="mt-5 block text-sm font-medium text-neutral-800">
                Display name
                <input
                  type="text"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#315efb] focus:ring-2 focus:ring-[#315efb]/20"
                  placeholder={installModalApp.name}
                />
              </label>

              <p className="mt-4 text-sm font-medium text-neutral-800">Visibility for members</p>
              <p className="text-xs text-neutral-500">Private: only you see this app in the sidebar. Public: members see it.</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalVisible(true)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                    modalVisible
                      ? 'border-[#315efb] bg-[#eef2ff] text-[#315efb]'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  Show to members
                </button>
                <button
                  type="button"
                  onClick={() => setModalVisible(false)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                    !modalVisible
                      ? 'border-[#315efb] bg-[#eef2ff] text-[#315efb]'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  Hide (owner only)
                </button>
              </div>

              <label className="mt-4 block text-sm font-medium text-neutral-800">
                Note <span className="font-normal text-neutral-400">(optional)</span>
                <textarea
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Internal note — e.g. who this channel is for"
                  className="mt-1.5 w-full resize-none rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#315efb] focus:ring-2 focus:ring-[#315efb]/20"
                />
              </label>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeInstallModal}
                  className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!modalTitle.trim() || !!installingId}
                  onClick={() => void submitInstall()}
                  className="rounded-xl bg-[#315efb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2547c4] disabled:opacity-45"
                >
                  {installingId ? 'Adding…' : 'Add to community'}
                </button>
              </div>
            </div>
          </ResponsiveDialogShell>
        )}
      </div>
    </div>
  );
};

export default CommunityStore;
