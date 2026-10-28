import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText, Search, Download, ExternalLink, CheckCircle2, Clock,
  XCircle, AlertCircle, ChevronLeft, ChevronRight, ChevronDown,
  ChevronUp, Loader2, Info, RefreshCw, Inbox,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/api/client';
import { statusLabel, statusStyle, fileNameFromPath } from '@/lib/submissions';

const PAGE_SIZE = 8;

const STATUS_ICON: Record<string, React.ReactNode> = {
  approved: <CheckCircle2 className="w-4 h-4" />,
  pending: <Clock className="w-4 h-4" />,
  rejected: <XCircle className="w-4 h-4" />,
  requires_correction: <AlertCircle className="w-4 h-4" />,
};

const csvCell = (value: any) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const SubmissionHistory: React.FC = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, any>>({});
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    apiClient
      .getMySubmissions()
      .then((data) => {
        setSubmissions(data);
        setError('');
      })
      .catch((e: any) => setError(e?.message || 'Failed to load submission history'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return submissions.filter((sub) => {
      const matchesStatus = !statusFilter || (sub.status || '').toLowerCase() === statusFilter;
      if (!matchesStatus) return false;
      if (!term) return true;
      return [sub.id, sub.organization, sub.district, sub.city, fileNameFromPath(sub.file_path)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [submissions, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleDetails = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!previews[id]) {
      setPreviewLoading(id);
      try {
        const preview = await apiClient.getMySubmissionPreview(id);
        setPreviews((prev) => ({ ...prev, [id]: preview }));
      } catch {
        setPreviews((prev) => ({ ...prev, [id]: { error: true } }));
      } finally {
        setPreviewLoading(null);
      }
    }
  };

  const exportCsv = () => {
    if (filtered.length === 0) return;
    const header = ['Submission ID', 'File', 'Organization', 'District', 'City', 'Period Start', 'Period End', 'Status', 'Submitted At'];
    const rows = filtered.map((sub) =>
      [
        sub.id,
        fileNameFromPath(sub.file_path),
        sub.organization,
        sub.district,
        sub.city,
        sub.period_start,
        sub.period_end,
        statusLabel(sub.status),
        sub.created_at,
      ].map(csvCell).join(',')
    );
    const csv = [header.map(csvCell).join(','), ...rows].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'submission-history.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 transition-colors dark:bg-slate-900 dark:border-slate-800 dark:shadow-none">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by ID, file, organization or district..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="flex-1 md:flex-none px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="requires_correction">Requires Correction</option>
          </select>
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 rounded-xl p-4 flex items-center gap-3 text-sm dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={load} className="flex items-center gap-1.5 font-bold hover:underline">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-colors dark:bg-slate-900 dark:border-slate-800 dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Submission ID</th>
                <th className="px-6 py-4">File Details</th>
                <th className="px-6 py-4">Reporting Period</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading history...
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="mx-auto w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 dark:bg-slate-800/50">
                      <Inbox className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="font-bold text-slate-700 dark:text-slate-200">
                      {submissions.length === 0 ? 'No submissions yet' : 'No matching submissions'}
                    </p>
                    <p className="text-sm text-slate-400 mt-1 dark:text-slate-500">
                      {submissions.length === 0
                        ? 'Files you submit will appear here and remain available after refresh.'
                        : 'Try a different search term or status filter.'}
                    </p>
                  </td>
                </tr>
              ) : (
                pageRows.map((sub, idx) => {
                  const key = (sub.status || '').toLowerCase();
                  const isOpen = expandedId === sub.id;
                  const preview = previews[sub.id];
                  return (
                    <React.Fragment key={sub.id}>
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.04 }}
                        className="hover:bg-slate-50/50 transition-colors group dark:hover:bg-slate-800/50"
                      >
                        <td className="px-6 py-4">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{sub.id}</span>
                          <p className="text-[10px] text-slate-400 mt-1 dark:text-slate-500">
                            Submitted on {new Date(sub.created_at).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-slate-100 p-2 rounded-lg text-slate-600 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-teal-500/10 dark:group-hover:text-teal-400">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{fileNameFromPath(sub.file_path)}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500">{sub.organization} · {sub.district}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                          {sub.period_start} → {sub.period_end}
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusStyle(sub.status)}`}>
                            {STATUS_ICON[key]}
                            {statusLabel(sub.status)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => toggleDetails(sub.id)}
                            className="text-teal-600 hover:text-teal-700 font-semibold text-sm inline-flex items-center gap-1 dark:text-teal-400 dark:hover:text-teal-300"
                          >
                            {isOpen ? 'Hide Details' : 'View Details'}
                            {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </td>
                      </motion.tr>

                      {sub.admin_remarks && !isOpen && (
                        <tr className="bg-slate-50/30 dark:bg-slate-800/50">
                          <td colSpan={5} className="px-6 py-3">
                            <div className="flex items-start gap-2 text-xs text-slate-500 italic bg-white/50 p-2 rounded-lg border border-slate-100 dark:text-slate-400 dark:bg-slate-900/50 dark:border-slate-800">
                              <Info className="w-3.5 h-3.5 mt-0.5 text-slate-400 dark:text-slate-500" />
                              <span><strong>Admin Remark:</strong> {sub.admin_remarks}</span>
                            </div>
                          </td>
                        </tr>
                      )}

                      <AnimatePresence>
                        {isOpen && (
                          <tr>
                            <td colSpan={5} className="p-0">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden bg-slate-50/60 border-y border-slate-100 transition-colors dark:bg-slate-800/50 dark:border-slate-800"
                              >
                                <div className="p-6 space-y-6">
                                  {/* Metadata */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                      { label: 'Organization', value: `${sub.organization} (${sub.org_type || '—'})` },
                                      { label: 'Location', value: `${sub.district}${sub.city ? ` · ${sub.city}` : ''}` },
                                      { label: 'Reporting Period', value: `${sub.period_start} → ${sub.period_end}` },
                                      { label: 'Submitted At', value: new Date(sub.created_at).toLocaleString() },
                                    ].map((item) => (
                                      <div key={item.label} className="bg-white p-3 rounded-xl border border-slate-100 transition-colors dark:bg-slate-900 dark:border-slate-800">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest dark:text-slate-500">{item.label}</p>
                                        <p className="text-sm font-semibold text-slate-800 mt-1 dark:text-slate-100">{item.value}</p>
                                      </div>
                                    ))}
                                  </div>

                                  {sub.admin_remarks && (
                                    <div className="flex items-start gap-2 text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100 transition-colors dark:text-slate-300 dark:bg-slate-900 dark:border-slate-800">
                                      <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5 dark:text-slate-500" />
                                      <span><strong>Admin Remark:</strong> {sub.admin_remarks}</span>
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-slate-900 text-sm dark:text-white">File Contents</h4>
                                    <a
                                      href={apiClient.getMySubmissionFileUrl(sub.id)}
                                      className="text-teal-600 hover:text-teal-700 font-bold text-xs inline-flex items-center gap-1 dark:text-teal-400 dark:hover:text-teal-300"
                                    >
                                      Download Raw File <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>

                                  {previewLoading === sub.id ? (
                                    <div className="text-center py-8 text-slate-400 text-sm bg-white rounded-xl border border-slate-100 transition-colors dark:text-slate-500 dark:bg-slate-900 dark:border-slate-800">
                                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                                      Reading submitted file...
                                    </div>
                                  ) : preview?.error ? (
                                    <div className="text-center py-6 text-rose-600 text-sm bg-white rounded-xl border border-rose-100 transition-colors dark:text-rose-400 dark:bg-slate-900 dark:border-rose-500/30">
                                      The uploaded file could not be read. It may have been removed from the server.
                                    </div>
                                  ) : preview ? (
                                    <>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                          { label: 'Total Rows', value: preview.totalRows },
                                          { label: 'Total Cases', value: preview.stats.totalCases },
                                          { label: 'Duplicate Rows', value: preview.stats.duplicates },
                                          { label: 'Completeness', value: `${preview.stats.completeness}%` },
                                        ].map((item) => (
                                          <div key={item.label} className="bg-white p-3 rounded-xl border border-slate-100 transition-colors dark:bg-slate-900 dark:border-slate-800">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest dark:text-slate-500">{item.label}</p>
                                            <p className="text-lg font-bold text-slate-800 mt-1 dark:text-slate-100">{item.value}</p>
                                          </div>
                                        ))}
                                      </div>

                                      {preview.stats.missingColumns?.length > 0 && (
                                        <p className="text-xs text-rose-600 font-medium dark:text-rose-400">
                                          Missing required columns: {preview.stats.missingColumns.join(', ')}
                                        </p>
                                      )}

                                      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden transition-colors dark:bg-slate-900 dark:border-slate-800">
                                        <div className="overflow-x-auto max-h-72">
                                          <table className="w-full text-xs text-left">
                                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider sticky top-0 dark:bg-slate-800/50 dark:text-slate-400">
                                              <tr>
                                                {preview.columns.map((col: string) => (
                                                  <th key={col} className="px-4 py-3 whitespace-nowrap">{col}</th>
                                                ))}
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                              {preview.rows.map((row: any, i: number) => (
                                                <tr key={i} className="hover:bg-slate-50 transition-colors dark:hover:bg-slate-800/50">
                                                  {preview.columns.map((col: string) => (
                                                    <td key={col} className="px-4 py-2.5 text-slate-700 whitespace-nowrap dark:text-slate-200">{String(row[col] ?? '')}</td>
                                                  ))}
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                        {preview.totalRows > preview.rows.length && (
                                          <p className="text-[10px] text-slate-400 px-4 py-2 border-t border-slate-100 dark:text-slate-500 dark:border-slate-800">
                                            Showing first {preview.rows.length} of {preview.totalRows} rows.
                                          </p>
                                        )}
                                      </div>
                                    </>
                                  ) : null}
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 transition-colors dark:bg-slate-800/50 dark:border-slate-800 dark:text-slate-400">
            <p>
              Showing {(safePage - 1) * PAGE_SIZE + 1} to {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} submission{filtered.length === 1 ? '' : 's'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, safePage - 1))}
                disabled={safePage <= 1}
                className="flex items-center gap-1 px-3 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                disabled={safePage >= totalPages}
                className="flex items-center gap-1 px-3 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionHistory;
