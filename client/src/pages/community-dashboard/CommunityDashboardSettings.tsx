import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Users, Globe, Lock, CreditCard, Trash2, MessageSquare, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCommunityDashboard } from '../../context/CommunityDashboardContext';
import {
  COMMUNITY_ADMIN_PERMISSION_META,
  CommunityAdminPermissions,
  mergeAdminPermissions,
} from '../../constants/communityAdminPermissions';
import { useConfirm } from '../../context/ConfirmContext';

const API_URL = 'http://localhost:5000/api/communities';

const CATEGORIES = [
  'Memecoins',
  'Futures',
  'On-Chain',
  'Airdrops',
  'Education',
  'DeFi',
  'NFT',
  'Other',
] as const;

const CommunityDashboardSettings: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { confirm } = useConfirm();
  const { handle, community, setCommunity, reload } = useCommunityDashboard();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState('');
  const [banner, setBanner] = useState('');
  const [category, setCategory] = useState<string>('Other');
  const [isPublic, setIsPublic] = useState(true);
  const [membersCanPost, setMembersCanPost] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState(0);
  const [adminPermissions, setAdminPermissions] = useState<CommunityAdminPermissions>(
    mergeAdminPermissions()
  );
  const [savingAdminPermissions, setSavingAdminPermissions] = useState(false);

  useEffect(() => {
    if (!community) return;
    setName(community.name);
    setDescription(community.description);
    setAvatar(community.avatar || '');
    setBanner(community.banner || '');
    setCategory(community.category || 'Other');
    setIsPublic(community.isPublic !== false);
    setMembersCanPost(community.membersCanPost !== false);
    setJoinCode(community.joinCode || '');
    setIsPaid(!!community.isPaid);
    setPrice(typeof community.price === 'number' ? community.price : 0);
    setAdminPermissions(mergeAdminPermissions(community.adminPermissions));
  }, [community]);

  const handleSaveAdminPermissions = async () => {
    if (!token || !community?.isOwner) return;
    setSavingAdminPermissions(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/${encodeURIComponent(handle)}/admin-permissions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(adminPermissions),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { message?: string }).message || 'Failed to save admin permissions');
        return;
      }
      setCommunity(data);
      await reload();
    } catch {
      setError('Network error.');
    } finally {
      setSavingAdminPermissions(false);
    }
  };

  const handleSave = async () => {
    if (!token || !community) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/${encodeURIComponent(handle)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          avatar: avatar.trim(),
          banner: banner.trim(),
          category,
          isPublic,
          membersCanPost,
          joinCode: joinCode.trim(),
          isPaid,
          price: Number(price) || 0,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { message?: string }).message || 'Failed to save');
        return;
      }
      setCommunity(data);
      await reload();
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCommunity = useCallback(async () => {
    if (!token || !community) return;
    const normalized = deleteConfirm.trim().replace(/^@/, '').toLowerCase();
    if (normalized !== community.handle.toLowerCase()) return;
    const confirmed = await confirm({
      title: 'Delete community?',
      message: 'This is permanent. All posts, chats, apps, and uploaded files will be removed.',
      confirmLabel: 'Delete forever',
      variant: 'danger',
    });
    if (!confirmed) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/${encodeURIComponent(handle)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { message?: string }).message || 'Failed to delete');
        return;
      }
      navigate('/discover', { replace: true });
    } catch {
      setError('Network error.');
    } finally {
      setDeleting(false);
    }
  }, [token, community, deleteConfirm, handle, navigate, confirm]);

  if (!community) return null;

  const deleteConfirmNormalized = deleteConfirm.trim().replace(/^@/, '').toLowerCase();
  const canSubmitDelete = deleteConfirmNormalized === community.handle.toLowerCase();
  const isOwner = community.isOwner === true;
  const canEditSettings = isOwner || community.adminPermissions?.canManageSettings === true;

  return (
    <div className="min-h-full bg-white p-4 lg:p-8">
      <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
      <p className="mt-1 text-sm text-neutral-500">Detailed community configuration</p>

      {error && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      <div className="mt-8 max-w-2xl space-y-8">
        {isOwner && (
          <section className="space-y-4 rounded-2xl border border-neutral-200 p-6">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-5 w-5 shrink-0 text-[#315efb]" aria-hidden />
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Admin permissions</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Choose what community admins are allowed to do in the dashboard and on the community page.
                </p>
              </div>
            </div>
            <ul className="space-y-3">
              {COMMUNITY_ADMIN_PERMISSION_META.map((item) => (
                <li
                  key={item.key}
                  className="flex items-start gap-3 rounded-xl border border-neutral-200 px-4 py-3"
                >
                  <input
                    id={`admin-perm-${item.key}`}
                    type="checkbox"
                    checked={adminPermissions[item.key]}
                    onChange={(e) =>
                      setAdminPermissions((prev) => ({ ...prev, [item.key]: e.target.checked }))
                    }
                    className="mt-1 rounded border-neutral-300"
                  />
                  <label htmlFor={`admin-perm-${item.key}`} className="min-w-0 cursor-pointer">
                    <span className="block text-sm font-medium text-neutral-900">{item.label}</span>
                    <span className="mt-0.5 block text-xs text-neutral-500">{item.description}</span>
                  </label>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => void handleSaveAdminPermissions()}
              disabled={savingAdminPermissions}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
            >
              <Save className="h-4 w-4" aria-hidden />
              {savingAdminPermissions ? 'Saving…' : 'Save admin permissions'}
            </button>
          </section>
        )}

        {canEditSettings ? (
        <>
        <section className="space-y-4 rounded-2xl border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900">General</h2>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">Handle</label>
            <input
              type="text"
              value={community.handle}
              disabled
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 font-mono text-sm text-neutral-600"
            />
            <p className="mt-1 text-xs text-neutral-500">Handle cannot be changed after creation.</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full resize-y rounded-xl border border-neutral-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/10"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900">Branding</h2>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">Avatar URL</label>
            <input
              type="url"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">Banner URL</label>
            <input
              type="url"
              value={banner}
              onChange={(e) => setBanner(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900">Access</h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
            <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-neutral-200 px-4 py-3 has-[:checked]:border-[#315efb] has-[:checked]:bg-[#eef2ff]">
              <input
                type="radio"
                name="visibility"
                checked={isPublic}
                onChange={() => setIsPublic(true)}
                className="h-4 w-4"
              />
              <Globe className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
              <span className="text-sm font-medium">Public</span>
            </label>
            <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-neutral-200 px-4 py-3 has-[:checked]:border-[#315efb] has-[:checked]:bg-[#eef2ff]">
              <input
                type="radio"
                name="visibility"
                checked={!isPublic}
                onChange={() => setIsPublic(false)}
                className="h-4 w-4"
              />
              <Lock className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
              <span className="text-sm font-medium">Private</span>
            </label>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 px-4 py-3">
            <input
              type="checkbox"
              checked={membersCanPost}
              onChange={(e) => setMembersCanPost(e.target.checked)}
              className="mt-1 rounded border-neutral-300"
            />
            <span>
              <span className="flex items-center gap-2 text-sm font-medium text-neutral-900">
                <MessageSquare className="h-4 w-4 text-neutral-500" aria-hidden />
                Members can publish posts
              </span>
              <span className="mt-1 block text-xs text-neutral-500">
                When disabled, only the community owner can post to the feed.
              </span>
            </span>
          </label>
          {!isPublic && (
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">Join passphrase</label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Leave empty to allow join without a passphrase"
                maxLength={64}
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-2xl border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900">Monetization</h2>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={isPaid}
              onChange={(e) => setIsPaid(e.target.checked)}
              className="rounded border-neutral-300"
            />
            <CreditCard className="h-4 w-4 text-neutral-500" aria-hidden />
            <span className="text-sm font-medium">Paid access</span>
          </label>
          {isPaid && (
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">Price (USD)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
          )}
          <div className="flex items-center gap-2 border-t border-neutral-100 pt-2 text-sm text-neutral-500">
            <Users className="h-4 w-4" aria-hidden />
            <span>{community.memberCount} members</span>
          </div>
        </section>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || !name.trim() || !description.trim()}
          className="flex w-full max-w-2xl items-center justify-center gap-2 rounded-xl bg-black py-3 font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
        >
          <Save className="h-5 w-5" aria-hidden />
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        </>
        ) : (
          <p className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-6 text-sm text-neutral-600">
            You can view settings, but only the owner can change community details. Admin permission toggles are
            configured by the owner above.
          </p>
        )}

        {isOwner && (
        <section className="max-w-2xl rounded-2xl border border-red-200 bg-red-50/60 p-6">
          <h2 className="text-lg font-semibold text-red-900">Danger zone</h2>
          <p className="mt-1 text-sm text-red-800/90">
            Deleting a community is permanent. Posts, members, apps, and uploaded files will be removed.
          </p>
          <label className="mt-4 block text-sm font-medium text-red-900">
            Type the handle to confirm: <span className="font-mono">@{community.handle}</span>
          </label>
          <input
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={community.handle}
            autoComplete="off"
            className="mt-2 w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-red-300/50"
          />
          <button
            type="button"
            onClick={() => void handleDeleteCommunity()}
            disabled={!canSubmitDelete || deleting}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-red-300 bg-white py-3 font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-5 w-5" aria-hidden />
            {deleting ? 'Deleting…' : 'Delete community permanently'}
          </button>
        </section>
        )}
      </div>
    </div>
  );
};

export default CommunityDashboardSettings;
