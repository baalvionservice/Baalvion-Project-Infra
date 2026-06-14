import { NextRequest } from 'next/server';
import { statusUpdateSchema } from '@/lib/server/onboarding-schemas';
import { updateApplicationStatus } from '@/lib/server/onboarding-store';
import { requireAdmin } from '@/lib/server/onboarding-auth';

export const dynamic = 'force-dynamic';

// Admin: approve / reject a student application.
export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return Response.json({ success: false, data: null, error: auth.error }, { status: auth.status });
  }
  try {
    const { id } = await props.params;
    const parsed = statusUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { success: false, data: null, error: parsed.error.flatten() },
        { status: 422 },
      );
    }
    const updated = await updateApplicationStatus(
      'student',
      id,
      parsed.data.status,
      parsed.data.reviewNotes,
    );
    if (!updated) {
      return Response.json({ success: false, data: null, error: 'Not found.' }, { status: 404 });
    }
    return Response.json({ success: true, data: updated, error: null }, { status: 200 });
  } catch (e) {
    const error = e as Error;
    return Response.json(
      { success: false, data: null, error: error.message || 'Failed to update application.' },
      { status: 500 },
    );
  }
}
