import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, Upload, History, Home, LogOut, ChevronRight } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

interface UserPortalLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/user', icon: Home },
  { name: 'Submit Data', path: '/user/submit', icon: Upload },
  { name: 'History', path: '/user/history', icon: History },
];

const UserPortalLayout: React.FC<UserPortalLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Reflects the organization this provider last submitted as. Kept in local
  // storage so the identity survives page refreshes without an auth system.
  const organization = localStorage.getItem('denguecare.org') || '';
  const initials = organization
    ? organization
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase()
    : 'PP';

  const currentPage =
    NAV_ITEMS.find((item) => item.path === location.pathname)?.name || 'Dashboard';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans transition-colors duration-200">
      {/* ------------------------------------------------------- Sidebar rail */}
      <aside className="w-64 shrink-0 bg-slate-900 dark:bg-slate-900 text-slate-400 flex flex-col fixed inset-y-0 border-r border-slate-800 z-20">
        <Link
          to="/user"
          className="h-16 px-5 flex items-center gap-3 border-b border-slate-800/80 shrink-0"
        >
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-teal-700 text-white">
            <ShieldCheck className="w-4 h-4" strokeWidth={2.25} />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold text-white tracking-tight leading-none">
              DengueCare AI
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-400 mt-1">
              Provider portal
            </span>
          </span>
        </Link>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Reporting
          </p>
          <div className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'font-medium hover:bg-slate-800/60 hover:text-slate-100'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                  {isActive && <span className="ml-auto w-1 h-1 rounded-full bg-teal-400" />}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-3 border-t border-slate-800/80 shrink-0">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Exit portal
          </button>
        </div>
      </aside>

      {/* -------------------------------------------------------- Main column */}
      <div className="flex-1 ml-64 min-h-screen flex flex-col">
        <header className="sticky top-0 z-10 h-16 shrink-0 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between transition-colors duration-200">
          <div className="flex items-center gap-2 text-[13px] min-w-0">
            <span className="text-slate-400 dark:text-slate-500">Provider</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-white truncate">
              {currentPage}
            </span>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <span className="hidden sm:block text-[13px] text-slate-500 dark:text-slate-400 max-w-[220px] truncate">
              {organization || 'Healthcare provider'}
            </span>
            <span className="hidden sm:block w-px h-5 bg-slate-200 dark:bg-slate-800" />
            <ThemeToggle />
            <span className="grid place-items-center w-9 h-9 rounded-full bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/30 text-[11px] font-bold text-teal-700 dark:text-teal-300">
              {initials}
            </span>
          </div>
        </header>

        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default UserPortalLayout;
