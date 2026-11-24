import type { UserProfile } from '../types';

export type ActiveTab = 'browse' | 'report' | 'activity' | 'admin' | 'blueprint';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  user: UserProfile | null;
  unreadCount: number;
  onOpenAuth: () => void;
  onSignOut: () => void;
}

export function Navbar({
  activeTab,
  onSelectTab,
  user,
  unreadCount,
  onOpenAuth,
  onSignOut,
}: NavbarProps) {
  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'browse', label: 'Browse Items' },
    { id: 'report', label: 'Report Item' },
    { id: 'activity', label: unreadCount > 0 ? `My Activity (${unreadCount})` : 'My Activity' },
    { id: 'admin', label: 'Admin Desk' },
    { id: 'blueprint', label: 'SRS & Diagrams' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-8 px-6 py-4">
        <button
          type="button"
          onClick={() => onSelectTab('browse')}
          className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-900 rounded"
        >
          Campus Lost &amp; Found
        </button>

        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`text-sm font-medium whitespace-nowrap shrink-0 pb-0.5 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-900 ${
                  active
                    ? 'text-blue-900 border-b-2 border-blue-900'
                    : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          {user ? (
            <button
              type="button"
              onClick={onSignOut}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title={`Signed in as ${user.name} (${user.role})`}
            >
              Sign Out · {user.name.split(' ')[0]}
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Compact mobile navigation row */}
      <nav aria-label="Mobile navigation" className="flex md:hidden items-center gap-4 overflow-x-auto border-t border-slate-100 px-6 py-2.5">
        {navItems.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`text-xs font-medium whitespace-nowrap shrink-0 pb-0.5 ${
                active ? 'text-blue-900 border-b-2 border-blue-900' : 'text-slate-600'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
