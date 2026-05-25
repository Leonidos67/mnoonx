import React from 'react';
import { Bug, Calendar, Clock, HelpCircle, Lock, Tag } from 'lucide-react';
import type { SupportTicketCategory } from '../../types/support';
import type { SupportTicket } from '../../types/support';
import { formatRelativeTime, formatTicketDate } from './supportUtils';

interface SupportTicketCardProps {
  ticket: SupportTicket;
  onClick: () => void;
}

function CategoryIcon({ category }: { category: SupportTicketCategory }) {
  const cls = 'h-3 w-3 opacity-60';
  if (category === 'authentication') return <Lock className={cls} aria-hidden />;
  if (category === 'other') return <HelpCircle className={cls} aria-hidden />;
  return <Bug className={cls} aria-hidden />;
}

const SupportTicketCard: React.FC<SupportTicketCardProps> = ({ ticket, onClick }) => {
  const isOpen = ticket.status === 'open';

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-stone-200 bg-white p-5 text-left shadow-sm transition-all hover:border-stone-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="line-clamp-2 flex-1 text-base font-bold leading-snug text-neutral-900">
          {ticket.title}
        </h3>
        <div className="shrink-0 text-right">
          <div className="flex items-center justify-end gap-1 text-xs text-neutral-400">
            <Calendar className="h-3.5 w-3.5" aria-hidden />
            <span>{formatTicketDate(ticket.createdAt)}</span>
          </div>
          <p className="mt-0.5 text-xs text-neutral-400">
            {formatRelativeTime(ticket.updatedAt)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isOpen
              ? 'bg-orange-50 text-orange-800'
              : 'bg-stone-100 text-neutral-600'
          }`}
        >
          {isOpen ? (
            <Clock className="h-3 w-3" aria-hidden />
          ) : (
            <span className="h-3 w-3 rounded-full bg-neutral-400" aria-hidden />
          )}
          {isOpen ? 'Open' : 'Closed'}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
          <CategoryIcon category={ticket.category} />
          {ticket.categoryLabel}
        </span>
      </div>

      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-neutral-600">
        {ticket.description}
        {ticket.communityName || ticket.appLink ? (
          <>
            {ticket.communityName ? (
              <>
                {' '}
                App: {ticket.communityName}
                {ticket.communityId ? ` (ID: ${ticket.communityId})` : ''}
              </>
            ) : null}
            {ticket.appLink ? (
              <>
                {' '}
                App Link: {ticket.appLink}
              </>
            ) : null}
          </>
        ) : null}
      </p>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-stone-100 pt-3">
        {ticket.communityId || ticket.appLink ? (
          <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
            <Tag className="h-3 w-3" aria-hidden />
            App: {ticket.communityId || ticket.communityHandle || 'link'}
          </span>
        ) : (
          <span />
        )}
        <span className="rounded-md border border-stone-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
          {ticket.plan}
        </span>
      </div>
    </button>
  );
};

export default SupportTicketCard;
