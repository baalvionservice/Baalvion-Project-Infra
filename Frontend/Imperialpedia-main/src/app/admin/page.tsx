
import { redirect } from 'next/navigation';

/**
 * Admin Root Node.
 * Redirects to the Master Dashboard to initiate the governance cycle.
 */
export default function AdminIndex() {
  redirect('/admin/dashboard');
}
