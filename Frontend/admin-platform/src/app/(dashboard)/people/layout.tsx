import type { ReactNode } from 'react';
import AccessGate from '@/components/authz/AccessGate';

// Access rule lives in lib/authz/policy.ts. This page joins the staff directory with CMS
// access, so it shows more about people than either source alone — administrators only.
export default function PeopleLayout({ children }: { children: ReactNode }) {
  return <AccessGate section="People">{children}</AccessGate>;
}
