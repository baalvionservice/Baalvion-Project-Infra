import { redirect } from 'next/navigation';

// The old "super" dashboard showed simulated platform figures. The real overview lives at /admin.
export default function SuperAdminRedirect() {
  redirect('/admin');
}
