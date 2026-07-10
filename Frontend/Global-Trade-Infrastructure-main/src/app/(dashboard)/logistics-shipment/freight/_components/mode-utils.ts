/**
 * @file mode-utils.ts
 * @description Shared transport-mode metadata for the Freight Management module —
 * label, icon, and lucide icon component per mode, keyed off the same TransportMode
 * union the backend's freight quote flow validates against.
 */
import { Ship, Plane, TrainFront, Truck, PackageCheck, Network, LucideIcon } from 'lucide-react';
import { format } from 'date-fns';
import type { TransportMode } from '@/api/freight-carriers';

/**
 * Format a date string that may be null, missing, or malformed. `date-fns`'s
 * `format()` throws `RangeError: Invalid time value` on an invalid Date rather
 * than returning a fallback — every freight page renders event/booking timestamps
 * straight from the API, so this guards the whole render tree from a single bad
 * timestamp crashing the page.
 */
export function safeFormatDate(value: string | null | undefined, pattern: string, fallback = '—'): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return format(date, pattern);
}

export interface ModeMeta {
  mode: TransportMode;
  label: string;
  icon: LucideIcon;
  color: string;
}

export const MODE_META: Record<TransportMode, ModeMeta> = {
  ocean: { mode: 'ocean', label: 'Ocean Freight', icon: Ship, color: 'text-blue-500' },
  air: { mode: 'air', label: 'Air Freight', icon: Plane, color: 'text-sky-500' },
  rail: { mode: 'rail', label: 'Rail Freight', icon: TrainFront, color: 'text-amber-600' },
  road: { mode: 'road', label: 'Truck Freight', icon: Truck, color: 'text-orange-500' },
  express: { mode: 'express', label: 'Courier', icon: PackageCheck, color: 'text-emerald-500' },
  courier: { mode: 'express', label: 'Courier', icon: PackageCheck, color: 'text-emerald-500' },
  multimodal: { mode: 'multimodal', label: 'Multimodal', icon: Network, color: 'text-purple-500' },
};

export function modeMeta(mode: string | null | undefined): ModeMeta {
  return MODE_META[(mode as TransportMode) || 'road'] ?? MODE_META.road;
}

export const MODE_ORDER: TransportMode[] = ['ocean', 'air', 'rail', 'road', 'express', 'multimodal'];

export const QUOTE_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500/10 text-gray-600 border-gray-200',
  quoted: 'bg-blue-500/10 text-blue-600 border-blue-200',
  expired: 'bg-orange-500/10 text-orange-600 border-orange-200',
  converted: 'bg-green-500/10 text-green-600 border-green-200',
};

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500/10 text-gray-600 border-gray-200',
  booking: 'bg-blue-500/10 text-blue-600 border-blue-200',
  booked: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
  confirmed: 'bg-cyan-500/10 text-cyan-600 border-cyan-200',
  in_transit: 'bg-purple-500/10 text-purple-600 border-purple-200',
  delivered: 'bg-green-500/10 text-green-600 border-green-200',
  cancelled: 'bg-gray-500/10 text-gray-500 border-gray-200',
  failed: 'bg-red-500/10 text-red-600 border-red-200',
};

export const CARRIER_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/10 text-green-600 border-green-200',
  suspended: 'bg-orange-500/10 text-orange-600 border-orange-200',
  inactive: 'bg-gray-500/10 text-gray-500 border-gray-200',
};
