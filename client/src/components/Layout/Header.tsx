import React from 'react';
import { Bell, MessageCircle, LogIn, Menu } from 'lucide-react';
import MnoonxAISiriOrb from '../AI/MnoonxAISiriOrb';
import SearchBar from '../Common/SearchBar';
import HeaderIconBadge from '../Common/HeaderIconBadge';
import { useAuth } from '../../context/AuthContext';
import { useAIChatPanel } from '../../context/AIChatPanelContext';
import { useUnreads } from '../../context/UnreadsContext';

interface HeaderProps {
  onSearch?: (query: string, category?: string) => void;
  sidebarCollapsed?: boolean;
  onSidebarOpen?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch, sidebarCollapsed, onSidebarOpen }) => {
  const { user } = useAuth();
  const { messageUnread, notificationUnread } = useUnreads();
  const { isOpen: isAiOpen, togglePanel } = useAIChatPanel();

  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between bg-neutral-50 px-3 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {sidebarCollapsed && onSidebarOpen && (
          <button
            type="button"
            onClick={onSidebarOpen}
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl text-neutral-700 transition-colors hover:bg-black/5 active:scale-95 lg:flex"
            aria-label="Show sidebar"
          >
            <Menu className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        )}
        <div className="min-w-0 max-w-2xl flex-1">
        <SearchBar
          onSearch={onSearch}
          placeholder="Search for communities, businesses, or people..."
        />
        </div>
      </div>

      <div className="ml-2 flex shrink-0 items-center space-x-1 sm:ml-4 sm:space-x-2">
        <span className="hidden lg:contents">
          <HeaderIconBadge to="/messenger" label="Messages" count={messageUnread}>
            <MessageCircle className="h-5 w-5" />
          </HeaderIconBadge>
        </span>
        <HeaderIconBadge to="/notifications" label="Notifications" count={notificationUnread}>
          <Bell className="h-5 w-5" />
        </HeaderIconBadge>
        <button
          type="button"
          className="hidden py-2 px-4 font-simebold text-neutral-600 border hover:text-neutral-700 hover:bg-black/10 rounded-full active:scale-[0.95] transition-all md:inline-flex"
        >
          Go to Dashboard
        </button>

        <button
          type="button"
          onClick={togglePanel}
          className={`flex shrink-0 items-center justify-center rounded-full transition-all ${
            isAiOpen ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-neutral-50' : ''
          }`}
          aria-label={isAiOpen ? 'Close MNOONX AI' : 'Open MNOONX AI'}
          aria-expanded={isAiOpen}
        >
          <MnoonxAISiriOrb size="42px" animationDuration={18} compact />
        </button>

        {user ? (
          <div className="hidden items-center gap-3 border-l border-neutral-200 pl-3 lg:flex">
            <img
              src={user.avatar || `https://i.pravatar.cc/150?u=${user.email}`}
              alt={user.username}
              className="w-8 h-8 rounded-full"
            />
            <div className="hidden md:block">
              <p className="text-sm font-medium">{user.username}</p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openLogin'))}
            className="hidden items-center gap-2 rounded-xl border border-neutral-300 px-3 py-2 transition-all hover:bg-black hover:text-white active:scale-[0.95] lg:flex"
          >
            <LogIn className="h-5 w-5" />
            <span className="font-medium">Sign in</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
