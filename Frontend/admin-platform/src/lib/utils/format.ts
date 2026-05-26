import { format, formatDistanceToNow, parseISO } from 'date-fns';

export const formatDate = (date: string | Date, pattern = 'MMM d, yyyy') =>
  format(typeof date === 'string' ? parseISO(date) : date, pattern);

export const formatDateTime = (date: string | Date) =>
  format(typeof date === 'string' ? parseISO(date) : date, 'MMM d, yyyy HH:mm');

export const formatRelative = (date: string | Date) =>
  formatDistanceToNow(typeof date === 'string' ? parseISO(date) : date, { addSuffix: true });

export const formatCurrency = (amount: number, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount / 100);

export const formatNumber = (n: number) =>
  new Intl.NumberFormat('en-IN').format(n);

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
};

export const formatPercent = (value: number, decimals = 1) =>
  `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;

export const slugify = (str: string) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

export const truncate = (str: string, maxLen = 60) =>
  str.length > maxLen ? `${str.slice(0, maxLen)}…` : str;

export const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
