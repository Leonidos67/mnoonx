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
import { useTranslation } from '../i18n/useTranslation';
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

const STORE_CATEGORIES: AppCategory[] = [
  'All',
  'Community',
  'Business & productivity',
  'Social media',
  'Trading',
  'AI',
  'Education',
];

const STORE_CATEGORY_TKEY: Record<AppCategory, string> = {
  All: 'communityStore.catAll',
  Community: 'communityStore.catCommunity',
  'Business & productivity': 'communityStore.catBusinessProductivity',
  'Social media': 'communityStore.catSocialMedia',
  Trading: 'communityStore.catTrading',
  AI: 'communityStore.catAI',
  Education: 'communityStore.catEducation',
};

const APP_DEFS = [
  {
    id: COMMUNITY_APP_IDS.CHAT,
    i18nKey: 'chat',
    category: 'Community' as AppCategory,
    Icon: MessagesSquare,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    id: COMMUNITY_APP_IDS.CONTENT,
    i18nKey: 'content',
    category: 'Community' as AppCategory,
    Icon: FileText,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
  },
  {
    id: COMMUNITY_APP_IDS.COURSES,
    i18nKey: 'courses',
    category: 'Education' as AppCategory,
    Icon: GraduationCap,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    id: COMMUNITY_APP_IDS.FILES,
    i18nKey: 'files',
    category: 'Business & productivity' as AppCategory,
    Icon: FolderOpen,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: COMMUNITY_APP_IDS.ANNOUNCEMENTS,
    i18nKey: 'announcements',
    category: 'Community' as AppCategory,
    Icon: Megaphone,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  {
    id: COMMUNITY_APP_IDS.EVENTS,
    i18nKey: 'events',
    category: 'Community' as AppCategory,
    Icon: Calendar,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
] as const;

const VendorMark: React.FC<{ type: StoreApp['vendorBadge'] }> = ({ type }) => {
  if (type === 'mnoonx') {
    return (
      <img
        src="https://img.icons8.com/?size=100&id=ck3ZwyamgGAW&format=png&color=000000"
        alt=""
        className="h-4 w-4"
      />
    );
  }
  if (type === 'brand') {
    return <span className="h-4 w-4 shrink-0 rounded bg-amber-500" aria-hidden />;
  }
  return (
    <span
      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-[9px] font-bold text-white"
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
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<AppCategory>('All');
  const [search, setSearch] = useState('');
  const [installedInstances, setInstalledInstances] = useState<InstalledAppInstance[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [installModalApp, setInstallModalApp] = useState<StoreApp | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalVisible, setModalVisible] = useState(true);
  const [modalNote, setModalNote] = useState('');

  const apps = useMemo<StoreApp[]>(
    () =>
      APP_DEFS.map((def) => ({
        id: def.id,
        name: t(`communityStore.apps.${def.i18nKey}.name`),
        vendor: 'MNOONX',
        vendorBadge: 'mnoonx' as const,
        priceLabel: t('communityStore.freeToInstall'),
        description: t(`communityStore.apps.${def.i18nKey}.description`),
        longDescription: t(`communityStore.apps.${def.i18nKey}.longDescription`),
        installs: t(`communityStore.apps.${def.i18nKey}.installs`),
        category: def.category,
        Icon: def.Icon,
        iconBg: def.iconBg,
        iconColor: def.iconColor,
      })),
    [t]
  );

  const isOwner = Boolean(user?.id && ownerId && String(user.id) === String(ownerId));

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
        showToast((data as { message?: string }).message || t('communityStore.couldNotInstall'), 'error');
        return;
      }
      setInstalledInstances(Array.isArray(data.installedAppInstances) ? data.installedAppInstances : []);
      const newId =
        typeof (data as { newInstanceId?: string }).newInstanceId === 'string'
          ? (data as { newInstanceId: string }).newInstanceId
          : undefined;
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
      showToast(t('community.networkError'), 'error');
    } finally {
      setInstallingId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return apps.filter((app) => {
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
  }, [activeCategory, search, apps]);

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <div className="mx-auto max-w-full px-2 py-4 sm:px-4 sm:py-6">
        <Link
          to={handle ? communityPath(handle) : '/discover'}
          className="inline-flex items-center gap-2 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('communityStore.backToCommunity')}
        </Link>

        <div className="mb-2 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            {t('communityStore.pageTitle')}
          </h1>
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:min-w-[320px] lg:w-auto">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('communityStore.searchPlaceholder')}
                className="w-full rounded-full border border-neutral-200 bg-neutral-50/80 py-2.5 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 transition-shadow focus:border-[#315efb] focus:outline-none focus:ring-2 focus:ring-[#315efb]/25"
              />
            </div>
            {/* <button
              type="button"
              className="flex min-w-[200px] items-center justify-between gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 sm:min-w-[220px]"
            >
              <span className="truncate">{t('communityStore.sortMostWeekly')}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500" />
            </button> */}
          </div>
        </div>

        <div className="-mx-1 mb-8 border-b border-neutral-200">
          <div className="scrollbar-thin scrollbar-thumb-neutral-200 flex gap-1 overflow-x-auto pb-0">
            {STORE_CATEGORIES.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`relative shrink-0 whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors ${
                    active ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  {t(STORE_CATEGORY_TKEY[cat])}
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-[#315efb]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
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
                className="flex flex-col rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:border-neutral-300/80 hover:shadow-md sm:p-5"
              >
                <div className="flex gap-3">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${app.iconBg} ${app.iconColor}`}
                  >
                    <app.Icon className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-base font-bold leading-tight text-neutral-900">{app.name}</h2>
                      {canInstall ? (
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            disabled={installed || !isOwner || !token || busy}
                            onClick={() => openInstallModal(app)}
                            title={
                              !token
                                ? t('communityStore.signInTitle')
                                : !isOwner
                                  ? t('communityStore.ownerOnlyInstall')
                                  : installed
                                    ? t('communityStore.alreadyAdded')
                                    : t('communityStore.add')
                            }
                            className="rounded-full bg-[#315efb] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#2547c4] disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            {busy && installModalApp?.id === app.id
                              ? t('communityStore.addBusy')
                              : installed
                                ? t('communityStore.added')
                                : t('communityStore.add')}
                          </button>
                          {installed && isOwner && token && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => openInstallModal(app)}
                              className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 disabled:opacity-45"
                              title={t('communityStore.addMoreTitle')}
                            >
                              {t('communityStore.addMore')}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="shrink-0 rounded-full border border-neutral-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                          {t('communityStore.soon')}
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
                <details className="group mt-2">
                  <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-semibold text-[#315efb] [&::-webkit-details-marker]:hidden">
                    <span className="inline-block transition-transform group-open:rotate-90">▸</span>
                    {t('communityStore.readMore')}
                  </summary>
                  <p className="mt-2 border-t border-neutral-100 pt-2 text-sm leading-relaxed text-neutral-600">
                    {app.longDescription}
                  </p>
                </details>
                <div className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-neutral-400">
                  <Download className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  <span>{app.installs}</span>
                </div>
              </article>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-neutral-500">{t('communityStore.emptyFilters')}</div>
        )}

        {installModalApp && (
          <ResponsiveDialogShell
            open={!!installModalApp}
            onClose={closeInstallModal}
            title={t('communityStore.addModalTitle', { name: installModalApp.name })}
            sheetPadded
            disableClose={!!installingId}
            zIndexClass="z-[200]"
            panelClassName="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl"
          >
            <div aria-labelledby="install-modal-title">
              <h2 id="install-modal-title" className="text-lg font-semibold text-neutral-900">
                {t('communityStore.addModalHeading', { name: installModalApp.name })}
              </h2>
              <p className="mt-1 text-sm text-neutral-500">{t('communityStore.addModalSubtitle')}</p>

              <label className="mt-5 block text-sm font-medium text-neutral-800">
                {t('communityStore.displayName')}
                <input
                  type="text"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#315efb] focus:ring-2 focus:ring-[#315efb]/20"
                  placeholder={installModalApp.name}
                />
              </label>

              <p className="mt-4 text-sm font-medium text-neutral-800">{t('communityStore.visibilityForMembers')}</p>
              <p className="text-xs text-neutral-500">{t('communityStore.visibilityHint')}</p>
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
                  {t('communityStore.showToMembers')}
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
                  {t('communityStore.hideOwnerOnly')}
                </button>
              </div>

              <label className="mt-4 block text-sm font-medium text-neutral-800">
                {t('communityStore.noteLabel')}{' '}
                <span className="font-normal text-neutral-400">{t('communityStore.noteOptional')}</span>
                <textarea
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder={t('communityStore.notePlaceholder')}
                  className="mt-1.5 w-full resize-none rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#315efb] focus:ring-2 focus:ring-[#315efb]/20"
                />
              </label>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeInstallModal}
                  className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  disabled={!modalTitle.trim() || !!installingId}
                  onClick={() => void submitInstall()}
                  className="rounded-xl bg-[#315efb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2547c4] disabled:opacity-45"
                >
                  {installingId ? t('communityStore.adding') : t('communityStore.addToCommunity')}
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
