
import { NextRequest } from "next/server";

const JOBS_SERVICE = process.env.NEXT_PUBLIC_JOBS_SERVICE_URL || 'http://localhost:3002/api/v1';

export async function POST(request: NextRequest, props: { params: Promise<{ country: string }> }) {
    const params = await props.params;
    const countrySlug = params.country;

    try {
        const formData = await request.json();

        // Forward to the real jobs-service (public application endpoint).
        const payload = {
            job_id: parseInt(formData.jobId, 10),
            email: formData.email,
            full_name: formData.fullName,
            phone: formData.phone || undefined,
            cover_letter: formData.coverLetter || undefined,
            resume_url: formData.resumeUrl || undefined,
            source: formData.sourceOfDiscovery || undefined,
        };

        const res = await fetch(`${JOBS_SERVICE}/applications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        let json: any;
        try { json = await res.json(); } catch { json = {}; }

        if (!res.ok) {
            const msg = json?.error?.message || json?.message || `Backend error ${res.status}`;
            return Response.json({ success: false, data: null, error: msg }, { status: res.status });
        }

        const applicationId = String(json?.data?.id ?? json?.id ?? '');
        return Response.json(
            { success: true, data: { applicationId }, error: null },
            { status: 201 },
        );

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return Response.json({
            success: false,
            data: null,
            error: `Server error processing application: ${errorMessage}`,
        }, { status: 500 });
    }
}
