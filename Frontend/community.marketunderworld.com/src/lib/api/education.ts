// Education hub client (community-service /edu routes). Teachers host sessions on their own
// meeting link and students send enrollment requests; there are no payments in this module.
// Public reads work on the server (direct API) and in the browser (proxy); everything that
// needs a session goes through the cookie-aware proxy.

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

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  bio: string;
  longBio: string | null;
  regionId: string;
  country: string;
  priceNote: string | null;
  avatarUrl: string | null;
  tags: string[];
  skills: { name: string; level: number }[];
  education: { year: string; degree: string; institution: string }[];
  status: "pending" | "active" | "rejected" | "suspended";
  memberSince: string;
  rating: number | null;
  reviewCount: number;
  studentsCount: number;
  classesGiven: number;
  isLive: boolean;
  reviewNote?: string | null;
  userId?: string;
}

export interface Session {
  id: string;
  teacherId: string;
  title: string;
  description: string | null;
  startAt: string;
  durationMin: number;
  capacity: number;
  status: "scheduled" | "cancelled";
  teacher?: { id: string; name: string; subject: string };
  meetingUrl?: string;
  isLive?: boolean;
  requested?: number;
  approved?: number;
}

export interface Enrollment {
  id: string;
  sessionId: string;
  status: "requested" | "approved" | "declined" | "cancelled";
  note: string | null;
  createdAt: string;
  session?: Session;
  studentId?: string;
  student?: string | null;
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  student: string | null;
  createdAt: string;
}

export interface TeacherDetail extends Teacher {
  sessions: Session[];
  reviews: Review[];
}

export interface TeacherInput {
  displayName: string;
  subject: string;
  bio: string;
  longBio?: string;
  regionId: string;
  country: string;
  priceNote?: string;
  avatarUrl?: string;
  tags: string[];
  skills: { name: string; level: number }[];
  education: { year: string; degree: string; institution: string }[];
}

export interface SessionInput {
  title: string;
  description?: string;
  startAt: string;
  durationMin: number;
  capacity: number;
  meetingUrl: string;
}

// Public reads degrade to an empty list on failure rather than inventing teachers.
export async function getTeachers(): Promise<Teacher[]> {
  try {
    return (await call<{ items: Teacher[] }>("GET", "/edu/teachers?limit=100")).items;
  } catch {
    return [];
  }
}

export async function getTeacher(id: string): Promise<TeacherDetail | null> {
  try {
    return await call<TeacherDetail>("GET", `/edu/teachers/${encodeURIComponent(id)}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function getUpcomingSessions(): Promise<Session[]> {
  try {
    return await call<Session[]>("GET", "/edu/sessions");
  } catch {
    return [];
  }
}

export const edu = {
  myTeacher: () => call<Teacher | null>("GET", "/edu/teacher/me"),
  saveTeacher: (d: TeacherInput) => call<Teacher>("PUT", "/edu/teacher/me", d),
  mySessions: () => call<Session[]>("GET", "/edu/teacher/sessions"),
  createSession: (d: SessionInput) => call<Session>("POST", "/edu/teacher/sessions", d),
  updateSession: (id: string, d: Partial<SessionInput> & { status?: "scheduled" | "cancelled" }) =>
    call<Session>("PATCH", `/edu/teacher/sessions/${id}`, d),
  sessionEnrollments: (id: string) => call<Enrollment[]>("GET", `/edu/teacher/sessions/${id}/enrollments`),
  decide: (id: string, status: "approved" | "declined") => call<Enrollment>("PATCH", `/edu/teacher/enrollments/${id}`, { status }),

  enroll: (sessionId: string, note?: string) => call<Enrollment>("POST", `/edu/sessions/${sessionId}/enroll`, { note }),
  myEnrollments: () => call<Enrollment[]>("GET", "/edu/enrollments/mine"),
  cancel: (id: string) => call<Enrollment>("POST", `/edu/enrollments/${id}/cancel`),
  review: (teacherId: string, rating: number, comment?: string) =>
    call<{ id: string }>("POST", `/edu/teachers/${teacherId}/reviews`, { rating, comment }),
};

export const eduAdmin = {
  teachers: (status?: Teacher["status"]) =>
    call<{ items: Teacher[] }>("GET", `/admin/edu/teachers${status ? `?status=${status}` : ""}`).then((r) => r.items),
  reviewTeacher: (id: string, status: "active" | "rejected" | "suspended", note?: string) =>
    call<Teacher>("PATCH", `/admin/edu/teachers/${id}`, { status, note }),
  sessions: () => call<{ items: Session[] }>("GET", "/admin/edu/sessions?limit=100").then((r) => r.items),
  cancelSession: (id: string) => call<Session>("POST", `/admin/edu/sessions/${id}/cancel`),
};

export const isUnauthorized = (err: unknown) => err instanceof ApiError && err.status === 401;

export const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export const sessionEnd = (s: Pick<Session, "startAt" | "durationMin">) => new Date(new Date(s.startAt).getTime() + s.durationMin * 60000);
