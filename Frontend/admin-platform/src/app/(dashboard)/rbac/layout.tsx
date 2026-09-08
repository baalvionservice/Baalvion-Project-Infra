import type { ReactNode } from 'react';
import AccessGate from '@/components/authz/AccessGate';

// Was the console's only guarded section, via the legacy PermissionGuard + its invented role
// matrix (lib/constants/permissions.ts — kept, superseded). Now on the same policy engine as
// every other section, which resolves against the roles[]/permissions[] the backend enforces.
// The restriction itself is unchanged: platform administrators only.
export default function RbacLayout({ children }: { children: ReactNode }) {
  return <AccessGate section="Country &amp; Store Team Management">{children}</AccessGate>;
}
