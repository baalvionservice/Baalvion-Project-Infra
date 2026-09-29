import { redirect } from 'next/navigation';

// Bare /admin/analytics/roles has no index view — role analytics live at
// /admin/analytics/roles/[role]. Send visitors to the analytics overview.
export default function RolesAnalyticsIndex() {
  redirect('/admin/analytics');
}
