/**
 * The lead story, top stories, and topic-group rails used to be hardcoded
 * mock content here — replaced by the real CMS-backed
 * `@/components/home/getHomeEditorial` (see that file for why). This module
 * now only holds the still-static "Term of the Day" widget, which has no
 * image and no real CMS-backed data source.
 */

// "Read full definition" has to land on a page that really is the full
// definition. The previous entry paired a dollar-cost-averaging blurb with
// href "/personal-finance" — a retired hub that 301s to the homepage, and whose
// DCA article was pulled in the 2026-08 cleanup anyway, so there was nothing
// left to point at. Swapped to a term the site actually still publishes in
// depth. If this term's article is ever retired, TermOfDay drops the link
// rather than rendering a bounce back to the homepage.
export const TERM_OF_DAY = {
  term: "Zero-Based Budgeting",
  definition:
    "Zero-based budgeting assigns every dollar of income a job — rent, groceries, debt payoff, savings, even guilt-free spending — until income minus every assigned category equals exactly zero. “Zero” means every dollar has a destination, not that every dollar gets spent: savings and debt payments are assigned categories too.",
  href: "/budgeting-basics/zero-based-budgeting",
};
