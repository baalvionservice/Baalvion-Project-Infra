
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { articlesPublicApi } from '@/lib/api/client';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { AIAnswersCard } from '@/components/knowledge/AIAnswersCard';
import { RelatedArticles } from '@/components/knowledge/RelatedArticles';
import { Breadcrumbs } from '@/components/knowledge/Breadcrumbs';
import { InternalLinkingService } from '@/lib/api/services/internal-linking.service';
import { KeywordMappingRepository } from '@/lib/api/repositories/keyword-mapping.repository';
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  List,
  ChevronRight
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import seedData from '../../../../docs/seed-data.json';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

function generateFallbackContent(title: string): string {
  return `
    <h2>What Is ${title}?</h2>
    <p>This legal domain represents a strategic framework within the global legal network that facilitates the resolution of complex matters through established legal protocols.</p>
    <div class="key-takeaways">
      <h4>Key Takeaways</h4>
      <ul>
        <li>This is a specialized area of law with unique procedural requirements.</li>
        <li>Expert legal counsel is highly recommended for navigating this domain.</li>
        <li>The process is governed by both statutory and common law principles.</li>
      </ul>
    </div>
  `;
}

export default function ArticleDeepDivePage() {
  const { slug } = useParams();

  const [article, setArticle] = useState<any>(null);
  const [articleLoading, setArticleLoading] = useState(true);
  const [toc, setToc] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isSeriesOpen, setIsSeriesOpen] = useState(false);
  const [processedContent, setProcessedContent] = useState<string>("");
  const [isOptimizing, setIsOptimizing] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!slug) return;
    setArticleLoading(true);

    // Try law-service first, then CMS-managed articles (admin-platform console),
    // then the static seed — so console-published articles open correctly.
    const fromCms = async () => {
      try {
        const r = await fetch(`/api/cms/articles/${slug}`);
        if (r.ok) {
          const j = await r.json();
          if (j?.data) return j.data;
        }
      } catch {
        /* ignore */
      }
      return null;
    };
    const fromSeed = () => {
      const seedMatch = (seedData as any).articles?.find((a: any) => a.slug === slug);
      return seedMatch
        ? { ...seedMatch, content: seedMatch.content || generateFallbackContent(seedMatch.title), updatedAt: "February 12, 2025" }
        : null;
    };

    articlesPublicApi.get(slug as string)
      .then(async (res) => {
        const item = res.data?.data || null;
        setArticle(item || (await fromCms()) || fromSeed());
      })
      .catch(async () => {
        setArticle((await fromCms()) || fromSeed());
      })
      .finally(() => setArticleLoading(false));
  }, [slug]);

  useEffect(() => {
    const optimizeContent = async () => {
      if (!article?.content) return;
      setIsOptimizing(true);
      const linkingService = new InternalLinkingService(new KeywordMappingRepository());
      const contentWithLinks = await linkingService.generateInternalLinks(article.content, slug as string);
      const finalContent = contentWithLinks.replace(/<(h[1-3])>(.*?)<\/h[1-3]>/gi, (_match: string, tag: string, text: string) => {
        const id = text.toLowerCase().replace(/\W/g, '-');
        return `<${tag} id="${id}" class="scroll-mt-32">${text}</${tag}>`;
      });
      setProcessedContent(finalContent);
      setIsOptimizing(false);
    };
    optimizeContent();
  }, [article?.content, slug]);

  useEffect(() => {
    if (!processedContent) return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(processedContent, 'text/html');
    const headings = Array.from(doc.querySelectorAll('h1, h2, h3'));
    const tocItems = headings.map((h, i) => ({
      id: h.id || `heading-${i}`,
      text: h.textContent || "",
      level: parseInt(h.tagName.substring(1)),
    }));
    setToc(tocItems);

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActiveId(entry.target.id);
      });
    };

    observer.current = new IntersectionObserver(handleIntersect, {
      rootMargin: '-100px 0px -70% 0px',
      threshold: 0,
    });

    const timer = setTimeout(() => {
      tocItems.forEach((item) => {
        const el = document.getElementById(item.id);
        if (el) observer.current?.observe(el);
      });
    }, 500);

    return () => {
      clearTimeout(timer);
      observer.current?.disconnect();
    };
  }, [processedContent]);

  const category = article?.category;
  const subcategory = article?.subcategory;

  if (articleLoading && !article) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600 opacity-20" />
    </div>
  );

  if (!article) return <ArticleNotFound />;

  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-7xl">

          <Breadcrumbs
            category={category}
            subcategory={subcategory}
            articleTitle={article.title}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-20 items-start">

            <aside className="hidden lg:block lg:col-span-3 sticky top-32 max-h-[calc(100vh-160px)] pr-8">
              <div className="space-y-6">
                <h4 className="text-[18px] font-bold text-slate-900 tracking-tight">Table of Contents</h4>
                <div className="relative border-l border-slate-100">
                  <nav className="flex flex-col">
                    {toc.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={cn(
                          "text-[14px] leading-tight py-2.5 transition-all duration-300 relative pl-6 block",
                          activeId === item.id
                            ? "text-blue-600 font-bold"
                            : "text-slate-500 hover:text-slate-900 font-medium"
                        )}
                        style={{ paddingLeft: `${(item.level - 2) * 12 + 24}px` }}
                      >
                        {activeId === item.id && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10">
                            <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-blue-600 border-b-[5px] border-b-transparent" />
                          </div>
                        )}
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </div>
              </div>
            </aside>

            <article className="lg:col-span-9 space-y-8">

              <AIAnswersCard />

              <header className="space-y-6">
                <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-slate-900 tracking-tighter leading-[0.95]">
                  {article.title}
                </h1>

                <div className="space-y-1 text-[14px] text-slate-600">
                  <div className="flex flex-wrap items-center gap-1.5">
                    By
                    <Popover>
                      <PopoverTrigger asChild>
                        <span className="font-bold text-blue-600 uppercase cursor-pointer border-b border-blue-600 hover:text-blue-800 transition-colors leading-none">
                          JULIA KAGAN
                        </span>
                      </PopoverTrigger>
                      <PopoverContent className="w-[420px] p-0 shadow-2xl border-slate-200 rounded-none bg-white overflow-hidden" align="start" sideOffset={8}>
                        <div className="p-8 space-y-6">
                          <div className="flex gap-6">
                            <div className="relative w-24 h-24 shrink-0 bg-slate-100 overflow-hidden">
                              <Image
                                src="https://picsum.photos/seed/julia-kagan-editorial/200/200"
                                alt="Julia Kagan"
                                fill
                                className="object-cover grayscale"
                              />
                            </div>
                            <div className="space-y-4">
                              <p className="text-[15px] leading-relaxed text-slate-700 font-medium">
                                Julia Kagan is a distinguished legal and financial journalist and former senior editor of strategic dossiers within the global professional network.
                              </p>
                              <Link href="#" className="text-blue-600 text-[15px] font-bold flex items-center gap-1 hover:underline group">
                                Full Bio <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    Updated {article.updatedAt || article.updated_at || "February 12, 2025"}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mt-8 shadow-sm">
                  <div
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setIsSeriesOpen(!isSeriesOpen)}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <List className="w-4 h-4 text-blue-600" />
                        <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">Part of the Series</span>
                      </div>
                      <p className="text-xl font-bold text-slate-900">Complete Guide to {category?.name || "Legal Strategy"}</p>
                    </div>
                    {isSeriesOpen ? <ChevronUp className="w-6 h-6 text-slate-900" /> : <ChevronDown className="w-6 h-6 text-slate-900" />}
                  </div>

                  {isSeriesOpen && (
                    <div className="border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
                      <div className="p-5">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-4">Module Cluster</p>
                        <div className="space-y-3">
                          <Link href="#" className="text-sm font-medium text-blue-600 hover:underline block">1. Initialization Protocols</Link>
                          <Link href="#" className="text-sm font-medium text-slate-700 hover:text-blue-600 block">2. Discovery Infrastructure</Link>
                          <Link href="#" className="text-sm font-medium text-slate-700 hover:text-blue-600 block">3. Strategic Resolution</Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <figure className="pt-6">
                  <div className="aspect-[16/9] relative overflow-hidden bg-slate-50 rounded-lg">
                    <Image
                      src={`https://picsum.photos/seed/${article.id}/1200/800`}
                      alt={article.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </figure>
              </header>

              <div className="relative">
                {isOptimizing && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white shadow-xl border border-slate-100">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Synchronizing Intelligence...</span>
                    </div>
                  </div>
                )}
                <div
                  className="prose-legal max-w-none pt-8"
                  dangerouslySetInnerHTML={{ __html: processedContent || article.content }}
                />
              </div>

              <RelatedArticles />
            </article>

          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

function ArticleNotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200 mb-8 border border-slate-100 shadow-inner">
        <BookOpen className="w-12 h-12" />
      </div>
      <h2 className="text-3xl font-bold text-slate-900 mb-4 italic">Intelligence Record Missing</h2>
      <p className="text-slate-500 italic mb-10 max-w-sm mx-auto leading-relaxed">
        The requested strategic dossier could not be synchronized with our global knowledge ledger.
      </p>
      <Link href="/">
        <button className="bg-slate-900 text-white px-10 h-14 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 transition-all interactive-lift">
          Return to Discovery Hub
        </button>
      </Link>
    </div>
  );
}
