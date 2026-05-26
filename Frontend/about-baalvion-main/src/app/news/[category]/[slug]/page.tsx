
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Share2, Globe, ArrowLeft, Loader2, Link2, Twitter, Facebook, Linkedin, Mail } from 'lucide-react';
import { Article } from '@/lib/db';
import { SubPageHero } from '@/components/sub-page-hero';
import Image from 'next/image';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [moreNews, setMoreNews] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/news?slug=${slug}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setArticle(data);

        const listRes = await fetch(`/api/news?category=${data.category}`);
        const listData = await listRes.json();
        setMoreNews(listData.filter((a: Article) => a.id !== data.id).slice(0, 4));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchData();
  }, [slug]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Strategic Link Copied",
        description: "The article destination has been stored in your clipboard buffer.",
      });
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Accessing Intelligence Registry...</p>
      </div>
    </div>
  );

  if (!article) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center p-8">
      <h1 className="text-4xl font-bold mb-4 text-gray-900">404: Brief Missing</h1>
      <p className="text-gray-500 mb-8">The requested intelligence brief does not exist in the registry node.</p>
      <Link href="/news/updates" className="text-primary font-bold hover:underline">Return to News Nexus</Link>
    </div>
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.seo?.title || article.title,
    "image": [article.image],
    "datePublished": article.date,
    "author": [{
      "@type": "Person",
      "name": article.author,
      "url": "https://baalvion.nexus"
    }]
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="pt-48 pb-0">
        <div className="max-w-4xl mx-auto px-6 mb-24">
          {/* Main Headline */}
          <div className="space-y-4 mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-[#111111] leading-tight tracking-tight">
              {article.title}
            </h1>
            <p className="text-xl text-gray-500 font-medium">
              Baalvion Strategic Brief • {article.date}
            </p>
          </div>

          {/* Share Button */}
          <div className="flex justify-end mb-8">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-sm hover:bg-gray-50 transition-colors text-xs font-bold text-gray-700 outline-none">
                  <Share2 className="w-3 h-3 text-[#FF9900]" /> Share
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border-gray-100 shadow-2xl rounded-md p-1">
                <DropdownMenuItem onClick={handleCopyLink} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors rounded-sm">
                  <Link2 className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-bold text-gray-700">Copy Link</span>
                </DropdownMenuItem>
                <div className="h-px bg-gray-50 my-1" />
                <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors rounded-sm">
                  <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                  <span className="text-sm font-bold text-gray-700">Twitter / X</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors rounded-sm">
                  <Facebook className="w-4 h-4 text-[#4267B2]" />
                  <span className="text-sm font-bold text-gray-700">Facebook</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors rounded-sm">
                  <Linkedin className="w-4 h-4 text-[#0077B5]" />
                  <span className="text-sm font-bold text-gray-700">LinkedIn</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors rounded-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-bold text-gray-700">Email Brief</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Author & Timestamp */}
          <div className="flex items-center justify-between py-8 border-y border-gray-100 mb-12">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                <Globe className="text-white w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-gray-700">
                Strategic Intelligence by <span className="text-[#007185] hover:underline cursor-pointer">{article.author}</span>
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                Registry Date: {article.date}
              </p>
              <p className="text-xs text-gray-400 font-medium">{article.readTime}</p>
            </div>
          </div>

          {/* Article Image */}
          <div className="relative aspect-video rounded-xl overflow-hidden mb-12 bg-gray-100">
            <Image 
              src={article.image} 
              alt={article.title} 
              fill 
              className="object-cover"
              priority
            />
          </div>

          {/* Article Content */}
          <div className="prose prose-lg max-w-none mb-20">
            <div className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
              {article.content || 'Content for this strategic brief is currently being synchronized with the Baalvion Operating System (BOS).'}
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="mt-20 pt-10 border-t border-gray-100">
            <Button asChild variant="ghost" className="h-12 px-0 hover:bg-transparent text-primary font-bold group">
              <Link href={`/news/${article.category}`}>
                <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Return to Intelligence Nexus
              </Link>
            </Button>
          </div>
        </div>

        {/* More News Section */}
        {moreNews.length > 0 && (
          <section className="bg-[#F2F2F2] py-20">
            <div className="max-w-[1200px] mx-auto px-6">
              <h3 className="text-xl font-bold text-[#111111] mb-8 uppercase tracking-widest">Related Intelligence</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {moreNews.map((news) => (
                  <Link key={news.id} href={`/news/${news.category}/${news.slug}`} className="group bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden transition-transform hover:-translate-y-1">
                    <div className="aspect-[16/10] relative overflow-hidden bg-gray-50">
                      <Image
                        src={news.image}
                        alt={news.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold leading-tight text-gray-900 group-hover:text-[#007185] transition-colors line-clamp-3">
                          {news.title}
                        </h4>
                        <p className="text-[11px] text-gray-400 font-medium">
                          {news.date}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
