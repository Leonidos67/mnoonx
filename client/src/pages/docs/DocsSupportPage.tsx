import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  Ticket,
} from 'lucide-react';
import SupportTicketCard from '../../components/Support/SupportTicketCard';
import SupportTicketDetail from '../../components/Support/SupportTicketDetail';
import SupportTicketWizard from '../../components/Support/SupportTicketWizard';
import { useAuth } from '../../context/AuthContext';
import { SUPPORT_API } from '../../config/api';
import { DOCS_DEFAULT_PATH, DOCS_SUPPORT_PATH } from '../../docs/docsNav';
import type { SupportTicket, SupportTicketMessage, SupportTicketTab } from '../../types/support';

const DocsSupportPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId?: string }>();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const [tab, setTab] = useState<SupportTicketTab>('open');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [counts, setCounts] = useState({ open: 0, closed: 0, all: 0 });
  const [loading, setLoading] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [pendingTicket, setPendingTicket] = useState<{
    ticket: SupportTicket;
    messages: SupportTicketMessage[];
  } | null>(null);
  const listLoadedOnce = useRef(false);

  const loadTickets = useCallback(
    async (silent = false) => {
      if (!token) {
        setTickets([]);
        setCounts({ open: 0, closed: 0, all: 0 });
        return;
      }
      if (!silent && !listLoadedOnce.current) setLoading(true);
      try {
        const res = await fetch(`${SUPPORT_API}/tickets?status=${tab}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('fetch failed');
        const data = (await res.json()) as {
          tickets: SupportTicket[];
          counts: { open: number; closed: number; all: number };
        };
        setTickets(data.tickets);
        setCounts(data.counts);
        listLoadedOnce.current = true;
      } catch {
        if (!listLoadedOnce.current) setTickets([]);
      } finally {
        setLoading(false);
      }
    },
    [token, tab]
  );

  useEffect(() => {
    if (ticketId) return;
    void loadTickets();
  }, [loadTickets, ticketId]);

  const tabs = useMemo(
    () =>
      [
        { id: 'open' as const, label: 'Open', count: counts.open, icon: Clock },
        { id: 'closed' as const, label: 'Closed', count: counts.closed, icon: CheckCircle2 },
        { id: 'all' as const, label: 'All', count: counts.all, icon: Ticket },
      ] as const,
    [counts]
  );

  const handleCreated = async (ticket: SupportTicket) => {
    setWizardOpen(false);
    try {
      const res = await fetch(`${SUPPORT_API}/tickets/${ticket.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as {
          ticket: SupportTicket;
          messages: SupportTicketMessage[];
        };
        setPendingTicket({ ticket: data.ticket, messages: data.messages });
        navigate(`${DOCS_SUPPORT_PATH}/${ticket.id}`, {
          state: { ticket: data.ticket, messages: data.messages },
        });
        return;
      }
    } catch {
      /* fallback */
    }
    navigate(`${DOCS_SUPPORT_PATH}/${ticket.id}`, { state: { ticket } });
  };

  if (ticketId && token) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <SupportTicketDetail
          ticketId={ticketId}
          token={token}
          initialTicket={pendingTicket?.ticket.id === ticketId ? pendingTicket.ticket : undefined}
          initialMessages={
            pendingTicket?.ticket.id === ticketId ? pendingTicket.messages : undefined
          }
        />
      </div>
    );
  }

  const showInitialLoader = loading && !listLoadedOnce.current;
  const showEmpty = !showInitialLoader && isAuthenticated && tickets.length === 0;

  return (
    <div className="mx-auto w-full max-w-4xl pb-16">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 md:text-[2rem]">
          My Support Tickets
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void loadTickets(true)}
            disabled={loading || !isAuthenticated}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-stone-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                navigate('/');
                return;
              }
              setWizardOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-black/80"
          >
            <Plus className="h-4 w-4" aria-hidden />
            New Ticket
          </button>
        </div>
      </div>

      <div className="mb-10 inline-flex rounded-xl border border-stone-200/90 bg-stone-100/60 p-1">
        {tabs.map(({ id, label, count, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                active
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
              {label} ({count})
            </button>
          );
        })}
      </div>

      {!isAuthenticated ? (
        <div className="rounded-2xl border border-stone-200 bg-stone-50/80 px-6 py-12 text-center">
          <p className="text-lg font-semibold text-neutral-900">Sign in to view tickets</p>
          <p className="mt-2 text-sm text-neutral-600">
            Support requests are tied to your account. Log in on the platform, then return here.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Go to platform
          </button>
        </div>
      ) : showInitialLoader ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-orange-500" />
        </div>
      ) : tickets.length > 0 ? (
        <ul className="space-y-4">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <SupportTicketCard
                ticket={ticket}
                onClick={() => navigate(`${DOCS_SUPPORT_PATH}/${ticket.id}`)}
              />
            </li>
          ))}
        </ul>
      ) : showEmpty ? (
        <div className="flex flex-col items-center px-4 py-16 text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-sky-100/80">
            <Ticket className="h-11 w-11 text-sky-400/90" strokeWidth={1.25} aria-hidden />
          </div>
          <h2 className="text-xl font-bold text-neutral-900">
            {tab === 'closed' ? 'No Closed Tickets' : 'No Open Tickets'}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-neutral-500">
            {tab === 'closed'
              ? 'Closed tickets will appear here when support resolves your requests.'
              : "You don't have any open support tickets at the moment."}
          </p>
          {tab !== 'closed' ? (
            <button
              type="button"
              onClick={() => setWizardOpen(true)}  
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-black/80"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Create New Ticket
            </button>
          ) : null}
        </div>
      ) : null}

      {token ? (
        <SupportTicketWizard
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          token={token}
          onCreated={(t) => void handleCreated(t)}
        />
      ) : null}
    </div>
  );
};

export default DocsSupportPage;
