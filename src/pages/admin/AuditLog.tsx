import React, { useEffect, useState } from 'react';
import { Shield, Search, Download, User, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiClient } from '@/api/client';
import { EmptyState, LoadingState } from '@/components/admin/States';

const actionStyle = (action: string) => {
  if (action.includes('Approved') || action.includes('Received')) return 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30';
  if (action.includes('Rejected')) return 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30';
  if (action.includes('Forecast')) return 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30';
  return 'text-slate-600 bg-slate-50 border-slate-100 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-800';
};

const csvCell = (value: any) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const AuditLog: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiClient
      .getAuditLog(search)
      .then((res) => {
        if (!active) return;
        setLogs(res);
        setError('');
      })
      .catch((e: any) => {
        if (active) setError(e?.message || 'Failed to load audit logs');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [search]);

  const exportCsv = () => {
    if (logs.length === 0) return;
    const header = ['Timestamp', 'Action', 'Actor', 'Submission ID', 'Details'];
    const rows = logs.map((log) => [log.timestamp, log.action, log.actor, log.submission_id, log.details].map(csvCell).join(','));
    const csv = [header.map(csvCell).join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'audit-log.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 dark:bg-slate-900 dark:border-slate-800 dark:shadow-none transition-colors">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="p-3 bg-slate-900 rounded-xl text-white dark:bg-slate-700">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">System Audit Trail</h3>
            <p className="text-xs text-slate-500 font-medium dark:text-slate-400">Chronological log of all administrative actions</p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by action or actor..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
          <button
            onClick={exportCsv}
            disabled={logs.length === 0}
            className="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800 dark:shadow-none transition-colors">
        {loading ? (
          <LoadingState label="Loading audit trail..." />
        ) : error ? (
          <EmptyState title="Audit trail unavailable" message={error} />
        ) : logs.length === 0 ? (
          <EmptyState
            title="No audit entries"
            message={search ? 'No entries match the current search.' : 'Administrative actions will be recorded here as they occur.'}
          />
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {logs.map((log, i) => (
              <motion.div
                key={`${log.timestamp}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i, 12) * 0.03 }}
                className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row gap-6 dark:hover:bg-slate-800/50"
              >
                <div className="md:w-48 shrink-0">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2 dark:text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                  <div className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border ${actionStyle(log.action)}`}>
                    {log.action}
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                      <User className="w-4 h-4 text-slate-400 dark:text-slate-500" /> {log.actor || 'System'}
                    </div>
                    {log.submission_id && (
                      <div className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        Target: {log.submission_id}
                      </div>
                    )}
                  </div>
                  {log.details && <p className="text-sm text-slate-600 leading-relaxed dark:text-slate-300">{log.details}</p>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLog;
