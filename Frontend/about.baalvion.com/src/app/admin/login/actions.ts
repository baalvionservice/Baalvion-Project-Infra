'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const COOKIE_NAME = 'bos_admin';

function bufToBase64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function signSession(secret: string): Promise<string> {
  const ts = Date.now();
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(String(ts)),
  );
  const tsB64 = btoa(String(ts));
  const sigB64url = bufToBase64url(sig);
  return `${tsB64}.${sigB64url}`;
}

export async function adminLogin(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error: string }> {
  const password = (formData.get('password') as string | null) ?? '';
  const secret = process.env.ADMIN_SECRET_KEY;

  if (!secret) {
    console.error('[BOS] ADMIN_SECRET_KEY is not set');
    return { error: 'Server configuration error. Contact the system administrator.' };
  }

  if (!password || password !== secret) {
    await new Promise((r) => setTimeout(r, 400)); // constant-time delay
    return { error: 'Invalid credentials. Access denied.' };
  }

  const token = await signSession(secret);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  });

  redirect('/admin');
}

export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect('/admin/login');
}
