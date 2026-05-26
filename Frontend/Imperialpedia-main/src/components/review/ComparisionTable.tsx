"use client";

import { ReviewArticle } from "@/types/Review";
import Image from "next/image";
import Link from "next/link";
import { StarRating } from "./StarRating";

export function ComparisonTable({ review }: { review: ReviewArticle }) {
    if (review.comparisonColumns === undefined) return null;
    return (
        <section className="my-10">
            <h2 className="text-xl font-bold text-foreground mb-4">
                Compare {review.picks.length} Top Providers
            </h2>

            {/* Scroll wrapper for mobile */}
            <div className="w-full overflow-x-auto rounded-xl border border-border">
                <table className="min-w-full text-sm">
                    {/* Header */}
                    <thead>
                        <tr className="bg-muted/60 border-b border-border">
                            <th className="text-left px-4 py-3 font-semibold text-foreground w-44 sticky left-0 bg-muted/60">
                                Provider
                            </th>
                            {review.comparisonColumns.map((col) => (
                                <th
                                    key={col}
                                    className="text-left px-4 py-3 font-semibold text-foreground whitespace-nowrap"
                                >
                                    {col}
                                </th>
                            ))}
                            <th className="text-left px-4 py-3 font-semibold text-foreground w-28">
                                Rating
                            </th>

                        </tr>
                    </thead>

                    {/* Rows */}
                    <tbody>
                        {review.comparisonRows.map((row, idx) => (
                            <tr
                                key={row.providerName}
                                className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${idx === 0 ? "bg-primary/5" : ""
                                    }`}
                            >
                                {/* Provider name + logo — sticky on mobile */}
                                <td className="px-4 py-4 sticky left-0 bg-background">
                                    <div className="flex items-center gap-2.5">

                                        <span className="font-medium text-foreground whitespace-nowrap">
                                            {row.providerName}
                                        </span>

                                    </div>
                                </td>

                                {/* Spec columns */}
                                {review?.comparisonColumns?.map((col) => (
                                    <td key={col} className="px-4 py-4 text-foreground whitespace-nowrap">
                                        {row.specs[col] ?? "—"}
                                    </td>
                                ))}


                                {/* Star rating */}
                                <td className="px-4 py-4">
                                    <StarRating score={row.overallScore} size="sm" />
                                </td>


                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
                Rates and fees are subject to change. Verified as of {new Date(review.lastUpdated).toLocaleDateString("en-US", { month: "long", year: "numeric" })}.
            </p>
        </section>
    );
}