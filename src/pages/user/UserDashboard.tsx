import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle2, Clock, AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiClient } from '@/api/client';
import { statusLabel, statusStyle, fileNameFromPath } from '@/lib/submissions';

const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    apiClient
      .getMySubmissions()
      .then((data) => {
        if (!active) return;
        setSubmissions(data);
        setError('');
      })
      .catch((e: any) => {
        if (active) setError(e?.message || 'Failed to load your submissions');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const countBy = (status: string) =>
    submissions.filter((s) => (s.status || '').toLowerCase() === status).length;

  const stats = [
    {
      label: 'Total Submissions',
      value: submissions.length,
      icon: FileText,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-500/10',
    },
    {
      label: 'Approved',
      value: countBy('approved'),
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
    {
      label: 'Pending Review',
      value: countBy('pending'),
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
    },
    {
      label: 'Needs Attention',
      value: countBy('rejected') + countBy('requires_correction'),
      icon: AlertCircle,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-500/10',
    },
  ];

  const recent = submissions.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-8 text-white shadow-xl shadow-teal-900/10 dark:shadow-none"
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Ready to submit new data?</h2>
            <p className="text-teal-100 opacity-90 max-w-xl">
              Help us track urban dengue cases. Your data contributions drive the forecasting models and early warning signals for the city.
            </p>
          </div>
          <button
            onClick={() => navigate('/user/submit')}
            className="bg-white text-teal-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-teal-50 transition-colors shadow-lg whitespace-nowrap dark:bg-slate-900 dark:text-teal-300 dark:hover:bg-slate-800"
          >
            <Upload className="w-5 h-5" />
            Start Submission
          </button>
        </div>
      </motion.div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 rounded-xl p-4 flex items-center gap-3 text-sm dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 font-bold hover:underline"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm transition-colors dark:bg-slate-900 dark:border-slate-800 dark:shadow-none"
            >
              <div className={`${stat.bg} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <p className="text-slate-500 text-sm font-medium dark:text-slate-400">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {loading ? <span className="text-slate-300 dark:text-slate-600">—</span> : stat.value}
              </h3>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Submissions */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden transition-colors dark:bg-slate-900 dark:border-slate-800 dark:shadow-none">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white">Recent Submissions</h3>
          {submissions.length > 0 && (
            <button
              onClick={() => navigate('/user/history')}
              className="text-teal-600 text-sm font-semibold hover:underline dark:text-teal-400"
            >
              View All
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm dark:text-slate-500">Loading your submissions...</div>
        ) : recent.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 dark:bg-slate-800/50">
              <Inbox className="w-7 h-7 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="font-bold text-slate-700 dark:text-slate-200">No submissions yet</p>
            <p className="text-sm text-slate-400 mt-1 dark:text-slate-500">
              Upload your first weekly surveillance file to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {recent.map((sub) => (
              <div
                key={sub.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors dark:hover:bg-slate-800/50"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="bg-slate-100 p-2 rounded-lg flex-shrink-0 dark:bg-slate-800">
                    <FileText className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate dark:text-white">{fileNameFromPath(sub.file_path)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {sub.organization} · {sub.district} · Submitted on{' '}
                      {new Date(sub.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${statusStyle(sub.status)}`}>
                  {statusLabel(sub.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
