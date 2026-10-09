// Clubs + Locals hub client for community-service's /nightlife and /admin/nightlife routes.
// Browser calls go through the same-origin /api/community-proxy bridge (it turns the httpOnly
// access_token cookie into the Bearer header). Server Components skip the bridge and call the
// API directly — public reads need no cookie, and a Worker fetching its own origin is fragile.
// Public reads fall back to the bundled snapshot so a backend outage degrades the directory
// instead of blanking it; writes never fall back — a failed submit must say so.

import { INDIAN_CLUBS, type Club, type VipPackage } from "@/data/clubs-data";
import { MUMBAI_CLUBS } from "@/data/mumbai-clubs";

// All static clubs combined — used as fallback when backend is unreachable
const ALL_STATIC_CLUBS: Club[] = [...INDIAN_CLUBS, ...MUMBAI_CLUBS];
import { ALL_LISTINGS, type LocalListing } from "@/data/locals-listings";
import type { RoleRequirement, RoleCategory } from "@/data/locals-roles";

const PROXY_BASE = "/api/community-proxy";
const DIRECT_BASE = process.env.COMMUNITY_UPSTREAM_URL ?? '';

interface Envelope<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isServer = typeof window === "undefined";
  const res = await fetch(`${isServer ? DIRECT_BASE : PROXY_BASE}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init.headers || {}) },
    ...(isServer ? { next: { revalidate: 60 } } : { credentials: "include" as const, cache: "no-store" as const }),
  });
  const body = (await res.json().catch(() => ({}))) as Envelope<T>;
  if (!res.ok || body.success === false) {
    throw new ApiError(body.error?.message || `Request failed (${res.status})`, res.status, body.error?.code);
  }
  return body.data;
}

const send = <T>(method: string, path: string, payload?: unknown) =>
  call<T>(path, { method, body: payload === undefined ? undefined : JSON.stringify(payload), cache: "no-store" });

const qs = (params: Record<string, string | number | undefined>) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== "" && q.set(k, String(v)));
  const s = q.toString();
  return s ? `?${s}` : "";
};

// ── Clubs ───────────────────────────────────────────────────────────────────
export interface ApiClub {
  id: string;
  slug: string;
  name: string;
  state: string;
  city: string;
  suburb: string | null;
  address: string | null;
  image: string | null;
  musicType: string[];
  daysOpen: string | null;
  description: string | null;
  coverCharge: string | null;
  vibe: string | null;
  requiredRoles: string[];
  vipPackages: VipPackage[];
  contactEmail?: string | null;
  rating: number | null;
  status: "active" | "archived";
}

// The pages route on Club.id, so the view model carries the slug there (stable, readable URLs).
const toClub = (c: ApiClub): Club => ({
  id: c.slug,
  name: c.name,
  state: c.state,
  city: c.city,
  suburb: c.suburb ?? undefined,
  address: c.address ?? undefined,
  image: c.image ?? "",
  musicType: c.musicType,
  daysOpen: c.daysOpen ?? "",
  description: c.description ?? "",
  coverCharge: c.coverCharge ?? "",
  rating: c.rating ?? 0,
  vibe: c.vibe ?? undefined,
  requiredRoles: c.requiredRoles.length ? c.requiredRoles : undefined,
  vipPackages: c.vipPackages,
});

export async function getClubs(): Promise<Club[]> {
  try {
    const { items } = await call<{ items: ApiClub[] }>("/nightlife/clubs?limit=200");
    return items.map(toClub);
  } catch {
    return ALL_STATIC_CLUBS;
  }
}

export async function getClub(idOrSlug: string): Promise<Club | null> {
  // Normalise the lookup key so both "mumbai-c1" and "mumbai_c1" work
  const staticMatch =
    ALL_STATIC_CLUBS.find((c) => c.id === idOrSlug) ??
    ALL_STATIC_CLUBS.find((c) => c.id === idOrSlug.replace(/_/g, "-")) ??
    null;
  try {
    return toClub(await call<ApiClub>(`/nightlife/clubs/${encodeURIComponent(idOrSlug)}`));
  } catch {
    // When COMMUNITY_UPSTREAM_URL is not configured the fetch hits the local
    // Next.js server which returns its own 404 HTML → ApiError(404). We must
    // NOT treat that as "club doesn't exist"; fall back to bundled data first.
    return staticMatch;
  }
}

export interface GuestListInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  visitDate: string;
  males: number;
  females: number;
}
export interface VipTableInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  visitDate: string;
  groupSize: number;
  tablePackage?: string;
  notes?: string;
}

export const submitGuestList = (clubSlug: string, input: GuestListInput) =>
  send<{ id: string }>("POST", `/nightlife/clubs/${encodeURIComponent(clubSlug)}/guest-list`, input);
export const submitVipTable = (clubSlug: string, input: VipTableInput) =>
  send<{ id: string }>("POST", `/nightlife/clubs/${encodeURIComponent(clubSlug)}/vip-tables`, input);
export const getMyBookings = () =>
  send<{ items: ClubBooking[]; total: number }>("GET", "/nightlife/bookings/me");

export type BookingStatus = "pending" | "confirmed" | "declined" | "cancelled";
export interface ClubBooking {
  id: string;
  clubId: string;
  kind: "guest_list" | "vip_table";
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  visitDate: string;
  males: number;
  females: number;
  groupSize: number | null;
  tablePackage: string | null;
  notes: string | null;
  status: BookingStatus;
  createdAt: string;
  club?: { id: string; slug: string; name: string; city: string };
}

// ── Events ──────────────────────────────────────────────────────────────────
export type EventTag = "FREE ON GUEST LIST" | "BUY TICKETS" | "VIP TABLE" | "SOLD OUT";

export interface ApiEvent {
  id: string;
  clubId: string;
  eventName: string;
  djName: string | null;
  date: string;
  image: string | null;
  description: string | null;
  tag: EventTag;
  ticketUrl: string | null;
  status: "active" | "cancelled";
  club?: { id: string; slug: string; name: string; city: string; state: string };
}

// View model for the calendar pages. clubId carries the club slug because the guest-list and
// VIP routes are keyed by slug (same convention as Club.id above).
export interface ClubEvent {
  id: string;
  eventName: string;
  djName?: string;
  description?: string;
  venue: string;
  city: string;
  date: string;
  image: string;
  tag: EventTag;
  ticketUrl?: string;
  clubId: string;
}

const toEvent = (e: ApiEvent): ClubEvent => ({
  id: e.id,
  eventName: e.eventName,
  djName: e.djName ?? undefined,
  description: e.description ?? undefined,
  venue: e.club?.name ?? "",
  city: e.club?.city ?? "",
  date: e.date,
  image: e.image ?? "",
  tag: e.tag,
  ticketUrl: e.ticketUrl ?? undefined,
  clubId: e.club?.slug ?? "",
});

// Events are real, admin-entered records, so there is no bundled fallback: an outage shows
// an empty calendar rather than invented lineups.
export async function getEvents(): Promise<ClubEvent[]> {
  try {
    const { items } = await call<{ items: ApiEvent[] }>("/nightlife/events?limit=200");
    return items.map(toEvent);
  } catch {
    return [];
  }
}

export async function getEvent(id: string): Promise<ClubEvent | null> {
  try {
    return toEvent(await call<ApiEvent>(`/nightlife/events/${encodeURIComponent(id)}`));
  } catch {
    return null;
  }
}

// ── Locals ──────────────────────────────────────────────────────────────────
export interface ApiListing {
  id: string;
  slug: string;
  title: string;
  type: Exclude<LocalListing["type"], never>;
  location: string;
  city: string;
  description: string;
  requirements: string[];
  contact: string | null;
  date: string | null;
  salary: string | null;
  postedBy: string;
  verified: boolean;
  postedAt: string;
  minAge: number | null;
  maxAge: number | null;
  gender: "Male" | "Female" | "Any" | null;
  primaryCategory: string | null;
  roleRequirements: RoleRequirement[];
  seoKeywords: string[];
  status: "active" | "closed" | "archived";
  applicationCount?: number;
}

const toListing = (l: ApiListing): LocalListing => ({
  id: l.id,
  slug: l.slug,
  title: l.title,
  type: l.type,
  location: l.location,
  city: l.city,
  description: l.description,
  requirements: l.requirements.length ? l.requirements : undefined,
  contact: l.contact ?? undefined,
  date: l.date ?? undefined,
  salary: l.salary ?? undefined,
  postedBy: l.postedBy,
  verified: l.verified,
  postedAt: new Date(l.postedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
  minAge: l.minAge ?? undefined,
  maxAge: l.maxAge ?? undefined,
  gender: l.gender ?? undefined,
  primaryCategory: (l.primaryCategory ?? undefined) as RoleCategory | undefined,
  roleRequirements: l.roleRequirements.length ? l.roleRequirements : undefined,
  seoKeywords: l.seoKeywords.length ? l.seoKeywords : undefined,
});

export async function getListings(): Promise<LocalListing[]> {
  try {
    const { items } = await call<{ items: ApiListing[] }>("/nightlife/locals?limit=200");
    return items.map(toListing);
  } catch {
    return ALL_LISTINGS;
  }
}

export async function getListing(slug: string): Promise<LocalListing | null> {
  try {
    return toListing(await call<ApiListing>(`/nightlife/locals/${encodeURIComponent(slug)}`));
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    return ALL_LISTINGS.find((l) => l.slug === slug) ?? null;
  }
}

export interface ApplyInput {
  fullName: string;
  phone: string;
  email?: string;
  message?: string;
  details?: {
    age?: number;
    gender?: string;
    country?: string;
    state?: string;
    city?: string;
    height?: string;
    instagram?: string;
    introVideoLink?: string;
  };
}
export const applyToListing = (slug: string, input: ApplyInput) =>
  send<{ id: string }>("POST", `/nightlife/locals/${encodeURIComponent(slug)}/applications`, input);

export type ApplicationStatus = "pending" | "shortlisted" | "accepted" | "rejected" | "withdrawn";
export interface ListingApplication {
  id: string;
  listingId: string;
  userId: string;
  fullName: string;
  phone: string;
  email: string | null;
  message: string | null;
  details: NonNullable<ApplyInput["details"]>;
  status: ApplicationStatus;
  createdAt: string;
  listing?: { id: string; slug: string; title: string; city: string };
}

// ── Admin (platform admin only; the API enforces it) ────────────────────────
export interface ClubInput {
  name?: string;
  state?: string;
  city?: string;
  suburb?: string;
  address?: string;
  image?: string;
  musicTypes?: string[];
  daysOpen?: string;
  description?: string;
  coverCharge?: string;
  vibe?: string;
  requiredRoles?: string[];
  vipPackages?: VipPackage[];
  contactEmail?: string;
  status?: "active" | "archived";
}
export type ListingInput = Partial<Omit<ApiListing, "id" | "slug" | "postedAt">>;

export interface EventInput {
  clubId?: string;
  eventName?: string;
  djName?: string;
  eventDate?: string;
  image?: string;
  description?: string;
  tag?: EventTag;
  ticketUrl?: string;
  status?: "active" | "cancelled";
}

export const admin = {
  events: () => send<{ items: ApiEvent[]; total: number }>("GET", "/admin/nightlife/events?limit=200"),
  createEvent: (d: EventInput) => send<ApiEvent>("POST", "/admin/nightlife/events", d),
  updateEvent: (id: string, d: EventInput) => send<ApiEvent>("PATCH", `/admin/nightlife/events/${id}`, d),
  clubs: () => send<{ items: ApiClub[]; total: number }>("GET", "/admin/nightlife/clubs?limit=200"),
  createClub: (d: ClubInput) => send<ApiClub>("POST", "/admin/nightlife/clubs", d),
  updateClub: (id: string, d: ClubInput) => send<ApiClub>("PATCH", `/admin/nightlife/clubs/${id}`, d),
  bookings: (f: { status?: BookingStatus; clubId?: string } = {}) =>
    send<{ items: ClubBooking[]; total: number }>("GET", `/admin/nightlife/bookings${qs({ ...f, limit: 100 })}`),
  setBookingStatus: (id: string, status: BookingStatus) =>
    send<ClubBooking>("PATCH", `/admin/nightlife/bookings/${id}`, { status }),
  listings: () => send<{ items: ApiListing[]; total: number }>("GET", "/admin/nightlife/locals?limit=200"),
  createListing: (d: ListingInput) => send<ApiListing>("POST", "/admin/nightlife/locals", d),
  updateListing: (id: string, d: ListingInput) => send<ApiListing>("PATCH", `/admin/nightlife/locals/${id}`, d),
  applications: (f: { status?: ApplicationStatus; listingId?: string } = {}) =>
    send<{ items: ListingApplication[]; total: number }>("GET", `/admin/nightlife/applications${qs({ ...f, limit: 100 })}`),
  setApplicationStatus: (id: string, status: Exclude<ApplicationStatus, "withdrawn">) =>
    send<ListingApplication>("PATCH", `/admin/nightlife/applications/${id}`, { status }),
  // New Administrative Endpoints for Club Operations
  djDemands: () => send<{ items: any[]; total: number }>("GET", "/admin/nightlife/dj-demands"),
  createDjDemand: (data: any) => send<any>("POST", "/admin/nightlife/dj-demands", data),
  pledgeDjDemand: (id: string, amount: number) => send<any>("POST", `/admin/nightlife/dj-demands/${id}/pledge`, { amount }),
  eliteHostApplications: () => send<{ items: any[]; total: number }>("GET", "/admin/nightlife/elite-host"),
  createEliteHostApplication: (data: any) => send<any>("POST", "/nightlife/elite-host", data),
  updateEliteHostApplication: (id: string, status: string) => send<any>("PATCH", `/admin/nightlife/elite-host/${id}`, { status }),
  lotteryDraws: () => send<{ items: any[]; total: number }>("GET", "/admin/nightlife/lottery"),
  enterLottery: (data: any) => send<any>("POST", "/nightlife/lottery", data),
  runLotteryDraw: (data: any) => send<any>("POST", "/admin/nightlife/lottery/draw", data),
};
