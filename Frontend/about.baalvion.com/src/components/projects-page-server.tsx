import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Project, ProjectStatus, projectCategories } from "@/lib/db";
import {
  Target,
  Star,
  LayoutGrid,
  CheckCircle2,
  Clock,
  Calendar,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface ProjectsPageServerProps {
  projects: Project[];
}

/**
 * Server-side rendered projects page component
 * Optimized for SEO and Google indexing
 */
export default function ProjectsPageServer({
  projects,
}: ProjectsPageServerProps) {
  const featuredProjects = projects
    .filter((p) => p.isFeatured)
    .sort((a, b) => (a.priority || 10) - (b.priority || 10));

  const getStatusIcon = (status: ProjectStatus) => {
    switch (status) {
      case "Active":
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case "In Development":
        return <Clock className="w-3.5 h-3.5" />;
      case "Planned":
        return <Calendar className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case "Active":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "In Development":
        return "bg-amber-50 text-amber-600 border-amber-100";
      case "Planned":
        return "bg-gray-50 text-gray-500 border-gray-100";
      default:
        return "";
    }
  };

  return (
    <main className="flex-1 pt-40 pb-24">
      <div className="section-container">
        <div className="max-w-4xl mb-24 space-y-8 animate-fade-in">
          <span className="section-label">Operational Portfolio</span>
          <h1 className="text-gray-900 mb-8 font-bold leading-tight tracking-tight">
            Strategic <br />
            BOS Initiatives
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-3xl font-medium">
            A curated landscape of high-impact infrastructure projects
            architected to resolve terminal fragmentation in global commerce and
            financial clearing.
          </p>
        </div>

        {featuredProjects.length > 0 && (
          <div className="mb-32 space-y-12 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="w-1 h-8 bg-primary rounded-full" />
              <h2 className="text-2xl font-bold text-gray-900 mb-0 flex items-center gap-3">
                <Star className="w-5 h-5 text-primary fill-primary" /> Featured
                Initiatives
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  statusIcon={getStatusIcon(project.status)}
                  statusColor={getStatusColor(project.status)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-32">
          {projectCategories.map((cat) => {
            const catProjects = projects.filter((p) => p.category === cat.name);
            return (
              <section key={cat.id} className="space-y-12 animate-fade-in">
                <div className="max-w-3xl space-y-3">
                  <h2 className="text-2xl font-bold text-gray-900 mb-0">
                    {cat.name}
                  </h2>
                  <p className="text-gray-600 font-medium">{cat.description}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {catProjects.length === 0 ? (
                    <Card className="col-span-full border-dashed border-gray-200 py-20 flex flex-col items-center justify-center gap-4 bg-gray-50/50">
                      <Target className="w-10 h-10 text-gray-300" />
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                        No active nodes in this registry
                      </p>
                    </Card>
                  ) : (
                    catProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        statusIcon={getStatusIcon(project.status)}
                        statusColor={getStatusColor(project.status)}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function ProjectCard({
  project,
  statusIcon,
  statusColor,
}: {
  project: Project;
  statusIcon: React.ReactNode;
  statusColor: string;
}) {
  return (
    <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group h-full flex flex-col rounded-lg overflow-hidden">
      <Link href={`/projects/${project.id}`} className="flex flex-col h-full">
        <CardHeader className="p-8 pb-6 space-y-8">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-gray-50 rounded-sm flex items-center justify-center group-hover:bg-primary transition-all duration-300 border border-gray-100">
              <Target className="w-6 h-6 text-primary group-hover:text-white" />
            </div>
            <Badge
              className={cn(
                "py-1 px-3 text-[10px] font-bold uppercase tracking-widest rounded-sm border flex items-center gap-2",
                statusColor
              )}
              variant="outline"
            >
              {statusIcon}
              {project.status}
            </Badge>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors leading-tight">
              {project.name}
            </h3>
            <p className="text-[11px] font-bold text-primary tracking-widest uppercase">
              {project.type}
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8 flex-1 flex flex-col justify-between">
          <p className="text-gray-600 leading-relaxed text-sm line-clamp-3 mb-8">
            {project.description}
          </p>

          <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <LayoutGrid className="w-3.5 h-3.5" />
              EXPLORE NODE
            </div>
            <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
