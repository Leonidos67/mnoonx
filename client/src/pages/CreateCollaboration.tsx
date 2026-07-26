import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Users2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../i18n/useTranslation';
import { COMMUNITIES_API as API_URL } from '../config/api';
import { resolveMediaUrl } from '../utils/mediaUrl';

type OwnedCommunity = {
  _id: string;
  name: string;
  handle: string;
  avatar?: string;
};

async function fetchOwned(username: string, token?: string | null): Promise<OwnedCommunity[]> {
  const u = username.trim().replace(/^@/, '');
  if (!u) return [];
  const res = await fetch(`${API_URL}/owned-by/${encodeURIComponent(u)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

function faceAvatar(c: OwnedCommunity): string {
  const raw =
    c.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=315efb&color=fff&size=64&bold=true`;
  return resolveMediaUrl(raw) || raw;
}

/**
 * Lightweight create flow for two-creator collaborations (not a full community form).
 */
const CreateCollaborationForm: React.FC = () => {
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [myCommunities, setMyCommunities] = useState<OwnedCommunity[]>([]);
  const [partnerCommunities, setPartnerCommunities] = useState<OwnedCommunity[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    partnerUsername: '',
    description: '',
    primaryCreator: 'me' as 'me' | 'partner',
    myDisplayCommunity: 'user',
    partnerDisplayCommunity: 'user',
  });

  useEffect(() => {
    const partner = (searchParams.get('partner') || '').replace(/^@/, '').trim();
    if (partner) {
      setFormData((prev) => ({ ...prev, partnerUsername: partner }));
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user?.username || !token) return;
    void fetchOwned(user.username, token).then(setMyCommunities);
  }, [user?.username, token]);

  useEffect(() => {
    const partner = formData.partnerUsername.trim().replace(/^@/, '');
    if (partner.length < 2) {
      setPartnerCommunities([]);
      return;
    }
    const tmr = window.setTimeout(() => {
      void fetchOwned(partner, token).then((list) => {
        setPartnerCommunities(list);
        setFormData((prev) => {
          if (
            prev.partnerDisplayCommunity !== 'user' &&
            !list.some((c) => c._id === prev.partnerDisplayCommunity || c.handle === prev.partnerDisplayCommunity)
          ) {
            return { ...prev, partnerDisplayCommunity: 'user' };
          }
          return prev;
        });
      });
    }, 400);
    return () => window.clearTimeout(tmr);
  }, [formData.partnerUsername, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      window.dispatchEvent(new CustomEvent('openLogin'));
      return;
    }
    if (!formData.name.trim() || !formData.partnerUsername.trim()) {
      showToast(t('createCollaboration.toastRequired'), 'info');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          kind: 'collaboration',
          name: formData.name.trim(),
          partnerUsername: formData.partnerUsername.trim().replace(/^@/, ''),
          primaryCreator: formData.primaryCreator,
          myDisplayCommunity:
            formData.myDisplayCommunity === 'user' ? null : formData.myDisplayCommunity,
          partnerDisplayCommunity:
            formData.partnerDisplayCommunity === 'user' ? null : formData.partnerDisplayCommunity,
          description:
            formData.description.trim() ||
            t('createCollaboration.defaultDescription', { name: formData.name.trim() }),
          category: 'Other',
          isPublic: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || t('createCollaboration.toastFailed'));
      }

      if (data.type === 'request') {
        showToast(t('createCollaboration.toastRequestSent'), 'success');
        navigate('/settings?section=collaborations');
        return;
      }

      const handle = data.handle || data.community?.handle;
      showToast(t('createCollaboration.toastSuccess'), 'success');
      if (handle) navigate(`/community/${handle}`);
      else navigate('/discover');
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : t('createCollaboration.toastFailed'),
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const partnerLocked = Boolean((searchParams.get('partner') || '').trim());

  const renderFaceSelect = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    options: OwnedCommunity[],
    personLabel: string
  ) => (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-gray-800">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#315efb] focus:ring-2 focus:ring-[#315efb]/20"
      >
        <option value="user">{personLabel}</option>
        {options.map((c) => (
          <option key={c._id} value={c._id}>
            {c.name} (@{c.handle})
          </option>
        ))}
      </select>
      {value !== 'user' ? (
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#c7d2fe] bg-[#eef2ff]/50 px-3 py-2">
          <img
            src={faceAvatar(options.find((c) => c._id === value || c.handle === value) || { _id: '', name: '', handle: '' })}
            alt=""
            className="h-8 w-8 rounded-lg object-cover"
          />
          <p className="text-xs text-[#1e3a8a]">{t('createCollaboration.faceAsCommunity')}</p>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8 sm:py-12">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('createCollaboration.back')}
      </button>

      <div className="mb-8 flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#315efb]">
          <Users2 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('createCollaboration.title')}</h1>
          <p className="mt-1 text-sm text-gray-600">{t('createCollaboration.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-gray-200 bg-white p-5 sm:p-6">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-800">
            {t('createCollaboration.nameLabel')}
          </label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={t('createCollaboration.namePlaceholder')}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#315efb] focus:ring-2 focus:ring-[#315efb]/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-800">
            {t('createCollaboration.partnerLabel')}
          </label>
          <input
            name="partnerUsername"
            value={formData.partnerUsername}
            onChange={handleChange}
            readOnly={partnerLocked}
            placeholder={t('createCollaboration.partnerPlaceholder')}
            className={`w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#315efb] focus:ring-2 focus:ring-[#315efb]/20 ${
              partnerLocked ? 'bg-neutral-50 text-neutral-700' : ''
            }`}
          />
          <p className="mt-1.5 text-xs text-gray-500">{t('createCollaboration.partnerHint')}</p>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-gray-800">
            {t('createCollaboration.primaryLabel')}
          </p>
          <p className="mb-2.5 text-xs text-gray-500">{t('createCollaboration.primaryHint')}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                { id: 'me' as const, title: t('createCollaboration.primaryMe') },
                { id: 'partner' as const, title: t('createCollaboration.primaryPartner') },
              ] as const
            ).map((opt) => {
              const active = formData.primaryCreator === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, primaryCreator: opt.id }))}
                  className={`rounded-xl border px-3 py-3 text-left text-sm font-medium transition-colors ${
                    active
                      ? 'border-[#315efb] bg-[#eef2ff] text-[#1e3a8a]'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {opt.title}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-[#c7d2fe] bg-[#eef2ff]/30 p-4">
          <p className="text-sm font-semibold text-[#1e3a8a]">{t('createCollaboration.facesHeading')}</p>
          <p className="text-xs text-[#64748b]">{t('createCollaboration.facesHint')}</p>
          {renderFaceSelect(
            t('createCollaboration.myFaceLabel'),
            formData.myDisplayCommunity,
            (v) => setFormData((prev) => ({ ...prev, myDisplayCommunity: v })),
            myCommunities,
            t('createCollaboration.faceAsPerson')
          )}
          {renderFaceSelect(
            t('createCollaboration.partnerFaceLabel'),
            formData.partnerDisplayCommunity,
            (v) => setFormData((prev) => ({ ...prev, partnerDisplayCommunity: v })),
            partnerCommunities,
            t('createCollaboration.faceAsPerson')
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-800">
            {t('createCollaboration.descriptionLabel')}
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder={t('createCollaboration.descriptionPlaceholder')}
            className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#315efb] focus:ring-2 focus:ring-[#315efb]/20"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#315efb] py-3 text-sm font-semibold text-white hover:bg-[#2547c4] disabled:opacity-60"
        >
          {loading ? t('createCollaboration.submitting') : t('createCollaboration.submit')}
        </button>
      </form>
    </div>
  );
};

export default CreateCollaborationForm;
