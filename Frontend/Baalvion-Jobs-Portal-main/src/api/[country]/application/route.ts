import { NextRequest } from "next/server";
import { socketEngine } from "@/lib/realtime/socket.engine";
import { talentService } from "@/services/talent.service";
import { Notification } from "@/features/notifications";

// Persist public job applications to the real backend (jobs-service) instead of an
// in-memory mock. POST /applications is a public endpoint on jobs-service.
const JOBS_URL = process.env.NEXT_PUBLIC_JOBS_SERVICE_URL || "http://localhost:3002/api/v1";

export async function POST(
    request: NextRequest,
    { params }: { params: { country: string } }
) {
    const countrySlug = params.country;

    try {
        const applicationData = await request.json();

        const res = await fetch(`${JOBS_URL}/applications`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...applicationData, countrySlug }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json?.success === false) {
            const msg = json?.error?.message || json?.error || `jobs-service returned ${res.status}`;
            throw new Error(msg);
        }
        const newApplication = json.data ?? json;

        // Fetch job details to include in the notification (real backend via adapter).
        const job = await talentService.getJobById(applicationData.jobId);
        if (job) {
            const notificationPayload: Notification = {
                id: `notif-realtime-${Date.now()}`,
                tenantId: job.tenantId || 'org_acme',
                title: 'New Application Received',
                message: `${applicationData.fullName} applied for the ${job.title} position.`,
                type: 'INFO',
                read: false,
                createdAt: new Date().toISOString(),
                link: `/applications`
            };
            socketEngine.emit('NEW_NOTIFICATION', notificationPayload);
        }

        return Response.json({
            success: true,
            data: { applicationId: newApplication?.id ?? newApplication?.data?.id },
            error: null
        }, { status: 201 });

    } catch (error) {
        console.error("Failed to process application:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return Response.json({
            success: false,
            data: null,
            error: `Server error processing application: ${errorMessage}`
        }, { status: 500 });
    }
}
