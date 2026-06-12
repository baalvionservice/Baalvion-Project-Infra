import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Newspaper, Mail, CalendarDays, ArrowRight } from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BRAND_IMAGES } from "@/lib/brand-assets";
import { getNews, companyFacts } from "@/lib/content/store";
import { EmptyState } from "@/components/common/PendingDisclosure";

export const metadata: Metadata = {
  title: "News & Media",
  description:
    "Company news, press releases and media updates from Baalvion Mining Inc. Releases are published here as they are issued by management.",
  alternates: { canonical: "https://mining.baalvion.com/news" },
  openGraph: {
    title: "News & Media",
    description:
      "Company news, press releases and media updates from Baalvion Mining Inc.",
    url: "https://mining.baalvion.com/news",
    siteName: "Baalvion Mining Inc.",
  },
};

function formatDate(iso?: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function NewsPage() {
  const items = await getNews();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary py-16 text-primary-foreground relative overflow-hidden">
          <div className="absolute right-0 top-0 p-12 opacity-10" aria-hidden="true">
            <Newspaper className="h-64 w-64" />
          </div>
          <div className="container relative z-10 px-4 md:px-8 max-w-7xl mx-auto space-y-4">
            <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-2">
              News & Media
            </Badge>
            <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight">
              News & Media
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl text-lg leading-relaxed">
              Press releases, announcements and media updates from Baalvion
              Mining Inc., published as they are issued.
            </p>
          </div>
        </section>

        <div className="container px-4 md:px-8 max-w-7xl mx-auto py-12 space-y-12">
          {items.length === 0 ? (
            <EmptyState
              title="No press releases yet"
              message="Company news and media releases will appear here."
              ctaHref="/contact"
              ctaLabel="Media enquiries"
            />
          ) : (
            <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((article) => {
                const date = formatDate(article.publishedOn);
                return (
                  <Link key={article.id} href={`/news/${article.slug}`} className="group">
                    <Card className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden h-full">
                      <div className="relative aspect-[16/10]">
                        <Image
                          src={article.coverImage?.url ?? BRAND_IMAGES.insight}
                          alt={article.coverImage?.alt ?? article.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 1024px) 100vw, 33vw"
                        />
                      </div>
                      <CardContent className="p-6 space-y-3">
                        <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                          {article.category && (
                            <Badge className="bg-primary/10 text-primary border-primary/20">
                              {article.category}
                            </Badge>
                          )}
                          {date && (
                            <span className="flex items-center gap-1.5">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {date}
                            </span>
                          )}
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">
                          {article.title}
                        </h2>
                        {article.excerpt && (
                          <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
                            {article.excerpt}
                          </p>
                        )}
                        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                          Read more <ArrowRight className="h-4 w-4" />
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </section>
          )}

          {/* Media enquiries block */}
          <section className="rounded-2xl bg-slate-50 border border-slate-100 p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-secondary/10 shrink-0">
                <Mail className="h-7 w-7 text-secondary" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl md:text-2xl font-bold text-primary">
                  Media Enquiries
                </h2>
                <p className="text-secondary leading-relaxed">
                  For press, interviews and media requests, contact our
                  communications team.
                </p>
                <a
                  href={`mailto:${companyFacts.emails.media}`}
                  className="inline-block text-sm font-bold text-primary hover:underline"
                >
                  {companyFacts.emails.media}
                </a>
              </div>
            </div>
            <Link href="/contact">
              <Button className="font-bold h-12 px-8">Contact Us</Button>
            </Link>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
