/**
 * Centralized local-storage store for club bookings.
 *
 * When the community-service backend is not reachable, forms write here
 * and the admin panel reads from here so no submission is ever lost.
 * Once a real backend is wired, these helpers can be replaced with API calls.
 */

export type BookingKind = "guest_list" | "vip_table";
export type BookingStatus = "pending" | "confirmed" | "declined" | "cancelled";

export interface LocalBooking {
  id: string;
  kind: BookingKind;
  clubId: string;
  clubName: string;
  clubCity: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  visitDate: string;
  // guest list only
  males?: number;
  females?: number;
  // VIP only
  groupSize?: number;
  tablePackage?: string;
  notes?: string;
  status: BookingStatus;
  createdAt: string; // ISO string
}

const KEY = "baalvion_club_bookings";

export function loadBookings(): LocalBooking[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LocalBooking[]) : [];
  } catch {
    return [];
  }
}

export function saveBooking(booking: Omit<LocalBooking, "id" | "status" | "createdAt">): LocalBooking {
  const all = loadBookings();
  const entry: LocalBooking = {
    ...booking,
    id: `booking-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  all.unshift(entry); // newest first
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch { /* quota full — skip */ }
  return entry;
}

export function updateBookingStatus(id: string, status: BookingStatus): void {
  const all = loadBookings();
  const idx = all.findIndex((b) => b.id === id);
  if (idx === -1) return;
  all[idx] = { ...all[idx], status };
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch { /* quota full — skip */ }
}
