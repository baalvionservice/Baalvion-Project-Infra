// The member's own profile, and requests to join a department. Same-origin community bridge.
import { prepareImage } from "./media";

const BASE = "/api/community-proxy";

export interface MyProfile { photoPath: string | null; bio: string; city: string; interests: string[]; learnGoal: string }
export type RequestStatus = "pending" | "approved" | "declined" | "withdrawn";
export interface AccessRequest { id: string; department: string; message: string; status: RequestStatus; decisionNote: string | null; createdAt: string; decidedAt: string | null }
export interface AdminAccessRequest extends AccessRequest { userId: string; requesterLabel: string | null; requesterCity: string | null; requesterBio: string | null; requesterInterests: string[] }

export const DEPARTMENTS: { key: string; label: string; what: string }[] = [
  { key: "clubs_team", label: "Clubs team", what: "Listings, guest lists and VIP requests." },
  { key: "events_team", label: "Events team", what: "DJ nights, events and the ticket draw." },
  { key: "marketplace_team", label: "Marketplace team", what: "Sellers, listings and orders." },
  { key: "support_team", label: "Support team", what: "Answering members' questions and tickets." },
  { key: "forum_moderation", label: "Forum moderation", what: "Keeping the forum communities safe." },
  { key: "education_team", label: "Education team", what: "Courses, teachers and live sessions." },
  { key: "account_access", label: "Account access", what: "Ask to get your account opened again." },
  { key: "other", label: "Something else", what: "Tell us what you would like to help with." },
];

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, headers: { "content-type": "application/json", ...(init.headers || {}) }, credentials: "include", cache: "no-store" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) throw new Error(body.error?.message || `Request failed (${res.status})`);
  return body.data as T;
}

export const getMyProfile = () => call<MyProfile>("/me/profile");
export const saveMyProfile = (d: Partial<{ bio: string; city: string; interests: string[]; learnGoal: string; photoAssetId: string | null }>) =>
  call<MyProfile>("/me/profile", { method: "PUT", body: JSON.stringify(d) });

// Uploads the photo (re-encoded, metadata stripped) and returns the stored asset id.
export async function uploadProfilePhoto(file: File): Promise<string> {
  const dataUrl = await prepareImage(file);
  const out = await call<{ id: string }>("/media", { method: "POST", body: JSON.stringify({ purpose: "profile_photo", dataUrl }) });
  return out.id;
}
export const photoUrl = (path: string | null) => (path ? `${BASE}${path}` : null);

export const myRequests = () => call<{ items: AccessRequest[] }>("/access-requests/mine").then((r) => r.items);
export const sendRequest = (department: string, message: string) => call<AccessRequest>("/access-requests", { method: "POST", body: JSON.stringify({ department, message }) });
export const withdrawRequest = (id: string) => call<AccessRequest>(`/access-requests/${id}/withdraw`, { method: "POST" });
export const adminRequests = (status?: string) => call<{ items: AdminAccessRequest[] }>(`/admin/access-requests${status ? `?status=${status}` : ""}`).then((r) => r.items);
export const decideRequest = (id: string, approve: boolean, note?: string) => call<AccessRequest>(`/admin/access-requests/${id}/decide`, { method: "POST", body: JSON.stringify({ approve, note }) });
