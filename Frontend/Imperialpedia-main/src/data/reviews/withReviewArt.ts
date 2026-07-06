import { ReviewArticle } from "@/types/Review";
import { initialsBadgeDataUri, personSilhouetteDataUri } from "@baalvion/illustrations";

/**
 * Fills in `avatarUrl`/`logoUrl` fields across a review article with original,
 * deterministic art instead of stock headshot photos or fabricated brand logos:
 * an abstract silhouette avatar for the reviewer, and a colored initials badge
 * for each provider (we can't legitimately reproduce real trademarked logos).
 */
export function withReviewArt(
  raw: Omit<ReviewArticle, "reviewedBy" | "picks" | "providers" | "comparisonRows"> & {
    reviewedBy: Omit<ReviewArticle["reviewedBy"], "avatarUrl">;
    picks: Omit<ReviewArticle["picks"][number], "logoUrl">[];
    providers: Omit<ReviewArticle["providers"][number], "logoUrl">[];
    comparisonRows: Omit<ReviewArticle["comparisonRows"][number], "logoUrl">[];
  },
): ReviewArticle {
  return {
    ...raw,
    reviewedBy: {
      ...raw.reviewedBy,
      avatarUrl: personSilhouetteDataUri({ name: raw.reviewedBy.name, seed: `${raw.slug}-reviewer` }),
    },
    picks: raw.picks.map((pick) => ({
      ...pick,
      logoUrl: initialsBadgeDataUri({ label: pick.providerName, seed: pick.providerId }),
    })),
    providers: raw.providers.map((provider) => ({
      ...provider,
      logoUrl: initialsBadgeDataUri({ label: provider.name, seed: provider.id }),
    })),
    comparisonRows: raw.comparisonRows.map((row) => ({
      ...row,
      logoUrl: initialsBadgeDataUri({ label: row.providerName, seed: row.providerName }),
    })),
  };
}
