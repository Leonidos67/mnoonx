import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowLeftRight, Save, Users, Globe, Lock, CreditCard, Trash2, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { communityPath, COMMUNITY_SETTINGS_SEGMENT } from '../constants/communityRoutes';
import { isCommunityOwner } from '../utils/communityOwner';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../i18n/useTranslation';
import { resolveMediaUrl } from '../utils/mediaUrl';
import type { CollaborationSideLayoutContext } from '../components/Community/CollaborationSideLayout';
import {
  COMMUNITY_CATEGORY_LABEL_KEY,
  COMMUNITY_CATEGORY_OPTIONS,
  isCommunityCategory,
} from '../constants/communityCategories';
import StyledSelect from '../components/Common/StyledSelect';

import { COMMUNITIES_API as API_URL } from '../config/api';

interface CommunityCreator {
  _id: string;
  username: string;
  fullName: string;
  avatar: string;
}

type CreatorFace = {
  type: 'user' | 'community';
  name: string;
  handle: string;
  avatar?: string;
  username?: string;
  fullName?: string;
};

type OwnedCommunity = {
  _id: string;
  name: string;
  handle: string;
  avatar?: string;
};

interface Community {
  _id: string;
  name: string;
  handle: string;
  description: string;
  avatar: string;
  banner: string;
  owner: CommunityCreator;
  coOwner?: CommunityCreator | null;
  ownerFace?: CreatorFace | null;
  coOwnerFace?: CreatorFace | null;
  kind?: 'community' | 'collaboration';
  isOwner?: boolean;
  memberCount: number;
  category: string;
  isPublic: boolean;
  membersCanPost?: boolean;
  joinCode?: string;
  isPaid: boolean;
  price: number;
}

