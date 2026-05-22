import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import ResponsiveDialogShell from '../Common/ResponsiveDialogShell';
import {
  PROFILE_BG_EMOJIS,
  PROFILE_HEADER_BG_DISABLED,
  PROFILE_NAME_COLORS,
  PROFILE_STATUS_ICONS,
  isAllowedProfileBgEmoji,
  isAllowedProfileNameColor,
  normalizeProfileStatusIcon,
} from '../../constants/profileCustomization';
import { hasProSubscription, saveStoredPlanTier } from '../../utils/userPlan';

export interface ProfileCustomizationDraft {
  profileStatusIcon: string;
  profileNameColor: string;
  profileBgEmoji: string;
}

interface ProfilePremiumStyleModalProps {
  open: boolean;
  initial: ProfileCustomizationDraft;
  saving: boolean;
  onClose: () => void;
  onSave: (draft: ProfileCustomizationDraft) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const ProfilePremiumStyleModal: React.FC<ProfilePremiumStyleModalProps> = ({
  open,
  initial,
  saving,
  onClose,
  onSave,
  t,
}) => {
  const [draft, setDraft] = useState(initial);
  const [isPro, setIsPro] = useState(hasProSubscription);

  useEffect(() => {
    if (open) {
      setDraft(initial);
      setIsPro(hasProSubscription());
    }
  }, [open, initial]);

  useEffect(() => {
    const syncPlan = () => setIsPro(hasProSubscription());
    window.addEventListener('planTierChanged', syncPlan);
    window.addEventListener('storage', syncPlan);
    return () => {
      window.removeEventListener('planTierChanged', syncPlan);
      window.removeEventListener('storage', syncPlan);
    };
  }, []);

  const handlePlanToggle = (nextPro: boolean) => {
    saveStoredPlanTier(nextPro ? 'pro' : 'free');
    setIsPro(nextPro);
  };

  const handleSave = () => {
    if (!isPro) return;
    const profileNameColor = isAllowedProfileNameColor(draft.profileNameColor)
      ? draft.profileNameColor
      : '';
    const profileBgEmoji =
      draft.profileBgEmoji && isAllowedProfileBgEmoji(draft.profileBgEmoji)
        ? draft.profileBgEmoji
        : '';
    onSave({
      profileStatusIcon: normalizeProfileStatusIcon(draft.profileStatusIcon),
      profileNameColor,
      profileBgEmoji,
      ...PROFILE_HEADER_BG_DISABLED,
    });
  };

  const lockedClass = isPro ? '' : 'pointer-events-none select-none opacity-[0.42]';

  const body = (
    <div className="flex max-h-[min(85dvh,720px)] flex-col lg:max-h-[80vh]">
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 pb-3 lg:pb-4">
        <h2 className="text-lg font-semibold text-neutral-900">{t('userProfile.premiumModal.title')}</h2>
        <button
          type="button"
          onClick={onClose}
          className="hidden h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 lg:flex"
          aria-label={t('common.close')}
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-4">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50/80 px-3 py-3">
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              {t('userProfile.premiumModal.planToggleLabel')}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">
              {t('userProfile.premiumModal.planToggleHint')}
            </p>
          </div>
          <label className="flex shrink-0 cursor-pointer items-center gap-2">
            <span
              className={`text-xs font-semibold ${!isPro ? 'text-neutral-900' : 'text-neutral-400'}`}
            >
              {t('userProfile.premiumModal.planFree')}
            </span>
            <span className="relative inline-flex h-7 w-12 items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={isPro}
                onChange={(e) => handlePlanToggle(e.target.checked)}
                aria-label={t('userProfile.premiumModal.planToggleLabel')}
              />
              <span className="absolute inset-0 rounded-full bg-neutral-300 transition-colors peer-checked:bg-violet-600 peer-focus-visible:ring-2 peer-focus-visible:ring-violet-500/40" />
              <span className="absolute left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
            </span>
            <span
              className={`text-xs font-semibold ${isPro ? 'text-violet-700' : 'text-neutral-400'}`}
            >
              {t('userProfile.premiumModal.planPro')}
            </span>
          </label>
        </div>

        {!isPro ? (
          <p className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2.5 text-xs leading-relaxed text-amber-950">
            {t('userProfile.premiumModal.proRequired')}{' '}
            <Link to="/plan" onClick={onClose} className="font-semibold text-violet-700 underline">
              {t('userProfile.premiumModal.viewPlans')}
            </Link>
          </p>
        ) : null}

        <div className={`mt-5 space-y-6 ${lockedClass}`} aria-disabled={!isPro}>
          <section>
            <h3 className="text-sm font-semibold text-neutral-900">
              {t('userProfile.premiumModal.statusIcon')}
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              {t('userProfile.premiumModal.statusIconHint')}
            </p>
            <div className="mt-2 grid grid-cols-6 gap-2">
              <button
                type="button"
                disabled={saving || !isPro}
                tabIndex={isPro ? 0 : -1}
                onClick={() => setDraft((d) => ({ ...d, profileStatusIcon: '' }))}
                className={`rounded-xl border py-1 text-xs font-medium ${
                  !draft.profileStatusIcon
                    ? 'border-violet-500 bg-violet-50 text-violet-800'
                    : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                }`}
              >
                {t('userProfile.premiumModal.none')}
              </button>
              {PROFILE_STATUS_ICONS.map((status) => {
                const selected = draft.profileStatusIcon === status.id;
                const label = t(`userProfile.premiumModal.statusIcons.${status.labelKey}`);
                return (
                  <button
                    key={status.id}
                    type="button"
                    disabled={saving || !isPro}
                    tabIndex={isPro ? 0 : -1}
                    onClick={() => setDraft((d) => ({ ...d, profileStatusIcon: status.id }))}
                    className={`flex aspect-square items-center justify-center rounded-xl border p-1 transition-colors ${
                      selected
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                    title={label}
                    aria-label={label}
                  >
                    <img
                      src={status.imageUrl}
                      alt=""
                      className="h-full w-full object-contain"
                      draggable={false}
                    />
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-neutral-900">
              {t('userProfile.premiumModal.nameColor')}
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {PROFILE_NAME_COLORS.map((c) => {
                const selected = draft.profileNameColor === c.hex;
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={saving || !isPro}
                    tabIndex={isPro ? 0 : -1}
                    onClick={() => setDraft((d) => ({ ...d, profileNameColor: c.hex }))}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-transform ${
                      selected ? 'border-violet-500 scale-110' : 'border-neutral-200'
                    }`}
                    title={t(`userProfile.premiumModal.colors.${c.labelKey}`)}
                    aria-label={t(`userProfile.premiumModal.colors.${c.labelKey}`)}
                  >
                    <span
                      className="h-6 w-6 rounded-full border border-neutral-200/80"
                      style={{ backgroundColor: c.hex || '#171717' }}
                    />
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-neutral-900">
              {t('userProfile.premiumModal.bgEmoji')}
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              {t('userProfile.premiumModal.bgEmojiHint')}
            </p>
            <div className="mt-2 grid grid-cols-7 gap-2">
              <button
                type="button"
                disabled={saving || !isPro}
                tabIndex={isPro ? 0 : -1}
                onClick={() => setDraft((d) => ({ ...d, profileBgEmoji: '' }))}
                className={`rounded-xl border py-2 text-xs font-medium ${
                  !draft.profileBgEmoji
                    ? 'border-violet-500 bg-violet-50 text-violet-800'
                    : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                }`}
              >
                {t('userProfile.premiumModal.none')}
              </button>
              {PROFILE_BG_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  disabled={saving || !isPro}
                  tabIndex={isPro ? 0 : -1}
                  onClick={() => setDraft((d) => ({ ...d, profileBgEmoji: emoji }))}
                  className={`rounded-xl border py-1 text-2xl transition-colors ${
                    draft.profileBgEmoji === emoji
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="shrink-0 border-t border-neutral-100 pt-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !isPro}
          className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {saving ? t('userProfile.premiumModal.saving') : t('userProfile.premiumModal.save')}
        </button>
      </div>
    </div>
  );

  return (
    <ResponsiveDialogShell
      open={open}
      onClose={onClose}
      title={t('userProfile.premiumModal.title')}
      sheetPadded
      zIndexClass="z-[300]"
      panelClassName="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white p-5 shadow-2xl"
      disableClose={saving}
    >
      {body}
    </ResponsiveDialogShell>
  );
};

export default ProfilePremiumStyleModal;
