// pages/Settings.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useTranslation } from '../i18n/useTranslation';
import SocialLinksEditor from '../components/Profile/SocialLinksEditor';
import { USERS_API } from '../config/api';
import type { SocialLinks, SocialPlatform } from '../types/socialLinks';
import { EMPTY_SOCIAL_LINKS } from '../types/socialLinks';
import { normalizeSocialLinksInput } from '../utils/socialLinks';
import {
  Camera,
  MapPin,
  ArrowLeft,
  ChevronRight,
  LogOut,
  Link as LinkIcon,
} from 'lucide-react';
import {
  AnimatedSettingsNavIcon,
  type SettingsNavIconKind,
} from '../components/Settings/AnimatedSettingsNavIcon';
import SettingsAccountPanel from '../components/Settings/SettingsAccountPanel';
import SettingsNotificationsPanel from '../components/Settings/SettingsNotificationsPanel';
import SettingsSecurityPanel from '../components/Settings/SettingsSecurityPanel';
import SettingsOrdersPanel from '../components/Settings/SettingsOrdersPanel';
import SettingsPaymentsPanel from '../components/Settings/SettingsPaymentsPanel';
import SettingsResolutionPanel from '../components/Settings/SettingsResolutionPanel';

type SettingsSectionId =
  | 'account'
  | 'edit-profile'
  | 'connected'
  | 'security'
  | 'orders'
  | 'notifications'
  | 'payments'
  | 'resolution';

type MenuItem = {
  id: SettingsSectionId;
  label: string;
  icon: SettingsNavIconKind;
  description?: string;
};

type MenuGroup = {
  id: string;
  label: string;
  items: MenuItem[];
};

