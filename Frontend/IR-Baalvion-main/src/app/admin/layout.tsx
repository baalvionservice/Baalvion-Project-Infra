import { redirect } from 'next/navigation';

// Per-app admin RETIRED. IR administration is centralized in the Baalvion admin-platform
// console (editorial → CMS). Any /admin/* hit redirects there.
export default function AdminLayout() {
  redirect(process.env.NEXT_PUBLIC_ADMIN_CONSOLE_URL || 'http://localhost:3030/cms');
}
