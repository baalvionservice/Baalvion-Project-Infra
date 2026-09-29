import { NextRequest } from 'next/server';
import { studentApplicationSchema, type ApplicationStatus } from '@/lib/server/onboarding-schemas';
import { createStudentApplication, listStudentApplications } from '@/lib/server/onboarding-store';
import { requireAdmin } from '@/lib/server/onboarding-auth';

export const dynamic = 'force-dynamic';

// Public: a student submits their onboarding application.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = studentApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { success: false, data: null, error: parsed.error.flatten() },
        { status: 422 },
      );
    }
    const record = await createStudentApplication(parsed.data);
    return Response.json(
      { success: true, data: { id: record.id, referenceId: record.referenceId }, error: null },
      { status: 201 },
    );
  } catch (e) {
    const error = e as Error;
    return Response.json(
      { success: false, data: null, error: error.message || 'Failed to submit application.' },
      { status: 500 },
    );
  }
}

// Admin: list submitted student applications (optionally filtered by status).
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return Response.json({ success: false, data: null, error: auth.error }, { status: auth.status });
  }
  try {
    const status = request.nextUrl.searchParams.get('status') as ApplicationStatus | null;
    const data = await listStudentApplications(status ?? undefined);
    return Response.json({ success: true, data, error: null }, { status: 200 });
  } catch (e) {
    const error = e as Error;
    return Response.json(
      { success: false, data: null, error: error.message || 'Failed to load applications.' },
      { status: 500 },
    );
  }
}
