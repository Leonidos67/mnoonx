import React, { useMemo, useState } from 'react';
import { ArrowRight, Check, PartyPopper } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, type AppLocale } from '../../context/LanguageContext';
import { useTranslation } from '../../i18n/useTranslation';
import { AUTH_API } from '../../config/api';
import ConfettiBurst from './ConfettiBurst';

const LOCALES: AppLocale[] = ['en', 'ru'];
const SOURCES = [
  'friend',
  'social',
  'search',
  'youtube',
  'telegram',
  'discord',
  'podcast',
  'article',
  'event',
  'other',
] as const;
const GOALS = [
  'build_community',
  'find_communities',
  'create_courses',
  'collaborate',
  'explore',
] as const;

type SourceId = (typeof SOURCES)[number];
type GoalId = (typeof GOALS)[number];

const STEP_COUNT = 5;

/**
 * Full-screen post-registration welcome:
 * language → intro → source → goals → done.
 */
const WelcomeOnboarding: React.FC = () => {
  const { user, token, setUser, loading } = useAuth();
  const { locale, setLocale } = useLanguage();
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [pickedLocale, setPickedLocale] = useState<AppLocale | null>(null);
  const [source, setSource] = useState<SourceId | null>(null);
  const [goals, setGoals] = useState<GoalId[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const open = Boolean(
    !loading && user && token && user.welcomeOnboardingCompleted === false
  );

  const displayName = useMemo(() => {
    const raw = (user?.fullName || user?.username || '').trim();
    return raw || 'there';
  }, [user]);

  const activeLocale = pickedLocale || locale;

  const selectLocale = (next: AppLocale) => {
    setPickedLocale(next);
    setLocale(next);
  };

  const toggleGoal = (id: GoalId) => {
    setGoals((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  };

  const finish = async () => {
    if (!token || !source) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${AUTH_API}/welcome-onboarding`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source, goals }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { message?: string }).message || t('welcomeOnboarding.saveFailed'));
      }
      if (data.user) setUser(data.user);
      else setUser(user ? { ...user, welcomeOnboardingCompleted: true } : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('welcomeOnboarding.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white px-4 py-8">
      <ConfettiBurst active={step === 4} />
      <div className="relative z-10 flex w-full max-w-xl flex-col rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-2">
          {Array.from({ length: STEP_COUNT }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-[#315efb]' : 'bg-neutral-200'
              }`}
            />
          ))}
        </div>

        {step === 0 ? (
          <>
            <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">
              {t('welcomeOnboarding.languageTitle')}
            </h2>
            <p className="mt-1.5 text-sm text-neutral-500">{t('welcomeOnboarding.languageHint')}</p>
            <div className="mt-5 flex flex-col gap-2">
              {LOCALES.map((id) => {
                const selected = activeLocale === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectLocale(id)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                      selected
                        ? 'border-[#315efb] bg-[#eef2ff] text-[#315efb]'
                        : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300'
                    }`}
                  >
                    {t(`welcomeOnboarding.languages.${id}`)}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                if (!pickedLocale) setLocale(locale);
                setStep(1);
              }}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#315efb] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2547c4]"
            >
              {t('welcomeOnboarding.continue')}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#315efb]">
              {t('welcomeOnboarding.brand')}
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              {t('welcomeOnboarding.hello', { name: displayName })}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600 sm:text-base">
              {t('welcomeOnboarding.intro')}
            </p>
            <div className="mt-8 flex gap-2">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                {t('welcomeOnboarding.back')}
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#315efb] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2547c4]"
              >
                {t('welcomeOnboarding.continue')}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">
              {t('welcomeOnboarding.sourceTitle')}
            </h2>
            <p className="mt-1.5 text-sm text-neutral-500">{t('welcomeOnboarding.sourceHint')}</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {SOURCES.map((id) => {
                const selected = source === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSource(id)}
                    className={`rounded-2xl border px-3 py-3 text-left text-sm font-medium transition-colors sm:px-4 ${
                      selected
                        ? 'border-[#315efb] bg-[#eef2ff] text-[#315efb]'
                        : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300'
                    }`}
                  >
                    {t(`welcomeOnboarding.sources.${id}`)}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                {t('welcomeOnboarding.back')}
              </button>
              <button
                type="button"
                disabled={!source}
                onClick={() => setStep(3)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#315efb] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2547c4] disabled:opacity-50"
              >
                {t('welcomeOnboarding.continue')}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">
              {t('welcomeOnboarding.goalsTitle')}
            </h2>
            <p className="mt-1.5 text-sm text-neutral-500">{t('welcomeOnboarding.goalsHint')}</p>
            <div className="mt-5 flex flex-col gap-2">
              {GOALS.map((id) => {
                const selected = goals.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleGoal(id)}
                    className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                      selected
                        ? 'border-[#315efb] bg-[#eef2ff] text-[#315efb]'
                        : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300'
                    }`}
                  >
                    <span>{t(`welcomeOnboarding.goals.${id}`)}</span>
                    {selected ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : null}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                {t('welcomeOnboarding.back')}
              </button>
              <button
                type="button"
                disabled={goals.length === 0}
                onClick={() => setStep(4)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#315efb] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2547c4] disabled:opacity-50"
              >
                {t('welcomeOnboarding.continue')}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#315efb]">
              <PartyPopper className="h-6 w-6" aria-hidden />
            </div>
            <h2 className="mt-4 text-xl font-bold text-neutral-900 sm:text-2xl">
              {t('welcomeOnboarding.doneTitle', { name: displayName })}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600 sm:text-base">
              {t('welcomeOnboarding.doneBody')}
            </p>
            {error ? (
              <p className="mt-3 text-sm text-red-500" role="alert">
                {error}
              </p>
            ) : null}
            <div className="mt-8 flex gap-2">
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={saving}
                className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                {t('welcomeOnboarding.back')}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void finish()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#315efb] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2547c4] disabled:opacity-50"
              >
                {saving ? t('welcomeOnboarding.saving') : t('welcomeOnboarding.finish')}
                {!saving ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default WelcomeOnboarding;
