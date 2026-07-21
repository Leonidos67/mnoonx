import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  ClipboardList,
  Loader2,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/useTranslation';
import { COMMUNITIES_API as API } from '../../config/api';

type FieldType = 'text' | 'email' | 'phone' | 'textarea';

interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
}

interface FormDef {
  title: string;
  description: string;
  thankYouMessage: string;
  isOpen: boolean;
  fields: FormField[];
  configured?: boolean;
}

interface Submission {
  _id: string;
  answers: { fieldId: string; value: string }[];
  status: 'new' | 'reviewed' | 'archived';
  createdAt: string;
}

interface CommunityFormsPanelProps {
  handle: string;
  instanceId: string;
  instanceTitle?: string;
  isOwner: boolean;
  onBackToCommunity: () => void;
}

type TabId = 'form' | 'waitlist' | 'settings';

const FIELD_TYPES: FieldType[] = ['text', 'email', 'phone', 'textarea'];

function starterForm(t: (k: string) => string): FormDef {
  return {
    title: t('community.formsPanel.starterTitle'),
    description: t('community.formsPanel.starterDesc'),
    thankYouMessage: t('community.formsPanel.thanksDefault'),
    isOpen: true,
    fields: [
      { id: 'name', label: t('community.formsPanel.starterName'), type: 'text', required: true },
      { id: 'email', label: t('community.formsPanel.starterEmail'), type: 'email', required: true },
      { id: 'phone', label: t('community.formsPanel.starterPhone'), type: 'phone', required: false },
      {
        id: 'note',
        label: t('community.formsPanel.starterNote'),
        type: 'textarea',
        required: false,
      },
    ],
    configured: false,
  };
}

const inputClass =
  'w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/10';

