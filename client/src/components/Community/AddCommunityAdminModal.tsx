import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ResponsiveDialogShell from '../Common/ResponsiveDialogShell';

import { COMMUNITIES_API } from '../../config/api';

interface CommunityMemberRow {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  role: string;
}

interface AddCommunityAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityHandle: string;
  ownerId: string;
  existingAdminIds: string[];
  onAdded: () => void;
}

const AddCommunityAdminModal: React.FC<AddCommunityAdminModalProps> = ({
  isOpen,
  onClose,
  communityHandle,
  ownerId,
  existingAdminIds,
  onAdded,
}) => {
  const { token } = useAuth();
  const [members, setMembers] = useState<CommunityMemberRow[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const blockedIdsKey = useMemo(
    () => [ownerId, ...existingAdminIds].map(String).sort().join('|'),
    [ownerId, existingAdminIds]
  );

  const loadMembers = useCallback(async () => {
    if (!token || !communityHandle) return;
    const blockedIds = new Set(blockedIdsKey.split('|').filter(Boolean));
    setLoadingMembers(true);
    setError(null);
    try {
      const res = await fetch(
        `${COMMUNITIES_API}/${encodeURIComponent(communityHandle)}/members`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMembers([]);
        setError((data as { message?: string }).message || 'Failed to load members');
        return;
      }
      const rows = (data as CommunityMemberRow[]).filter(
        (m) =>
          m.role !== 'Owner' &&
          m.role !== 'Admin' &&
          !blockedIds.has(String(m.id))
      );
      setMembers(rows);
    } catch {
      setMembers([]);
      setError('Failed to load members.');
    } finally {
      setLoadingMembers(false);
    }
  }, [token, communityHandle, blockedIdsKey]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedId(null);
      setError(null);
      setMembers([]);
      return;
    }
    void loadMembers();
  }, [isOpen, loadMembers]);

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.username.toLowerCase().includes(q) ||
        (m.fullName || '').toLowerCase().includes(q)
    );
  }, [members, query]);

  const selected = members.find((m) => m.id === selectedId) ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `${COMMUNITIES_API}/${encodeURIComponent(communityHandle)}/admins`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: selectedId }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { message?: string }).message || 'Failed to add admin');
        return;
      }
      onAdded();
      onClose();
    } catch {
      setError('Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ResponsiveDialogShell
      open={isOpen}
      onClose={onClose}
      title="Add admin"
      sheetPadded
      disableClose={submitting}
      zIndexClass="z-[130]"
      panelClassName="flex max-h-[min(90vh,640px)] w-full max-w-md flex-col rounded-3xl bg-white p-6 shadow-xl"
    >
      <div className="flex min-h-0 flex-1 flex-col" aria-labelledby="add-admin-title">
        <div className="mb-4 flex shrink-0 items-start justify-between gap-3">
          <div>
            <h2 id="add-admin-title" className="text-xl font-bold text-neutral-900">
              Add admin
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Choose a community member. Role: Admin.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hidden lg:block text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="shrink-0">
            <label className="mb-2 block text-sm font-medium text-neutral-700">Role</label>
            <div className="rounded-xl border border-[#e5e5e5] bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-800">
              Admin
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <label htmlFor="admin-member-filter" className="mb-2 block text-sm font-medium text-neutral-700">
              Members
            </label>
            <input
              id="admin-member-filter"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by name or @username…"
              autoComplete="off"
              className="mb-2 w-full shrink-0 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />

            <div className="min-h-[200px] flex-1 overflow-y-auto rounded-xl border border-neutral-200">
              {loadingMembers ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
                </div>
              ) : filteredMembers.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-neutral-500">
                  {members.length === 0
                    ? 'No eligible members. Users must join the community first.'
                    : 'No members match your filter.'}
                </p>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {filteredMembers.map((member) => {
                    const isSelected = selectedId === member.id;
                    return (
                      <li key={member.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(member.id)}
                          className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors ${
                            isSelected ? 'bg-[#eef2ff]' : 'hover:bg-neutral-50'
                          }`}
                        >
                          <img
                            src={
                              member.avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName || member.username)}&background=404040&color=fff&size=64`
                            }
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-full object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-neutral-900">
                              {member.fullName || member.username}
                            </p>
                            <p className="truncate text-xs text-neutral-500">@{member.username}</p>
                          </div>
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                              isSelected ? 'border-[#315efb] bg-[#315efb]' : 'border-neutral-300'
                            }`}
                            aria-hidden
                          >
                            {isSelected && (
                              <span className="h-2 w-2 rounded-full bg-white" />
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {error && (
            <p className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}

          <div className="flex shrink-0 gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-neutral-200 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedId || submitting || loadingMembers}
              className="flex-1 rounded-xl bg-black py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {submitting ? 'Adding…' : 'Add admin'}
            </button>
          </div>
        </form>
      </div>
    </ResponsiveDialogShell>
  );
};

export default AddCommunityAdminModal;
