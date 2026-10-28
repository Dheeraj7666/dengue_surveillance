import React, { useEffect, useState } from 'react';
import { BarChart3, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiClient } from '@/api/client';
import { useTheme } from '@/lib/theme';
import { EmptyState, LoadingState } from '@/components/admin/States';

const ModelPerformance: React.FC = () => {
  const { isDark } = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        setData(await apiClient.getModelPerformance());
      } catch (e: any) {
        setError(e?.message || 'Failed to load model performance');
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, []);

  if (loading) {
    return <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors"><LoadingState label="Back-testing the model..." /></div>;
  }

  if (error || !data) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors">
        <EmptyState title="Model performance unavailable" message={error || 'Could not reach the analytics service.'} />
      </div>
    );
  }

  if (!data.sufficient) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors">
        <EmptyState
          title="Not enough data to back-test"
          message={data.message || 'The model requires a longer history of approved weekly records.'}
        />
      </div>
    );
  }

  const metrics = [
    { name: 'MAE', value: data.metrics.mae, description: 'Mean Absolute Error' },
    { name: 'RMSE', value: data.metrics.rmse, description: 'Root Mean Square Error' },
    { name: 'R²', value: data.metrics.r2 ?? '—', description: 'Coefficient of Determination' },
    { name: 'MAPE', value: `${data.metrics.mape}%`, description: 'Mean Abs Percentage Error' },
  ];

  const importance = data.featureImportance || [];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {metrics.map((m) => (
          <div key={m.name} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none text-center transition-colors">
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{m.description}</h4>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-600 dark:text-teal-400" /> Feature Importance
          </h3>
          <div className="h-80 w-full">
            {importance.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={importance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} width={130} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#e2e8f0' : '#0f172a', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} labelStyle={{ color: isDark ? '#e2e8f0' : '#0f172a' }} itemStyle={{ color: isDark ? '#e2e8f0' : '#0f172a' }} />
                  <Bar dataKey="score" fill="#0d9488" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="Feature importance is not available for this model run." />
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none space-y-6 transition-colors">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Model Specifications</h3>
          <div className="space-y-4">
            {[
              { label: 'Algorithm', value: data.modelName },
              { label: 'Last Back-Tested', value: data.lastTrained },
              { label: 'Weeks of History', value: `${data.trainedOn} weeks` },
              { label: 'Back-Tested Weeks', value: `${data.testSize} weeks` },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800">
                <span className="text-sm text-slate-500 dark:text-slate-400">{row.label}</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{row.value}</span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-teal-50 dark:bg-teal-500/10 rounded-xl border border-teal-100 dark:border-teal-500/30 flex gap-3 transition-colors">
            <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
            <p className="text-xs text-teal-800 dark:text-teal-200 leading-relaxed">
              Metrics come from an expanding-window back-test: each week is predicted using only the
              weeks before it, with lagged cases and weather inputs from approved records only.
            </p>
          </div>
        </motion.div>
      </div>

      {data.smallSample && (
        <div className="bg-amber-50 dark:bg-amber-500/10 p-6 rounded-2xl border border-amber-100 dark:border-amber-500/30 flex gap-4 transition-colors">
          <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
            Only {data.trainedOn} weeks of approved data are available. The metrics are computed from
            this real history but on a short window, so treat them as indicative — approving more
            weekly submissions will make the back-test more reliable.
          </p>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-500/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-500/30 flex gap-4 transition-colors">
        <Info className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
        <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
          Back-test results describe how the model would have performed on unseen recent weeks. Larger
          training windows generally produce more stable metrics.
        </p>
      </div>
    </div>
  );
};

export default ModelPerformance;
