import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import MainLayout from "@/components/layout/MainLayout";
import PageSeo from "@/components/seo/PageSeo";
import PageHeader from "@/components/directory/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";
import { listArticles, type Article, type Facet } from "@/lib/publicApi";

export default function Guides() {
  const [params, setParams] = useSearchParams();
  const topic = params.get("topic") || "";
  const [articles, setArticles] = useState<Article[]>([]);
  const [topics, setTopics] = useState<Facet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listArticles(topic || undefined)
      .then((d) => { setArticles(d.articles); setTopics(d.topics); })
      .finally(() => setLoading(false));
  }, [topic]);

  return (
    <MainLayout>
      <PageSeo
        title="Guides — How to read investor filings and use them to raise | Baalvion"
        description="Short, practical guides to the public records behind the directory: what a Form D filing proves, why cheque sizes are rarely published, and how to choose which investors to approach."
        path="/guides"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Guides",
          hasPart: articles.map((a) => ({ "@type": "Article", headline: a.title, url: `https://www.marketunderworld.com/guides/${a.slug}` })),
        }}
      />

      <PageHeader
        eyebrow="Guides"
        title="How to read the record"
        lede="The directory tells you who funds companies like yours. These explain what the underlying filings do and do not prove — the part no dataset can answer for you."
        crumbs={[{ label: "Home", to: "/" }, { label: "Guides" }]}
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {topics.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-6 mb-2 border-b border-border">
            <button onClick={() => setParams({})}
              className={`rounded-full border px-3 py-1 text-sm ${!topic ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:border-primary/50"}`}>
              All
            </button>
            {topics.map((t) => (
              <button key={t.value} onClick={() => setParams({ topic: t.value })}
                className={`rounded-full border px-3 py-1 text-sm ${topic === t.value ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:border-primary/50"}`}>
                {t.value} <span className="text-muted-foreground">{t.n}</span>
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
        ) : articles.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">No guides here yet.</p>
        ) : (
          <ul className="rule-list">
            {articles.map((a) => (
              <li key={a.id}>
                <Link to={`/guides/${a.slug}`} className="group flex items-start justify-between gap-6 py-5">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-primary group-hover:underline">{a.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{a.summary}</p>
                    <p className="label-eyebrow mt-2">{[a.topic, a.reading_mins ? `${a.reading_mins} min read` : null].filter(Boolean).join(" · ")}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground self-center group-hover:text-primary hidden sm:block shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </MainLayout>
  );
}
