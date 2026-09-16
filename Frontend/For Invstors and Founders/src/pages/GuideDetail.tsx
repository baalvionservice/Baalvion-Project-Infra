import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import MainLayout from "@/components/layout/MainLayout";
import PageSeo from "@/components/seo/PageSeo";
import Prose from "@/components/directory/Prose";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { getArticle, type Article } from "@/lib/publicApi";

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "");

export default function GuideDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<{ article: Article; related: Article[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getArticle(String(slug))
      .then((d) => { if (!d) navigate("/guides", { replace: true }); else setData(d); })
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  if (loading) {
    return <MainLayout><div className="container mx-auto px-4 py-10 max-w-3xl space-y-4"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-64" /></div></MainLayout>;
  }
  if (!data) return null;
  const { article, related } = data;

  return (
    <MainLayout>
      <PageSeo
        title={`${article.title} | Baalvion`}
        description={article.summary}
        path={`/guides/${article.slug}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.summary,
          datePublished: article.published_at || undefined,
          dateModified: article.updated_at || undefined,
          author: { "@type": "Organization", name: "Baalvion" },
          publisher: { "@type": "Organization", name: "Baalvion" },
        }}
      />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/guides")}>
          <ArrowLeft className="w-4 h-4 mr-1" />All guides
        </Button>

        <article>
          <header className="pb-6 border-b border-foreground/80">
            <div className="label-eyebrow mb-2">{[article.topic, article.reading_mins ? `${article.reading_mins} min read` : null].filter(Boolean).join(" · ")}</div>
            <h1 className="text-3xl lg:text-4xl font-semibold leading-[1.15]">{article.title}</h1>
            <p className="text-lg text-muted-foreground mt-3 leading-relaxed">{article.summary}</p>
            {article.published_at && <p className="text-xs text-muted-foreground mt-4">Published {fmt(article.published_at)}</p>}
          </header>

          <div className="py-8"><Prose body={article.body || ""} /></div>
        </article>

        <div className="border-t border-border pt-6 mt-4">
          <p className="text-sm text-muted-foreground">
            Put it to use:{" "}
            <Link to="/investors" className="text-primary hover:underline">search the investor directory</Link>
            {" "}or{" "}
            <Link to="/directory" className="text-primary hover:underline">browse by location</Link>.
          </p>
        </div>

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide pb-2 border-b border-foreground/80">More on {article.topic}</h2>
            <ul className="rule-list">
              {related.map((r) => (
                <li key={r.id}>
                  <Link to={`/guides/${r.slug}`} className="group flex items-start justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-primary group-hover:underline">{r.title}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{r.summary}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground self-center group-hover:text-primary hidden sm:block shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </MainLayout>
  );
}
