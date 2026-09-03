import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Job, Country } from "@/lib/talent-acquisition";
import { ApplyCTA } from "./ApplyCTA";
import { unitTextClass } from "@/lib/business-units";
import { cn } from "@/lib/utils";

interface JobHeaderProps {
    job: Job;
    country: Country;
    departmentName?: string;
    applyUrl: string;
    /** Gazetteer slug for the job's town, when it resolved to a known place. */
    placeSlug?: string | null;
}

/**
 * Title, locations, apply — in that order, matching the reference posting.
 *
 * Its markup after the H1 is literally `Locations:` / values, then `Additional
 * Locations:` / values, then the apply button, then the jump nav. Inline
 * label-then-value rather than a card or a grid of tiles, so the eye goes straight down
 * the left edge.
 */
function InlineFact({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <p className="text-[15px] leading-relaxed">
            <span className="font-bold">{label}: </span>
            <span className="text-muted-foreground">{children}</span>
        </p>
    );
}

const formatPosted = (value?: string | Date | null) => {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime())
        ? null
        : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export function JobHeader({ job, country, departmentName, applyUrl, placeSlug }: JobHeaderProps) {
    const posted = formatPosted(job.publishStartDate ?? job.createdAt);
    const location = [job.city, job.state, country.name].filter(Boolean).join(', ');
    const isRemote = job.remoteAllowed || job.city === 'Remote';

    return (
        <section className="border-b bg-background">
            <div className="container mx-auto max-w-[1100px] px-5 py-12 lg:py-16">
                {job.isNew && <Badge variant="outline" className="mb-4">Newly posted</Badge>}

                <h1 className="max-w-4xl text-3xl font-bold leading-tight tracking-tight md:text-[2.75rem]">
                    {job.title}
                </h1>

                <div className="mt-6 space-y-1.5">
                    <InlineFact label="Location">
                        {placeSlug ? (
                            <Link href={`/careers/jobs/${placeSlug}`} className="underline-offset-4 hover:underline">
                                {location}
                            </Link>
                        ) : (
                            location
                        )}
                    </InlineFact>

                    {isRemote && (
                        <InlineFact label="Additional locations">
                            Open to remote candidates in {country.name}
                        </InlineFact>
                    )}

                    {departmentName && (
                        <InlineFact label="Team">
                            <span className={cn('font-medium', unitTextClass(job.departmentId))}>
                                {departmentName}
                            </span>
                        </InlineFact>
                    )}

                    <InlineFact label="Job requisition">
                        <span className="font-mono text-sm">{job.requisitionCode ?? `JOB-${job.id}`}</span>
                    </InlineFact>

                    {posted && <InlineFact label="Date posted">{posted}</InlineFact>}
                </div>

                <div className="mt-8">
                    <ApplyCTA applyUrl={applyUrl} />
                </div>
            </div>
        </section>
    );
}
