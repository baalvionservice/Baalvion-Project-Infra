// One-time identity verification (KYC) client. Browser-only: every call needs the session
// cookie, so it goes through the same-origin proxy.

import { ApiError } from "./nightlife";

export { ApiError };

const PROXY_BASE = "/api/community-proxy";

interface Envelope<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

async function call<T>(method: string, path: string, payload?: unknown): Promise<T> {
  const res = await fetch(`${PROXY_BASE}${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: payload === undefined ? undefined : JSON.stringify(payload),
    credentials: "include",
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as Envelope<T>;
  if (!res.ok || body.success === false) {
    throw new ApiError(body.error?.message || `Request failed (${res.status})`, res.status, body.error?.code);
  }
  return body.data;
}

export type KycStatus = "submitted" | "approved" | "rejected" | "expired";
export type IdType = "passport" | "government_id" | "driving_license";

export interface KycCase {
  id: string;
  status: KycStatus;
  fullName: string;
  nationality: string;
  idType: IdType;
  idNumberLast4: string;
  submittedAt: string;
  reviewedAt: string | null;
  expiresAt: string | null;
  rejectionReason: string | null;
  documentsPurged: boolean;
  userId?: string;
  dateOfBirth?: string;
  label?: string | null;
}

export interface KycSubmission {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  idType: IdType;
  idNumberLast4: string;
  idDocument: string;
  selfie: string;
}

export const kyc = {
  mine: () => call<KycCase | null>("GET", "/kyc/me"),
  submit: (d: KycSubmission) => call<KycCase>("POST", "/kyc", d),
};

export const kycAdmin = {
  list: (status?: KycStatus) => call<{ items: KycCase[] }>("GET", `/admin/kyc${status ? `?status=${status}` : ""}`).then((r) => r.items),
  decide: (id: string, status: "approved" | "rejected", reason?: string) => call<KycCase>("PATCH", `/admin/kyc/${id}`, { status, reason }),
  // Documents are binary; fetch as a blob so the reviewer sees them without a public URL.
  documentUrl: async (id: string, kind: "id" | "selfie"): Promise<{ url: string; type: string }> => {
    const res = await fetch(`${PROXY_BASE}/admin/kyc/${id}/documents/${kind}`, { credentials: "include", cache: "no-store" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(body.error?.message || `Could not open the document (${res.status})`, res.status);
    }
    const blob = await res.blob();
    return { url: URL.createObjectURL(blob), type: blob.type };
  },
};

const MAX_BYTES = 1_400_000;

// Shrinks a photo until it fits the upload limit; PDFs are passed through (and must already fit).
export async function fileToDataUrl(file: File): Promise<string> {
  const read = (f: Blob) => new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read the file"));
    r.readAsDataURL(f);
  });

  if (file.type === "application/pdf") {
    if (file.size > MAX_BYTES) throw new Error("PDF is too large. Use a file under 1.4 MB or upload a photo instead.");
    return read(file);
  }
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Use a JPEG, PNG, WebP or PDF file.");
  if (file.size <= MAX_BYTES) return read(file);

  const bitmap = await createImageBitmap(file);
  let scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.85);
    });
    if (blob && blob.size <= MAX_BYTES) return read(blob);
    scale *= 0.75;
  }
  throw new Error("Could not shrink that image enough. Try a smaller photo.");
}
