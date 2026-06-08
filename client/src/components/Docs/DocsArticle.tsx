import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import DocsCardGrid, { type DocsCardItem } from './DocsCardGrid';
import DocsOnPageNav, { type DocsTocItem } from './DocsOnPageNav';

export interface DocStep {
  title: string;
  body: React.ReactNode;
}

export interface DocSection {
  heading: string;
  body: React.ReactNode;
}

export interface DocsCardGridBlock {
  title: string;
  cards: DocsCardItem[];
}

export interface DocsFaqItem {
  question: string;
  answer: React.ReactNode;
}

export interface DocsArticleProps {
  title: string;
  lead: string;
  /** Дополнительный абзац после вступления */
  context?: string;
  breadcrumbSection?: string;
  steps?: DocStep[];
  sections?: DocSection[];
  tips?: string[];
  faq?: DocsFaqItem[];
  cardGrids?: DocsCardGridBlock[];
  showHero?: boolean;
  prev?: { path: string; title: string } | null;
  next?: { path: string; title: string } | null;
}

function sectionId(prefix: string, index: number) {
  return `${prefix}-${index}`;
}

const DocsArticle: React.FC<DocsArticleProps> = ({
  title,
  lead,
  context,
  breadcrumbSection,
  steps,
  sections,
  tips,
  faq,
  cardGrids,
  showHero,
  prev,
  next,
}) => {
  const { t } = useTranslation();
  const toc: DocsTocItem[] = useMemo(() => {
    const items: DocsTocItem[] = [];
    if (context) items.push({ id: 'context', label: t('docs.article.whyThis') });
    if (cardGrids?.length) {
      cardGrids.forEach((g, i) => items.push({ id: sectionId('grid', i), label: g.title }));
    }
    steps?.forEach((s, i) => items.push({ id: `step-${i}`, label: s.title }));
    sections?.forEach((s, i) => items.push({ id: sectionId('sec', i), label: s.heading }));
    if (tips?.length) items.push({ id: 'tips', label: t('docs.article.tips') });
    if (faq?.length) items.push({ id: 'faq', label: t('docs.article.faq') });
    return items;
  }, [steps, sections, tips, faq, cardGrids, context, t]);

  return (
    <div className="flex w-full min-w-0 gap-10">
      <article className="min-w-0 flex-1 pb-20">
        {breadcrumbSection ? (
          <p className="mb-3 text-sm text-neutral-500">{breadcrumbSection}</p>
        ) : null}

        <header className="mb-8">
          <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-neutral-900 md:text-[2.25rem]">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-[1.7] text-neutral-600">{lead}</p>
          {context ? (
            <p
              id="context"
              className="scroll-mt-24 mt-5 max-w-2xl text-[15px] leading-[1.75] text-neutral-700"
            >
              {context}
            </p>
          ) : null}
        </header>

        {showHero ? (
          <div className="mb-10 overflow-hidden rounded-2xl border border-stone-200 bg-gradient-to-br from-neutral-900 via-neutral-800 to-stone-700 p-8 shadow-lg">
            <p className="text-sm font-medium uppercase tracking-wider text-orange-300/90">
              MNOONX Alpha Space
            </p>
            <p className="mt-2 max-w-lg text-lg leading-relaxed text-white/90">
              {t('docs.article.heroTagline')}
            </p>
          </div>
        ) : null}

        {cardGrids?.map((grid, index) => (
          <div key={grid.title} id={sectionId('grid', index)} className="scroll-mt-24">
            <DocsCardGrid title={grid.title} cards={grid.cards} />
          </div>
        ))}

        {steps && steps.length > 0 ? (
          <ol className="mb-10 space-y-10">
            {steps.map((step, index) => (
              <li key={step.title} id={`step-${index}`} className="scroll-mt-24">
                <h2 className="mb-3 text-xl font-semibold text-neutral-900">{step.title}</h2>
                <div className="prose-docs max-w-2xl text-[15px] leading-[1.75] text-neutral-700">
                  {step.body}
                </div>
              </li>
            ))}
          </ol>
        ) : null}

        {sections?.map((block, index) => {
          const id = sectionId('sec', index);
          return (
            <section key={`${block.heading}-${index}`} id={id} className="scroll-mt-24 mb-10">
              <h2 className="mb-4 text-xl font-semibold text-neutral-900">{block.heading}</h2>
              <div className="prose-docs max-w-2xl text-[15px] leading-[1.75] text-neutral-700">
                {block.body}
              </div>
            </section>
          );
        })}

        {faq && faq.length > 0 ? (
          <section id="faq" className="scroll-mt-24 mb-10">
            <h2 className="mb-4 text-xl font-semibold text-neutral-900">{t('docs.article.faq')}</h2>
            <dl className="max-w-2xl space-y-5">
              {faq.map((item) => (
                <div key={item.question} className="border-b border-stone-200/80 pb-5 last:border-0">
                  <dt className="text-[15px] font-semibold text-neutral-900">{item.question}</dt>
                  <dd className="prose-docs mt-2 text-[15px] leading-[1.75] text-neutral-700">
                    {item.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {tips && tips.length > 0 ? (
          <div
            id="tips"
            className="scroll-mt-24 mb-10 rounded-xl border border-amber-200/70 bg-amber-50/50 p-6"
          >
            <div className="mb-3 flex items-center gap-2 text-amber-950">
              <Lightbulb className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
              <span className="font-semibold">{t('docs.article.tips')}</span>
            </div>
            <ul className="space-y-2 text-[15px] leading-relaxed text-amber-950/90">
              {tips.map((tip) => (
                <li key={tip} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <nav className="mt-12 flex flex-wrap items-stretch justify-between gap-3 border-t border-stone-200 pt-8">
          {prev ? (
            <Link
              to={prev.path}
              className="flex min-w-[160px] flex-1 flex-col rounded-xl border border-stone-200 bg-white px-4 py-3 transition-colors hover:border-stone-300"
            >
              <span className="flex items-center gap-1 text-xs font-medium text-neutral-500">
                <ChevronLeft className="h-4 w-4" /> {t('docs.article.back')}
              </span>
              <span className="mt-1 text-sm font-semibold text-neutral-900">{prev.title}</span>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
          {next ? (
            <Link
              to={next.path}
              className="flex min-w-[160px] flex-1 flex-col items-end rounded-xl border border-orange-600 bg-orange-600 px-4 py-3 text-right text-white transition-colors hover:bg-orange-700"
            >
              <span className="flex items-center gap-1 text-xs font-medium text-orange-100">
                {t('docs.article.next')} <ChevronRight className="h-4 w-4" />
              </span>
              <span className="mt-1 text-sm font-semibold">{next.title}</span>
            </Link>
          ) : null}
        </nav>
      </article>

      <DocsOnPageNav toc={toc} />
    </div>
  );
};

export default DocsArticle;
