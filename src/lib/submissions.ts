export const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  requires_correction: 'Requires Correction',
};

export const STATUS_STYLE: Record<string, string> = {
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
  pending: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
  rejected: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30',
  requires_correction: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/30',
};

export const statusLabel = (status?: string) =>
  STATUS_LABEL[(status || '').toLowerCase()] || 'Unknown';

export const statusStyle = (status?: string) =>
  STATUS_STYLE[(status || '').toLowerCase()] ||
  'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-700';

export const fileNameFromPath = (path?: string) =>
  path ? path.split(/[\\/]/).pop() || path : 'Unknown file';
