import { NextResponse } from 'next/server';
import { withPermission } from '@/lib/rbac/with-permission';

// Mark a single alert read (standalone mode — acknowledged, not persisted).
export const PATCH = withPermission('VIEW_DASHBOARD', async () => {
  return NextResponse.json({ success: true, data: null });
});
