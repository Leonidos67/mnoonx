import React from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import ResponsiveDialogShell from '../Common/ResponsiveDialogShell';
import { profilePath } from '../../constants/paths';
import { resolveMediaUrl } from '../../utils/mediaUrl';

export interface ProfileFollowListUser {
  _id: string;
  username: string;
  fullName: string;
  avatar: string;
}

interface ProfileFollowersSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  users: ProfileFollowListUser[];
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  emptySearch: string;
  emptyList: string;
  showSearch?: boolean;
}

const ProfileFollowersSheet: React.FC<ProfileFollowersSheetProps> = ({
  open,
  onClose,
  title,
  users,
  search,
  onSearchChange,
  searchPlaceholder,
  emptySearch,
  emptyList,
  showSearch = true,
}) => (
  <ResponsiveDialogShell
    open={open}
    onClose={onClose}
    title={title}
    sheetPadded
    sheetContentClassName="!max-h-[92dvh]"
    panelClassName="flex max-h-[min(640px,85vh)] w-full max-w-md flex-col rounded-3xl bg-white p-6 shadow-2xl"
  >
    <h2 className="mb-4 text-lg font-bold text-neutral-900 lg:hidden">{title}</h2>
    {showSearch ? (
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-full border border-neutral-200 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
        />
      </div>
    ) : null}
    <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain">
      {users.length > 0 ? (
        users.map((u) => (
          <Link
            key={u._id || u.username}
            to={profilePath(u.username)}
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-neutral-50"
          >
            <img
              src={
                u.avatar
                  ? resolveMediaUrl(u.avatar)
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || u.username)}&background=000&color=fff&size=40&bold=true`
              }
              alt=""
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-neutral-900">
                {u.fullName || u.username}
              </p>
              <p className="truncate text-sm text-neutral-500">@{u.username}</p>
            </div>
          </Link>
        ))
      ) : (
        <p className="py-8 text-center text-sm text-neutral-500">
          {search.trim() ? emptySearch : emptyList}
        </p>
      )}
    </div>
  </ResponsiveDialogShell>
);

export default ProfileFollowersSheet;
