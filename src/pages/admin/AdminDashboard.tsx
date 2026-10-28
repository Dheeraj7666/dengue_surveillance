import React, { useEffect, useState } from 'react';
import {
  FileText, CheckCircle2, Clock, TrendingUp,
  MapPin, Activity, AlertTriangle, Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { apiClient } from '@/api/client';
import { EmptyState, LoadingState } from '@/components/admin/States';
import { useTheme } from '@/lib/theme';

const COLORS = ['#0d9488', '#0f766e', '#115e59', '#134e4a', '#14b8a6'];

const relativeTime = (timestamp: string) => {
  const then = new Date(timestamp).getTime();
  if (Number.isNaN(then)) return '';
  const diffMinutes = Math.round((Date.now() - then) / 60000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const AdminDashboard: React.FC = () => {
  const { isDark } = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setData(await apiClient.getDashboardStats());
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors"><LoadingState label="Loading surveillance overview..." /></div>;
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors">
        <EmptyState title="Analytics unavailable" message="Could not reach the analytics service. Make sure the API server is running." />
      </div>
    );
  }

  const stats = [
    {
      label: 'Reported Cases',
      value: data.reportedCases.toLocaleString(),
      sub: `${data.totalRecords} records · ${data.affectedDistricts} district${data.affectedDistricts === 1 ? '' : 's'}`,
      icon: FileText,
      tone: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
      to: '/admin/explorer',
    },
    {
      label: 'Pending Reviews',
      value: data.pendingReviews.toLocaleString(),
      sub: `${data.totalSubmissions} total submissions`,
      icon: Clock,
      tone: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    },
    {
      label: 'Active Hotspots',
      value: data.hotspots.toLocaleString(),
      sub: 'Districts at high or critical risk',
      icon: MapPin,
      tone: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
    },
    {
      label: 'Forecast · Next Week',
      value: data.forecastedCases.toLocaleString(),
      sub: data.lastUpdated ? `Based on data through ${data.lastUpdated}` : 'Awaiting approved data',
      icon: TrendingUp,
      tone: 'bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400',
    },
  ];

  const trend = data.trend || [];
  const districtData = data.districtDistribution || [];
  const alerts = data.alerts || [];
  const activity = data.recentActivity || [];

  return (
    <div className="space-y-8">
      {!data.hasData && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/30 rounded-2xl p-5 flex gap-3 transition-colors">
          <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-900 dark:text-amber-200">No approved surveillance data yet</p>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
              Approve a submission in the Submissions tab to populate the analytics, forecasts and hotspot detection.
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          const to = (stat as any).to as string | undefined;
          const card = (
            <>
              <div className={`p-2 rounded-lg w-fit ${stat.tone} mb-4`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">{stat.sub}</p>
            </>
          );
          const className = 'bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors';
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
            >
              {to ? (
                <Link
                  to={to}
                  title="View the underlying records in the Data Explorer"
                  className={`${className} block h-full hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-md`}
                >
                  {card}
                </Link>
              ) : (
                <div className={`${className} h-full`}>{card}</div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors"
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Weekly Case Trend</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Reported cases vs. fitted forecast</p>
            </div>
            <div className="flex gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-teal-600" /> Reported</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600" /> Forecast</div>
            </div>
          </div>
          <div className="h-80 w-full">
            {trend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#e2e8f0' : '#0f172a', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} labelStyle={{ color: isDark ? '#e2e8f0' : '#0f172a' }} itemStyle={{ color: isDark ? '#e2e8f0' : '#0f172a' }} />
                  <Line type="monotone" dataKey="cases" stroke="#0d9488" strokeWidth={3} dot={{ r: 4, fill: '#0d9488', strokeWidth: 2, stroke: isDark ? '#0f172a' : '#fff' }} activeDot={{ r: 6 }} connectNulls />
                  <Line type="monotone" dataKey="forecast" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No weekly trend available until surveillance data is approved." />
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors"
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">District Distribution</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Reported cases by administrative area</p>
            </div>
          </div>
          <div className="h-80 w-full">
            {districtData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={districtData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }} width={110} />
                  <Tooltip cursor={{ fill: isDark ? '#1e293b' : '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#e2e8f0' : '#0f172a', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} labelStyle={{ color: isDark ? '#e2e8f0' : '#0f172a' }} itemStyle={{ color: isDark ? '#e2e8f0' : '#0f172a' }} />
                  <Bar dataKey="cases" radius={[0, 4, 4, 0]} barSize={24}>
                    {districtData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="District distribution appears once district records are approved." />
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom Grid: Hotspots & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden transition-colors">
          <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-white">Critical Area Monitoring</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${alerts.length ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
              {alerts.length} Alert{alerts.length === 1 ? '' : 's'} Active
            </span>
          </div>
          {alerts.length ? (
            <div className="p-6 grid md:grid-cols-3 gap-4">
              {alerts.map((alert: any) => {
                const critical = alert.risk === 'Critical';
                return (
                  <div key={alert.area} className={`p-4 rounded-xl border ${critical ? 'border-rose-100 bg-rose-50/60 dark:border-rose-500/30 dark:bg-rose-500/10' : 'border-orange-100 bg-orange-50/60 dark:border-orange-500/30 dark:bg-orange-500/10'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${critical ? 'text-rose-700 dark:text-rose-300' : 'text-orange-700 dark:text-orange-300'}`}>{alert.risk} Risk</span>
                      <MapPin className={`w-4 h-4 ${critical ? 'text-rose-600 dark:text-rose-400' : 'text-orange-600 dark:text-orange-400'}`} />
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{alert.area}</h4>
                    <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-2">{alert.cases} cases</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 italic">
                      {alert.trend === null ? 'Trend unavailable' : `${alert.trend > 0 ? '+' : ''}${alert.trend}% week-over-week`}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No critical alerts"
              message="No district is currently flagged at high or critical risk based on approved data."
            />
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden transition-colors">
          <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h3 className="font-bold text-slate-900 dark:text-white">System Activity</h3>
          </div>
          {activity.length ? (
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {activity.map((item: any, i: number) => {
                const isApprove = item.action?.includes('Approved');
                const isReject = item.action?.includes('Rejected');
                return (
                  <div key={i} className="p-4 flex gap-3 items-start hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className={`p-1.5 rounded-lg mt-0.5 ${isApprove ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : isReject ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'}`}>
                      {isApprove ? <CheckCircle2 className="w-3.5 h-3.5" /> : isReject ? <AlertTriangle className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">{item.action}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">{item.details}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{relativeTime(item.timestamp)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="Administrative actions will be listed here as they happen." />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
