import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  Calendar,
  ChevronDown,
  Clock,
  Link2,
  Lock,
  Pencil,
  Plus,
  Share2,
  Star,
  Users,
  Video,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ResponsiveDialogShell from '../Common/ResponsiveDialogShell';
import { useConfirm } from '../../context/ConfirmContext';
import { communityPath } from '../../constants/communityRoutes';
import { useTranslation } from '../../i18n/useTranslation';

import { COMMUNITIES_API as API } from '../../config/api';

interface Host {
  _id: string;
  username: string;
  fullName: string;
  avatar?: string;
}

export interface CommunityEventItem {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  repeatRule: string;
  locationType: 'place' | 'online';
  locationLabel: string;
  locationAddress: string;
  allowRsvp: boolean;
  hostUserId: string;
  host: Host | null;
  createdAt: string;
  updatedAt: string;
}

interface CommunityEventsPanelProps {
  handle: string;
  instanceId: string;
  instanceTitle?: string;
  isOwner: boolean;
  isMember: boolean;
  ownerUsername: string;
  onBackToCommunity: () => void;
}

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase().slice(0, 2);
  return name.trim().slice(0, 2).toUpperCase() || '??';
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function toInputLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const CommunityEventsPanel: React.FC<CommunityEventsPanelProps> = ({
  handle,
  instanceId,
  instanceTitle,
  isOwner,
  isMember,
  ownerUsername,
  onBackToCommunity,
}) => {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const { t } = useTranslation();
  const googleMeetDefault = t('community.eventsPanel.googleMeetDefault');
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CommunityEventItem[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formTitle, setFormTitle] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formStarts, setFormStarts] = useState('');
  const [formEnds, setFormEnds] = useState('');
  const [formTimezone] = useState('Europe/Moscow');
  const [formRepeat, setFormRepeat] = useState('none');
  const [formLocType, setFormLocType] = useState<'place' | 'online'>('online');
  const [formLocLabel, setFormLocLabel] = useState('');
  const [formLocAddr, setFormLocAddr] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formRsvp, setFormRsvp] = useState(false);

  const load = useCallback(async () => {
    if (!token || !handle || !instanceId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API}/${encodeURIComponent(handle)}/events?instanceId=${encodeURIComponent(instanceId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      } else {
        setEvents([]);
      }
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [token, handle, instanceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const upcoming = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return events
      .filter((e) => new Date(e.startsAt).getTime() >= startOfToday.getTime())
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }, [events]);

  const grouped = useMemo(() => {
    const map = new Map<string, CommunityEventItem[]>();
    for (const ev of upcoming) {
      const key = new Date(ev.startsAt).toDateString();
      const list = map.get(key) || [];
      list.push(ev);
      map.set(key, list);
    }
    return Array.from(map.entries()).map(([k, list]) => {
      const d = new Date(list[0].startsAt);
      const today = new Date();
      const sameDay =
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate();
      const md = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return {
        key: k,
        label: sameDay ? `${md} / ${t('community.eventsPanel.today')}` : md,
        items: list,
      };
    });
  }, [upcoming, t]);

  const openCreate = () => {
    setEditingId(null);
    const now = new Date();
    const end = new Date(now.getTime() + 60 * 60 * 1000);
    setFormTitle('');
    setFormImageUrl('');
    setFormStarts(toInputLocal(now.toISOString()));
    setFormEnds(toInputLocal(end.toISOString()));
    setFormRepeat('none');
    setFormLocType('online');
    setFormLocLabel(googleMeetDefault);
    setFormLocAddr('');
    setFormDesc('');
    setFormRsvp(false);
    setModalOpen(true);
  };

  const openEdit = (ev: CommunityEventItem) => {
    setEditingId(ev._id);
    setFormTitle(ev.title);
    setFormImageUrl(ev.imageUrl || '');
    setFormStarts(toInputLocal(ev.startsAt));
    setFormEnds(toInputLocal(ev.endsAt));
    setFormRepeat(ev.repeatRule || 'none');
    setFormLocType(ev.locationType === 'place' ? 'place' : 'online');
    setFormLocLabel(ev.locationLabel || googleMeetDefault);
    setFormLocAddr(ev.locationAddress || '');
    setFormDesc(ev.description || '');
    setFormRsvp(ev.allowRsvp);
    setModalOpen(true);
  };

  const submitModal = async () => {
    if (!token || !formTitle.trim()) return;
    setSaving(true);
    try {
      const body = {
        instanceId,
        title: formTitle.trim(),
        description: formDesc,
        imageUrl: formImageUrl.trim(),
        startsAt: new Date(formStarts).toISOString(),
        endsAt: new Date(formEnds).toISOString(),
        timezone: formTimezone,
        repeatRule: formRepeat,
        locationType: formLocType,
        locationLabel: formLocLabel,
        locationAddress: formLocAddr,
        allowRsvp: formRsvp,
        hostUserId: user?.id ? String(user.id) : undefined,
      };
      if (editingId) {
        const res = await fetch(`${API}/${encodeURIComponent(handle)}/events/${editingId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          showToast((err as { message?: string }).message || t('community.eventsPanel.saveFailed'), 'error');
          return;
        }
        showToast(t('community.eventsPanel.updatedToast'));
      } else {
        const res = await fetch(`${API}/${encodeURIComponent(handle)}/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          showToast((err as { message?: string }).message || t('community.eventsPanel.createFailed'), 'error');
          return;
        }
        showToast(t('community.eventsPanel.createdToast'));
      }
      setModalOpen(false);
      await load();
    } catch {
      showToast(t('community.eventsPanel.networkError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!token) return;
    const confirmed = await confirm({
      title: t('community.eventsPanel.deleteTitle'),
      message: t('community.eventsPanel.deleteMessage'),
      confirmLabel: t('community.eventsPanel.deleteConfirm'),
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(
        `${API}/${encodeURIComponent(handle)}/events/${id}?instanceId=${encodeURIComponent(instanceId)}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast((err as { message?: string }).message || t('community.eventsPanel.deleteFailed'), 'error');
        return;
      }
      await load();
      showToast(t('community.eventsPanel.deletedToast'));
    } catch {
      showToast(t('community.eventsPanel.networkError'), 'error');
    }
  };

  const shareEvent = (ev: CommunityEventItem) => {
    const link = `${window.location.origin}${communityPath(handle)}`;
    void navigator.clipboard.writeText(link).then(
      () => showToast(t('community.eventsPanel.linkCopied', { title: ev.title })),
      () => showToast(t('community.eventsPanel.copyFailed'), 'error')
    );
  };

  const title = instanceTitle || t('community.eventsPanel.titleFallback');

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[#e7e7e7] bg-white">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#ececec] px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={onBackToCommunity}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-100"
            aria-label={t('community.eventsPanel.back')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
            <Star className="h-5 w-5" fill="currentColor" strokeWidth={1.5} />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-neutral-900">
              {isOwner && editMode ? t('community.eventsPanel.editingTitle') : title}
            </h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
            title={t('community.eventsPanel.copyLink')}
            onClick={() =>
              void navigator.clipboard
                .writeText(`${window.location.origin}${communityPath(handle)}`)
                .catch(() => {})
            }
          >
            <Link2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
            title={t('community.eventsPanel.people')}
          >
            <Users className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
            title={t('community.eventsPanel.notifications')}
          >
            <Bell className="h-4 w-4" />
          </button>
          {isOwner && (
            <button
              type="button"
              onClick={() => setEditMode((v) => !v)}
              className="ml-1 flex items-center gap-1.5 rounded-xl bg-[#315efb] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2547c4]"
            >
              <Pencil className="h-4 w-4" />
              {editMode ? t('community.eventsPanel.done') : t('community.eventsPanel.edit')}
            </button>
          )}
          {isOwner && editMode && (
            <span className="ml-1 flex h-9 w-9 items-center justify-center text-neutral-400" title={t('community.eventsPanel.owner')}>
              <Lock className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between border-b border-[#ececec] px-4 py-2">
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
        >
          {t('community.eventsPanel.upcomingEvents')}
          <ChevronDown className="h-4 w-4 text-neutral-500" />
        </button>
        {isOwner && editMode && (
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-xl bg-[#315efb] px-3 py-2 text-sm font-semibold text-white hover:bg-[#2547c4]"
          >
            <Plus className="h-4 w-4" />
            {t('community.eventsPanel.createEvent')}
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-[#315efb]" />
          </div>
        ) : upcoming.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <Calendar className="mb-4 h-20 w-20 text-neutral-200" strokeWidth={1.1} />
            <p className="text-lg font-semibold text-neutral-900">{t('community.eventsPanel.noUpcoming')}</p>
            {isOwner && editMode ? (
              <>
                <p className="mt-2 max-w-sm text-sm text-neutral-500">{t('community.eventsPanel.emptyOwnerHint')}</p>
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-8 w-full max-w-sm rounded-2xl bg-[#315efb] py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#2547c4]"
                >
                  {t('community.eventsPanel.createEvent')}
                </button>
              </>
            ) : (
              <>
                <p className="mt-2 max-w-sm text-sm text-neutral-500">
                  {t('community.eventsPanel.emptyMemberHint')}
                </p>
                {isOwner && !editMode && (
                  <p className="mt-3 text-sm text-neutral-600">
                    {t('community.eventsPanel.emptyOwnerEditHint', { edit: t('community.eventsPanel.edit') })}
                  </p>
                )}
                {!isOwner && isMember && ownerUsername ? (
                  <Link
                    to={`/@${ownerUsername}`}
                    className="mt-8 flex w-full max-w-sm items-center justify-center rounded-2xl bg-[#315efb] py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#2547c4]"
                  >
                    {t('community.eventsPanel.dmCreator')}
                  </Link>
                ) : null}
                {!isOwner && !isMember && (
                  <p className="mt-6 text-sm text-neutral-400">{t('community.eventsPanel.joinToContact')}</p>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="px-4 py-4">
            {grouped.map((g) => (
              <div key={g.key} className="mb-8">
                <p className="mb-3 text-sm font-semibold text-neutral-600">{g.label}</p>
                <div className="space-y-0 divide-y divide-[#ececec] rounded-2xl border border-[#ececec] bg-white">
                  {g.items.map((ev) => (
                    <div key={ev._id} className="flex gap-4 p-4">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-lime-300 to-violet-400">
                        {ev.imageUrl ? (
                          <img src={ev.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-semibold text-neutral-700">
                            {ev.host ? initials(ev.host.fullName || ev.host.username) : '??'}
                          </span>
                          <span className="font-medium text-neutral-700">
                            {ev.host?.username || t('community.eventsPanel.hostFallback')}
                          </span>
                        </div>
                        <p className="mt-1 text-lg font-bold text-neutral-900">{ev.title}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatTime(ev.startsAt)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Video className="h-4 w-4 text-emerald-600" />
                            {ev.locationLabel}
                          </span>
                        </div>
                        {ev.description ? (
                          <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{ev.description}</p>
                        ) : null}
                        {isOwner && editMode && (
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(ev)}
                              className="text-sm font-medium text-[#315efb] hover:underline"
                            >
                              {t('community.eventsPanel.edit')}
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteEvent(ev._id)}
                              className="text-sm font-medium text-red-600 hover:underline"
                            >
                              {t('community.eventsPanel.delete')}
                            </button>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => shareEvent(ev)}
                        className="flex shrink-0 items-center gap-1 self-start text-sm font-semibold text-[#315efb] hover:underline"
                      >
                        <Share2 className="h-4 w-4" />
                        {t('community.eventsPanel.share')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ResponsiveDialogShell
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? t('community.eventsPanel.editEvent') : t('community.eventsPanel.createEvent')}
        disableClose={saving}
        zIndexClass="z-[200]"
        panelClassName="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-xl"
      >
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-4 py-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                aria-label={t('community.eventsPanel.close')}
              >
                <X className="h-4 w-4" />
              </button>
              <h2 className="text-base font-semibold text-neutral-900">
                {editingId ? t('community.eventsPanel.editEvent') : t('community.eventsPanel.createEvent')}
              </h2>
              <span className="w-9" />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <div className="mb-5 overflow-hidden rounded-xl bg-gradient-to-br from-lime-300 to-violet-400">
                <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 p-5">
                  <p className="text-sm font-medium text-white drop-shadow">{t('community.eventsPanel.coverImageUrl')}</p>
                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder={t('community.eventsPanel.coverImagePh')}
                    className="w-full max-w-sm rounded-lg border border-white/60 bg-white/95 px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-500"
                  />
                </div>
              </div>

              <label className="block text-xs font-medium text-neutral-500">{t('community.eventsPanel.eventName')}</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={t('community.eventsPanel.eventNamePh')}
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-[#315efb]"
              />

              <p className="mt-4 text-xs font-medium text-neutral-500">
                {t('community.eventsPanel.dateTimeLabel', { timezone: formTimezone })}
              </p>
              <div className="mt-2 space-y-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                <div className="flex gap-3">
                  <div className="flex w-4 flex-col items-center pt-1">
                    <span className="h-2 w-2 rounded-full bg-neutral-400" />
                    <span className="min-h-[24px] w-px flex-1 border-l border-dotted border-neutral-300" />
                    <span className="h-2 w-2 rounded-full border-2 border-neutral-400 bg-white" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div>
                      <p className="text-xs text-neutral-500">{t('community.eventsPanel.start')}</p>
                      <input
                        type="datetime-local"
                        value={formStarts}
                        onChange={(e) => setFormStarts(e.target.value)}
                        className="mt-0.5 w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">{t('community.eventsPanel.end')}</p>
                      <input
                        type="datetime-local"
                        value={formEnds}
                        onChange={(e) => setFormEnds(e.target.value)}
                        className="mt-0.5 w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <label className="mt-4 block text-xs font-medium text-neutral-500">{t('community.eventsPanel.repeat')}</label>
              <select
                value={formRepeat}
                onChange={(e) => setFormRepeat(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm"
              >
                <option value="none">{t('community.eventsPanel.repeatNone')}</option>
                <option value="daily">{t('community.eventsPanel.repeatDaily')}</option>
                <option value="weekly">{t('community.eventsPanel.repeatWeekly')}</option>
              </select>

              <label className="mt-4 block text-xs font-medium text-neutral-500">{t('community.eventsPanel.location')}</label>
              <select
                value={formLocType}
                onChange={(e) => setFormLocType(e.target.value === 'place' ? 'place' : 'online')}
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm"
              >
                <option value="online">{t('community.eventsPanel.locationOnline')}</option>
                <option value="place">{t('community.eventsPanel.locationPlace')}</option>
              </select>
              <input
                type="text"
                value={formLocLabel}
                onChange={(e) => setFormLocLabel(e.target.value)}
                placeholder={googleMeetDefault}
                className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm"
              />
              <input
                type="text"
                value={formLocAddr}
                onChange={(e) => setFormLocAddr(e.target.value)}
                placeholder={t('community.eventsPanel.addressPh')}
                className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm"
              />

              <label className="mt-4 block text-xs font-medium text-neutral-500">{t('community.eventsPanel.description')}</label>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={4}
                placeholder={t('community.eventsPanel.descriptionPh')}
                className="mt-1 w-full resize-y rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm"
              />

              <div className="mt-4 flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3">
                <div>
                  <p className="text-sm font-medium text-neutral-900">{t('community.eventsPanel.allowRsvp')}</p>
                  <p className="text-xs text-neutral-500">
                    {t('community.eventsPanel.allowRsvpHint')}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formRsvp}
                  onClick={() => setFormRsvp((v) => !v)}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${formRsvp ? 'bg-[#315efb]' : 'bg-neutral-300'}`}
                >
                  <span
                    className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${formRsvp ? 'left-5' : 'left-0.5'}`}
                  />
                </button>
              </div>
            </div>
            <div className="flex shrink-0 gap-2 border-t border-neutral-200 p-4">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 rounded-xl border border-neutral-200 py-3 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
              >
                {t('community.eventsPanel.cancel')}
              </button>
              <button
                type="button"
                disabled={saving || !formTitle.trim()}
                onClick={() => void submitModal()}
                className="flex-1 rounded-xl bg-[#315efb] py-3 text-sm font-semibold text-white hover:bg-[#2547c4] disabled:opacity-50"
              >
                {saving
                  ? t('community.eventsPanel.saving')
                  : editingId
                    ? t('community.eventsPanel.save')
                    : t('community.eventsPanel.create')}
              </button>
            </div>
          </div>
      </ResponsiveDialogShell>
    </div>
  );
};

export default CommunityEventsPanel;
