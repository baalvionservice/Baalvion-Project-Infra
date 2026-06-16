import { notFound, redirect } from 'next/navigation';

// Per-app admin RETIRED. Imperialpedia administration (entities, moderation, media) is
// centralized in the Baalvion admin-platform console → Imperialpedia section.
// The console URL is env-driven; the hardcoded localhost is a DEV-ONLY fallback (guarded by
// NODE_ENV). In production with no env set we 404 rather than redirect users to localhost.
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ADMIN_CONSOLE_URL =
  process.env.NEXT_PUBLIC_ADMIN_CONSOLE_URL ||
  (IS_PRODUCTION ? '' : 'http://localhost:3030/imperialpedia');

export default function AdminLayout() {
  if (!ADMIN_CONSOLE_URL) notFound();
  redirect(ADMIN_CONSOLE_URL);
}
