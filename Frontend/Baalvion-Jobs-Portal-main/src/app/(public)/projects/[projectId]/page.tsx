import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils/currency';
import { AppConfig } from '@/config/app.config';
import { marketplaceService } from '@/services/marketplace.service';
import { ProjectApplyForm } from '@/modules/projects/components/ProjectApplyForm';
import { MarketplaceProjectCard } from '@/modules/projects/components/MarketplaceProjectCard';
import { generateBreadcrumbStructuredData } from '@/lib/structured-data';

type Props = { params: Promise<{ projectId: string }> };

export const dynamic = 'force-dynamic';

const MODE_TEXT: Record<string, string> = {
  solo: 'One person',
  team: 'A team',
  either: 'Solo or a team',
};

const formatDate = (value: string | null) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { projectId } = await props.params;
  const project = await marketplaceService.getProject(projectId).catch(() => null);
  if (!project) return { title: 'Project not found', robots: { index: false, follow: false } };

  const url = `${AppConfig.baseUrl}/projects/${project.slug ?? project.id}`;
  const description =
    project.summary ??
    (project.description ? `${project.description.slice(0, 150).replace(/\s+\S*$/, '')}…` : project.title);

  return {
    title: project.title,
    description,
    alternates: { canonical: url },
    openGraph: { title: project.title, description, url, type: 'article' },
  };
}

export default async function ProjectDetailPage(props: Props) {
  const { projectId } = await props.params;
  const project = await marketplaceService.getProject(projectId);
  if (!project) notFound();

  // A few other live briefs, so the page isn't a dead end if this one isn't a fit.
  const related = await marketplaceService
    .listProjects({ limit: 4, category: project.category ?? undefined })
    .then((r) => r.items.filter((p) => p.id !== project.id).slice(0, 3))
    .catch(() => []);

  const breadcrumbs = generateBreadcrumbStructuredData(
    [
      { name: 'Home', path: '/' },
      { name: 'Project Marketplace', path: '/projects' },
      { name: project.title, path: `/projects/${project.slug ?? project.id}` },
    ],
    AppConfig.baseUrl,
  );

  const deadline = formatDate(project.deadline);
  const posted = formatDate(project.publishedAt ?? project.createdAt);

  return (
    <main className="bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />

      <section className="border-b bg-muted/30">
        <div className="container mx-auto max-w-5xl px-4 py-12 lg:py-16">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
            <Link href="/projects" className="hover:text-foreground hover:underline">Project marketplace</Link>
            {' / '}
            <span className="text-foreground">{project.title}</span>
          </nav>

          <h1 className="max-w-4xl text-3xl font-bold tracking-tight md:text-4xl">{project.title}</h1>
          {project.summary && (
            <p className="mt-4 max-w-3xl text-lg text-muted-foreground">{project.summary}</p>
          )}

          <dl className="mt-8 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
            {project.budget !== null && (
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Budget</dt>
                <dd className="mt-1 text-[15px] font-medium">
                  {formatCurrency(project.budget, project.currency || 'INR')}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Who it&apos;s for</dt>
              <dd className="mt-1 text-[15px] font-medium">
                {MODE_TEXT[project.collaborationMode] ?? MODE_TEXT.either}
                {project.collaborationMode !== 'solo' && project.maxTeamSize
                  ? ` (up to ${project.maxTeamSize})`
                  : ''}
              </dd>
            </div>
            {project.category && (
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Category</dt>
                <dd className="mt-1 text-[15px] font-medium">{project.category}</dd>
              </div>
            )}
            {deadline ? (
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Closes</dt>
                <dd className="mt-1 text-[15px] font-medium">{deadline}</dd>
              </div>
            ) : posted ? (
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Posted</dt>
                <dd className="mt-1 text-[15px] font-medium">{posted}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </section>

      <div className="container mx-auto max-w-5xl px-4 py-12 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="space-y-10 lg:col-span-2">
            <section>
              <h2 className="text-2xl font-bold tracking-tight">The brief</h2>
              <div className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">
                {project.description}
              </div>
            </section>

            {project.requiredSkills.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold tracking-tight">What it needs</h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {project.requiredSkills.map((skill) => (
                    <li key={skill}><Badge variant="secondary" className="font-normal">{skill}</Badge></li>
                  ))}
                </ul>
              </section>
            )}

            {project.roles.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold tracking-tight">Roles on this project</h2>
                <ul className="mt-4 space-y-2 text-muted-foreground">
                  {project.roles.map((role, i) => (
                    <li key={i}>
                      {role.title}
                      {role.count && role.count > 1 ? ` × ${role.count}` : ''}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section id="apply">
              <ProjectApplyForm project={project} />
            </section>
          </div>

          <aside className="lg:col-span-1">
            {related.length > 0 && (
              <div className="lg:sticky lg:top-24">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Other open briefs
                </h2>
                <div className="mt-4 space-y-3">
                  {related.map((p) => (
                    <MarketplaceProjectCard key={p.id} project={p} />
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
