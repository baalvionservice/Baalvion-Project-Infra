'use client';

import type { ReactNode } from 'react';
import { ShieldX } from 'lucide-react';
import PermissionGuard from '@/components/common/PermissionGuard';
import { Card, CardContent } from '@/components/ui/card';

// UX gate only — RBAC (backend) is the real authority on every mutation (requireScopeAdmin).
// Restricts the whole Country & Store Team Management section to platform administrators.
export default function RbacLayout({ children }: { children: ReactNode }) {
  return (
    <PermissionGuard
      minRole="super_admin"
      fallback={
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <ShieldX className="h-10 w-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Restricted</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Country &amp; Store Team Management is available to platform administrators only.
            </p>
          </CardContent>
        </Card>
      }
    >
      {children}
    </PermissionGuard>
  );
}
