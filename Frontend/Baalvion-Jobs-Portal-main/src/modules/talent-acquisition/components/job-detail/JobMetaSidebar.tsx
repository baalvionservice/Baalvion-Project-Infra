
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Job } from "@/lib/talent-acquisition";
import { ChevronsRight, Clock, Globe, Zap } from "lucide-react";
import { ApplyCTA } from "./ApplyCTA";

interface JobMetaSidebarProps {
    job: Job;
    departmentName?: string;
    countryName: string;
    applyUrl: string;
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3">
            <div className="mt-1 text-muted-foreground">{icon}</div>
            <div>
                <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">{label}</p>
                <p className="text-sm">{value}</p>
            </div>
        </div>
    )
}

export function JobMetaSidebar({ job, departmentName, countryName, applyUrl }: JobMetaSidebarProps) {
    return (
        <div className="space-y-6">
            <ApplyCTA applyUrl={applyUrl} className="w-full" />
            <Card>
                <CardHeader><CardTitle className="text-lg">At a glance</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {/* Department, location and the posted date live in the header now.
                        Repeating them here — and in a different date format — made the two
                        blocks look like they disagreed. This keeps only what the header
                        doesn't already say. */}
                    <MetaRow icon={<ChevronsRight className="h-4 w-4"/>} label="Experience Level" value={job.experienceBand} />
                    <MetaRow icon={<Zap className="h-4 w-4"/>} label="Employment Type" value={job.employmentType} />
                    <MetaRow icon={<Globe className="h-4 w-4"/>} label="Workforce Model" value={job.workforceType} />
                    <MetaRow icon={<Clock className="h-4 w-4"/>} label="Applications" value={job.remoteAllowed ? 'Open to remote candidates' : undefined} />
                </CardContent>
            </Card>
        </div>
    );
}
