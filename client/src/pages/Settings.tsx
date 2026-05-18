// pages/Settings.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
import {
  User,
  Edit,
  Users,
  Link as LinkIcon,
  Shield,
  ShoppingBag,
  Bell,
  CreditCard,
  AlertCircle,
  Camera,
  MapPin,
  ArrowLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';

type SettingsSectionId =
  | 'account'
  | 'edit-profile'
  | 'invites'
  | 'connected'
  | 'security'
  | 'orders'
  | 'notifications'
  | 'payments'
  | 'resolution';

const MENU_ITEMS: {
  id: SettingsSectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'account', label: 'Account settings', icon: User },
  { id: 'edit-profile', label: 'Edit profile', icon: Edit },
  { id: 'invites', label: 'Invites', icon: Users },
  { id: 'connected', label: 'Connected accounts', icon: LinkIcon },
  { id: 'security', label: 'Account security', icon: Shield },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'payments', label: 'Payment methods', icon: CreditCard },
  { id: 'resolution', label: 'Resolution center', icon: AlertCircle },
];

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('edit-profile');
  const [mobileView, setMobileView] = useState<'menu' | 'content'>('menu');
  const [formData, setFormData] = useState({
    name: user?.fullName || 'MakTraxer',
    username: user?.username || 'maktraxer',
    bio: '',
    day: '04',
    month: '09',
    year: '2008',
    location: '',
    website: '',
  });

  useEffect(() => {
    if (isDesktop) setMobileView('menu');
  }, [isDesktop]);

  const activeItem = MENU_ITEMS.find((item) => item.id === activeSection) ?? MENU_ITEMS[1];

  const selectSection = (id: SettingsSectionId) => {
    setActiveSection(id);
    if (!isDesktop) setMobileView('content');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'edit-profile':
        return (
          <div className="mx-auto w-full max-w-2xl">
            <h2 className="mb-6 hidden text-2xl font-bold lg:mb-8 lg:block">Edit profile</h2>

            <div className="mb-8 flex items-center space-x-4 rounded-xl bg-neutral-50 p-4">
              <div className="relative shrink-0">
                <img
                  src={
                    user?.avatar ||
                    `https://ui-avatars.com/api/?name=${formData.name}&background=6366f1&color=fff&size=96`
                  }
                  alt="Avatar"
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
              <label className="mb-2 block text-sm font-medium text-neutral-700">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                maxLength={100}
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder="Your name"
              />
              <p className="mt-1 text-sm text-neutral-400">{formData.name.length}/100</p>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-neutral-700">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                maxLength={42}
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder="Username"
              />
              <p className="mt-1 text-sm text-neutral-400">{formData.username.length}/42</p>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-neutral-700">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                maxLength={200}
                rows={3}
                className="w-full resize-none rounded-xl border border-neutral-200 px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder={formData.bio ? '' : 'No bio'}
              />
              <p className="mt-1 text-sm text-neutral-400">{formData.bio.length}/200</p>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-neutral-700">Date of birth</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={formData.day}
                  onChange={(e) => handleInputChange('day', e.target.value)}
                  maxLength={2}
                  className="w-20 rounded-xl border border-neutral-200 px-4 py-3 text-center transition-all focus:outline-none focus:ring-2 focus:ring-black/10"
                  placeholder="04"
                />
                <span className="text-2xl text-neutral-300">.</span>
                <input
                  type="text"
                  value={formData.month}
                  onChange={(e) => handleInputChange('month', e.target.value)}
                  maxLength={2}
                  className="w-20 rounded-xl border border-neutral-200 px-4 py-3 text-center transition-all focus:outline-none focus:ring-2 focus:ring-black/10"
                  placeholder="09"
                />
                <span className="text-2xl text-neutral-300">.</span>
                <input
                  type="text"
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  maxLength={4}
                  className="w-24 rounded-xl border border-neutral-200 px-4 py-3 text-center transition-all focus:outline-none focus:ring-2 focus:ring-black/10"
                  placeholder="2008"
                />
              </div>
            </div>

            <div className="mt-8 border-t border-neutral-200 pt-6">
              <h3 className="mb-4 text-lg font-semibold">More details</h3>
              <p className="mb-6 text-sm text-neutral-500">
                Choose what appears on your profile and other discovery surfaces.
              </p>

              <div className="mb-4">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-700">
                  <MapPin size={16} />
                  <span>Location</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-black/10"
                  placeholder="Add your location"
                />
              </div>

              <div className="mb-4">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-700">
                  <LinkIcon size={16} />
                  <span>Website</span>
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-black/10"
                  placeholder="https://"
                />
              </div>
            </div>

            <div className="mt-8 border-t border-neutral-200 pt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-neutral-50 p-4 text-center">
                  <p className="text-2xl font-bold">$0</p>
                  <p className="text-sm text-neutral-500">Total earned</p>
                </div>
                <div className="rounded-xl bg-neutral-50 p-4 text-center">
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-neutral-500">Owned mnoonxes</p>
                </div>
                <div className="rounded-xl bg-neutral-50 p-4 text-center">
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-neutral-500">Joined mnoonxes</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pb-4">
              <button
                type="button"
                className="w-full rounded-xl bg-black py-3 font-medium text-white transition-colors hover:bg-neutral-800 active:scale-[0.99]"
              >
                Save changes
              </button>
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="mx-auto w-full max-w-2xl">
            <h2 className="mb-6 hidden text-2xl font-bold lg:block">Account settings</h2>
            <div className="space-y-4">
              <div className="rounded-xl bg-neutral-50 p-4">
                <p className="font-medium">Email</p>
                <p className="text-neutral-500">{user?.email || 'Not set'}</p>
              </div>
              <div className="rounded-xl bg-neutral-50 p-4">
                <p className="font-medium">Member since</p>
                <p className="text-neutral-500">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="mx-auto w-full max-w-2xl">
            <h2 className="mb-6 hidden text-2xl font-bold lg:block">Notifications</h2>
            <div className="space-y-4">
              {['Push notifications', 'Email notifications', 'SMS notifications'].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-xl bg-neutral-50 p-4"
                >
                  <span className="font-medium">{item}</span>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" className="peer sr-only" />
                    <div className="peer h-6 w-11 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all peer-checked:bg-black peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-black/10" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="flex h-48 items-center justify-center">
            <p className="text-lg text-neutral-500">Coming soon</p>
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
            <h1 className="text-xl font-semibold text-neutral-800">Settings</h1>
          </div>

          <div className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
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
                  <Icon className="h-5 w-5 shrink-0 text-neutral-700" />
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
              Log out
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
            aria-label="Back to settings"
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
