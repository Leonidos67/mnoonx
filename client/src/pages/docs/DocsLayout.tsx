import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import DocsHeader from '../../components/Docs/DocsHeader';
import DocsSidebar from '../../components/Docs/DocsSidebar';
import { DOCS_SUPPORT_PATH } from '../../docs/docsNav';

const DocsLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const isSupportArea =
    pathname === DOCS_SUPPORT_PATH || pathname.startsWith(`${DOCS_SUPPORT_PATH}/`);
  const isTicketDetail = /^\/docs\/support\/[^/]+$/.test(pathname);

  return (
    <div className="flex h-screen max-h-dvh flex-col overflow-hidden bg-white text-neutral-900">
      <DocsHeader />

      <div className="flex min-h-0 flex-1">
        {!isSupportArea ? (
          <DocsSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
        ) : null}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {!isSupportArea ? (
            <div className="flex items-center gap-2 border-b border-stone-200/80 bg-[#faf9f7]/90 px-4 py-2.5 backdrop-blur-sm lg:hidden">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg border border-stone-200/80 bg-white p-2 text-neutral-700 shadow-sm transition-colors hover:border-orange-200 hover:text-orange-800"
                aria-label="Открыть меню"
              >
                <Menu size={20} />
              </button>
              <span className="text-sm font-medium text-neutral-700">Содержание документации</span>
            </div>
          ) : null}

          <main
            className={`min-h-0 flex-1 bg-white ${
              isTicketDetail ? 'overflow-hidden' : 'overflow-y-auto overscroll-y-contain'
            }`}
          >
            <div
              className={
                isTicketDetail
                  ? 'flex h-full min-h-0 flex-col px-4 py-3 sm:px-6'
                  : isSupportArea
                    ? 'mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 lg:py-10'
                    : 'mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10'
              }
            >
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DocsLayout;
