import React, { useEffect, useState } from 'react';
import { MapPin, Users, Info, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiClient } from '@/api/client';
import { EmptyState, LoadingState, RiskBadge } from '@/components/admin/States';

const RISK_ORDER = ['Critical', 'High', 'Moderate', 'Low'];
const RISK_CARD: Record<string, string> = {
  Critical: 'border-rose-100 dark:border-rose-500/30 bg-rose-50/60 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300',
  High: 'border-orange-100 dark:border-orange-500/30 bg-orange-50/60 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300',
  Moderate: 'border-amber-100 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300',
  Low: 'border-teal-100 dark:border-teal-500/30 bg-teal-50/60 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300',
};

const STATUS_STYLE: Record<string, string> = {
  'Active Outbreak': 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300',
  'Rising Trend': 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300',
  'Potential Signal': 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300',
  Stable: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
};

const HotspotAnalysis: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHotspots = async () => {
      try {
        setData(await apiClient.getHotspots());
      } catch (e: any) {
        setError(e?.message || 'Failed to load hotspots');
      } finally {
        setLoading(false);
      }
    };
    fetchHotspots();
  }, []);

  if (loading) {
    return <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors"><LoadingState label="Analyzing district hotspots..." /></div>;
  }

  if (error || !data) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors">
        <EmptyState title="Hotspot analysis unavailable" message={error || 'Could not reach the analytics service.'} />
      </div>
    );
  }

  const areas = data.areas || [];

  if (!data.sufficient || areas.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors">
        <EmptyState
          title="No hotspot signals yet"
          message="District risk ranking appears once surveillance records are approved."
        />
      </div>
    );
  }

  const counts = data.counts || {};

  return (
    <div className="space-y-8">
      {/* Risk summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {RISK_ORDER.map((risk) => (
          <div key={risk} className={`p-6 rounded-2xl border ${RISK_CARD[risk]} transition-colors`}>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{risk} Risk</p>
            <h3 className="text-3xl font-bold mt-1">{counts[risk] || 0}</h3>
            <p className="text-[10px] font-medium mt-1 opacity-70">
              district{(counts[risk] || 0) === 1 ? '' : 's'} flagged
            </p>
          </div>
        ))}
      </div>

      {/* Incidence note */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex gap-3 transition-colors">
        <Info className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {data.incidenceAvailable
            ? `Risk levels are based on incidence rate per 10,000 residents${data.latestWeek ? ` for the latest reporting week (${data.latestWeek})` : ''}.`
            : 'Population figures are not available in the approved data, so districts are ranked by total case load. Approve records that include a population column to enable incidence-based risk.'}
        </p>
      </div>

      {/* Hotspot Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 dark:text-white">District Risk Ranking</h3>
          {data.latestWeek && (
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
              Latest week {data.latestWeek}
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-bold">
              <tr>
                <th className="px-6 py-4">District</th>
                <th className="px-6 py-4 text-center">Total Cases</th>
                <th className="px-6 py-4 text-center">Incidence /10k</th>
                <th className="px-6 py-4">Signal</th>
                <th className="px-6 py-4">Week-over-Week</th>
                <th className="px-6 py-4 text-right">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {areas.map((area: any, idx: number) => {
                const trend = area.trend;
                return (
                  <motion.tr
                    key={area.district}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{area.district}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {area.population ? `${area.population.toLocaleString()} pop.` : `${area.localities} localit${area.localities === 1 ? 'y' : 'ies'}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-800 dark:text-slate-100 text-sm">{area.cases}</td>
                    <td className="px-6 py-4 text-center font-mono text-xs text-slate-600 dark:text-slate-300">
                      {area.incidence != null ? area.incidence : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_STYLE[area.status] || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                        {area.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {trend == null ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-slate-400 dark:text-slate-500">
                          <Minus className="w-3 h-3" /> No prior week
                        </span>
                      ) : (
                        <span className={`flex items-center gap-1 text-sm font-bold ${trend > 0 ? 'text-rose-600 dark:text-rose-400' : trend < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                          {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : trend < 0 ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                          {trend > 0 ? '+' : ''}{trend}%
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex">
                        <RiskBadge risk={area.risk} />
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex gap-4 transition-colors">
        <MapPin className="w-6 h-6 text-teal-600 dark:text-teal-400 flex-shrink-0" />
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Risk is recomputed from approved records on every load. Thresholds: Critical ≥ 30, High ≥ 15,
          Moderate ≥ 7, Low &lt; 7 incidence per 10,000 residents.
        </p>
      </div>
    </div>
  );
};

export default HotspotAnalysis;
