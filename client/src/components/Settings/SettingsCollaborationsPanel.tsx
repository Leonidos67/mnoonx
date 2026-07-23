import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n/useTranslation';
import { USERS_API } from '../../config/api';

type CollabPrivacy = 'everyone' | 'friends' | 'request' | 'off';

interface IncomingRequest {
  id: string;
  name: string;
  description: string;
  fromUser: { id: string; username: string; fullName: string; avatar: string } | null;
}

const MODES: CollabPrivacy[] = ['everyone', 'friends', 'request', 'off'];

const SettingsCollaborationsPanel: React.FC = () => {
  const { token } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<CollabPrivacy>('everyone');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [incoming, setIncoming] = useState<IncomingRequest[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [privRes, reqRes] = await Promise.all([
        fetch(`${USERS_API}/me/collaboration-privacy`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${USERS_API}/me/collaboration-requests?tab=incoming`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (privRes.ok) {
        const data = await privRes.json();
        setMode((data.collaborationPrivacy as CollabPrivacy) || 'everyone');
      }
      if (reqRes.ok) {
        const data = await reqRes.json();
        setIncoming(Array.isArray(data.requests) ? data.requests : []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveMode = async (next: CollabPrivacy) => {
    if (!token) return;
    setMode(next);
    setSaving(true);
    try {
      const res = await fetch(`${USERS_API}/me/collaboration-privacy`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ collaborationPrivacy: next }),
      });
      if (!res.ok) throw new Error('fail');
      showToast(t('settings.collaborationsSaved'));
    } catch {
      showToast(t('settings.collaborationsSaveFailed'), 'error');
      void load();
    } finally {
      setSaving(false);
    }
  };

  const respond = async (id: string, action: 'accept' | 'decline') => {
    if (!token) return;
    setBusyId(id);
    try {
      const res = await fetch(`${USERS_API}/me/collaboration-requests/${id}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { message?: string }).message || 'fail');
      if (action === 'accept' && data.community?.handle) {
        showToast(t('settings.collaborationsAccepted'));
        navigate(`/community/${data.community.handle}`);
        return;
      }
      showToast(t('settings.collaborationsDeclined'));
      setIncoming((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      showToast(e instanceof Error ? e.message : t('settings.collaborationsActionFailed'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h2 className="text-2xl font-bold">{t('settings.collaborationsHeading')}</h2>
      <p className="mt-1 text-sm text-neutral-500">{t('settings.collaborationsHint')}</p>

      {loading ? (
        <p className="mt-8 text-sm text-neutral-500">{t('settings.collaborationsLoading')}</p>
      ) : (
        <>
          <div className="mt-8 space-y-3">
            <p className="text-sm font-semibold text-neutral-900">
              {t('settings.collaborationsWhoCanInvite')}
            </p>
            {MODES.map((m) => (
              <label
                key={m}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
                  mode === m
                    ? 'border-[#315efb] bg-[#eef2ff]'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                } ${saving ? 'opacity-70' : ''}`}
              >
                <input
                  type="radio"
                  name="collab-privacy"
                  className="mt-1"
                  checked={mode === m}
                  disabled={saving}
                  onChange={() => void saveMode(m)}
                />
                <span>
                  <span className="block text-sm font-semibold text-neutral-900">
                    {t(`settings.collaborationsMode.${m}.title`)}
                  </span>
                  <span className="mt-0.5 block text-sm text-neutral-500">
                    {t(`settings.collaborationsMode.${m}.desc`)}
                  </span>
                </span>
              </label>
            ))}
          </div>

          <div className="mt-10">
            <p className="text-sm font-semibold text-neutral-900">
              {t('settings.collaborationsIncoming')}
            </p>
            {incoming.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-500">{t('settings.collaborationsIncomingEmpty')}</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {incoming.map((req) => (
                  <li
                    key={req.id}
                    className="rounded-2xl border border-neutral-200 bg-white p-4"
                  >
                    <p className="font-semibold text-neutral-900">{req.name}</p>
                    <p className="mt-0.5 text-sm text-neutral-500">
                      {t('settings.collaborationsFrom', {
                        name: req.fromUser?.fullName || req.fromUser?.username || '—',
                      })}
                    </p>
                    {req.description ? (
                      <p className="mt-2 text-sm text-neutral-600">{req.description}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busyId === req.id}
                        onClick={() => void respond(req.id, 'accept')}
                        className="rounded-full bg-[#315efb] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#2547c4] disabled:opacity-50"
                      >
                        {t('settings.collaborationsAccept')}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === req.id}
                        onClick={() => void respond(req.id, 'decline')}
                        className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
                      >
                        {t('settings.collaborationsDecline')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SettingsCollaborationsPanel;
