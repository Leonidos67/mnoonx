import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n/useTranslation';
import { ArrowLeft, Upload } from 'lucide-react';
import {
  COMMUNITY_CATEGORY_LABEL_KEY,
  COMMUNITY_CATEGORY_OPTIONS,
  type CommunityCategory,
} from '../../constants/communityCategories';
import StyledSelect from '../Common/StyledSelect';
import { communityPath } from '../../constants/communityRoutes';

import { COMMUNITIES_API as API_URL } from '../../config/api';

export interface CreateCommunityFormProps {
  /** Fit inside AppLayout main (viewport minus header) with internal scroll */
  embedded?: boolean;
  /** Back navigation target; omit to use browser history (-1) */
  backTo?: string;
}

const CreateCommunityForm: React.FC<CreateCommunityFormProps> = ({ embedded = false, backTo }) => {
  const { token } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    handle: '',
    description: '',
    category: 'Other' as CommunityCategory,
    isPublic: true,
  });

  const categoryOptions = COMMUNITY_CATEGORY_OPTIONS.map((value) => ({
    value,
    label: t(COMMUNITY_CATEGORY_LABEL_KEY[value]),
  }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const goBack = () => {
    if (backTo) navigate(backTo);
    else navigate(-1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      window.dispatchEvent(new CustomEvent('openLogin'));
      return;
    }

    if (!formData.name.trim() || !formData.handle.trim() || !formData.description.trim()) {
      showToast(t('createCommunity.toastRequired'), 'info');
      return;
    }

    if (!/^[a-zA-Z0-9-]+$/.test(formData.handle)) {
      showToast(t('createCommunity.toastHandleInvalid'), 'info');
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
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || t('createCommunity.toastCreateFailed'));
      }

      navigate(communityPath(formData.handle));
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : t('createCommunity.toastGenericError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const headerBar = (
    <div
      className={
        embedded
          ? 'shrink-0 border-b border-neutral-200 bg-white/90 backdrop-blur-md'
          : 'sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur-md'
      }
    >
      <div className="flex items-center gap-4 px-4 py-3">
        <button type="button" onClick={goBack} className="rounded-full p-2 transition-colors hover:bg-neutral-100">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">{t('createCommunity.headerTitle')}</h1>
      </div>
    </div>
  );

  const formInner = (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-center">
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700 text-3xl font-bold text-white">
            {formData.name.charAt(0) || '?'}
          </div>
          <button
            type="button"
            className="absolute -bottom-2 -right-2 rounded-full border border-neutral-200 bg-white p-2 shadow-sm hover:bg-neutral-50"
          >
            <Upload size={16} />
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">{t('createCommunity.nameLabel')}</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder={t('createCommunity.namePlaceholder')}
          className="w-full rounded-xl border border-neutral-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/10"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">{t('createCommunity.handleLabel')}</label>
        <div className="flex items-center gap-2">
          <span className="text-neutral-500">@</span>
          <input
            type="text"
            name="handle"
            value={formData.handle}
            onChange={handleChange}
            placeholder={t('createCommunity.handlePlaceholder')}
            className="flex-1 rounded-xl border border-neutral-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/10"
            required
          />
        </div>
        <p className="mt-1 text-xs text-neutral-500">{t('createCommunity.handleHint')}</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">{t('createCommunity.descriptionLabel')}</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          placeholder={t('createCommunity.descriptionPlaceholder')}
          className="w-full resize-none rounded-xl border border-neutral-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/10"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">{t('createCommunity.categoryLabel')}</label>
        <StyledSelect
          value={formData.category}
          options={categoryOptions}
          aria-label={t('createCommunity.categoryLabel')}
          placeholder={t('createCommunity.categoryPlaceholder')}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, category: value as CommunityCategory }))
          }
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">{t('createCommunity.visibilityLabel')}</label>
        <div className="flex gap-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="isPublic"
              value="true"
              checked={formData.isPublic === true}
              onChange={() => setFormData((prev) => ({ ...prev, isPublic: true }))}
              className="h-4 w-4"
            />
            <span>{t('createCommunity.visibilityPublic')}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="isPublic"
              value="false"
              checked={formData.isPublic === false}
              onChange={() => setFormData((prev) => ({ ...prev, isPublic: false }))}
              className="h-4 w-4"
            />
            <span>{t('createCommunity.visibilityPrivate')}</span>
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-black py-3 font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
      >
        {loading ? t('createCommunity.submitCreating') : t('createCommunity.submit')}
      </button>
    </form>
  );

  if (embedded) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-[600px] flex-col overflow-hidden border-x border-neutral-200">
          {headerBar}
          <div className="min-h-0 flex-1 overflow-y-auto p-6">{formInner}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-[600px] border-x border-neutral-200 bg-white">
      {headerBar}
      <div className="p-6">{formInner}</div>
    </div>
  );
};

export default CreateCommunityForm;
