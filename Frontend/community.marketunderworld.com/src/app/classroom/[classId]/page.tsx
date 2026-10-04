import { redirect } from 'next/navigation';

// The in-site classroom was a mock-up. Sessions run on each teacher's own meeting link,
// which approved students get from their dashboard.
export default function RetiredClassroom() {
  redirect('/student-dashboard/sessions');
}
