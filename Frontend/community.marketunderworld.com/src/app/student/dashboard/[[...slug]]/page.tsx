import { redirect } from 'next/navigation';

// The old student dashboard (wallet, purchases, progress) ran on mock data. Everything real
// lives under /student-dashboard.
export default function LegacyStudentDashboard() {
  redirect('/student-dashboard');
}
