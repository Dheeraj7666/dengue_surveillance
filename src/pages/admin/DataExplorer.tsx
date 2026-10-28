import React, { useEffect, useState } from 'react';
import { Search, Download, FileSpreadsheet, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { apiClient } from '@/api/client';
import { EmptyState, LoadingState } from '@/components/admin/States';

const fmt = (value: any, suffix = '') => (value == null ? '—' : `${value}${suffix}`);

const DataExplorer: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiClient
      .getDataExplorer({ search, district, page, pageSize })
      .then((res) => {
        if (!active) return;
        setData(res);
        setError('');
      })
      .catch((e: any) => {
        if (active) setError(e?.message || 'Failed to load records');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [search, district, page, pageSize]);

  const items = data?.items || [];
  const districts = data?.districts || [];
  const total = data?.total ?? 0;
  const firstShown = total === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const lastShown = total === 0 ? 0 : (data.page - 1) * data.pageSize + items.length;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none space-y-4 transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by locality or district..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <select
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                setPage(1);
              }}
              className="flex-1 md:flex-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All districts</option>
              {districts.map((d: string) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <button
              onClick={() => apiClient.downloadDataExport()}
              className="bg-teal-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-teal-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-900/10 whitespace-nowrap"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 dark:text-white">Approved Surveillance Records</h3>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            {(data?.total ?? 0).toLocaleString()} record{(data?.total ?? 0) === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <LoadingState label="Loading records..." />
        ) : error ? (
          <EmptyState title="Records unavailable" message={error} />
        ) : items.length === 0 ? (
          <EmptyState
            title="No matching records"
            message={
              data?.total === 0
                ? 'No approved surveillance data yet. Approve a submission to populate this explorer.'
                : 'No records match the current search or district filter.'
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                  <tr>
                    <th className="px-6 py-4">Report Date</th>
                    <th className="px-6 py-4">District</th>
                    <th className="px-6 py-4">Locality</th>
                    <th className="px-6 py-4 text-center">Reported</th>
                    <th className="px-6 py-4 text-center">Confirmed</th>
                    <th className="px-6 py-4 text-center">Visits</th>
                    <th className="px-6 py-4 text-center">Rainfall</th>
                    <th className="px-6 py-4 text-center">Temp</th>
                    <th className="px-6 py-4 text-center">Humidity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
                  {items.map((row: any, i: number) => (
                    <tr key={`${row.report_date}-${row.district}-${i}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-300">{row.report_date}</td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{row.district}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{row.locality}</td>
                      <td className="px-6 py-4 text-center font-bold">{row.reported_cases}</td>
                      <td className="px-6 py-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">{row.confirmed_cases}</td>
                      <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300">{row.hospital_visits}</td>
                      <td className="px-6 py-4 text-center text-slate-500 dark:text-slate-400">{fmt(row.rainfall, ' mm')}</td>
                      <td className="px-6 py-4 text-center text-slate-500 dark:text-slate-400">{fmt(row.temperature, '°')}</td>
                      <td className="px-6 py-4 text-center text-slate-500 dark:text-slate-400">{fmt(row.humidity, '%')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-between items-center text-xs text-slate-500 dark:text-slate-400">
              <p>
                Showing <span className="font-bold text-slate-700 dark:text-slate-200">{firstShown.toLocaleString()}</span>–
                <span className="font-bold text-slate-700 dark:text-slate-200">{lastShown.toLocaleString()}</span> of{' '}
                <span className="font-bold text-slate-700 dark:text-slate-200">{total.toLocaleString()}</span> records
              </p>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  Rows per page
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {[25, 50, 100, 200].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <span className="hidden sm:inline">Page {data.page} of {data.pages}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={data.page <= 1}
                    className="flex items-center gap-1 px-3 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                    disabled={data.page >= data.pages}
                    className="flex items-center gap-1 px-3 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex gap-4 transition-colors">
        <div className="bg-slate-900 dark:bg-slate-700 p-3 rounded-2xl text-white h-fit transition-colors">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Data Usage Policy <Info className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Export contains every approved surveillance record. Granular data is intended for internal
            public-health analysis and must be handled according to applicable data-protection policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DataExplorer;
