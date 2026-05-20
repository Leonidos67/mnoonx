import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n/useTranslation';
import SimpleWizard, { WizardStep } from '../Common/SimpleWizard';

import { COMMUNITIES_API as API_URL } from '../../config/api';

export type CommunityWizardVariant = 'personal' | 'business';

function slugifyHandle(name: string): string {
  const s = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return s || 'community';
}

interface CommunityCreateWizardProps {
  variant: CommunityWizardVariant;
}

const CommunityCreateWizard: React.FC<CommunityCreateWizardProps> = ({ variant }) => {
  const { token } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const steps = useMemo((): WizardStep[] => {
    if (variant === 'business') {
      return [
        {
          id: 'name',
          title: t('newPage.wizard.steps.businessNameTitle'),
          subtitle: t('newPage.wizard.steps.businessNameSub'),
        },
        {
          id: 'about',
          title: t('newPage.wizard.steps.businessAboutTitle'),
          subtitle: t('newPage.wizard.steps.businessAboutSub'),
        },
        {
          id: 'visibility',
          title: t('newPage.wizard.steps.visibilityTitle'),
          subtitle: t('newPage.wizard.steps.visibilitySub'),
        },
      ];
    }
    return [
      {
        id: 'name',
        title: t('newPage.wizard.steps.personalNameTitle'),
        subtitle: t('newPage.wizard.steps.personalNameSub'),
      },
      {
        id: 'about',
        title: t('newPage.wizard.steps.personalAboutTitle'),
        subtitle: t('newPage.wizard.steps.personalAboutSub'),
      },
      {
        id: 'visibility',
        title: t('newPage.wizard.steps.visibilityTitle'),
        subtitle: t('newPage.wizard.steps.visibilitySub'),
      },
    ];
  }, [t, variant]);

  const headerLabel =
    variant === 'business' ? t('newPage.wizard.businessHeader') : t('newPage.wizard.personalHeader');

  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [hasWebsite, setHasWebsite] = useState(false);
  const [website, setWebsite] = useState('');
  const [communityType, setCommunityType] = useState<'private' | 'public'>('private');
  const [loading, setLoading] = useState(false);

  const handlePreview = useMemo(() => slugifyHandle(name), [name]);

  const buildDescription = useCallback(() => {
    let d = description.trim();
    if (variant === 'business' && hasWebsite && website.trim()) {
      d = d ? `${d}\n\nWebsite: ${website.trim()}` : `Website: ${website.trim()}`;
    }
    return d;
  }, [description, hasWebsite, variant, website]);

  const canNext = useMemo(() => {
    if (stepIndex === 0) return name.trim().length >= 2;
    if (stepIndex === 1) return description.trim().length >= 10;
    return true;
  }, [description, name, stepIndex]);

  const handleBack = useCallback(() => {
    if (stepIndex === 0) navigate('/new');
    else setStepIndex((i) => i - 1);
  }, [navigate, stepIndex]);

  const createCommunity = useCallback(async () => {
    const trimmedName = name.trim();
    const desc = buildDescription();
    if (!trimmedName || !desc) return;

    if (!token) {
      window.dispatchEvent(new CustomEvent('openLogin'));
      return;
    }

    const baseHandle = slugifyHandle(trimmedName);
    if (!/^[a-zA-Z0-9-]+$/.test(baseHandle)) {
      showToast(t('newPage.wizard.toastInvalidHandle'), 'info');
      return;
    }

    setLoading(true);
    try {
      let handle = baseHandle;
      for (let attempt = 0; attempt < 30; attempt++) {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: trimmedName,
            handle,
            description: desc,
            category: 'Other',
            isPublic: communityType === 'public',
          }),
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          navigate(`/community/${handle}`);
          return;
        }

        const msg = (data as { message?: string }).message || '';
        if (msg.includes('already taken') || msg.toLowerCase().includes('handle')) {
          handle = `${baseHandle}-${attempt + 2}`;
          if (!/^[a-zA-Z0-9-]+$/.test(handle)) break;
          continue;
        }
        throw new Error(msg || t('createCommunity.toastCreateFailed'));
      }
      showToast(t('newPage.wizard.toastNoUrl'), 'error');
    } catch (e) {
      showToast(e instanceof Error ? e.message : t('createCommunity.toastGenericError'), 'error');
    } finally {
      setLoading(false);
    }
  }, [buildDescription, communityType, name, navigate, token, showToast, t]);

  const handleNext = useCallback(() => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
      return;
    }
    void createCommunity();
  }, [createCommunity, stepIndex, steps.length]);

  const stepId = steps[stepIndex]?.id;

  return (
    <SimpleWizard
      steps={steps}
      stepIndex={stepIndex}
      onBack={handleBack}
      onNext={handleNext}
      canNext={canNext}
      finishLabel={t('createCommunity.submit')}
      loading={loading}
      headerLabel={headerLabel}
    >
      {stepId === 'name' && (
        <div className="space-y-4">
          <label className="block text-[15px] font-medium">
            {variant === 'business' ? t('newPage.wizard.businessName') : t('newPage.wizard.communityName')}
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              variant === 'business' ? t('newPage.wizard.businessNamePh') : t('newPage.wizard.communityNamePh')
            }
            className="h-[64px] w-full rounded-2xl border border-[#e5e5e5] bg-white px-5 text-[16px] focus:border-black focus:outline-none"
            autoFocus
          />
          {name.trim() && (
            <p className="text-[15px] text-[#666]">
              {t('newPage.wizard.urlPreview')}{' '}
              <span className="font-medium text-black">/community/{handlePreview}</span>
            </p>
          )}
        </div>
      )}

      {stepId === 'about' && (
        <div className="space-y-6">
          <div>
            <label className="mb-3 block text-[15px] font-medium">{t('newPage.wizard.description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                variant === 'business' ? t('newPage.wizard.businessDescPh') : t('newPage.wizard.personalDescPh')
              }
              className="min-h-[160px] w-full resize-none rounded-2xl border border-[#e5e5e5] bg-white p-5 text-[16px] focus:border-black focus:outline-none"
              autoFocus
            />
          </div>

          {variant === 'business' && (
            <div className="rounded-2xl border border-[#e5e5e5] bg-white p-5">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={hasWebsite}
                  onChange={() => setHasWebsite(!hasWebsite)}
                  className="h-5 w-5"
                />
                <span className="text-[15px] font-medium">{t('newPage.wizard.hasWebsite')}</span>
              </label>
              {hasWebsite && (
                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder={t('newPage.wizard.websitePh')}
                  className="mt-5 h-[60px] w-full rounded-2xl border border-[#e5e5e5] bg-[#fafafa] px-5 text-[16px] focus:border-black focus:outline-none"
                />
              )}
            </div>
          )}
        </div>
      )}

      {stepId === 'visibility' && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setCommunityType('private')}
            className={`relative rounded-3xl border bg-white p-6 text-left transition-all ${
              communityType === 'private' ? 'border-black' : 'border-[#e5e5e5] hover:border-[#cfcfcf]'
            }`}
          >
            {communityType === 'private' && (
              <span className="absolute right-4 top-4 flex h-7 items-center rounded-full bg-black px-3 text-xs font-medium text-white">
                {t('newPage.wizard.selected')}
              </span>
            )}
            <h3 className="text-[18px] font-semibold text-black">{t('newPage.wizard.private')}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-[#666]">
              {variant === 'business'
                ? t('newPage.wizard.privateBusinessDesc')
                : t('newPage.wizard.privatePersonalDesc')}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setCommunityType('public')}
            className={`relative rounded-3xl border bg-white p-6 text-left transition-all ${
              communityType === 'public' ? 'border-black' : 'border-[#e5e5e5] hover:border-[#cfcfcf]'
            }`}
          >
            {communityType === 'public' && (
              <span className="absolute right-4 top-4 flex h-7 items-center rounded-full bg-black px-3 text-xs font-medium text-white">
                {t('newPage.wizard.selected')}
              </span>
            )}
            <h3 className="text-[18px] font-semibold text-black">{t('newPage.wizard.public')}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-[#666]">
              {variant === 'business'
                ? t('newPage.wizard.publicBusinessDesc')
                : t('newPage.wizard.publicPersonalDesc')}
            </p>
          </button>
        </div>
      )}
    </SimpleWizard>
  );
};

export default CommunityCreateWizard;
