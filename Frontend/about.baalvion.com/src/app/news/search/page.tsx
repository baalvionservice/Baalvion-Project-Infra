"use client"

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Article, Project } from "@/lib/db";
import { Loader2, Search, Newspaper, Briefcase, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    async function performSearch() {
      setLoading(true);
      try {
        const [aRes, pRes] = await Promise.all([
          fetch('/api/news'),
          fetch('/api/projects')
        ]);
        
        const allArticles: Article[] = await aRes.json();
        const allProjects: Project[] = await pRes.json();

        const filteredArticles = allArticles.filter(a => 
          a.title.toLowerCase().includes(query.toLowerCase()) || 
          a.category.toLowerCase().includes(query.toLowerCase())
        );

        const filteredProjects = allProjects.filter(p => 
          p.name.toLowerCase().includes(query.toLowerCase()) || 
          p.description.toLowerCase().includes(query.toLowerCase()) ||
          p.category.toLowerCase().includes(query.toLowerCase())
        );

        setArticles(filteredArticles);
        setProjects(filteredProjects);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setLoading(false);
      }
    }
    performSearch();
  }, [query]);

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Querying Global Registry...</p>
    </div>
  );

  return (
    <div className="section-container pt-40 pb-24">
      <div className="mb-16 space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Search Results for <span className="text-primary italic">"{query}"</span>
        </h1>
        <p className="text-gray-500 font-medium">
          Found {articles.length + projects.length} matching entries in the Baalvion Nexus.
        </p>
      </div>

      {articles.length === 0 && projects.length === 0 ? (
        <div className="py-32 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No matching nodes found</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Our strategic intelligence buffer has no records matching your query. Please refine your search parameters.
          </p>
          <Button asChild className="mt-8 btn-primary px-8">
            <Link href="/">Return to Homepage</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-20">
          {/* News Results */}
          {articles.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <Newspaper className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-gray-900 uppercase tracking-widest text-sm">Strategic Intelligence</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {articles.map((article) => (
                  <Link key={article.id} href={`/news/${article.category}/${article.slug}`} className="group flex flex-col gap-4">
                    <div className="aspect-[16/10] relative rounded-xl overflow-hidden bg-gray-100">
                      <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold leading-tight text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{article.category} • {article.date}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Project Results */}
          {projects.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <Briefcase className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-gray-900 uppercase tracking-widest text-sm">Execution Layer</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`} className="group p-8 rounded-xl border border-gray-100 hover:border-primary/20 hover:shadow-lg transition-all bg-white">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{project.category}</span>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">{project.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{project.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Suspense fallback={
          <div className="min-h-[60vh] flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        }>
          <SearchResultsContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
