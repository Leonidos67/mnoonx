/** Shared Activity page surface tokens (light, modern). */
export const activityPage = {
  shell: 'min-h-0 flex h-full w-full bg-gradient-to-b from-slate-50 via-white to-indigo-50/30',
  container: 'mx-auto flex h-full min-h-0 w-full max-w-[1200px] flex-col',
  header:
    'sticky top-0 z-30 shrink-0 border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8',
  scroll: 'min-h-0 flex-1 overflow-y-auto',
  inner: 'px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8',
  card: 'rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40',
  cardHover: 'transition-all hover:shadow-md hover:shadow-slate-200/50',
  panel: 'rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6',
  heroCard:
    'rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 shadow-xl shadow-indigo-500/25',
  muted: 'text-slate-500',
  title: 'text-slate-900',
  accent: 'text-indigo-600',
  accentBg: 'bg-indigo-600',
  accentSoft: 'bg-indigo-50 text-indigo-700',
  claimBtn:
    'inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-all hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98]',
  chipActive: 'bg-slate-900 text-white shadow-sm',
  chipIdle:
    'border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-slate-300 hover:text-slate-900',
  navActive: 'bg-indigo-50 font-semibold text-indigo-900 ring-1 ring-indigo-200/80',
  navIdle: 'text-slate-700 hover:bg-slate-50',
} as const;
