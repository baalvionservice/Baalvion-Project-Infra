"use client"

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Project } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, Target, Globe, Star, CheckCircle2, Clock, Calendar, ShieldCheck, Activity, Layers, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ProjectDetailClient({ id }: { id: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [related, setRelated] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/projects?id=${id}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setProject(data);

        const allRes = await fetch('/api/projects');
        const allData = await allRes.json();
        setRelated(allData.filter((p: Project) => p.category === data.category && p.id !== data.id).slice(0, 3));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
        <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-gray-400">Accessing Registry Node...</p>
      </div>
    </div>
  );

  if (!project) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center p-8">
      <h1 className="text-4xl font-bold mb-4 text-gray-900">404: Node Missing</h1>
      <p className="text-gray-500 mb-8">The requested strategic initiative does not exist in the nexus.</p>
      <Button asChild variant="outline">
        <Link href="/projects"><ArrowLeft className="mr-2 w-4 h-4" /> Return to Portfolio</Link>
      </Button>
    </div>
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'In Development': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'Planned': return <Calendar className="w-4 h-4 text-gray-400" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="pt-56 pb-48">
        <div className="section-container">
          <div className="max-w-5xl mb-32 space-y-12 animate-fade-in">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" className="h-10 px-4 -ml-4 hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-all">
                <Link href="/projects"><ArrowLeft className="mr-2 w-4 h-4" /> Strategic Portfolio</Link>
              </Button>
            </div>
            
            <div className="space-y-8">
              <div className="flex flex-wrap items-center gap-4">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 py-1.5 px-6 rounded-full font-bold uppercase tracking-widest text-[10px]">
                  {project.category} Initiative
                </Badge>
                {project.isFeatured && (
                  <Badge className="bg-primary text-white py-1.5 px-6 rounded-full font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                    <Star className="w-3 h-3 fill-white" /> Featured Node
                  </Badge>
                )}
              </div>
              <h1 className="text-6xl md:text-8xl font-bold text-gray-900 tracking-tighter leading-tight mb-0">
                {project.name}
              </h1>
              <div className="flex flex-wrap items-center gap-8 py-4 border-y border-gray-100">
                <div className="flex items-center gap-3">
                  {getStatusIcon(project.status)}
                  <span className="text-sm font-bold uppercase tracking-widest text-gray-900">{project.status}</span>
                </div>
                <div className="text-gray-200">•</div>
                <div className="text-sm font-bold uppercase tracking-widest text-primary">{project.type} Protocol</div>
                <div className="text-gray-200">•</div>
                <div className="text-sm font-bold uppercase tracking-widest text-gray-400">REF: {project.id}</div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-24">
            <div className="lg:col-span-8 space-y-24">
              <section className="space-y-12 animate-fade-in">
                <div className="space-y-6">
                  <span className="section-label">Executive Brief</span>
                  <p className="text-2xl md:text-3xl text-gray-900 font-light leading-relaxed">
                    {project.description}
                  </p>
                </div>
                <div className="prose max-w-none">
                  <p className="text-xl text-gray-600 leading-relaxed">
                    {project.longDescription || "No detailed briefing available for this infrastructure node."}
                  </p>
                </div>
              </section>

              <section className="grid md:grid-cols-2 gap-12 animate-fade-in">
                <Card className="bg-white border border-gray-100 p-12 space-y-8 shadow-sm rounded-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <Layers className="w-8 h-8" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-gray-900">Ecosystem Role</h3>
                    <p className="text-gray-600 leading-relaxed">
                      {project.ecosystemRole || "Integration protocols currently under strategic review."}
                    </p>
                  </div>
                </Card>
                <Card className="bg-white border border-gray-100 p-12 space-y-8 shadow-sm rounded-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-900 border border-gray-100">
                    <Activity className="w-8 h-8" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-gray-900">Future Scope</h3>
                    <p className="text-gray-600 leading-relaxed">
                      {project.futureScope || "Roadmap expansion parameters are confidential."}
                    </p>
                  </div>
                </Card>
              </section>
            </div>

            <aside className="lg:col-span-4 space-y-12 animate-fade-in">
              <Card className="bg-gray-50 border border-gray-100 p-10 space-y-10 sticky top-32 rounded-2xl shadow-sm">
                <div className="space-y-6">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-[0.4em]">Node Connectivity</h4>
                  {project.domain ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-gray-900">
                        <Globe className="w-5 h-5 text-primary" />
                        <span className="text-sm font-mono">{project.subdomain ? `${project.subdomain}.${project.domain}` : project.domain}</span>
                      </div>
                      <Button className="w-full h-14 font-bold btn-primary" disabled>
                        Request Direct Link
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Internal nexus domain restricted.</p>
                  )}
                </div>

                <div className="space-y-6 pt-10 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-[0.4em]">Audit Compliance</h4>
                  <div className="flex items-center gap-4 text-gray-600">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <span className="text-xs font-bold uppercase tracking-widest">SECURE INFRASTRUCTURE</span>
                  </div>
                </div>

                <div className="pt-6">
                  <Button asChild variant="outline" className="w-full h-14 font-bold btn-outline">
                    <Link href="/contact">Inquire for Partners</Link>
                  </Button>
                </div>
              </Card>
            </aside>
          </div>

          {related.length > 0 && (
            <section className="mt-48 space-y-16 animate-fade-in">
              <div className="flex items-center gap-6">
                <div className="w-1.5 h-10 bg-primary rounded-full" />
                <h2 className="text-3xl font-bold mb-0 text-gray-900">Related {project.category} Nodes</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {related.map(p => (
                  <Card key={p.id} className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group h-full rounded-xl overflow-hidden">
                    <Link href={`/projects/${p.id}`} className="block h-full">
                      <CardContent className="p-10 space-y-8 flex flex-col h-full">
                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 border border-gray-100">
                          <Target className="w-6 h-6" />
                        </div>
                        <div className="space-y-3 flex-1">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">{p.name}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{p.description}</p>
                        </div>
                        <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{p.status}</span>
                          <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-2 transition-all" />
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
