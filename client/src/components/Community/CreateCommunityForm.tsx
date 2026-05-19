import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ArrowLeft, Upload } from 'lucide-react';

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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    handle: '',
    description: '',
    category: 'Other',
    isPublic: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      showToast('Please fill in all required fields', 'info');
      return;
    }

    if (!/^[a-zA-Z0-9-]+$/.test(formData.handle)) {
      showToast('Handle can only contain letters, numbers, and hyphens', 'info');
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
        throw new Error(data.message || 'Failed to create community');
      }

      navigate(`/community/${formData.handle}`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
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
        <h1 className="text-xl font-bold">Create Community</h1>
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
        <label className="mb-1 block text-sm font-medium text-neutral-700">Community Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Crypto Trading Signals"
          className="w-full rounded-xl border border-neutral-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/10"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">Community Handle *</label>
        <div className="flex items-center gap-2">
          <span className="text-neutral-500">@</span>
          <input
            type="text"
            name="handle"
            value={formData.handle}
            onChange={handleChange}
            placeholder="e.g., cryptosignals"
            className="flex-1 rounded-xl border border-neutral-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/10"
            required
          />
        </div>
        <p className="mt-1 text-xs text-neutral-500">Letters, numbers, and hyphens only. No spaces.</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">Description *</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          placeholder="Tell people what your community is about..."
          className="w-full resize-none rounded-xl border border-neutral-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/10"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">Category</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full rounded-xl border border-neutral-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/10"
        >
          <option value="Memecoins">🐸 Memecoins</option>
          <option value="Futures">📈 Futures</option>
          <option value="On-Chain">🔗 On-Chain</option>
          <option value="Airdrops">🎁 Airdrops</option>
          <option value="Education">📚 Education</option>
          <option value="DeFi">💎 DeFi</option>
          <option value="NFT">🎨 NFT</option>
          <option value="Other">🤝 Other</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">Visibility</label>
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
            <span>🌍 Public</span>
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
            <span>🔒 Private</span>
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-black py-3 font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Community'}
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
