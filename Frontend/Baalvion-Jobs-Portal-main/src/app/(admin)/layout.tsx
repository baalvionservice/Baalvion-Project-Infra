import { redirect } from 'next/navigation';

// Per-app admin RETIRED. Jobs administration is centralized in the Baalvion admin-platform
// console → Talent → Jobs section.
export default function AdminGroupLayout() {
  redirect(process.env.NEXT_PUBLIC_ADMIN_CONSOLE_URL || 'http://localhost:3030/jobs');
}
