import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Users, Globe, Lock, CreditCard, Trash2, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { communityPath, COMMUNITY_SETTINGS_SEGMENT } from '../constants/communityRoutes';
import { isCommunityOwner } from '../utils/communityOwner';
import { useConfirm } from '../context/ConfirmContext';

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

interface Community {
  _id: string;
  name: string;
  handle: string;
  description: string;
  avatar: string;
  banner: string;
  owner: { _id: string; username: string; fullName: string; avatar: string };
  memberCount: number;
  category: string;
  isPublic: boolean;
  membersCanPost?: boolean;
  joinCode?: string;
  isPaid: boolean;
  price: number;
}

const CommunitySettings: React.FC = () => {
  const { handle: handleParam } = useParams<{ handle: string; [key: string]: string | undefined }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { confirm } = useConfirm();

  const handle = handleParam?.toLowerCase() || '';

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
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

  const load = useCallback(async () => {
    if (!handle) return;
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/${encodeURIComponent(handle)}`, { headers });
      if (!res.ok) {
        navigate('/discover');
        return;
      }
      const data: Community = await res.json();
      setCommunity(data);
      setName(data.name);
      setDescription(data.description);
      setAvatar(data.avatar || '');
      setBanner(data.banner || '');
      setCategory(data.category || 'Other');
      setIsPublic(data.isPublic !== false);
      setMembersCanPost(data.membersCanPost !== false);
      setJoinCode(data.joinCode || '');
      setIsPaid(!!data.isPaid);
      setPrice(typeof data.price === 'number' ? data.price : 0);
      if (!user || !isCommunityOwner(data, user.id)) {
        navigate(communityPath(data.handle), { replace: true });
        return;
      }
    } catch {
      setError('Failed to load community.');
    } finally {
      setLoading(false);
    }
  }, [handle, token, navigate, user]);

  useEffect(() => {
    load();
  }, [load]);

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
      setCommunity(data as Community);
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-300 border-t-black" />
      </div>
    );
  }

  if (!community) return null;

  const ownerId = community.owner?._id != null ? String(community.owner._id) : '';
  const userId = user?.id != null ? String(user.id) : '';
  const canEdit = !!token && ownerId === userId;

  const deleteConfirmNormalized = deleteConfirm.trim().replace(/^@/, '').toLowerCase();
  const canSubmitDelete = canEdit && deleteConfirmNormalized === community.handle.toLowerCase();

  const handleDeleteCommunity = async () => {
    if (!token || !community || !canSubmitDelete) return;
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
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <Link
          to={communityPath(community.handle)}
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-black text-sm font-medium mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {community.name}
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900">Community settings</h1>
        <p className="text-neutral-500 text-sm mt-1">
          /community/{community.handle}/{COMMUNITY_SETTINGS_SEGMENT}
        </p>
      </div>

      {!token && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
          Sign in to edit this community.
        </p>
      )}

      {token && !canEdit && (
        <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">
          You do not have permission to edit this community.
        </p>
      )}

      {error && (
        <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">{error}</p>
      )}

      <div className="space-y-6 bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canEdit}
            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 disabled:bg-neutral-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!canEdit}
            rows={4}
            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 disabled:bg-neutral-50 resize-y"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Avatar URL</label>
          <input
            type="url"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            disabled={!canEdit}
            placeholder="https://..."
            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 disabled:bg-neutral-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Banner URL</label>
          <input
            type="url"
            value={banner}
            onChange={(e) => setBanner(e.target.value)}
            disabled={!canEdit}
            placeholder="https://..."
            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 disabled:bg-neutral-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={!canEdit}
            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 disabled:bg-neutral-50"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-neutral-700 mb-2">Community visibility</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-neutral-200 px-4 py-3 has-[:checked]:border-[#315efb] has-[:checked]:bg-[#eef2ff]">
                <input
                  type="radio"
                  name="communityVisibility"
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                  disabled={!canEdit}
                  className="h-4 w-4"
                />
                <Globe className="h-4 w-4 shrink-0 text-neutral-500" />
                <span className="text-sm font-medium">
                  Public
                  <span className="mt-0.5 block text-xs font-normal text-neutral-500">
                    Listed in Discover; content is visible to everyone
                  </span>
                </span>
              </label>
              <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-neutral-200 px-4 py-3 has-[:checked]:border-[#315efb] has-[:checked]:bg-[#eef2ff]">
                <input
                  type="radio"
                  name="communityVisibility"
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                  disabled={!canEdit}
                  className="h-4 w-4"
                />
                <Lock className="h-4 w-4 shrink-0 text-neutral-500" />
                <span className="text-sm font-medium">
                  Private
                  <span className="mt-0.5 block text-xs font-normal text-neutral-500">
                    Listed in Discover; content is members only
                  </span>
                </span>
              </label>
            </div>
          </div>
          <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-neutral-200 px-4 py-3">
            <input
              type="checkbox"
              checked={membersCanPost}
              onChange={(e) => setMembersCanPost(e.target.checked)}
              disabled={!canEdit}
              className="mt-1 rounded border-neutral-300"
            />
            <span>
              <span className="flex items-center gap-2 text-sm font-medium text-neutral-900">
                <MessageSquare className="h-4 w-4 text-neutral-500" />
                Members can publish posts
              </span>
              <span className="mt-1 block text-xs text-neutral-500">
                When off, only the community owner can post to the feed.
              </span>
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPaid}
              onChange={(e) => setIsPaid(e.target.checked)}
              disabled={!canEdit}
              className="rounded border-neutral-300"
            />
            <CreditCard className="w-4 h-4 text-neutral-500" />
            <span className="text-sm font-medium">Paid access</span>
          </label>
          {!isPublic && (
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">Join passphrase</label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                disabled={!canEdit}
                placeholder="Leave empty to allow join without a passphrase"
                maxLength={64}
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/10 disabled:bg-neutral-50"
              />
              <p className="mt-1 text-xs text-neutral-500">
                New members must enter this passphrase to join. Only you can see it in settings.
              </p>
            </div>
          )}
        </div>

        {isPaid && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Price</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              disabled={!canEdit}
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 disabled:bg-neutral-50"
            />
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-neutral-500 pt-2 border-t border-neutral-100">
          <Users className="w-4 h-4" />
          <span>{community.memberCount} members</span>
          <span className="mx-1">·</span>
          <span className="font-mono text-xs">@{community.handle}</span>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !name.trim() || !description.trim()}
            className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        )}
      </div>

      {canEdit && (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50/60 p-6 shadow-sm">
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
            className="mt-2 w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-300/50"
          />
          <button
            type="button"
            onClick={handleDeleteCommunity}
            disabled={!canSubmitDelete || deleting}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-red-300 bg-white py-3 font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-5 w-5" />
            {deleting ? 'Deleting…' : 'Delete community permanently'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CommunitySettings;
