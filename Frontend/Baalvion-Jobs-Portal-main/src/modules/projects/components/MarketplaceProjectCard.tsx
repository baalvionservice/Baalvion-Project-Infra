import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils/currency';
import { Users, User, UsersRound, CalendarDays } from 'lucide-react';
import type { MarketplaceProject } from '@/services/marketplace.service';

const MODE_LABEL: Record<MarketplaceProject['collaborationMode'], { text: string; icon: typeof User }> = {
  solo: { text: 'Solo', icon: User },
  team: { text: 'Team', icon: UsersRound },
  either: { text: 'Solo or team', icon: Users },
};

const formatDeadline = (value: string | null) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export function MarketplaceProjectCard({ project }: { project: MarketplaceProject }) {
  const mode = MODE_LABEL[project.collaborationMode] ?? MODE_LABEL.either;
  const ModeIcon = mode.icon;
  const deadline = formatDeadline(project.deadline);

  return (
    <article className="border bg-card p-6 transition-colors hover:border-foreground/25">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold tracking-tight">
            <Link href={`/projects/${project.slug ?? project.id}`} className="underline-offset-4 hover:underline">
              {project.title}
            </Link>
          </h3>
          {project.summary && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{project.summary}</p>
          )}
        </div>
        {project.budget !== null && (
          <div className="shrink-0 text-right">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Budget</p>
            <p className="text-lg font-semibold">{formatCurrency(project.budget, project.currency || 'INR')}</p>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <ModeIcon className="h-3.5 w-3.5" aria-hidden />
          {mode.text}
          {project.collaborationMode !== 'solo' && project.maxTeamSize
            ? ` · up to ${project.maxTeamSize}`
            : ''}
        </span>
        {project.category && <span>{project.category}</span>}
        {deadline && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            Closes {deadline}
          </span>
        )}
        {/* Only shown once someone has actually applied — "0 applications" is a
            discouraging non-fact to put on a brief. */}
        {project.applicationsCount > 0 && (
          <span>{project.applicationsCount} {project.applicationsCount === 1 ? 'application' : 'applications'}</span>
        )}
      </div>

      {project.requiredSkills.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {project.requiredSkills.slice(0, 6).map((skill) => (
            <li key={skill}>
              <Badge variant="secondary" className="font-normal">{skill}</Badge>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
