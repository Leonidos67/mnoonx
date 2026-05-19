import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
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

const BUSINESS_STEPS: WizardStep[] = [
  {
    id: 'name',
    title: 'Name your hub',
    subtitle: 'Pick a business name. We will generate a unique URL from it.',
  },
  {
    id: 'about',
    title: 'Tell your story',
    subtitle: 'Add a short description so members know what your community is about.',
  },
  {
    id: 'visibility',
    title: 'Choose visibility',
    subtitle: 'You can change this later in community settings.',
  },
];

const PERSONAL_STEPS: WizardStep[] = [
  {
    id: 'name',
    title: 'Name your space',
    subtitle: 'Pick a name for your personal community. We will generate a unique URL from it.',
  },
  {
    id: 'about',
    title: 'Describe your space',
    subtitle: 'A few words about what members can expect here.',
  },
  {
    id: 'visibility',
    title: 'Choose visibility',
    subtitle: 'You can change this later in community settings.',
  },
];

interface CommunityCreateWizardProps {
  variant: CommunityWizardVariant;
}

const CommunityCreateWizard: React.FC<CommunityCreateWizardProps> = ({ variant }) => {
  const { token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const steps = variant === 'business' ? BUSINESS_STEPS : PERSONAL_STEPS;
  const headerLabel = variant === 'business' ? 'Business community' : 'Personal community';

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
      showToast(
        'Name must yield a valid URL handle (letters, numbers, hyphens). Try a Latin name or abbreviation.',
        'info'
      );
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
        throw new Error(msg || 'Failed to create community');
      }
      showToast('Could not find an available community URL. Try a different name.', 'error');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    } finally {
      setLoading(false);
    }
  }, [buildDescription, communityType, name, navigate, token, showToast]);

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
      finishLabel="Create community"
      loading={loading}
      headerLabel={headerLabel}
    >
      {stepId === 'name' && (
        <div className="space-y-4">
          <label className="block text-[15px] font-medium">
            {variant === 'business' ? 'Business name' : 'Community name'}
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={variant === 'business' ? 'e.g. Nova Labs' : 'e.g. Alex Hub'}
            className="h-[64px] w-full rounded-2xl border border-[#e5e5e5] bg-white px-5 text-[16px] focus:border-black focus:outline-none"
            autoFocus
          />
          {name.trim() && (
            <p className="text-[15px] text-[#666]">
              URL preview:{' '}
              <span className="font-medium text-black">/community/{handlePreview}</span>
            </p>
          )}
        </div>
      )}

      {stepId === 'about' && (
        <div className="space-y-6">
          <div>
            <label className="mb-3 block text-[15px] font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                variant === 'business'
                  ? 'Describe your business or community...'
                  : 'What is this space about?'
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
                <span className="text-[15px] font-medium">I already have a website</span>
              </label>
              {hasWebsite && (
                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://"
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
                Selected
              </span>
            )}
            <h3 className="text-[18px] font-semibold text-black">Private</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-[#666]">
              {variant === 'business'
                ? 'Invite-only or paid access for members and exclusive content.'
                : 'Only people you approve can join and see posts.'}
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
                Selected
              </span>
            )}
            <h3 className="text-[18px] font-semibold text-black">Public</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-[#666]">
              {variant === 'business'
                ? 'Anyone can discover and join to grow your audience.'
                : 'Visible in Discover; anyone can request to join.'}
            </p>
          </button>
        </div>
      )}
    </SimpleWizard>
  );
};

export default CommunityCreateWizard;
