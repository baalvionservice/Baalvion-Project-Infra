import { redirect } from 'next/navigation';

// This page ran on hard-coded sample data with no backend. The real equivalent is /admin/analytics.
export default function MovedAdminPage() {
  redirect('/admin/analytics');
}
