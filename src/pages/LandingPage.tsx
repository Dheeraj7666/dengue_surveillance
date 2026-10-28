import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, ArrowRight, Activity, BarChart3, MapPin, CloudSun,
  Upload, CheckCircle2, Menu, X, Hospital, LayoutDashboard, FileText,
  TrendingUp, Database, ClipboardList, LineChart, Building2, Lock, ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';

const PREVIEW_NAV = [
  { icon: LayoutDashboard, label: 'Overview' },
  { icon: FileText, label: 'Submissions' },
  { icon: TrendingUp, label: 'Forecast' },
  { icon: MapPin, label: 'Hotspots' },
  { icon: CloudSun, label: 'Weather' },
  { icon: BarChart3, label: 'Model Performance' },
  { icon: Database, label: 'Data Explorer' },
  { icon: ClipboardList, label: 'Audit Log' },
];

const BAR_HEIGHTS = [36, 48, 42, 62, 55, 74, 88];

/** Shared entrance animation for the scroll-revealed sections. */
const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.45, delay, ease: 'easeOut' as const },
});

const NAV_LINKS = [
  { label: 'Capabilities', href: '#features' },
  { label: 'Workflow', href: '#how-it-works' },
  { label: 'Portals', href: '#portals' },
];

const CAPABILITIES = [
  { icon: FileText, label: 'Weekly reporting', desc: 'Validated 12-column uploads' },
  { icon: ShieldCheck, label: 'Review workflow', desc: 'Approve or reject with remarks' },
  { icon: TrendingUp, label: 'Case forecasting', desc: 'Weekly projections + intervals' },
  { icon: MapPin, label: 'Hotspot ranking', desc: 'Incidence by district' },
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const features = [
    {
      icon: BarChart3,
      title: 'Data-driven forecasting',
      desc: 'Weekly case projections with prediction intervals, generated only from records that passed review.',
    },
    {
      icon: MapPin,
      title: 'Hotspot detection',
      desc: 'Districts ranked by incidence and week-over-week trend, so resources reach the areas that need them.',
    },
    {
      icon: Activity,
      title: 'Controlled data intake',
      desc: 'Every report is validated on upload, previewed by an officer and approved before it enters the dataset.',
    },
  ];

  const steps = [
    {
      icon: Upload,
      title: 'Providers report',
      desc: 'Hospitals submit weekly case, locality and weather data through a validated upload form.',
    },
    {
      icon: ShieldCheck,
      title: 'Authorities review',
      desc: 'Health officials inspect the file, preview its contents and approve or reject it with remarks.',
    },
    {
      icon: LineChart,
      title: 'Insights generated',
      desc: 'Approved data drives forecasting, hotspot detection, weather correlation and model back-testing.',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-sans antialiased selection:bg-teal-100 dark:selection:bg-teal-500/30 transition-colors">
      {/* ---------------------------------------------------------------- Nav */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5 shrink-0">
            <span className="grid place-items-center w-8 h-8 rounded-lg bg-teal-700 text-white shadow-sm">
              <ShieldCheck className="w-4 h-4" strokeWidth={2.25} />
            </span>
            <span className="font-semibold text-[15px] tracking-tight text-slate-900 dark:text-white">
              DengueCare <span className="text-teal-700 dark:text-teal-400">AI</span>
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-lg text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <span className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
            <button
              onClick={() => navigate('/user')}
              className="text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-400 px-3 py-2 rounded-lg transition-colors"
            >
              Provider sign in
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="inline-flex items-center gap-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[13px] font-semibold px-4 py-2 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
            >
              Admin portal <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-6 py-4 space-y-1 transition-colors">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 mt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2">
              <button
                onClick={() => { setMenuOpen(false); navigate('/user'); }}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
              >
                Provider
              </button>
              <button
                onClick={() => { setMenuOpen(false); navigate('/admin'); }}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900"
              >
                Admin portal
              </button>
            </div>
          </div>
        )}
      </header>

      {/* -------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden pt-32 pb-20">
        {/* Institutional backdrop: a faint grid instead of decorative blobs. */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.55] dark:opacity-[0.18]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgb(148 163 184 / 0.22) 1px, transparent 1px), linear-gradient(to bottom, rgb(148 163 184 / 0.22) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, #000 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, #000 40%, transparent 100%)',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-16 items-center">
            <div>
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 rounded-full border border-teal-200 dark:border-teal-500/30 bg-teal-50 dark:bg-teal-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-800 dark:text-teal-300"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400" />
                Urban dengue surveillance
              </motion.span>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.5, ease: 'easeOut' }}
                className="mt-6 text-[2.5rem] leading-[1.08] md:text-[3.25rem] font-semibold tracking-[-0.02em] text-slate-900 dark:text-white"
              >
                From weekly reports to
                <span className="block text-teal-700 dark:text-teal-400">outbreak foresight</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16, duration: 0.5, ease: 'easeOut' }}
                className="mt-6 text-[17px] leading-relaxed text-slate-600 dark:text-slate-400 max-w-xl"
              >
                One workspace where healthcare providers submit surveillance data and health
                authorities turn it into forecasts, hotspot rankings and early warning signals.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24, duration: 0.5, ease: 'easeOut' }}
                className="mt-9 flex flex-col sm:flex-row gap-3"
              >
                <button
                  onClick={() => navigate('/admin')}
                  className="group inline-flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-6 py-3.5 rounded-xl text-[15px] font-semibold transition-colors shadow-sm"
                >
                  Government access
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button
                  onClick={() => navigate('/user')}
                  className="inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-6 py-3.5 rounded-xl text-[15px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Hospital className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                  Provider portal
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.36 }}
                className="mt-8 flex items-center gap-2 text-[13px] text-slate-500 dark:text-slate-500"
              >
                <Lock className="w-3.5 h-3.5" />
                Officer sign-in required · HMAC-signed sessions · Full audit trail
              </motion.div>
            </div>

            {/* Product preview built from the real portal structure */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
              className="relative"
            >
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/10 dark:shadow-black/40 overflow-hidden transition-colors">
                {/* Window chrome */}
                <div className="flex items-center gap-2 px-4 h-9 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <div className="ml-3 h-5 flex-1 max-w-[220px] rounded-md bg-slate-100 dark:bg-slate-800" />
                </div>

                <div className="flex h-[356px]">
                  {/* Sidebar */}
                  <div className="hidden sm:flex flex-col w-44 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-3 gap-0.5">
                    <div className="flex items-center gap-2 px-2 py-2 mb-3">
                      <span className="grid place-items-center w-5 h-5 rounded bg-teal-700 text-white">
                        <ShieldCheck className="w-3 h-3" />
                      </span>
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                        Admin Portal
                      </span>
                    </div>
                    {PREVIEW_NAV.map((item, i) => (
                      <div
                        key={item.label}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium ${
                          i === 0
                            ? 'bg-teal-700 text-white'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <item.icon className="w-3.5 h-3.5" />
                        {item.label}
                      </div>
                    ))}
                  </div>

                  {/* Main */}
                  <div className="flex-1 p-5 space-y-4 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-2.5 w-28 rounded-full bg-slate-800 dark:bg-slate-200" />
                        <div className="h-2 w-40 rounded-full bg-slate-200 dark:bg-slate-700" />
                      </div>
                      <div className="h-7 w-20 rounded-lg bg-teal-700" />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3"
                        >
                          <div className="h-2 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                          <div className="h-3.5 w-12 rounded bg-slate-800 dark:bg-slate-200 mt-2.5" />
                        </div>
                      ))}
                    </div>

                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 h-[140px]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="h-2 w-24 rounded-full bg-slate-200 dark:bg-slate-700" />
                        <div className="h-2 w-10 rounded-full bg-slate-100 dark:bg-slate-800" />
                      </div>
                      <div className="flex items-end gap-2 h-[86px]">
                        {BAR_HEIGHTS.map((h, i) => (
                          <div
                            key={i}
                            style={{ height: `${h}%` }}
                            className={`flex-1 rounded-t ${
                              i >= BAR_HEIGHTS.length - 2 ? 'bg-teal-700' : 'bg-teal-700/25'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Framed caption anchored to the mock */}
              <div className="absolute -bottom-5 left-5 hidden lg:flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 shadow-lg shadow-slate-900/5 dark:shadow-black/40 transition-colors">
                <span className="grid place-items-center w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400">
                  <Activity className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                    Computed from approved records
                  </p>
                  <p className="text-[13px] font-semibold text-slate-900 dark:text-white">
                    Forecast · Hotspots · Audit
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- Capability strip */}
      <section className="border-y border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-200 dark:divide-slate-800">
            {CAPABILITIES.map((item, i) => (
              <motion.div
                key={item.label}
                {...reveal(i * 0.06)}
                className="flex items-start gap-3 px-6 py-7 first:pl-0"
              >
                <item.icon className="w-5 h-5 mt-0.5 text-teal-700 dark:text-teal-400 shrink-0" />
                <div>
                  <p className="text-[13px] font-semibold text-slate-900 dark:text-white">
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- Features */}
      <section id="features" className="py-24 bg-white dark:bg-slate-950 transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...reveal()} className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-400">
              Capabilities
            </p>
            <h2 className="mt-4 text-3xl md:text-[2.35rem] font-semibold tracking-[-0.02em] leading-tight text-slate-900 dark:text-white">
              Built for real surveillance work
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed">
              Three capabilities sit at the core of the platform. Everything else in the portal
              exists to support them.
            </p>
          </motion.div>

          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                {...reveal(i * 0.08)}
                className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-card hover:shadow-card-hover hover:border-teal-300 dark:hover:border-teal-700/60 transition-all"
              >
                <span className="grid place-items-center w-11 h-11 rounded-xl bg-slate-900 dark:bg-slate-800 text-white group-hover:bg-teal-700 transition-colors">
                  <f.icon className="w-5 h-5" />
                </span>
                <h3 className="mt-6 text-[17px] font-semibold text-slate-900 dark:text-white">
                  {f.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- How it works */}
      <section
        id="how-it-works"
        className="py-24 bg-slate-50 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800 transition-colors"
      >
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...reveal()} className="text-center max-w-2xl mx-auto">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-400">
              Workflow
            </p>
            <h2 className="mt-4 text-3xl md:text-[2.35rem] font-semibold tracking-[-0.02em] text-slate-900 dark:text-white">
              Three steps from report to signal
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed">
              Nothing enters the analytical dataset until a health officer has approved it.
            </p>
          </motion.div>

          <div className="relative mt-16 max-w-5xl mx-auto">
            {/* Connector rail between the numbered steps */}
            <div className="hidden md:block absolute top-6 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-slate-200 via-teal-300 to-slate-200 dark:from-slate-800 dark:via-teal-800 dark:to-slate-800" />

            <div className="grid md:grid-cols-3 gap-6">
              {steps.map((step, i) => (
                <motion.div key={step.title} {...reveal(i * 0.08)} className="relative">
                  <div className="relative z-10 mx-auto md:mx-0 md:ml-0 w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card grid place-items-center text-slate-900 dark:text-white">
                    <step.icon className="w-5 h-5" />
                    <span className="absolute -top-2 -right-2 grid place-items-center w-5 h-5 rounded-full bg-teal-700 text-white text-[10px] font-bold">
                      {i + 1}
                    </span>
                  </div>
                  <div className="mt-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-card transition-colors">
                    <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Portals */}
      <section id="portals" className="py-24 bg-white dark:bg-slate-950 transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...reveal()} className="text-center max-w-2xl mx-auto">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-400">
              Portals
            </p>
            <h2 className="mt-4 text-3xl md:text-[2.35rem] font-semibold tracking-[-0.02em] text-slate-900 dark:text-white">
              Two workspaces, one dataset
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed">
              Providers feed the pipeline. Authorities consume it. Both read the same approved records.
            </p>
          </motion.div>

          <div className="mt-14 grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <motion.div {...reveal()} className="h-full">
              <button
                onClick={() => navigate('/user')}
                className="group w-full h-full text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-card hover:shadow-card-hover hover:border-teal-300 dark:hover:border-teal-700/60 transition-all flex flex-col"
              >
                <span className="grid place-items-center w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 group-hover:bg-teal-700 group-hover:text-white transition-colors">
                  <Hospital className="w-6 h-6" />
                </span>
                <h3 className="mt-6 text-xl font-semibold text-slate-900 dark:text-white">
                  Healthcare providers
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400 flex-1">
                  Submit weekly case reports, rainfall readings and locality metrics through a
                  validated upload, then follow each report's review status.
                </p>
                <ul className="mt-6 space-y-2.5">
                  {['Validated 12-column upload', 'Preview before submit', 'Submission status tracking'].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <span className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 dark:text-teal-400">
                  Enter provider portal
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </motion.div>

            <motion.div {...reveal(0.08)} className="h-full">
              <button
                onClick={() => navigate('/admin')}
                className="group w-full h-full text-left rounded-2xl border border-slate-900 dark:border-slate-700 bg-slate-900 dark:bg-slate-900 p-8 shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 transition-all flex flex-col"
              >
                <span className="grid place-items-center w-12 h-12 rounded-xl bg-white/10 text-white group-hover:bg-teal-700 transition-colors">
                  <Building2 className="w-6 h-6" />
                </span>
                <h3 className="mt-6 text-xl font-semibold text-white">Health authorities</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400 flex-1">
                  Review incoming submissions, curate the analytical dataset and monitor forecasts,
                  hotspot rankings and weather signals.
                </p>
                <ul className="mt-6 space-y-2.5">
                  {['Approval workflow with remarks', 'Forecasting & hotspot analysis', 'Complete audit trail'].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <span className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-400">
                  Enter admin portal
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="grid place-items-center w-8 h-8 rounded-lg bg-teal-700 text-white">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <span className="font-semibold tracking-tight text-slate-900 dark:text-white">
                  DengueCare AI
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400 max-w-sm">
                Urban dengue surveillance, forecasting and early warning for government health
                authorities.
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                Platform
              </p>
              <ul className="mt-4 space-y-2.5">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-slate-600 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-400 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                Access
              </p>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <button
                    onClick={() => navigate('/user')}
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-400 transition-colors"
                  >
                    Provider portal
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/admin')}
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-400 transition-colors"
                  >
                    Admin portal
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              &copy; 2026 Public Health Intelligence Unit · Academic prototype
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Analytical output is decision support, not a clinical diagnosis.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
