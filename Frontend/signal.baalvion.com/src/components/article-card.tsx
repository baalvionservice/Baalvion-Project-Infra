import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { RealArticle, Sentiment } from "@/lib/types";

const sentimentVariant: Record<Sentiment, "positive" | "negative" | "neutral"> = {
  positive: "positive",
  negative: "negative",
  neutral: "neutral",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ArticleCard({ article }: { article: RealArticle }) {
  return (
    <Card className="glow-card">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{article.category}</Badge>
          {article.sentiment && <Badge variant={sentimentVariant[article.sentiment]}>{article.sentiment}</Badge>}
        </div>
        <a href={article.url} target="_blank" rel="noopener noreferrer" className="block">
          <h3 className="text-lg font-semibold leading-snug text-foreground hover:text-primary">{article.title}</h3>
        </a>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {article.summary_ai ?? article.summary_raw ?? "No summary available yet."}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-muted-foreground">
          <span>{article.source.name}</span>
          <span>{formatDate(article.published_at)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
