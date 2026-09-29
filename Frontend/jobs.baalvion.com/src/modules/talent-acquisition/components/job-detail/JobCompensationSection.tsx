
import { Job } from "@/lib/talent-acquisition";
import { formatCurrency } from "@/lib/utils/currency";
import { JobSection } from './JobSection';

interface JobCompensationSectionProps {
    job: Job;
}

/** "₹28,00,000 – ₹42,00,000" from the stored "2800000-4200000" band. */
function formatBand(band: string | undefined, currency: string) {
    if (!band) return null;
    const [min, max] = band.split('-').map((v) => Number(v));
    if (!Number.isFinite(min)) return null;
    if (!Number.isFinite(max) || max === min) return formatCurrency(min, currency);
    return `${formatCurrency(min, currency)} – ${formatCurrency(max, currency)}`;
}

export function JobCompensationSection({ job }: JobCompensationSectionProps) {
    const currency = job.currency || 'USD';
    const range = formatBand(job.salaryBand, currency);
    // Accept both casings: the mapper and the form have historically disagreed, and a
    // mismatch here silently hides a salary the employer chose to publish.
    const visibility = String(job.salaryVisibility ?? '').toLowerCase();

    const content = () => {
        if (range && (visibility === 'public' || visibility === 'range' || visibility === 'rangeonly')) {
            // An internship is paid a monthly stipend. Labelling that "per year" turned a
            // ₹15,000/month stipend into a figure that meant nothing.
            const period = job.salaryPeriod ?? 'year';
            const per = period === 'month' ? 'per month' : period === 'day' ? 'per day' : period === 'hour' ? 'per hour' : 'per year';
            const isStipend = period === 'month';

            return (
                <>
                    <p className="text-xl font-semibold text-foreground">
                        {range}<span className="text-base font-normal text-muted-foreground"> {per}</span>
                    </p>
                    <p className="mt-2 text-muted-foreground">
                        {isStipend
                            ? 'The stipend within this range is set by the track and your assessed level at the start, and is reviewed monthly against the performance framework.'
                            : 'The final offer within this range reflects your experience and the interview outcome. Bonus and equity, where applicable, are discussed separately.'}
                    </p>
                </>
            );
        }
        return (
            <p className="text-muted-foreground">
                Compensation for this role is discussed during the first conversation, benchmarked to the market for the location and level.
            </p>
        );
    };

    return <JobSection title="Compensation">{content()}</JobSection>;
}