const Settings: React.FC = () => {
  const { user, logout, token } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('edit-profile');
  const [mobileView, setMobileView] = useState<'menu' | 'content'>('menu');
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.fullName || '',
    username: user?.username || '',
    bio: '',
    day: '',
    month: '',
    year: '',
    location: '',
    website: '',
  });
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({ ...EMPTY_SOCIAL_LINKS });

  const menuGroups: MenuGroup[] = useMemo(
    () => [
      {
        id: 'profile',
        label: t('settings.groupProfile'),
        items: [
          {
            id: 'account',
            label: t('settings.accountSettings'),
            icon: 'account',
            description: t('settings.accountNavHint'),
          },
          {
            id: 'edit-profile',
            label: t('settings.editProfile'),
            icon: 'editProfile',
            description: t('settings.editProfileNavHint'),
          },
          {
            id: 'connected',
            label: t('settings.connectedAccounts'),
            icon: 'connected',
            description: t('settings.connectedNavHint'),
          },
        ],
      },
      {
        id: 'security',
        label: t('settings.groupSecurity'),
        items: [
          {
            id: 'security',
            label: t('settings.accountSecurity'),
            icon: 'security',
            description: t('settings.securityNavHint'),
          },
          {
            id: 'notifications',
            label: t('settings.notifications'),
            icon: 'notifications',
            description: t('settings.notificationsNavHint'),
          },
        ],
      },
      {
        id: 'billing',
        label: t('settings.groupBilling'),
        items: [
          { id: 'orders', label: t('settings.orders'), icon: 'orders' },
          { id: 'payments', label: t('settings.paymentMethods'), icon: 'payments' },
        ],
      },
      {
        id: 'support',
        label: t('settings.groupSupport'),
        items: [
          { id: 'resolution', label: t('settings.resolutionCenter'), icon: 'resolution' },
        ],
      },
    ],
    [t],
  );

  const menuItems: MenuItem[] = useMemo(
    () => menuGroups.flatMap((group) => group.items),
    [menuGroups],
  );

  useEffect(() => {
    if (isDesktop) setMobileView('menu');
  }, [isDesktop]);

  useEffect(() => {
    const section = searchParams.get('section');
    if (section === 'connected' || section === 'security') {
      setActiveSection(section);
      if (!isDesktop) setMobileView('content');
    }
  }, [searchParams, isDesktop]);

  useEffect(() => {
    if (searchParams.get('focus') !== 'links') return;
    if (activeSection !== 'security') return;
    if (!isDesktop && mobileView !== 'content') return;
    const timer = window.setTimeout(() => {
      document.getElementById('settings-link-opening')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [searchParams, activeSection, isDesktop, mobileView]);

  const loadProfile = useCallback(async () => {
    if (!token) {
      setProfileLoading(false);
      return;
    }
    try {
      setProfileLoading(true);
      const res = await fetch(`${USERS_API}/me/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('load failed');
      const data = await res.json();
      setFormData((prev) => ({
        ...prev,
        name: data.fullName || '',
        username: data.username || '',
        bio: data.bio || '',
        location: data.location || '',
        website: data.website || '',
      }));
      setSocialLinks(normalizeSocialLinksInput(data.socialLinks));
    } catch {
      showToast(t('settings.profileLoadFailed'), 'error');
    } finally {
      setProfileLoading(false);
    }
  }, [token, showToast, t]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const activeItem = menuItems.find((item) => item.id === activeSection) ?? menuItems[1];

  const selectSection = (id: SettingsSectionId) => {
    setActiveSection(id);
    if (!isDesktop) setMobileView('content');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (platform: SocialPlatform, value: string) => {
    setSocialLinks((prev) => ({ ...prev, [platform]: value }));
  };

  const saveProfile = async (options?: { socialOnly?: boolean }) => {
    if (!token) return;
    try {
      setSaving(true);
      const body = options?.socialOnly
        ? { socialLinks }
        : {
            fullName: formData.name,
            username: formData.username,
            bio: formData.bio,
            location: formData.location,
            website: formData.website,
            socialLinks,
          };
      const res = await fetch(`${USERS_API}/me/profile`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast((data as { message?: string }).message || t('settings.saveFailed'), 'error');
        return;
      }
      setFormData((prev) => ({
        ...prev,
        name: data.fullName || prev.name,
        username: data.username || prev.username,
        bio: data.bio || '',
        location: data.location || '',
        website: data.website || '',
      }));
      setSocialLinks(normalizeSocialLinksInput(data.socialLinks));
      showToast(t('settings.saveSuccess'));
    } catch {
      showToast(t('settings.saveFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'connected':
        return (
          <div className="mx-auto w-full max-w-2xl">
            <h2 className="mb-2 hidden text-2xl font-bold lg:block">{t('settings.connectedHeading')}</h2>
            <p className="mb-6 hidden text-sm text-neutral-500 lg:block">{t('settings.connectedHint')}</p>
            {profileLoading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
              </div>
            ) : (
              <>
                <SocialLinksEditor value={socialLinks} onChange={handleSocialChange} />
                <div className="mt-8 pb-4">
                  <button
                    type="button"
                    onClick={() => void saveProfile({ socialOnly: true })}
                    disabled={saving}
                    className="w-full rounded-xl bg-black py-3 font-medium text-white transition-colors hover:bg-black/80 active:scale-[0.99] disabled:opacity-50"
                  >
                    {saving ? t('settings.saving') : t('settings.saveChanges')}
                  </button>
                </div>
              </>
            )}
          </div>
        );

      case 'edit-profile':
        return (
          <div className="mx-auto w-full max-w-2xl">
            <h2 className="mb-6 hidden text-2xl font-bold lg:mb-8 lg:block">{t('settings.editProfileHeading')}</h2>
            {profileLoading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
              </div>
            ) : (
              <>

            <div className="mb-8 flex items-center space-x-4 rounded-xl bg-neutral-50 p-4">
              <div className="relative shrink-0">
                <img
                  src={
                    user?.avatar ||
                    `https://ui-avatars.com/api/?name=${formData.name}&background=6366f1&color=fff&size=96`
                  }
                  alt={t('settings.avatarAlt')}
                  className="h-24 w-24 rounded-full object-cover"
                />
                <button
                  type="button"
                  className="absolute bottom-0 right-0 rounded-full bg-black p-2 text-white transition-colors hover:bg-gray-800"
                >
                  <Camera size={16} />
                </button>
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{formData.name}</p>
                <p className="truncate text-neutral-500">@{formData.username}</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-neutral-700">{t('settings.name')}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                maxLength={100}
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder={t('settings.namePlaceholder')}
              />
              <p className="mt-1 text-sm text-neutral-400">{formData.name.length}/100</p>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-neutral-700">{t('settings.username')}</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                maxLength={42}
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder={t('settings.usernamePlaceholder')}
              />
              <p className="mt-1 text-sm text-neutral-400">{formData.username.length}/42</p>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-neutral-700">{t('settings.bio')}</label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                maxLength={200}
                rows={3}
                className="w-full resize-none rounded-xl border border-neutral-200 px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder={formData.bio ? '' : t('settings.bioPlaceholder')}
              />
              <p className="mt-1 text-sm text-neutral-400">{formData.bio.length}/200</p>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-neutral-700">{t('settings.dateOfBirth')}</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={formData.day}
                  onChange={(e) => handleInputChange('day', e.target.value)}
                  maxLength={2}
                  className="w-20 rounded-xl border border-neutral-200 px-4 py-3 text-center transition-all focus:outline-none focus:ring-2 focus:ring-black/10"
                  placeholder="DD"
                />
                <span className="text-2xl text-neutral-300">.</span>
                <input
                  type="text"
                  value={formData.month}
                  onChange={(e) => handleInputChange('month', e.target.value)}
                  maxLength={2}
                  className="w-20 rounded-xl border border-neutral-200 px-4 py-3 text-center transition-all focus:outline-none focus:ring-2 focus:ring-black/10"
                  placeholder="MM"
                />
                <span className="text-2xl text-neutral-300">.</span>
                <input
                  type="text"
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  maxLength={4}
                  className="w-24 rounded-xl border border-neutral-200 px-4 py-3 text-center transition-all focus:outline-none focus:ring-2 focus:ring-black/10"
                  placeholder="YYYY"
                />
              </div>
            </div>

            <div className="mt-8 border-t border-neutral-200 pt-6">
              <h3 className="mb-4 text-lg font-semibold">{t('settings.moreDetails')}</h3>
              <p className="mb-6 text-sm text-neutral-500">{t('settings.moreDetailsHint')}</p>

              <div className="mb-4">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-700">
                  <MapPin size={16} />
                  <span>{t('settings.location')}</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-black/10"
                  placeholder={t('settings.locationPlaceholder')}
                />
              </div>

              <div className="mb-4">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-700">
                  <LinkIcon size={16} />
                  <span>{t('settings.website')}</span>
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-black/10"
                  placeholder={t('settings.websitePlaceholder')}
                />
              </div>
            </div>

            <div className="mt-8 border-t border-neutral-200 pt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-neutral-50 p-4 text-center">
                  <p className="text-2xl font-bold">$0</p>
                  <p className="text-sm text-neutral-500">{t('settings.totalEarned')}</p>
                </div>
                <div className="rounded-xl bg-neutral-50 p-4 text-center">
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-neutral-500">{t('settings.ownedMnoonxes')}</p>
                </div>
                <div className="rounded-xl bg-neutral-50 p-4 text-center">
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-neutral-500">{t('settings.joinedMnoonxes')}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-neutral-200 pt-4">
              <div className="flex items-center justify-between gap-3 py-4">
                <div>
                  <h3 className="text-lg font-semibold">{t('settings.connectedAccounts')}</h3>
                  <p className="mt-1 text-sm text-neutral-500">{t('settings.connectedShortHint')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => selectSection('connected')}
                  className="shrink-0 rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-50"
                >
                  {t('settings.manageLinks')}
                </button>
              </div>
            </div>

            <div className="mt-8 pb-4">
              <button
                type="button"
                onClick={() => void saveProfile()}
                disabled={saving}
                className="w-full rounded-xl bg-black py-3 font-medium text-white transition-colors hover:bg-black/80 active:scale-[0.99] disabled:opacity-50"
              >
                {saving ? t('settings.saving') : t('settings.saveChanges')}
              </button>
            </div>
              </>
            )}
          </div>
        );

      case 'account':
        return <SettingsAccountPanel />;

      case 'notifications':
        return <SettingsNotificationsPanel userId={user?.id} />;

      case 'security':
        return <SettingsSecurityPanel />;

      case 'orders':
        return <SettingsOrdersPanel />;

      case 'payments':
        return <SettingsPaymentsPanel />;

      case 'resolution':
        return <SettingsResolutionPanel />;

      default:
        return (
          <div className="flex h-48 items-center justify-center">
            <p className="text-lg text-neutral-500">{t('settings.comingSoon')}</p>
          </div>
        );
    }
  };

  const showMenu = isDesktop || mobileView === 'menu';
  const showContent = isDesktop || mobileView === 'content';

  return (
    <div className="flex h-full min-h-0">
      <aside
        className={`flex h-full min-h-0 flex-col border-neutral-200 lg:w-64 lg:shrink-0 lg:border-r ${
          showMenu ? 'w-full max-lg:flex' : 'max-lg:hidden'
        }`}
      >
        <nav className="flex min-h-0 flex-1 flex-col p-2">
          <div className="shrink-0 px-2 pt-2">
            <h1 className="text-xl font-semibold text-neutral-800">{t('settings.title')}</h1>
          </div>

          <div className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectSection(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all active:scale-[0.99] lg:py-2 ${
                    isActive && isDesktop
                      ? 'bg-black/10 font-medium'
                      : 'hover:bg-black/5 max-lg:active:bg-black/5'
                  }`}
                >
                  <AnimatedSettingsNavIcon
                    kind={item.icon}
                    size={20}
                    className="text-neutral-700"
                    color="currentColor"
                  />
                  <span className="min-w-0 flex-1 font-medium text-neutral-900">{item.label}</span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-neutral-400 lg:hidden" aria-hidden />
                </button>
              );
            })}
          </div>

          <div className="mt-2 shrink-0 border-t border-neutral-200 pt-2 lg:hidden">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-medium text-red-600 transition-colors hover:bg-red-50 active:scale-[0.99]"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {t('common.logOut')}
            </button>
          </div>
        </nav>
      </aside>

      <main
        className={`min-h-0 flex-1 overflow-y-auto bg-white ${
          showContent ? 'max-lg:flex max-lg:flex-col' : 'max-lg:hidden'
        }`}
      >
        <div className="sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b border-neutral-200 bg-white/90 px-3 py-3 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setMobileView('menu')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-800 transition-colors hover:bg-black/5 active:scale-95"
            aria-label={t('settings.backToSettingsAria')}
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} />
          </button>
          <h2 className="min-w-0 truncate text-lg font-semibold text-neutral-900">{activeItem.label}</h2>
        </div>

        <div className="flex-1 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:p-8">{renderContent()}</div>
      </main>
    </div>
  );
};

export default Settings;
