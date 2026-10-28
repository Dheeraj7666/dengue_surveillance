import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, User, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiClient } from '@/api/client';
import { isAuthenticated, setSession } from '@/lib/auth';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated()) navigate('/admin', { replace: true });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = username.trim();
    if (!user || !password) {
      setError('Please enter both username and password.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const session = await apiClient.login(user, password);
      setSession(session.token, session.username);
      navigate('/admin', { replace: true });
    } catch (err: any) {
      const message = err?.message || '';
      setError(
        message === 'Failed to fetch' || err instanceof TypeError
          ? 'Cannot reach the server. Please make sure the backend is running.'
          : message || 'Unable to sign in. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.16]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgb(148 163 184 / 0.45) 1px, transparent 1px), linear-gradient(to bottom, rgb(148 163 184 / 0.45) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 100%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <button
          onClick={() => navigate('/')}
          className="text-slate-400 hover:text-white text-sm font-medium flex items-center gap-2 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </button>

        <div className="bg-white dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-2xl shadow-2xl dark:shadow-none p-10 transition-colors">
          <div className="flex flex-col items-center text-center mb-9">
            <div className="grid place-items-center w-14 h-14 rounded-2xl bg-teal-700 shadow-lg shadow-teal-900/30 mb-5">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Government Admin Portal</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Restricted access. Sign in with your official credentials.
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-xl p-3.5 flex items-start gap-2.5 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-teal-700 text-white py-3.5 rounded-xl font-semibold hover:bg-teal-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {busy ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Verifying...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-8 leading-relaxed">
            Access is limited to authorised health department officials. All
            administrative actions are recorded in the audit log.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
