// Nightlife staffing client: candidate profiles, employer accounts, gigs and applications.
// Same transport rules as lib/api/nightlife.ts (proxy in the browser, direct on the server).
// There is deliberately no bundled fallback here: gigs and people are real records, and
// showing stand-in ones would be fabricating them.

import { ApiError } from "./nightlife";

export { ApiError };

const PROXY_BASE = "/api/community-proxy";
const DIRECT_BASE = process.env.NEXT_PUBLIC_COMMUNITY_API_BASE ?? "https://api.baalvion.com/api/v1/community";

interface Envelope<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

async function call<T>(method: string, path: string, payload?: unknown): Promise<T> {
  const isServer = typeof window === "undefined";
  const res = await fetch(`${isServer ? DIRECT_BASE : PROXY_BASE}${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: payload === undefined ? undefined : JSON.stringify(payload),
    ...(isServer ? { next: { revalidate: 30 } } : { credentials: "include" as const, cache: "no-store" as const }),
  });
  const body = (await res.json().catch(() => ({}))) as Envelope<T>;
  if (!res.ok || body.success === false) {
    throw new ApiError(body.error?.message || `Request failed (${res.status})`, res.status, body.error?.code);
  }
  return body.data;
}

export type ReviewStatus = "pending" | "verified" | "rejected";

export interface Gig {
  id: string;
  title: string;
  payAmount: number;
  payCycle: string;
  venueAddress: string;
  dressCode: string | null;
  rolesNeeded: string[];
  eventDate: string;
  status: "active" | "filled" | "closed" | "removed";
  postedAt: string;
  postedBy?: string;
  employerId: string;
  applicationCount?: number;
}

export interface Profile {
  id: string;
  fullName: string;
  gender: "Female" | "Male" | "Non-binary";
  age: number;
  height: string | null;
  instagram: string;
  zone: string;
  roles: string[];
  services: string[];
  perks: string[];
  portraitUrl: string | null;
  fullLookUrl: string | null;
  status: ReviewStatus;
  reviewNote: string | null;
  createdAt: string;
  whatsapp?: string;
}

export interface Employer {
  id: string;
  businessName: string;
  contactName: string;
  phone: string;
  website: string | null;
  instagram: string | null;
  city: string;
  status: ReviewStatus;
  reviewNote: string | null;
  createdAt: string;
}

export type GigApplicationStatus = "pending" | "shortlisted" | "hired" | "rejected" | "withdrawn";
export interface GigApplication {
  id: string;
  gigId: string;
  profileId: string;
  note: string | null;
  status: GigApplicationStatus;
  createdAt: string;
  gig?: Gig;
  profile?: Profile;
}

export interface ProfileInput {
  fullName: string;
  gender: Profile["gender"];
  age: number;
  height?: string;
  instagram: string;
  zone: string;
  roles: string[];
  services: string[];
  perks: string[];
  portraitUrl?: string;
  fullLookUrl?: string;
  whatsapp: string;
}
export interface EmployerInput {
  businessName: string;
  contactName: string;
  phone: string;
  website?: string;
  instagram?: string;
  city: string;
}
export interface GigInput {
  title: string;
  payAmount: number;
  payCycle: string;
  venueAddress: string;
  dressCode?: string;
  rolesNeeded: string[];
  eventDate: string;
}

export const gigs = {
  list: async (): Promise<Gig[]> => (await call<{ items: Gig[] }>("GET", "/nightlife/gigs?limit=100")).items,
  // Server pages treat a missing gig as 404 and anything else (backend down) as an error.
  get: async (id: string): Promise<Gig | null> => {
    try {
      return await call<Gig>("GET", `/nightlife/gigs/${encodeURIComponent(id)}`);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 400)) return null;
      throw err;
    }
  },
  mine: () => call<Gig[]>("GET", "/nightlife/gigs/mine"),
  create: (d: GigInput) => call<Gig>("POST", "/nightlife/gigs", d),
  setStatus: (id: string, status: "active" | "filled" | "closed") => call<Gig>("PATCH", `/nightlife/gigs/${id}`, { status }),
  apply: (id: string, note?: string) => call<GigApplication>("POST", `/nightlife/gigs/${id}/apply`, { note }),
  applications: (id: string) => call<GigApplication[]>("GET", `/nightlife/gigs/${id}/applications`),
  setApplicationStatus: (id: string, status: Exclude<GigApplicationStatus, "withdrawn">) =>
    call<GigApplication>("PATCH", `/nightlife/gig-applications/${id}`, { status }),
  myApplications: () => call<GigApplication[]>("GET", "/nightlife/gig-applications/mine"),
  withdraw: (id: string) => call<GigApplication>("POST", `/nightlife/gig-applications/${id}/withdraw`),
};

export const people = {
  myProfile: () => call<Profile | null>("GET", "/nightlife/profile/me"),
  saveProfile: (d: ProfileInput) => call<Profile>("PUT", "/nightlife/profile/me", d),
  myEmployer: () => call<Employer | null>("GET", "/nightlife/employer/me"),
  saveEmployer: (d: EmployerInput) => call<Employer>("PUT", "/nightlife/employer/me", d),
  candidates: async (f: { zone?: string; q?: string } = {}) => {
    const q = new URLSearchParams();
    if (f.zone) q.set("zone", f.zone);
    if (f.q) q.set("q", f.q);
    return (await call<{ items: Profile[] }>("GET", `/nightlife/candidates?${q}`)).items;
  },
  revealContact: (id: string) => call<{ id: string; fullName: string; whatsapp: string }>("POST", `/nightlife/candidates/${id}/contact`),
};

export const nightAdmin = {
  profiles: (status?: ReviewStatus) =>
    call<{ items: Profile[] }>("GET", `/admin/nightlife/profiles${status ? `?status=${status}` : ""}`).then((r) => r.items),
  reviewProfile: (id: string, status: "verified" | "rejected", note?: string) =>
    call<Profile>("PATCH", `/admin/nightlife/profiles/${id}`, { status, note }),
  employers: (status?: ReviewStatus) =>
    call<{ items: Employer[] }>("GET", `/admin/nightlife/employers${status ? `?status=${status}` : ""}`).then((r) => r.items),
  reviewEmployer: (id: string, status: "verified" | "rejected", note?: string) =>
    call<Employer>("PATCH", `/admin/nightlife/employers/${id}`, { status, note }),
};

export const isUnauthorized = (err: unknown) => err instanceof ApiError && err.status === 401;
