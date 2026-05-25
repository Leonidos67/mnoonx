import React from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

export interface DocsCardItem {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
}

interface DocsCardGridProps {
  title: string;
  cards: DocsCardItem[];
}

const DocsCardGrid: React.FC<DocsCardGridProps> = ({ title, cards }) => (
  <section className="mb-12">
    <h2 className="mb-4 text-lg font-semibold text-neutral-900">{title}</h2>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(({ icon: Icon, title: cardTitle, description, to }) => (
        <Link
          key={to + cardTitle}
          to={to}
          className="group flex flex-col overflow-hidden rounded-xl border border-stone-200/90 bg-[#f5f4f0] transition-all hover:border-stone-300 hover:shadow-md"
        >
          <div className="flex items-center gap-2 border-b border-stone-200/80 px-4 py-3">
            <Icon className="h-4 w-4 shrink-0 text-neutral-700" strokeWidth={1.75} aria-hidden />
            <span className="text-sm font-semibold text-neutral-900 group-hover:text-orange-700">
              {cardTitle}
            </span>
          </div>
          <p className="flex-1 px-4 py-3 text-sm leading-relaxed text-neutral-600">{description}</p>
        </Link>
      ))}
    </div>
  </section>
);

export default DocsCardGrid;
