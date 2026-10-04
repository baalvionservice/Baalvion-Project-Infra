// Image uploads to community-service (/media). Photos are always re-drawn on a canvas and
// re-encoded as JPEG before upload, which strips camera metadata (location, device) and keeps
// the file small; the server strips JPEG metadata again as a second line of defence.

import { ApiError } from "./nightlife";

export type UploadPurpose = "profile_photo" | "teacher_avatar" | "club_image" | "event_poster";

const MAX_DATA_URL = 1_300_000; // ~950 KB of image after base64

function drawToJpeg(bitmap: ImageBitmap, scale: number, quality: number): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read the image"));
    r.readAsDataURL(blob);
  });
}

export async function prepareImage(file: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Use a JPEG, PNG or WebP photo.");
  const bitmap = await createImageBitmap(file);
  let scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  let quality = 0.86;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const blob = await drawToJpeg(bitmap, scale, quality);
    if (blob) {
      const url = await blobToDataUrl(blob);
      if (url.length <= MAX_DATA_URL) return url;
    }
    scale *= 0.8;
    quality = Math.max(0.6, quality - 0.05);
  }
  throw new Error("That photo is too large even after shrinking. Try a smaller one.");
}

export async function uploadImage(file: File, purpose: UploadPurpose): Promise<string> {
  const dataUrl = await prepareImage(file);
  const res = await fetch("/api/community-proxy/media", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ purpose, dataUrl }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new ApiError(body.error?.message || `Upload failed (${res.status})`, res.status, body.error?.code);
  }
  // Absolute so it passes the API's http(s) link validation and works wherever the field is shown.
  return `${window.location.origin}/api/community-proxy${body.data.path}`;
}
