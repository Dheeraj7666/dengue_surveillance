import React, { useState, useEffect } from 'react';
import {
  Search, CheckCircle2, XCircle, FileText, Download, Eye, MapPin, Loader2, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/api/client';
import { EmptyState, LoadingState } from '@/components/admin/States';

const STATUS_STYLES: Record<string, string> = {
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
};

const SubmissionManagement: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'pending' | 'all'>('pending');
  const [search, setSearch] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      setSubmissions(await apiClient.getAllSubmissions());
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const openReview = async (submission: any) => {
    setActiveSubmission(submission);
    setRemarks('');
    setActionError('');
    setPreview(null);
    setShowReviewModal(true);
    setPreviewLoading(true);
    try {
      setPreview(await apiClient.getSubmissionPreview(submission.id));
    } catch (error: any) {
      setActionError(error.message || 'Could not read the submitted file.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!activeSubmission) return;
    setBusy(true);
    setActionError('');
    try {
      await apiClient.approveSubmission(activeSubmission.id);
      setShowReviewModal(false);
      await fetchSubmissions();
    } catch (error: any) {
      setActionError(error.message || 'Approval failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!activeSubmission) return;
    if (!remarks.trim()) {
      setActionError('Please provide a reason for rejection.');
      return;
    }
    setBusy(true);
    setActionError('');
    try {
      await apiClient.rejectSubmission(activeSubmission.id, remarks.trim());
      setShowReviewModal(false);
      await fetchSubmissions();
    } catch (error: any) {
      setActionError(error.message || 'Rejection failed.');
    } finally {
      setBusy(false);
    }
  };

  const pendingCount = submissions.filter(s => s.status === 'pending').length;

  const filteredSubmissions = (selectedTab === 'pending'
    ? submissions.filter(s => s.status === 'pending')
    : submissions
  ).filter(s => {
    if (!search.trim()) return true;
    const needle = search.trim().toLowerCase();
    return (
      s.organization?.toLowerCase().includes(needle) ||
      s.id?.toLowerCase().includes(needle) ||
      s.district?.toLowerCase().includes(needle)
    );
  });

  return (
    <div className="space-y-6">
      {/* Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto dark:bg-slate-900 dark:border-slate-700 dark:shadow-none transition-colors">
          <button
            onClick={() => setSelectedTab('pending')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              selectedTab === 'pending' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Pending Review ({pendingCount})
          </button>
          <button
            onClick={() => setSelectedTab('all')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              selectedTab === 'all' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            All Submissions ({submissions.length})
          </button>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organization, district or ID..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800 dark:shadow-none transition-colors">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest font-bold dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4">Submission</th>
              <th className="px-6 py-4">District</th>
              <th className="px-6 py-4">Period</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={5}><LoadingState label="Loading submissions..." /></td>
              </tr>
            ) : filteredSubmissions.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    title="No submissions to show"
                    message={selectedTab === 'pending'
                      ? 'There are no submissions awaiting review right now.'
                      : 'No submissions match the current search.'}
                  />
                </td>
              </tr>
            ) : filteredSubmissions.map((sub) => (
              <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-800/50">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900 text-sm dark:text-white">{sub.organization}</div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5 dark:text-slate-400">{sub.id}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 font-medium dark:text-slate-300">
                  {sub.district}
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs text-slate-700 font-semibold dark:text-slate-200">{sub.period_start} - {sub.period_end}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 dark:text-slate-500">Submitted {new Date(sub.created_at).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${STATUS_STYLES[sub.status] || 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-300'}`}>
                    {sub.status}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => openReview(sub)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 dark:bg-slate-700 dark:hover:bg-slate-600"
                  >
                    Review <Eye className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && activeSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !busy && setShowReviewModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col dark:bg-slate-900 dark:shadow-none transition-colors"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/50">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Review Submission</h3>
                  <p className="text-xs text-slate-500 font-mono mt-1 dark:text-slate-400">{activeSubmission.id} • {activeSubmission.organization}</p>
                </div>
                <button
                  onClick={() => !busy && setShowReviewModal(false)}
                  className="p-2 hover:bg-slate-200 rounded-lg transition-colors dark:hover:bg-slate-700"
                >
                  <XCircle className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {actionError && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 text-sm text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span>{actionError}</span>
                  </div>
                )}

                {previewLoading ? (
                  <LoadingState label="Reading submitted file..." />
                ) : preview ? (
                  <>
                    <div className="grid md:grid-cols-3 gap-8">
                      <div className="md:col-span-2 space-y-6">
                        <section>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 dark:text-slate-500">Data Summary</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center dark:bg-slate-800/50 dark:border-slate-800">
                              <p className="text-2xl font-bold text-slate-900 dark:text-white">{preview.stats.totalCases.toLocaleString()}</p>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1 dark:text-slate-400">Total Cases</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center dark:bg-slate-800/50 dark:border-slate-800">
                              <p className={`text-2xl font-bold ${preview.stats.duplicates ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{preview.stats.duplicates}</p>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1 dark:text-slate-400">Duplicate Rows</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center dark:bg-slate-800/50 dark:border-slate-800">
                              <p className="text-2xl font-bold text-slate-900 dark:text-white">{preview.stats.completeness}%</p>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1 dark:text-slate-400">Completeness</p>
                            </div>
                          </div>
                          {preview.stats.missingColumns.length > 0 && (
                            <p className="text-xs text-rose-600 mt-3 font-medium dark:text-rose-400">
                              Missing required columns: {preview.stats.missingColumns.join(', ')}
                            </p>
                          )}
                        </section>

                        <section>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 dark:text-slate-500">Geographic Coverage</h4>
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                            <div className="flex items-center gap-3 mb-3">
                              <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{activeSubmission.district}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-medium text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">{activeSubmission.city}</span>
                              <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-medium text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">{preview.totalRows} rows</span>
                            </div>
                          </div>
                        </section>
                      </div>

                      <aside className="space-y-6">
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 dark:text-slate-500">Metadata</h4>
                          <div className="space-y-4 text-sm">
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider dark:text-slate-500">Submitter Org</p>
                              <p className="font-bold text-slate-900 dark:text-white">{activeSubmission.organization}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">{activeSubmission.org_type}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider dark:text-slate-500">Reporting Period</p>
                              <p className="text-xs text-slate-600 font-medium dark:text-slate-300">{activeSubmission.period_start} to {activeSubmission.period_end}</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 dark:text-slate-500">Review Remarks</h4>
                          <textarea
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 min-h-[100px] resize-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                            placeholder="Add a reason for rejection (required to reject)..."
                          />
                        </div>
                      </aside>
                    </div>

                    <section>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 dark:text-slate-500">
                        Data Preview (first {preview.rows.length} of {preview.totalRows} rows)
                      </h4>
                      <div className="border border-slate-100 rounded-xl overflow-x-auto dark:border-slate-800">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 text-slate-500 font-bold dark:bg-slate-800/50 dark:text-slate-400">
                            <tr>
                              {preview.columns.map((col: string) => (
                                <th key={col} className="px-3 py-2 whitespace-nowrap">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {preview.rows.map((row: any, i: number) => (
                              <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50">
                                {preview.columns.map((col: string) => (
                                  <td key={col} className="px-3 py-2 text-slate-700 whitespace-nowrap dark:text-slate-200">{String(row[col] ?? '')}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  </>
                ) : null}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 dark:bg-slate-800/50 dark:border-slate-800">
                <button
                  onClick={() => apiClient.downloadSubmissionFile(activeSubmission.id)}
                  className="w-full md:w-auto px-6 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-white transition-colors flex items-center justify-center gap-2 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Download className="w-4 h-4" /> Download Raw File
                </button>
                <div className="flex gap-3 w-full md:w-auto">
                  <button
                    onClick={handleReject}
                    disabled={busy}
                    className="flex-1 md:flex-none px-6 py-2 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-sm font-bold hover:bg-rose-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30 dark:hover:bg-rose-500/20"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={busy || previewLoading}
                    className="flex-1 md:flex-none px-8 py-2 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-900/20 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Approve &amp; Integrate
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubmissionManagement;
