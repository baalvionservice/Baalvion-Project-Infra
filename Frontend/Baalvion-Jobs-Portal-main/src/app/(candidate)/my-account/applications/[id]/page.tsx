
'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from "next/navigation";
import { ApplicationHeader } from "@/modules/candidates/components/dashboard/application-header";
import { ApplicationTimeline } from "@/modules/candidates/components/dashboard/timeline";
import { Separator } from "@/components/ui/separator";
import { DocumentManager } from "@/modules/candidates/components/dashboard/document-manager";
import { UpcomingInterviews } from "@/modules/candidates/components/dashboard/upcoming-interviews";
import { applicationService } from "@/services/application.service";
import { ApplicationDetails } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { useAuth } from '@/hooks/useAuth';


export default function ApplicationDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const { user, isLoading: isAuthLoading } = useAuth();

    const [details, setDetails] = useState<ApplicationDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Wait until the session is established (access token in memory) before fetching —
        // otherwise a direct load / refresh races the auth bootstrap and 401s.
        if (!id || isAuthLoading || !user) return;

        const fetchDetails = async () => {
            setIsLoading(true);
            try {
                const data = await applicationService.getMyApplicationDetail(id);
                setDetails(data);
            } catch (error) {
                console.error("Failed to fetch application details:", error);
                setDetails(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetails();
    }, [id, user, isAuthLoading]);

    if (isLoading) {
        return (
             <div className="space-y-8">
                <Skeleton className="h-24 w-full" />
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                    <div className="md:col-span-2 space-y-8">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                    <div className="md:col-span-1">
                        <Skeleton className="h-96 w-full" />
                    </div>
                </div>
            </div>
        )
    }

    if (!details) {
        notFound();
    }

    const { application, candidate, interviews, stageHistory, documents } = details;

    return (
        <div className="space-y-8">
            <div className="mb-6">
              <Breadcrumbs />
            </div>
            <ApplicationHeader application={application} candidate={candidate} />
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                <div className="md:col-span-2 space-y-8">
                    <UpcomingInterviews interviews={interviews} isLoading={isLoading} />
                    <DocumentManager documents={documents} />
                </div>
                <div className="md:col-span-1">
                    <ApplicationTimeline stageHistory={stageHistory} currentStage={application.status} />
                </div>
            </div>
        </div>
    );
}
