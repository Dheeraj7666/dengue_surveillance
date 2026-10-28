import React, { useEffect, useState } from 'react';
import { TrendingUp, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { apiClient } from '@/api/client';
import { useTheme } from '@/lib/theme';
import { EmptyState, LoadingState } from '@/components/admin/States';

const ForecastPage: React.FC = () => {
  const { isDark } = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        setData(await apiClient.getForecast());
      } catch (e: any) {
        setError(e?.message || 'Failed to load forecast');
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
  }, []);

  if (loading) {
    return <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors"><LoadingState label="Running forecast model..." /></div>;
  }

  if (error || !data) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors">
        <EmptyState title="Forecast unavailable" message={error || 'Could not reach the analytics service.'} />
      </div>
    );
  }

  if (!data.sufficient) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors">
        <EmptyState title="Not enough data to forecast" message={data.message || 'Approve more weekly submissions to enable forecasting.'} />
      </div>
    );
  }

  const series = data.series || [];
  const futureWeeks = series.filter((s: any) => s.actual == null);

  const cards = [
    {
      label: 'Forecast Horizon',
      value: `${data.horizonWeeks} Weeks`,
      sub: `Based on approved data through ${data.basedOnWeek}`,
      tone: 'text-slate-900 dark:text-white',
    },
    {
      label: 'Next Week Prediction',
      value: `${data.nextWeekPrediction} cases`,
      sub: data.changePct == null
        ? 'No prior week to compare'
        : `${data.changePct > 0 ? '+' : ''}${data.changePct}% vs. current week (${data.currentWeekCases})`,
      tone: data.changePct != null && data.changePct > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Model Confidence',
      value: `${data.confidence}%`,
      sub: `Model: ${data.modelName}`,
      tone: 'text-emerald-600 dark:text-emerald-400',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{c.label}</p>
            <h3 className={`text-2xl font-bold ${c.tone}`}>{c.value}</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium">{c.sub}</p>
          </div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Weekly Case Forecast <TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Reported cases vs. trend projection across all districts
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Projected Peak</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{data.peakWeek} · {data.peakValue} cases</p>
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={series}>
              <defs>
                <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
              <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#e2e8f0' : '#0f172a', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ color: isDark ? '#e2e8f0' : '#0f172a' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: isDark ? '#e2e8f0' : '#0f172a' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area type="monotone" dataKey="upper" stroke="none" fill="#0d9488" fillOpacity={0.12} name="Upper bound" connectNulls />
              <Area type="monotone" dataKey="lower" stroke="none" fill={isDark ? '#0f172a' : '#ffffff'} fillOpacity={1} name="Lower bound" connectNulls />
              <Line
                type="monotone"
                dataKey="actual"
                stroke={isDark ? '#e2e8f0' : '#0f172a'}
                strokeWidth={3}
                dot={{ r: 4, fill: isDark ? '#e2e8f0' : '#0f172a', strokeWidth: 2, stroke: isDark ? '#0f172a' : '#fff' }}
                name="Reported cases"
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#0d9488"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: '#0d9488' }}
                name="Projected"
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {futureWeeks.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden transition-colors">
          <div className="p-6 border-b border-slate-50 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white">Projection Detail</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Point estimate with 95% prediction interval</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                <tr>
                  <th className="px-6 py-4">Week</th>
                  <th className="px-6 py-4 text-center">Projected Cases</th>
                  <th className="px-6 py-4 text-center">Lower Bound</th>
                  <th className="px-6 py-4 text-center">Upper Bound</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
                {futureWeeks.map((row: any) => (
                  <tr key={row.week} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{row.week}</td>
                    <td className="px-6 py-4 text-center font-bold text-teal-700 dark:text-teal-300">{row.predicted}</td>
                    <td className="px-6 py-4 text-center text-slate-500 dark:text-slate-400">{row.lower ?? '—'}</td>
                    <td className="px-6 py-4 text-center text-slate-500 dark:text-slate-400">{row.upper ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-500/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-500/30 flex gap-4 transition-colors">
        <Info className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
        <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
          Forecasts are derived from the approved weekly case series. Confidence reflects how well the trend
          line explains observed variation — wider intervals indicate more volatile reporting.
        </p>
      </div>
    </div>
  );
};

export default ForecastPage;
