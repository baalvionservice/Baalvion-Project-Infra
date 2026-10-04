import { redirect } from 'next/navigation';

// Students have no separate profile record; their activity is enrollments, managed by teachers.
export default function AdminStudentRedirect() {
  redirect('/admin/education/approvals');
}
