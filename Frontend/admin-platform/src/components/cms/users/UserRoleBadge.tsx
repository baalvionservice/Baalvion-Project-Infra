'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import { cmsRoleLabel, CMS_ROLE_TONE } from '@/lib/cms/permissions';
import type { CmsRole } from '@/lib/types/cms-website.types';

export default function UserRoleBadge({ role, className }: { role: CmsRole; className?: string }) {
  return (
    <Badge variant="outline" className={cn('font-medium', CMS_ROLE_TONE[role], className)}>
      {cmsRoleLabel(role)}
    </Badge>
  );
}
