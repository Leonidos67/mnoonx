import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bug,
  Check,
  HelpCircle,
  Lock,
  Plus,
  Search,
  X,
} from 'lucide-react';
import ResponsiveDialogShell from '../Common/ResponsiveDialogShell';
import { SUPPORT_API } from '../../config/api';
import { DOCS_DEFAULT_PATH } from '../../docs/docsNav';
import type {
  CreateSupportTicketPayload,
  SupportAppOption,
  SupportTicket,
  SupportTicketCategory,
} from '../../types/support';

type WizardStep = 1 | 2 | 3;

const CATEGORIES: {
  id: SupportTicketCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'bug', label: 'Bug Report', icon: Bug },
  { id: 'authentication', label: 'Authentication', icon: Lock },
  { id: 'other', label: 'Other', icon: HelpCircle },
];

const DESCRIPTION_PLACEHOLDER = `Example:
• What you were trying to do
• What happened instead
• Any error message
• Steps to reproduce (if relevant)`;

interface SupportTicketWizardProps {
  open: boolean;
  onClose: () => void;
  token: string;
  onCreated: (ticket: SupportTicket) => void;
}

const SupportTicketWizard: React.FC<SupportTicketWizardProps> = ({
  open,
  onClose,
  token,
  onCreated,
}) => {
  const [step, setStep] = useState<WizardStep>(1);
  const [category, setCategory] = useState<SupportTicketCategory>('bug');
  const [apps, setApps] = useState<SupportAppOption[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appSearch, setAppSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState<SupportAppOption | null>(null);
  const [customAppLink, setCustomAppLink] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStep(1);
    setCategory('bug');
    setAppSearch('');
    setSelectedApp(null);
    setCustomAppLink('');
    setDescription('');
    setFiles([]);
    setError(null);
    setSubmitting(false);
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    setAppsLoading(true);
    fetch(`${SUPPORT_API}/apps`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : { apps: [] }))
      .then((data: { apps?: SupportAppOption[] }) => setApps(data.apps ?? []))
      .catch(() => setApps([]))
      .finally(() => setAppsLoading(false));
  }, [open, token, reset]);

  const filteredApps = useMemo(() => {
    const q = appSearch.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.handle.toLowerCase().includes(q)
    );
  }, [apps, appSearch]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const goBack = () => {
    setError(null);
    if (step === 1) handleClose();
    else setStep((s) => (s - 1) as WizardStep);
  };

  const goContinue = async () => {
    setError(null);
    if (step === 1) {
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
      return;
    }

    const desc = description.trim();
    if (!desc) {
      setError('Please describe your issue.');
      return;
    }

    setSubmitting(true);
    try {
      const origin = window.location.origin;
      const payload: CreateSupportTicketPayload = {
        category,
        description: desc,
        attachmentNames: files.map((f) => f.name),
      };
      if (selectedApp) {
        payload.communityId = selectedApp.id;
        payload.communityHandle = selectedApp.handle;
        payload.communityName = selectedApp.name;
        payload.appLink = `${origin}/community/${selectedApp.handle}`;
      } else if (customAppLink.trim()) {
        payload.appLink = customAppLink.trim();
      }

      const res = await fetch(`${SUPPORT_API}/tickets`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message || 'Failed to create ticket');
      }
      const data = (await res.json()) as { ticket: SupportTicket };
      onCreated(data.ticket);
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const onFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...picked].slice(0, 5));
    e.target.value = '';
  };

  const stepTitle =
    step === 1
      ? 'What type of issue are you experiencing?'
      : step === 2
        ? 'Select the app related to your issue'
        : 'Tell us about your issue';

  const stepHint =
    step === 1
      ? 'It looks like your issue falls into one of these categories. Select the one that fits best — it helps us guide you to the right solution.'
      : step === 2
        ? 'Choose a community you manage or joined, or add a custom link below.'
        : 'Please share what you were doing, what went wrong, how we can reproduce it.';

  const content = (
    <div className="relative flex max-h-[min(90vh,720px)] flex-col overflow-hidden rounded-2xl bg-white">
      {/* <div className="h-1 shrink-0 bg-gradient-to-r from-orange-400 via-orange-500 to-amber-400" aria-hidden /> */}

      <button
        type="button"
        onClick={handleClose}
        className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-stone-100 hover:text-neutral-700"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="overflow-y-auto px-6 pb-4 pt-6 sm:px-8">
        <p className="text-xs font-medium text-neutral-400">Submit support ticket</p>
        <h2 className="mt-1 pr-8 text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
          {stepTitle}
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-500">{stepHint}</p>

        {step === 1 ? (
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {CATEGORIES.map(({ id, label, icon: Icon }) => {
              const selected = category === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCategory(id)}
                  className={`relative flex min-h-[140px] flex-col justify-between rounded-xl border-2 p-4 text-left transition-all ${
                    selected
                      ? 'border-neutral-900 bg-white shadow-sm'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  {selected ? (
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-white">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                    </span>
                  ) : null}
                  <Icon className="h-6 w-6 text-neutral-700" aria-hidden />
                  <span className="text-sm font-semibold text-neutral-900">{label}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-8 space-y-4">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                aria-hidden
              />
              <input
                type="search"
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                placeholder="Search for apps..."
                className="w-full rounded-xl border border-stone-200 py-3 pl-10 pr-4 text-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedApp(null);
                setCustomAppLink('');
              }}
              className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-stone-300">
                <Plus className="h-3.5 w-3.5" />
              </span>
              Add app link
            </button>

            {customAppLink !== '' || !selectedApp ? (
              <input
                type="url"
                value={customAppLink}
                onChange={(e) => {
                  setCustomAppLink(e.target.value);
                  if (e.target.value) setSelectedApp(null);
                }}
                placeholder="https://..."
                className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            ) : null}

            <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-stone-100">
              {appsLoading ? (
                <p className="px-4 py-6 text-center text-sm text-neutral-500">Loading...</p>
              ) : filteredApps.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-neutral-500">
                  No communities found. Use a custom app link above.
                </p>
              ) : (
                filteredApps.map((app) => {
                  const selected = selectedApp?.id === app.id;
                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => {
                        setSelectedApp(app);
                        setCustomAppLink('');
                      }}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                        selected ? 'bg-orange-50' : 'hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-200 text-xs font-bold text-neutral-600">
                          {(app.name[0] || 'u').toUpperCase()}
                        </span>
                        <span className="truncate font-medium text-neutral-900">{app.name}</span>
                      </div>
                      <span className="shrink-0 text-xs text-neutral-400">
                        edited{' '}
                        {formatMonthsAgo(app.editedAt)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-8 space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-900">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                rows={8}
                placeholder={DESCRIPTION_PLACEHOLDER}
                className="w-full resize-y rounded-xl border border-stone-200 px-4 py-3 text-sm leading-relaxed text-neutral-800 placeholder:text-neutral-400 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
              <p className="mt-1 text-xs text-neutral-400">
                {description.length} / 500
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-900">
                Attachments
              </label>
              <label className="flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-stone-300 bg-stone-50/50 px-4 py-6 transition-colors hover:border-stone-400 hover:bg-stone-50">
                <span className="text-sm text-neutral-500">
                  {files.length
                    ? files.map((f) => f.name).join(', ')
                    : 'Drag and drop files here'}
                </span>
                <span className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800">
                  Browse files
                </span>
                <input
                  type="file"
                  multiple
                  className="sr-only"
                  onChange={onFilePick}
                />
              </label>
            </div>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </div>

      <div className="shrink-0 border-t border-stone-200 px-6 py-4 sm:px-8">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={submitting}
            className="rounded-lg border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-stone-50 disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => void goContinue()}
            disabled={submitting}
            className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : step === 3 ? 'Submit' : 'Continue'}
          </button>
        </div>
      </div>

      <div className="shrink-0 border-t border-stone-100 bg-stone-50 px-6 py-3 text-center text-sm text-neutral-600 sm:px-8">
        <strong className="font-semibold text-neutral-800">Need immediate help?</strong> Check our{' '}
        <Link to={DOCS_DEFAULT_PATH} className="underline hover:text-neutral-900">
          documentation
        </Link>.
      </div>
    </div>
  );

  return (
    <ResponsiveDialogShell
      open={open}
      onClose={handleClose}
      title="Submit support ticket"
      disableClose={submitting}
      panelClassName="w-full max-w-2xl overflow-hidden rounded-2xl bg-white p-0 shadow-2xl"
      zIndexClass="z-[130]"
    >
      {content}
    </ResponsiveDialogShell>
  );
};

function formatMonthsAgo(iso: string): string {
  const months = Math.max(
    0,
    Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24 * 30))
  );
  if (months === 0) return 'recently';
  return `${months} month${months === 1 ? '' : 's'} ago`;
}

export default SupportTicketWizard;
