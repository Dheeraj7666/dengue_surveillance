import React, { useEffect, useState } from 'react';
import { Droplets, Thermometer, Wind, History, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ComposedChart, Line, Bar, BarChart, Legend,
} from 'recharts';
import { apiClient } from '@/api/client';
import { useTheme } from '@/lib/theme';
import { EmptyState, LoadingState } from '@/components/admin/States';

const strength = (r: number | null) => {
  if (r == null) return 'Unavailable';
  const abs = Math.abs(r);
  const label = abs >= 0.7 ? 'Strong' : abs >= 0.4 ? 'Moderate' : abs >= 0.2 ? 'Weak' : 'Negligible';
  return `${r > 0 ? '+' : ''}${r} (${label})`;
};

const WeatherAnalysis: React.FC = () => {
  const { isDark } = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setData(await apiClient.getWeather());
      } catch (e: any) {
        setError(e?.message || 'Failed to load weather analysis');
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  if (loading) {
    return <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors"><LoadingState label="Computing weather correlations..." /></div>;
  }

  if (error || !data) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors">
        <EmptyState title="Weather analysis unavailable" message={error || 'Could not reach the analytics service.'} />
      </div>
    );
  }

  if (!data.sufficient) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors">
        <EmptyState
          title="Not enough weather data"
          message={data.message || 'Approve at least 3 weeks of records containing rainfall, temperature and humidity to compute correlations.'}
        />
      </div>
    );
  }

  const cards = [
    { icon: Droplets, tone: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400', label: 'Rainfall Correlation', value: strength(data.rainfallCorrelation) },
    { icon: Thermometer, tone: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400', label: 'Temperature Correlation', value: strength(data.temperatureCorrelation) },
    { icon: Wind, tone: 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400', label: 'Humidity Correlation', value: strength(data.humidityCorrelation) },
    {
      icon: History,
      tone: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
      label: 'Strongest Lag',
      value: data.bestLag ? `${data.bestLag.label} (r = ${data.bestLag.r})` : 'Unavailable',
    },
  ];

  const scatter = data.scatter || [];
  const series = data.series || [];
  const lags = (data.lagCorrelations || []).filter((l: any) => l.r != null);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none flex items-center gap-4 transition-colors">
            <div className={`${c.tone} p-3 rounded-xl transition-colors`}><c.icon className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{c.label}</p>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{c.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Rainfall vs. Cases</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Each point is one reporting week</p>
          <div className="h-80 w-full">
            {scatter.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                  <XAxis type="number" dataKey="rainfall" name="Rainfall" unit="mm" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }} />
                  <YAxis type="number" dataKey="cases" name="Cases" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#e2e8f0' : '#0f172a', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} labelStyle={{ color: isDark ? '#e2e8f0' : '#0f172a' }} itemStyle={{ color: isDark ? '#e2e8f0' : '#0f172a' }} />
                  <Scatter name="Weeks" data={scatter} fill="#0d9488" />
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No weekly weather readings available." />
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Rainfall and Cases Over Time</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Weekly mean rainfall against reported cases</p>
          <div className="h-80 w-full">
            {series.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#0d9488' }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#e2e8f0' : '#0f172a' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#e2e8f0' : '#0f172a', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} labelStyle={{ color: isDark ? '#e2e8f0' : '#0f172a' }} itemStyle={{ color: isDark ? '#e2e8f0' : '#0f172a' }} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="rainfall" fill="#38bdf8" radius={[4, 4, 0, 0]} barSize={18} name="Rainfall (mm)" />
                  <Line yAxisId="right" type="monotone" dataKey="cases" stroke={isDark ? '#e2e8f0' : '#0f172a'} strokeWidth={3} dot={{ r: 3 }} name="Dengue cases" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No weekly weather readings available." />
            )}
          </div>
        </motion.div>
      </div>

      {lags.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Rainfall Lag Correlation</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Correlation between cases and rainfall shifted by 0–4 weeks</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lags}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }} />
                <YAxis domain={[-1, 1]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#e2e8f0' : '#0f172a', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} labelStyle={{ color: isDark ? '#e2e8f0' : '#0f172a' }} itemStyle={{ color: isDark ? '#e2e8f0' : '#0f172a' }} />
                <Bar dataKey="r" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={40} name="Correlation" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-500/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-500/30 flex gap-4 transition-colors">
        <Info className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
        <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
          Correlation is computed on approved records only and describes association, not causation.
          These signals support resource planning and do not replace clinical judgement.
        </p>
      </div>
    </div>
  );
};

export default WeatherAnalysis;
