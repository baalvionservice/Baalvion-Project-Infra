import Link from 'next/link';
import { jobPath } from '@/lib/job-url';
import { unitBarClass, unitTextClass } from '@/lib/business-units';
import { cn } from '@/lib/utils';

type Props = {
  job: any;
  departmentName?: string;
  countryName?: string;
  countries: { id: string; slug: string }[];
};

/** `Location: Toronto, Ontario` — label in normal weight, value bold, as the reference has it. */
function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="flex gap-2.5 text-base leading-normal">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-bold">{children}</span>
    </span>
  );
}

/**
 * One search result, built to the reference's own spec.
 *
 * Their row is a bordered box, not a rule-separated line:
 *   .section3__search-results-ul { display:flex; flex-direction:column; gap:15px }
 *   .section3__search-results-a  { border:1px solid #000; padding:15px 60px 15px 20px }
 *   .section3__job-title         { font-size:1.25rem; letter-spacing:-.42px;
 *                                  text-decoration:underline }
 *   .section3__job-info          { font-weight:bold }
 * The whole box is one link, the title is underlined by default, and each fact reads
 * "Label: **value**" rather than hiding the label.
 *
 * The one addition is the business-unit colour on the left edge — with 349 roles across
 * 38 departments, it is what makes the list scannable, and it sits where the border
 * already is rather than adding furniture.
 */
export function JobResultRow({ job, departmentName, countryName, countries }: Props) {
  const location = job.workforceType === 'Remote' || job.city === 'Remote'
    ? `Remote${countryName ? ` · ${countryName}` : ''}`
    : [job.city, job.state, countryName].filter(Boolean).join(', ');

  return (
    <li className="relative flex w-full list-none">
      <Link
        href={jobPath(job, countries)}
        className="group w-full border border-black py-4 pl-6 pr-5 no-underline transition-colors hover:bg-muted/60 sm:pr-14"
      >
        {/* Unit colour on the left edge, inside the border. */}
        <span
          className={cn('absolute bottom-0 left-0 top-0 w-1.5', unitBarClass(job.departmentId))}
          aria-hidden
        />

        <h3 className="mb-1.5 text-xl font-bold leading-tight tracking-[-0.42px] underline underline-offset-4">
          {job.title}
        </h3>

        <div className="flex flex-wrap gap-x-7 gap-y-1">
          <Fact label="Location">{location}</Fact>
          {departmentName && (
            <Fact label="Team">
              <span className={cn(unitTextClass(job.departmentId))}>{departmentName}</span>
            </Fact>
          )}
          {job.employmentType && <Fact label="Type">{job.employmentType}</Fact>}
          {job.experienceBand && <Fact label="Experience">{job.experienceBand}</Fact>}
        </div>
      </Link>
    </li>
  );
}
