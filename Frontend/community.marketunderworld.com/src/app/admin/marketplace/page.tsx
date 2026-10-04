import { redirect } from 'next/navigation';

// This page ran on hard-coded sample data with no backend. The real equivalent is /admin/categories.
export default function MovedAdminPage() {
  redirect('/admin/categories');
}
