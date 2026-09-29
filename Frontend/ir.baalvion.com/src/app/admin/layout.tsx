import { notFound, redirect } from 'next/navigation';

// Per-app admin RETIRED. IR administration is centralized in the Baalvion admin-platform
// console (editorial → CMS). Any /admin/* hit redirects there.
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ADMIN_CONSOLE_URL =
  process.env.NEXT_PUBLIC_ADMIN_CONSOLE_URL || (IS_PRODUCTION ? '' : 'http://localhost:3030/cms');

export default function AdminLayout() {
  // Never fall back to a localhost URL in production; 404 if the console URL is unset.
  if (!ADMIN_CONSOLE_URL) notFound();
  redirect(ADMIN_CONSOLE_URL);
}
