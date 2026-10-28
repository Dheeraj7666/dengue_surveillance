import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShieldCheck, LayoutDashboard, FileSpreadsheet, TrendingUp,
  Map, CloudSun, BarChart3, Search, ClipboardList, LogOut, ChevronRight,
} from 'lucide-react';
import { clearSession, getAdminUser } from '@/lib/auth';
import ThemeToggle from '@/components/ThemeToggle';

interface AdminPortalLayoutProps {
  children: React.ReactNode;
}

const NAV_SECTIONS = [
  {
    label: 'Monitoring',
    items: [
      { name: 'Overview', path: '/admin', icon: LayoutDashboard },
      { name: 'Forecast', path: '/admin/forecast', icon: TrendingUp },
      { name: 'Hotspots', path: '/admin/hotspots', icon: Map },
      { name: 'Weather', path: '/admin/weather', icon: CloudSun },
    ],
  },
  {
    label: 'Data',
    items: [
      { name: 'Submissions', path: '/admin/submissions', icon: FileSpreadsheet },
      { name: 'Data Explorer', path: '/admin/explorer', icon: Search },
      { name: 'Model Performance', path: '/admin/models', icon: BarChart3 },
      { name: 'Audit Log', path: '/admin/audit', icon: ClipboardList },
    ],
  },
];

const AdminPortalLayout: React.FC<AdminPortalLayoutProps> = ({ children }) => {
  const location = useLocation();

  const adminUser = getAdminUser();
  const initials = adminUser ? adminUser.slice(0, 2).toUpperCase() : 'AD';

  const handleSignOut = () => {
    clearSession();
    // Full page load so every cached admin view resets; the base path keeps
    // this working when the app is served from a sub-path on static hosting.
    window.location.replace(import.meta.env.BASE_URL);
  };

  const currentPage =
    NAV_SECTIONS.flatMap((section) => section.items).find((item) => item.path === location.pathname)
      ?.name || 'Admin Portal';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans transition-colors duration-200">
      {/* ------------------------------------------------------- Sidebar rail */}
      <aside className="w-64 shrink-0 bg-slate-900 dark:bg-slate-900 text-slate-400 flex flex-col fixed inset-y-0 border-r border-slate-800 z-20">
        <Link
          to="/admin"
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
              Government admin
            </span>
          </span>
        </Link>

        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-7">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
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
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3 px-2 py-2">
            <span className="grid place-items-center w-8 h-8 shrink-0 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-bold text-teal-400">
              {initials}
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-white truncate">
                {adminUser || 'Admin User'}
              </span>
              <span className="block text-[11px] text-slate-500 truncate">Health Department</span>
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="mt-1 flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* -------------------------------------------------------- Main column */}
      <div className="flex-1 ml-64 min-h-screen flex flex-col">
        <header className="sticky top-0 z-10 h-16 shrink-0 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between transition-colors duration-200">
          <div className="flex items-center gap-2 text-[13px] min-w-0">
            <span className="text-slate-400 dark:text-slate-500">Admin</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-white truncate">
              {currentPage}
            </span>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <span className="hidden lg:block text-[13px] text-slate-400 dark:text-slate-500">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <span className="hidden lg:block w-px h-5 bg-slate-200 dark:bg-slate-800" />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
};

export default AdminPortalLayout;
