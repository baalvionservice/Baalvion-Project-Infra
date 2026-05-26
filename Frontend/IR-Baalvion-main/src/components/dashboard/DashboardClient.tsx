"use client";

import CapitalOverview from "@/components/dashboard/CapitalOverview";
import CapitalCalls from "@/components/dashboard/CapitalCalls";
import DistributionLedger from "@/components/dashboard/DistributionLedger";
import NavChart from "@/components/dashboard/NavChart";
import DocumentPreview from "@/components/dashboard/DocumentPreview";
import ActiveVoting from "@/components/dashboard/ActiveVoting";
import { EventPackageDownload } from "@/components/dashboard/EventPackageDownload";

interface DashboardData {
  summary: any;
  calls: any;
  distributions: any;
  navHistory: any;
  documents: any;
  votes: any;
}

interface DashboardClientProps {
  data: DashboardData;
  userEmail: string;
  userRole: string;
}

export default function DashboardClient({
  data,
  userEmail,
  userRole,
}: DashboardClientProps) {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col xl:flex-row justify-between items-start gap-6">
        <div className="flex flex-col gap-1 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            Investor Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Institutional Capital Overview for{" "}
            <span className="text-foreground font-semibold">{userEmail}</span>
          </p>
        </div>
        <div className="w-full xl:w-auto">
          <EventPackageDownload />
        </div>
      </div>

      <CapitalOverview summary={data.summary} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-8">
          <NavChart data={data.navHistory} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="overflow-x-auto">
              <CapitalCalls calls={data.calls} />
            </div>
            <div className="overflow-x-auto">
              <DistributionLedger distributions={data.distributions} />
            </div>
          </div>
        </div>

        {/* Sidebar Info Area */}
        <div className="lg:col-span-4 space-y-8">
          <ActiveVoting votes={data.votes} />
          <DocumentPreview documents={data.documents} role={userRole} />
        </div>
      </div>
    </div>
  );
}
