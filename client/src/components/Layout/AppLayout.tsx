// components/Layout/AppLayout.tsx
import React, { ReactNode, useRef, useState, useCallback } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';
import AIChatDrawer from '../AI/AIChatDrawer';
import DiscoverMarketGridBackground from './DiscoverMarketGridBackground';
import { AIChatPanelProvider, useAIChatPanel } from '../../context/AIChatPanelContext';
import { useDiscoverMarketTab } from '../../hooks/useDiscoverMarketTab';

const SIDEBAR_COLLAPSED_KEY = 'mnoonx-sidebar-collapsed';

function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

const AppMain: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isOpen } = useAIChatPanel();
  const isDiscoverMarket = useDiscoverMarketTab();

  const panelRadius = isOpen
    ? 'rounded-l-3xl rounded-tr-none rounded-br-none max-lg:rounded-3xl'
    : 'rounded-3xl';

  return (
    <main
      className={`flex min-h-0 flex-1 overflow-hidden ${isOpen ? 'max-lg:flex-col' : ''}`}
    >
      <div
        className={`relative min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto border-0 transition-[border-radius] duration-300 ${panelRadius} ${
          isDiscoverMarket ? 'bg-stone-50' : 'bg-white'
        }`}
      >
        {isDiscoverMarket && <DiscoverMarketGridBackground />}
        <div className={`relative z-10 min-h-full ${isDiscoverMarket ? '' : 'h-full'}`}>
          {children}
        </div>
      </div>
      <AIChatDrawer />
    </main>
  );
};

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed);

  const collapseSidebar = useCallback(() => {
    setSidebarCollapsed(true);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, '1');
    } catch {
      /* ignore */
    }
  }, []);

  const expandSidebar = useCallback(() => {
    setSidebarCollapsed(false);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, '0');
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <AIChatPanelProvider>
      <div className="flex h-[100dvh] overflow-hidden bg-neutral-50">
        <aside
          className={`hidden h-full shrink-0 overflow-visible border-neutral-200 bg-neutral-50 transition-[width,border-width] duration-300 ease-out lg:flex ${
            sidebarCollapsed ? 'w-0 border-r-0' : 'w-64 border-r'
          }`}
          aria-hidden={sidebarCollapsed}
        >
          {!sidebarCollapsed && <Sidebar onToggleCollapse={collapseSidebar} />}
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div ref={headerRef} className="shrink-0">
            <Header sidebarCollapsed={sidebarCollapsed} onSidebarOpen={expandSidebar} />
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <AppMain>{children}</AppMain>
            <MobileBottomNav />
          </div>
        </div>
      </div>
    </AIChatPanelProvider>
  );
};

export default AppLayout;
