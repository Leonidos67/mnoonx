import React, { useState } from 'react';
import { HelpCircle, MessageSquare, Send } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n/useTranslation';

const SettingsResolutionPanel: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const faqs = [
    { q: t('settings.resolutionFaq1q'), a: t('settings.resolutionFaq1a') },
    { q: t('settings.resolutionFaq2q'), a: t('settings.resolutionFaq2a') },
    { q: t('settings.resolutionFaq3q'), a: t('settings.resolutionFaq3a') },
  ];

  const submitTicket = async () => {
    if (!subject.trim() || !message.trim()) {
      showToast(t('settings.resolutionFormRequired'), 'error');
      return;
    }
    setSending(true);
    await new Promise((r) => setTimeout(r, 500));
    setSending(false);
    setSubject('');
    setMessage('');
    showToast(t('settings.resolutionTicketSent'));
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="hidden lg:block">
        <h2 className="text-2xl font-bold">{t('settings.resolutionHeading')}</h2>
        <p className="mt-1 text-sm text-neutral-500">{t('settings.resolutionHint')}</p>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-neutral-500" aria-hidden />
          <h3 className="font-semibold text-neutral-900">{t('settings.resolutionFaqTitle')}</h3>
        </div>
        <div className="divide-y divide-neutral-100">
          {faqs.map((item) => (
            <details key={item.q} className="group py-3">
              <summary className="cursor-pointer list-none font-medium text-neutral-900 marker:content-none">
                <span className="flex items-center justify-between gap-2">
                  {item.q}
                  <span className="text-neutral-400 transition-transform group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-2 text-sm text-neutral-500">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-neutral-500" aria-hidden />
          <h3 className="font-semibold text-neutral-900">{t('settings.resolutionContactTitle')}</h3>
        </div>
        <p className="mb-4 text-sm text-neutral-500">{t('settings.resolutionContactHint')}</p>
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              {t('settings.resolutionSubject')}
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={120}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:ring-2 focus:ring-black/10"
              placeholder={t('settings.resolutionSubjectPlaceholder')}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              {t('settings.resolutionMessage')}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={2000}
              className="w-full resize-none rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:ring-2 focus:ring-black/10"
              placeholder={t('settings.resolutionMessagePlaceholder')}
            />
          </div>
          <button
            type="button"
            disabled={sending}
            onClick={() => void submitTicket()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 font-medium text-white transition-colors hover:bg-black/80 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {sending ? t('settings.saving') : t('settings.resolutionSend')}
          </button>
        </div>
      </section>
    </div>
  );
};

export default SettingsResolutionPanel;
