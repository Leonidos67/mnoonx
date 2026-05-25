import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BookOpen, ChevronDown, ChevronsDownUp, X } from 'lucide-react';
import { DOCS_DEFAULT_PATH, DOCS_SECTIONS, docsPagePath } from '../../docs/docsNav';

const STORAGE_KEY = 'mnoonx-docs-sidebar-sections';

interface DocsSidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

function loadStoredOpen(): Set<string> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as string[];
    if (Array.isArray(parsed)) return new Set(parsed);
  } catch {
    /* ignore */
  }
  return null;
}

function saveStoredOpen(open: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(open)));
  } catch {
    /* ignore */
  }
}

function activeSectionFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/docs\/([^/]+)/);
  return match?.[1] ?? null;
}

const DocsSidebar: React.FC<DocsSidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { pathname } = useLocation();
  const activeSectionId = activeSectionFromPath(pathname);

  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const stored = loadStoredOpen();
    if (stored) return stored;
    return new Set(DOCS_SECTIONS.map((s) => s.id));
  });

  useEffect(() => {
    if (!activeSectionId) return;
    setOpenSections((prev) => {
      if (prev.has(activeSectionId)) return prev;
      const next = new Set(prev);
      next.add(activeSectionId);
      saveStoredOpen(next);
      return next;
    });
  }, [activeSectionId]);

  const toggleSection = useCallback((sectionId: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      saveStoredOpen(next);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const all = new Set(DOCS_SECTIONS.map((s) => s.id));
    setOpenSections(all);
    saveStoredOpen(all);
  }, []);

  const collapseAll = useCallback(() => {
    const next = activeSectionId ? new Set([activeSectionId]) : new Set<string>();
    setOpenSections(next);
    saveStoredOpen(next);
  }, [activeSectionId]);

  const allExpanded = useMemo(
    () => openSections.size >= DOCS_SECTIONS.length,
    [openSections]
  );

  const nav = (
    <nav className="flex flex-1 flex-col py-3 lg:py-4">
      <div className="mb-3 hidden px-4 lg:block">
        <NavLink
          to={DOCS_DEFAULT_PATH}
          className="group flex items-center gap-2.5 rounded-xl border border-stone-200/80 bg-white/70 px-3 py-2.5 shadow-sm transition-colors hover:border-orange-200/80 hover:bg-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-sm">
            <BookOpen className="h-4 w-4" aria-hidden />
          </span>
          <span>
            <span className="block text-[11px] font-medium uppercase tracking-wider text-neutral-400">
              Справочник
            </span>
            <span className="block text-sm font-semibold text-neutral-900 group-hover:text-orange-800">
              Документация
            </span>
          </span>
        </NavLink>
      </div>

      <div className="mb-2 flex items-center justify-between gap-2 px-4">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
          Содержание
        </span>
        <button
          type="button"
          onClick={allExpanded ? collapseAll : expandAll}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-orange-700 transition-colors hover:bg-orange-50"
        >
          <ChevronsDownUp className="h-3.5 w-3.5" aria-hidden />
          {allExpanded ? 'Свернуть' : 'Раскрыть'}
        </button>
      </div>

      <div className="space-y-0.5 px-2">
        {DOCS_SECTIONS.map((section, sectionIndex) => {
          const isOpen = openSections.has(section.id);
          const hasActiveChild = activeSectionId === section.id;

          return (
            <div
              key={section.id}
              className={`overflow-hidden rounded-xl transition-colors ${
                hasActiveChild ? 'bg-white/60 ring-1 ring-stone-200/60 shadow-sm' : ''
              }`}
            >
              {sectionIndex > 0 ? (
                <div
                  className="mx-3 my-1 h-px bg-gradient-to-r from-transparent via-stone-200/80 to-transparent"
                  aria-hidden
                />
              ) : null}

              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold transition-colors ${
                  hasActiveChild
                    ? 'text-orange-900'
                    : 'text-neutral-800 hover:bg-stone-100/70'
                }`}
                aria-expanded={isOpen}
              >
                <span className="truncate">{section.sidebarLabel}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                    hasActiveChild ? 'text-orange-500' : 'text-neutral-400'
                  } ${isOpen ? 'rotate-0' : '-rotate-90'}`}
                  aria-hidden
                />
              </button>

              <div
                className={`grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out ${
                  isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
                aria-hidden={!isOpen}
              >
                <div className="min-h-0 overflow-hidden">
                  <ul className={`space-y-0.5 pl-2 pr-1 ${isOpen ? 'pb-2' : 'pb-0'}`}>
                  {section.items.map((item) => (
                    <li key={`${section.id}-${item.slug}`}>
                      <NavLink
                        to={docsPagePath(section.id, item.slug)}
                        onClick={onCloseMobile}
                        className={({ isActive }) =>
                          `group/link relative block rounded-lg py-2 pl-4 pr-2 text-[13px] leading-snug transition-all ${
                            isActive
                              ? 'bg-orange-50 font-semibold text-orange-800 shadow-[inset_2px_0_0_0_rgb(249,115,22)]'
                              : 'text-neutral-600 hover:bg-stone-100/80 hover:text-neutral-900 hover:shadow-[inset_2px_0_0_0_rgb(231,229,228)]'
                          }`
                        }
                      >
                        {item.title}
                      </NavLink>
                    </li>
                  ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-[2px] lg:hidden"
          aria-label="Закрыть меню"
          onClick={onCloseMobile}
        />
      ) : null}

      <aside
        className={`fixed bottom-0 left-0 top-14 z-40 flex w-[min(100vw-2rem,288px)] flex-col overflow-hidden border-r border-stone-200/90 shadow-xl transition-transform lg:static lg:top-auto lg:z-auto lg:w-[280px] lg:shrink-0 lg:shadow-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between border-b border-stone-200/80 bg-white/50 px-4 py-3 backdrop-blur-sm lg:hidden">
          <span className="text-sm font-semibold text-neutral-800">Навигация</span>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-stone-100"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgb(214_211_209)_transparent]">
          {nav}
        </div>
      </aside>
    </>
  );
};

export default DocsSidebar;
