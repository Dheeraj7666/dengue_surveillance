import React from 'react';
import { Database, Loader2 } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data available yet',
  message,
  className = '',
}) => (
  <div className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}>
    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl mb-4 transition-colors duration-200">
      <Database className="w-8 h-8 text-slate-400 dark:text-slate-500" />
    </div>
    <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">{title}</h4>
    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">{message}</p>
  </div>
);

export const LoadingState: React.FC<{ label?: string }> = ({ label = 'Loading data...' }) => (
  <div className="flex items-center justify-center gap-3 py-16 text-slate-400 dark:text-slate-500 text-sm font-medium">
    <Loader2 className="w-5 h-5 animate-spin" />
    {label}
  </div>
);

const RISK_STYLES: Record<string, string> = {
  Critical: 'bg-rose-600 text-white',
  High: 'bg-orange-500 text-white',
  Moderate: 'bg-amber-400 text-slate-900',
  Low: 'bg-teal-500 text-white',
};

export const RiskBadge: React.FC<{ risk: string }> = ({ risk }) => (
  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${RISK_STYLES[risk] || 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}>
    {risk}
  </span>
);
