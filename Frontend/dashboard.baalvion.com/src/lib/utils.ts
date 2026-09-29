import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date safely. Returns `fallback` for empty/invalid values instead of throwing
 * `RangeError: Invalid time value` (which crashes the page) — common when API data is still
 * loading or a date field is null.
 */
export function safeFormatDate(
  value: string | number | Date | null | undefined,
  fmt: string,
  fallback = "—",
): string {
  if (!value) return fallback
  const d = new Date(value)
  return isNaN(d.getTime()) ? fallback : format(d, fmt)
}
