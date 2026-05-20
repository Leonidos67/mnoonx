import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, Lock, Link2 } from 'lucide-react';
import { useCommunityDashboard } from '../../context/CommunityDashboardContext';
import { communityPath, communityDashboardSettingsPath } from '../../constants/communityRoutes';
import { useTranslation } from '../../i18n/useTranslation';

const CommunityDashboardInvites: React.FC = () => {
  const { handle, community } = useCommunityDashboard();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  if (!community) return null;

  const inviteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${communityPath(community.handle)}`
      : communityPath(community.handle);

  const isPublic = community.isPublic !== false;
  const hasJoinCode = Boolean(community.joinCode?.trim());

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="min-h-full bg-white p-4 lg:p-8">
      <h1 className="text-2xl font-bold text-neutral-900">{t('communityDashboard.invites.title')}</h1>
      <p className="mt-1 text-sm text-neutral-500">{t('communityDashboard.invites.subtitle')}</p>

      <div className="mt-8 max-w-xl space-y-6">
        <section className="rounded-xl border border-neutral-200 p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
            <Link2 className="h-4 w-4" aria-hidden />
            {t('communityDashboard.invites.inviteLink')}
          </h2>
          <p className="mt-2 text-sm text-neutral-500">
            {isPublic ? t('communityDashboard.invites.inviteLinkPublic') : t('communityDashboard.invites.inviteLinkPrivate')}
          </p>
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-800"
            />
            <button
              type="button"
              onClick={() => void copyLink()}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#315efb] px-4 text-sm font-medium text-white hover:bg-[#2748c9]"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? t('communityDashboard.invites.copied') : t('communityDashboard.invites.copy')}
            </button>
          </div>
        </section>

        {!isPublic && (
          <section className="rounded-xl border border-neutral-200 p-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
              <Lock className="h-4 w-4" aria-hidden />
              {t('communityDashboard.invites.joinPassphrase')}
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              {hasJoinCode
                ? t('communityDashboard.invites.passphraseRequired')
                : t('communityDashboard.invites.passphraseNotSet')}
            </p>
            {hasJoinCode ? (
              <p className="mt-3 rounded-lg bg-neutral-100 px-3 py-2 font-mono text-sm text-neutral-700">
                {community.joinCode}
              </p>
            ) : null}
            <Link
              to={communityDashboardSettingsPath(handle)}
              className="mt-4 inline-block text-sm font-medium text-[#315efb] hover:underline"
            >
              {t('communityDashboard.invites.editInSettings')}
            </Link>
          </section>
        )}

        <section className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 text-sm text-neutral-600">
          <p>{t('communityDashboard.invites.membersHaveAccess', { count: community.memberCount })}</p>
        </section>
      </div>
    </div>
  );
};

export default CommunityDashboardInvites;