const CommunityFormsPanel: React.FC<CommunityFormsPanelProps> = ({
  handle,
  instanceId,
  instanceTitle,
  isOwner,
  onBackToCommunity,
}) => {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>('form');
  const [form, setForm] = useState<FormDef | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submittedThanks, setSubmittedThanks] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormDef | null>(null);

  const configured = Boolean(form?.configured);

  const load = useCallback(async () => {
    if (!token || !handle || !instanceId) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const q = new URLSearchParams({ instanceId });
      const res = await fetch(`${API}/${encodeURIComponent(handle)}/forms?${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { message?: string }).message || t('community.formsPanel.loadFailed'));
        return;
      }
      const f = (data as { form: FormDef }).form;
      setForm(f);
      setEditForm(f.configured ? f : starterForm(t));
      setSubmissions(
        Array.isArray((data as { submissions?: Submission[] }).submissions)
          ? (data as { submissions: Submission[] }).submissions
          : []
      );
      setSubmissionCount(Number((data as { submissionCount?: number }).submissionCount) || 0);
      const init: Record<string, string> = {};
      for (const field of f.fields || []) init[field.id] = '';
      setAnswers(init);
      if (!f.configured && isOwner) setTab('settings');
      else setTab('form');
    } catch {
      setError(t('community.networkError'));
    } finally {
      setLoading(false);
    }
  }, [token, handle, instanceId, t, isOwner]);

  useEffect(() => {
    setLoading(true);
    setSubmittedThanks(null);
    void load();
  }, [load]);

  const submitForm = async () => {
    if (!token || !form?.configured || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API}/${encodeURIComponent(handle)}/forms/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          instanceId,
          answers: Object.entries(answers).map(([fieldId, value]) => ({ fieldId, value })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { message?: string }).message || t('community.formsPanel.submitFailed'));
        return;
      }
      setSubmittedThanks(
        (data as { thankYouMessage?: string }).thankYouMessage ||
          form.thankYouMessage ||
          t('community.formsPanel.thanksDefault')
      );
      setSubmissionCount((n) => n + 1);
      if (isOwner && (data as { submission?: Submission }).submission) {
        setSubmissions((prev) => [(data as { submission: Submission }).submission, ...prev]);
      }
    } catch {
      setError(t('community.networkError'));
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async () => {
    if (!token || !isOwner || !editForm || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API}/${encodeURIComponent(handle)}/forms`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          instanceId,
          title: editForm.title,
          description: editForm.description,
          thankYouMessage: editForm.thankYouMessage,
          isOpen: editForm.isOpen,
          fields: editForm.fields,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { message?: string }).message || t('community.formsPanel.saveFailed'));
        return;
      }
      const f = (data as { form: FormDef }).form;
      setForm(f);
      setEditForm(f);
      const init: Record<string, string> = {};
      for (const field of f.fields || []) init[field.id] = '';
      setAnswers(init);
      setTab('form');
    } catch {
      setError(t('community.networkError'));
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (id: string, status: Submission['status']) => {
    if (!token) return;
    try {
      const res = await fetch(
        `${API}/${encodeURIComponent(handle)}/forms/submissions/${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ instanceId, status }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      setSubmissions((prev) => prev.map((s) => (s._id === id ? (data as Submission) : s)));
    } catch {
      /* ignore */
    }
  };

  const deleteSubmission = async (id: string) => {
    if (!token) return;
    try {
      const q = new URLSearchParams({ instanceId });
      const res = await fetch(
        `${API}/${encodeURIComponent(handle)}/forms/submissions/${encodeURIComponent(id)}?${q}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return;
      setSubmissions((prev) => prev.filter((s) => s._id !== id));
      setSubmissionCount((n) => Math.max(0, n - 1));
    } catch {
      /* ignore */
    }
  };

  const labelFor = (fieldId: string) =>
    form?.fields.find((f) => f.id === fieldId)?.label || fieldId;

  const fieldTypeLabel = (type: FieldType) => t(`community.formsPanel.fieldType.${type}`);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {t('community.formsPanel.loading')}
      </div>
    );
  }

  const tabs: { id: TabId; label: string }[] = configured
    ? [
        { id: 'form', label: t('community.formsPanel.tabForm') },
        ...(isOwner
          ? [
              {
                id: 'waitlist' as const,
                label: `${t('community.formsPanel.tabWaitlist')} (${submissionCount})`,
              },
              { id: 'settings' as const, label: t('community.formsPanel.tabSettings') },
            ]
          : []),
      ]
    : isOwner
      ? [{ id: 'settings', label: t('community.formsPanel.tabCreate') }]
      : [];

  const renderSelect = (
    value: string,
    onChange: (v: string) => void,
    options: { value: string; label: string }[],
    className = ''
  ) => (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-neutral-200 bg-white py-3 pl-4 pr-10 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black/10"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#e7e7e7] bg-white max-lg:rounded-none max-lg:border-x-0">
      <div className="flex shrink-0 items-center gap-2 border-b border-[#ececec] px-3 py-3 sm:px-6 sm:py-4">
        <button
          type="button"
          onClick={onBackToCommunity}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 lg:hidden"
          aria-label={t('community.formsPanel.back')}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <ClipboardList className="h-5 w-5 shrink-0 text-violet-600" />
        <h1 className="min-w-0 truncate text-lg font-semibold text-neutral-900">
          {instanceTitle || t('community.defaultFormsTitle')}
        </h1>
      </div>

      {tabs.length > 0 && (
        <div className="flex shrink-0 gap-1 border-b border-[#ececec] px-2 py-1.5 sm:px-4">
          {tabs.map((tb) => (
            <button
              key={tb.id}
              type="button"
              onClick={() => setTab(tb.id)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                tab === tb.id
                  ? 'bg-[#eef2ff] text-[#315efb]'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mx-4 mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {tab === 'form' && (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-lg space-y-5">
            {!configured ? (
              <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                <ClipboardList className="mb-4 h-20 w-20 text-neutral-200" strokeWidth={1.1} />
                <p className="text-lg font-semibold text-neutral-900">
                  {t('community.formsPanel.notConfiguredTitle')}
                </p>
                <p className="mt-2 max-w-sm text-sm text-neutral-500">
                  {isOwner
                    ? t('community.formsPanel.notConfiguredOwnerHint')
                    : t('community.formsPanel.notConfiguredMemberHint')}
                </p>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditForm(starterForm(t));
                      setTab('settings');
                    }}
                    className="mt-8 w-full max-w-sm rounded-2xl bg-[#315efb] py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#2547c4]"
                  >
                    {t('community.formsPanel.createFormCta')}
                  </button>
                )}
              </div>
            ) : submittedThanks ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-10 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-600" />
                <p className="text-base font-semibold text-emerald-900">{submittedThanks}</p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedThanks(null);
                    const init: Record<string, string> = {};
                    for (const field of form?.fields || []) init[field.id] = '';
                    setAnswers(init);
                  }}
                  className="mt-4 text-sm font-medium text-emerald-800 underline"
                >
                  {t('community.formsPanel.submitAnother')}
                </button>
              </div>
            ) : !form?.isOpen ? (
              <p className="py-16 text-center text-sm text-neutral-500">
                {t('community.formsPanel.formClosed')}
              </p>
            ) : (
              <>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900">{form?.title}</h3>
                  {form?.description ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-600">
                      {form.description}
                    </p>
                  ) : null}
                </div>
                {(form?.fields || []).map((field) => (
                  <div key={field.id}>
                    <label className="mb-2 block text-sm font-medium text-neutral-700">
                      {field.label}
                      {field.required ? <span className="text-red-500"> *</span> : null}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={answers[field.id] || ''}
                        onChange={(e) =>
                          setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))
                        }
                        rows={4}
                        placeholder={t('community.formsPanel.longTextPh')}
                        className={`${inputClass} resize-y`}
                      />
                    ) : (
                      <input
                        type={
                          field.type === 'email'
                            ? 'email'
                            : field.type === 'phone'
                              ? 'tel'
                              : 'text'
                        }
                        value={answers[field.id] || ''}
                        onChange={(e) =>
                          setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))
                        }
                        placeholder={
                          field.type === 'phone'
                            ? t('community.formsPanel.phonePh')
                            : field.type === 'email'
                              ? t('community.formsPanel.emailPh')
                              : undefined
                        }
                        className={inputClass}
                      />
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => void submitForm()}
                  disabled={saving}
                  className="flex w-full items-center justify-center rounded-2xl bg-[#315efb] py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#2547c4] disabled:opacity-50"
                >
                  {saving ? t('community.formsPanel.submitting') : t('community.formsPanel.submit')}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'waitlist' && isOwner && (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          {!configured ? (
            <p className="py-16 text-center text-sm text-neutral-500">
              {t('community.formsPanel.createFormFirst')}
            </p>
          ) : submissions.length === 0 ? (
            <p className="py-16 text-center text-sm text-neutral-500">
              {t('community.formsPanel.emptyWaitlist')}
            </p>
          ) : (
            <ul className="mx-auto max-w-2xl space-y-3">
              {submissions.map((s) => (
                <li
                  key={s._id}
                  className="rounded-2xl border border-neutral-200 bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="text-xs text-neutral-500">
                      {new Date(s.createdAt).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2">
                      {renderSelect(
                        s.status,
                        (v) => void setStatus(s._id, v as Submission['status']),
                        [
                          { value: 'new', label: t('community.formsPanel.statusNew') },
                          { value: 'reviewed', label: t('community.formsPanel.statusReviewed') },
                          { value: 'archived', label: t('community.formsPanel.statusArchived') },
                        ],
                        'min-w-[140px]'
                      )}
                      <button
                        type="button"
                        onClick={() => void deleteSubmission(s._id)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <dl className="mt-3 space-y-2">
                    {s.answers.map((a) => (
                      <div key={a.fieldId}>
                        <dt className="text-xs font-medium text-neutral-500">
                          {labelFor(a.fieldId)}
                        </dt>
                        <dd className="whitespace-pre-wrap text-sm text-neutral-900">
                          {a.value || '—'}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'settings' && isOwner && editForm && (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-lg space-y-5">
            {!configured && (
              <div className="rounded-2xl border border-[#315efb]/30 bg-[#eef2ff] px-4 py-3 text-sm text-neutral-800">
                {t('community.formsPanel.createIntro')}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                {t('community.formsPanel.formTitle')}
              </label>
              <input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className={inputClass}
                placeholder={t('community.formsPanel.formTitlePh')}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                {t('community.formsPanel.formDesc')}
              </label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                className={`${inputClass} resize-y`}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                {t('community.formsPanel.thanksMsg')}
              </label>
              <input
                value={editForm.thankYouMessage}
                onChange={(e) => setEditForm({ ...editForm, thankYouMessage: e.target.value })}
                className={inputClass}
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 px-4 py-3">
              <input
                type="checkbox"
                checked={editForm.isOpen}
                onChange={(e) => setEditForm({ ...editForm, isOpen: e.target.checked })}
                className="mt-1 rounded border-neutral-300"
              />
              <span>
                <span className="block text-sm font-medium text-neutral-900">
                  {t('community.formsPanel.accepting')}
                </span>
                <span className="mt-0.5 block text-xs text-neutral-500">
                  {t('community.formsPanel.acceptingHint')}
                </span>
              </span>
            </label>

            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-neutral-900">
                  {t('community.formsPanel.fields')}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setEditForm({
                      ...editForm,
                      fields: [
                        ...editForm.fields,
                        {
                          id: `field_${Date.now()}`,
                          label: '',
                          type: 'text' as const,
                          required: false,
                        },
                      ].slice(0, 20),
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#eef2ff] px-3 py-2 text-sm font-semibold text-[#315efb] hover:bg-[#dfe7ff]"
                >
                  <Plus className="h-4 w-4" />
                  {t('community.formsPanel.addField')}
                </button>
              </div>
              <div className="space-y-3">
                {editForm.fields.map((field, idx) => (
                  <div
                    key={field.id}
                    className="space-y-3 rounded-2xl border border-neutral-200 p-4"
                  >
                    <div className="flex gap-2">
                      <input
                        value={field.label}
                        onChange={(e) => {
                          const fields = [...editForm.fields];
                          fields[idx] = { ...fields[idx], label: e.target.value };
                          setEditForm({ ...editForm, fields });
                        }}
                        placeholder={t('community.formsPanel.fieldLabelPh')}
                        className={`min-w-0 flex-1 ${inputClass}`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setEditForm({
                            ...editForm,
                            fields: editForm.fields.filter((_, i) => i !== idx),
                          })
                        }
                        className="flex h-[46px] w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-medium text-neutral-500">
                        {t('community.formsPanel.fieldTypeLabel')}
                      </p>
                      {renderSelect(
                        field.type,
                        (v) => {
                          const fields = [...editForm.fields];
                          fields[idx] = { ...fields[idx], type: v as FieldType };
                          setEditForm({ ...editForm, fields });
                        },
                        FIELD_TYPES.map((ft) => ({ value: ft, label: fieldTypeLabel(ft) }))
                      )}
                    </div>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => {
                          const fields = [...editForm.fields];
                          fields[idx] = { ...fields[idx], required: e.target.checked };
                          setEditForm({ ...editForm, fields });
                        }}
                        className="rounded border-neutral-300"
                      />
                      <span className="text-sm font-medium text-neutral-900">
                        {t('community.formsPanel.required')}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => void saveSettings()}
              disabled={saving}
              className="flex w-full items-center justify-center rounded-2xl bg-[#315efb] py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#2547c4] disabled:opacity-50"
            >
              {saving
                ? t('community.formsPanel.saving')
                : configured
                  ? t('community.formsPanel.save')
                  : t('community.formsPanel.createAndPublish')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityFormsPanel;
