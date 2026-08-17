/**
 * The lead story, top stories, and topic-group rails used to be hardcoded
 * mock content here — replaced by the real CMS-backed
 * `@/components/home/getHomeEditorial` (see that file for why). This module
 * now only holds the still-static "Term of the Day" widget, which has no
 * image and no real CMS-backed data source.
 */

export const TERM_OF_DAY = {
  term: "Dollar-Cost Averaging",
  definition:
    "Dollar-cost averaging means investing a fixed amount on a regular schedule, regardless of price. Because you buy more units when prices are low and fewer when they're high, your average cost per unit smooths out over time — reducing the risk of mistiming the market and building a calm, repeatable investing habit.",
  href: "/personal-finance",
};
