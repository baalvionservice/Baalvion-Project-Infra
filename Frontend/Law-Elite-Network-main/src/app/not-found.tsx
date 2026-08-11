import React from "react";
import { Navbar } from "@/components/navbar";
import { PublicFooter } from "@/components/knowledge/PublicFooter";
import { ArticleCard } from "@/components/knowledge/ArticleCard";
import SearchBar from "@/components/search/SearchBar";
import { Button } from "@/components/ui/button";
import { SearchX, ArrowLeft, ShieldAlert, Sparkles } from "lucide-react";
import Link from "next/link";
import { getFeaturedArticles } from "@/data/law-content";

/**
 * Branded 404 Discovery Page. Server component so it can pull real editorial
 * content straight into the dead-end instead of leaving the reader with
 * nowhere to go — same intent as a newsroom "trending stories" rail on a
 * broken link. Reads only the bundled article library (never the CMS/API),
 * so this page can never itself go blank or fail to render on a broken URL.
 */
export default function NotFound() {
  const trending = getFeaturedArticles(6);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-6 pt-32 pb-24">
        <div className="max-w-xl w-full mx-auto text-center space-y-10 animate-in fade-in zoom-in duration-1000">
          <div className="relative inline-block">
            <div className="w-32 h-32 rounded-[3rem] bg-slate-50 flex items-center justify-center text-slate-200 border border-slate-100 shadow-inner">
              <SearchX className="w-16 h-16" />
            </div>
            <div className="absolute -top-2 -right-2 bg-blue-600 rounded-full p-2 border-4 border-white shadow-xl">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="font-serif text-5xl md:text-6xl font-bold text-slate-900 tracking-tight">Page Not Found</h1>
            <p className="text-slate-500 text-lg md:text-xl font-medium max-w-sm mx-auto leading-relaxed">
              The page you&apos;re looking for doesn&apos;t exist or may have moved. Try searching, or head back to the homepage.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <SearchBar variant="navbar" />
          </div>

          <div className="pt-2">
            <Button asChild className="bg-slate-900 hover:bg-blue-600 text-white rounded-2xl px-12 h-16 font-bold uppercase text-[10px] tracking-[0.3em] shadow-2xl transition-all interactive-lift">
              <Link href="/">
                <ArrowLeft className="mr-3 w-5 h-5" /> Back to Homepage
              </Link>
            </Button>
          </div>
        </div>

        {trending.length > 0 && (
          <div className="max-w-6xl mx-auto mt-24 pt-16 border-t border-slate-100">
            <div className="flex items-center justify-center gap-3 mb-12">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900 font-serif">
                Trending guides you might be looking for
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {trending.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          </div>
        )}

        <div className="max-w-xl mx-auto pt-16 text-center opacity-40">
          <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-slate-400">
            404 — Page Not Found
          </p>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
