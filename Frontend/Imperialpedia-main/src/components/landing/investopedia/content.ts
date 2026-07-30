/**
 * The lead story, top stories, and topic-group rails used to be hardcoded
 * mock content here — replaced by the real CMS-backed
 * `@/components/home/getHomeEditorial` (see that file for why). This module
 * now only holds the still-static "Term of the Day" widget, which has no
 * image and no real CMS-backed data source.
 */

export const TERM_OF_DAY = {
  term: "Compound Interest",
  definition:
    "Compound interest is the interest you earn on both your original principal and the interest that has already accumulated. Because each period's interest is added to the balance, growth accelerates over time — the engine behind long-term investing and the reason starting early matters so much.",
  href: "/financial-tools/compound-interest",
};
