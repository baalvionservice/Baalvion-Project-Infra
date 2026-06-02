import { redirect } from 'next/navigation';

// Per-app admin RETIRED. Law Elite administration (lawyers, moderation, broadcast, registry)
// is centralized in the Baalvion admin-platform console → Ecosystem → Law Elite section.
export default function AdminLayout() {
  redirect(process.env.NEXT_PUBLIC_ADMIN_CONSOLE_URL || 'http://localhost:3030/law');
}
