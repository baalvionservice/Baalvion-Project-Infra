import Link from "next/link";
import { Term } from "@/lib/data/terms";
import { getTermUrl } from "@/lib/data/utils";
import Image from "next/image";
import { CategoryBadge } from "@/app/news/NewsArticleCard";

interface RelatedTermsProps {
  terms: Term[];
}

export default function RelatedTerms({ terms }: RelatedTermsProps) {
  if (terms.length === 0) return null;

  return (
    <section className=" pt-12 mt-16">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-foreground mb-2">
          Related Articles
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {terms.map((term) => (
          <Link
            key={term.slug}
            href={getTermUrl(term.slug)}
            className="group block space-y-4 bg-card border border-border  hover:border-primary/50 transition-colors"
          >
            <div className=" h-32 w-full aspect-square ">
              <Image
                src={term?.featuredImageUrl || "https://picsum.photos/300/300"}
                alt={term.title}
                width={200}
                height={200}
                className="object-cover h-full w-full"
              />
            </div>
            <div className="px-4 space-y-2 pb-2">
              <CategoryBadge category={term.categoryNames!} />
              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2">
                {term.title}
              </h4>
              <p className="text-sm text-muted-foreground line-clamp-3">
                By {term.author}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
