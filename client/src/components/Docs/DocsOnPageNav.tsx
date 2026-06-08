import React, { useCallback, useState } from 'react';
import { Copy, MessageSquare } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n/useTranslation';

export interface DocsTocItem {
  id: string;
  label: string;
}

interface DocsOnPageNavProps {
  toc: DocsTocItem[];
}

const DocsOnPageNav: React.FC<DocsOnPageNavProps> = ({ toc }) => {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState<string | null>(toc[0]?.id ?? null);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
    }
  };

  const copyPage = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast(t('docs.article.linkCopied'));
    } catch {
      showToast(t('docs.article.copyFailed'), 'error');
    }
  }, [showToast, t]);

  if (toc.length === 0) return null;

  return (
    <aside className="hidden w-52 shrink-0 xl:block">
      <div className="sticky top-20 space-y-6 pl-4">
        <div>
          <p className="mb-3 text-xs font-semibold text-neutral-900">{t('docs.article.onThisPage')}</p>
          <ul className="space-y-2 border-l border-stone-200">
            {toc.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => scrollTo(item.id)}
                  className={`block w-full border-l-2 py-0.5 pl-3 text-left text-sm transition-colors ${
                    activeId === item.id
                      ? 'border-orange-500 font-medium text-orange-700'
                      : 'border-transparent text-neutral-500 hover:border-stone-300 hover:text-neutral-800'
                  }`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <ul className="space-y-2 text-sm text-neutral-600">
          <li>
            <button
              type="button"
              onClick={() => void copyPage()}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-stone-100"
            >
              <Copy className="h-4 w-4 shrink-0" aria-hidden />
              {t('docs.article.copyLink')}
            </button>
          </li>
          <li>
            <a
              href={`mailto:support@mnoonx.dev?subject=${encodeURIComponent(t('docs.article.feedbackSubject'))}`}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-stone-100"
            >
              <MessageSquare className="h-4 w-4 shrink-0" aria-hidden />
              {t('docs.article.feedback')}
            </a>
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default DocsOnPageNav;