function creatorAvatar(user: CommunityCreator, size = 64): string {
  const raw =
    user.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.username)}&background=171717&color=fff&size=${size}&bold=true`;
  return resolveMediaUrl(raw) || raw;
}

async function fetchOwnedCommunities(
  username: string,
  token?: string | null
): Promise<OwnedCommunity[]> {
  const u = username.trim().replace(/^@/, '');
  if (!u) return [];
  const res = await fetch(`${API_URL}/owned-by/${encodeURIComponent(u)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

function faceSelectValue(face: CreatorFace | null | undefined, options: OwnedCommunity[]): string {
  if (!face || face.type !== 'community') return 'user';
  const match = options.find((c) => c.handle === face.handle);
  return match?._id || 'user';
}

export type CommunitySettingsProps = {
  /** @deprecated settings always render as a page; kept for type compat */
  embedded?: boolean;
  communityHandle?: string;
  onBack?: () => void;
  onUpdated?: () => void;
};

const CommunitySettings: React.FC<CommunitySettingsProps> = ({
  communityHandle,
  onUpdated,
}) => {
  const { handle: handleParam } = useParams<{ handle: string; [key: string]: string | undefined }>();
  const navigate = useNavigate();
  const layoutCtx = useOutletContext<CollaborationSideLayoutContext | undefined>();
  const { user, token } = useAuth();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const { t } = useTranslation();

  const handle = (communityHandle || handleParam || '').toLowerCase();

  const notifyUpdated = useCallback(() => {
    onUpdated?.();
    void layoutCtx?.refreshCommunity();
  }, [onUpdated, layoutCtx]);

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [savingFaces, setSavingFaces] = useState(false);
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
  const [ownerCommunities, setOwnerCommunities] = useState<OwnedCommunity[]>([]);
  const [coOwnerCommunities, setCoOwnerCommunities] = useState<OwnedCommunity[]>([]);
  const [ownerFaceValue, setOwnerFaceValue] = useState('user');
  const [coOwnerFaceValue, setCoOwnerFaceValue] = useState('user');

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

      if (data.kind === 'collaboration') {
        const [ownerList, coList] = await Promise.all([
          data.owner?.username
            ? fetchOwnedCommunities(data.owner.username, token)
            : Promise.resolve([]),
          data.coOwner?.username
            ? fetchOwnedCommunities(data.coOwner.username, token)
            : Promise.resolve([]),
        ]);
        setOwnerCommunities(ownerList);
        setCoOwnerCommunities(coList);
        setOwnerFaceValue(faceSelectValue(data.ownerFace, ownerList));
        setCoOwnerFaceValue(faceSelectValue(data.coOwnerFace, coList));
      } else {
        setOwnerCommunities([]);
        setCoOwnerCommunities([]);
        setOwnerFaceValue('user');
        setCoOwnerFaceValue('user');
      }
    } catch {
      setError(t('communitySettings.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [handle, token, navigate, user, t]);

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
        setError((data as { message?: string }).message || t('communitySettings.saveFailed'));
        return;
      }
      setCommunity(data as Community);
      notifyUpdated();
    } catch {
      setError(t('communitySettings.networkError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSwapCreators = async () => {
    if (!token || !community || community.kind !== 'collaboration') return;
    setSwapping(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/${encodeURIComponent(handle)}/swap-creators`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(
          (data as { message?: string }).message || t('communitySettings.swapCreatorsFailed'),
          'error'
        );
        return;
      }
      const next = data as Community;
      setCommunity(next);
      const [ownerList, coList] = await Promise.all([
        next.owner?.username
          ? fetchOwnedCommunities(next.owner.username, token)
          : Promise.resolve([]),
        next.coOwner?.username
          ? fetchOwnedCommunities(next.coOwner.username, token)
          : Promise.resolve([]),
      ]);
      setOwnerCommunities(ownerList);
      setCoOwnerCommunities(coList);
      setOwnerFaceValue(faceSelectValue(next.ownerFace, ownerList));
      setCoOwnerFaceValue(faceSelectValue(next.coOwnerFace, coList));
      showToast(t('communitySettings.swapCreatorsSuccess'));
      notifyUpdated();
    } catch {
      showToast(t('communitySettings.swapCreatorsFailed'), 'error');
    } finally {
      setSwapping(false);
    }
  };

  const handleSaveFaces = async () => {
    if (!token || !community || community.kind !== 'collaboration') return;
    setSavingFaces(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/${encodeURIComponent(handle)}/creator-faces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ownerDisplayCommunity: ownerFaceValue === 'user' ? 'user' : ownerFaceValue,
          coOwnerDisplayCommunity: coOwnerFaceValue === 'user' ? 'user' : coOwnerFaceValue,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(
          (data as { message?: string }).message || t('communitySettings.faceSaveFailed'),
          'error'
        );
        return;
      }
      const next = data as Community;
      setCommunity(next);
      setOwnerFaceValue(faceSelectValue(next.ownerFace, ownerCommunities));
      setCoOwnerFaceValue(faceSelectValue(next.coOwnerFace, coOwnerCommunities));
      showToast(t('communitySettings.faceSaved'));
      notifyUpdated();
    } catch {
      showToast(t('communitySettings.faceSaveFailed'), 'error');
    } finally {
      setSavingFaces(false);
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
  const coOwnerId =
    community.coOwner?._id != null ? String(community.coOwner._id) : '';
  const userId = user?.id != null ? String(user.id) : '';
  const isCollab = community.kind === 'collaboration';
  const canEdit =
    !!token &&
    (community.isOwner === true ||
      ownerId === userId ||
      (isCollab && coOwnerId !== '' && coOwnerId === userId));

  const deleteConfirmNormalized = deleteConfirm.trim().replace(/^@/, '').toLowerCase();
  const canSubmitDelete = canEdit && deleteConfirmNormalized === community.handle.toLowerCase();

  const handleDeleteCommunity = async () => {
    if (!token || !community || !canSubmitDelete) return;
    const confirmed = await confirm({
      title: t('communitySettings.deleteCommunityTitle'),
      message: t('communitySettings.deleteCommunityMessage'),
      confirmLabel: t('communitySettings.deleteConfirmButton'),
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
        setError((data as { message?: string }).message || t('communitySettings.deleteFailed'));
        return;
      }
      navigate('/discover', { replace: true });
    } catch {
      setError(t('communitySettings.networkError'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="w-full space-y-3 p-3">
      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <Link
          to={communityPath(community.handle)}
          className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('communitySettings.backToNamed', { name: community.name })}
        </Link>
        <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">
          {t('communitySettings.title')}
        </h1>
        {community.kind !== 'collaboration' ? (
          <p className="mt-1 text-sm text-neutral-500">
            {t('communitySettings.pathHint', {
              handle: community.handle,
              segment: COMMUNITY_SETTINGS_SEGMENT,
            })}
          </p>
        ) : null}
      </div>

      {!token && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t('communitySettings.signInToEdit')}
        </p>
      )}

      {token && !canEdit && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {t('communitySettings.noPermission')}
        </p>
      )}

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {isCollab && community.owner && community.coOwner ? (
        <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              {t('communitySettings.creatorsHeading')}
            </p>
            <p className="mt-1 text-xs text-neutral-500">{t('communitySettings.creatorsHint')}</p>
          </div>
          <div className="space-y-2">
            {[
              { user: community.owner, badge: t('communitySettings.primaryBadge') },
              { user: community.coOwner, badge: t('communitySettings.coOwnerBadge') },
            ].map(({ user: creator, badge }) => (
              <div
                key={creator._id}
                className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50/60 px-3 py-2.5"
              >
                <img
                  src={creatorAvatar(creator)}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-neutral-200"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-900">
                    {creator.fullName || creator.username}
                  </p>
                  <p className="truncate text-xs text-neutral-500">@{creator.username}</p>
                </div>
                <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">
                  {badge}
                </span>
              </div>
            ))}
          </div>
          {canEdit ? (
            <button
              type="button"
              onClick={() => void handleSwapCreators()}
              disabled={swapping}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 disabled:opacity-60"
            >
              <ArrowLeftRight className="h-4 w-4" />
              {swapping
                ? t('communitySettings.swappingCreators')
                : t('communitySettings.swapCreators')}
            </button>
          ) : null}
        </div>
      ) : null}

      {isCollab && community.owner && community.coOwner ? (
        <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="text-sm font-semibold text-neutral-900">{t('communitySettings.faceLabel')}</p>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-neutral-500">
              {t('communitySettings.primaryBadge')} — @{community.owner.username}
            </label>
            <select
              value={ownerFaceValue}
              onChange={(e) => setOwnerFaceValue(e.target.value)}
              disabled={!canEdit}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10 disabled:bg-neutral-50"
            >
              <option value="user">{t('communitySettings.faceAsPerson')}</option>
              {ownerCommunities.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} (@{c.handle})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-neutral-500">
              {t('communitySettings.coOwnerBadge')} — @{community.coOwner.username}
            </label>
            <select
              value={coOwnerFaceValue}
              onChange={(e) => setCoOwnerFaceValue(e.target.value)}
              disabled={!canEdit}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10 disabled:bg-neutral-50"
            >
              <option value="user">{t('communitySettings.faceAsPerson')}</option>
              {coOwnerCommunities.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} (@{c.handle})
                </option>
              ))}
            </select>
          </div>
          {canEdit ? (
            <button
              type="button"
              onClick={() => void handleSaveFaces()}
              disabled={savingFaces}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
            >
              {savingFaces ? t('communitySettings.faceSaving') : t('communitySettings.faceSave')}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            {t('communitySettings.name')}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canEdit}
            className="w-full rounded-xl border border-neutral-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/10 disabled:bg-neutral-50"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            {t('communitySettings.description')}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!canEdit}
            rows={4}
            className="w-full resize-y rounded-xl border border-neutral-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/10 disabled:bg-neutral-50"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            {t('communitySettings.avatarUrl')}
          </label>
          <input
            type="url"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            disabled={!canEdit}
            placeholder={t('communitySettings.urlPlaceholder')}
            className="w-full rounded-xl border border-neutral-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/10 disabled:bg-neutral-50"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            {t('communitySettings.bannerUrl')}
          </label>
          <input
            type="url"
            value={banner}
            onChange={(e) => setBanner(e.target.value)}
            disabled={!canEdit}
            placeholder={t('communitySettings.urlPlaceholder')}
            className="w-full rounded-xl border border-neutral-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/10 disabled:bg-neutral-50"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            {t('communitySettings.category')}
          </label>
          <StyledSelect
            value={isCommunityCategory(category) ? category : 'Other'}
            disabled={!canEdit}
            aria-label={t('communitySettings.category')}
            options={COMMUNITY_CATEGORY_OPTIONS.map((c) => ({
              value: c,
              label: t(COMMUNITY_CATEGORY_LABEL_KEY[c]),
            }))}
            onChange={setCategory}
          />
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4">
        <div>
          <p className="mb-2 text-sm font-medium text-neutral-700">
            {t('communitySettings.visibilityHeading')}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-neutral-200 px-4 py-3 has-[:checked]:border-neutral-900 has-[:checked]:bg-neutral-50">
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
                {t('communitySettings.visibilityPublicTitle')}
                <span className="mt-0.5 block text-xs font-normal text-neutral-500">
                  {t('communitySettings.visibilityPublicHint')}
                </span>
              </span>
            </label>
            <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-neutral-200 px-4 py-3 has-[:checked]:border-neutral-900 has-[:checked]:bg-neutral-50">
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
                {t('communitySettings.visibilityPrivateTitle')}
                <span className="mt-0.5 block text-xs font-normal text-neutral-500">
                  {t('communitySettings.visibilityPrivateHint')}
                </span>
              </span>
            </label>
          </div>
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 px-4 py-3">
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
              {t('communitySettings.membersCanPostTitle')}
            </span>
            <span className="mt-1 block text-xs text-neutral-500">
              {t('communitySettings.membersCanPostHint')}
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3">
          <input
            type="checkbox"
            checked={isPaid}
            onChange={(e) => setIsPaid(e.target.checked)}
            disabled={!canEdit}
            className="rounded border-neutral-300"
          />
          <CreditCard className="h-4 w-4 text-neutral-500" />
          <span className="text-sm font-medium">{t('communitySettings.paidAccess')}</span>
        </label>
        {!isPublic && (
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              {t('communitySettings.joinPassphrase')}
            </label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              disabled={!canEdit}
              placeholder={t('communitySettings.joinPassphrasePlaceholder')}
              maxLength={64}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/10 disabled:bg-neutral-50"
            />
            <p className="mt-1 text-xs text-neutral-500">{t('communitySettings.joinPassphraseHint')}</p>
          </div>
        )}
        {isPaid && (
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              {t('communitySettings.price')}
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              disabled={!canEdit}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/10 disabled:bg-neutral-50"
            />
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Users className="h-4 w-4" />
          <span>{t('communitySettings.membersCount', { count: community.memberCount })}</span>
          <span className="mx-1">·</span>
          <span className="font-mono text-xs">@{community.handle}</span>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !name.trim() || !description.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            {saving ? t('communitySettings.saving') : t('communitySettings.saveChanges')}
          </button>
        )}
      </div>

      {canEdit && (
        <div className="rounded-2xl border border-red-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-red-900">{t('communitySettings.dangerZone')}</h2>
          <p className="mt-1 text-sm text-red-800/90">{t('communitySettings.dangerZoneBody')}</p>
          <label className="mt-4 block text-sm font-medium text-red-900">
            {t('communitySettings.deleteConfirmLabel')}{' '}
            <span className="font-mono">@{community.handle}</span>
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
            {deleting ? t('communitySettings.deleting') : t('communitySettings.deleteForever')}
          </button>
        </div>
      )}
    </div>
  );
};

export default CommunitySettings;
