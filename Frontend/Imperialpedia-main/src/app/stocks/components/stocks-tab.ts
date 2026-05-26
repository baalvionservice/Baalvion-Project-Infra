

  export type StocksValueCategory =
  | "all"
  | "top-stocks"  
  | "trending-stocks"
  | "growth-stocks"
  | "value-stocks"
  | "dividend-stocks"
  | "tech-stocks"
  | "more";

  export type StocksCategory =
    | "Top Stocks"
    | "Trending Stocks"
    | "Growth Stocks"
    | "Value Stocks"
    | "Dividend Stocks"
    | "Tech Stocks";
    

export const MAIN_TABS_STOCKS: Array<{
  value: Exclude<StocksValueCategory, "more">;
  label: string;
  category: StocksCategory | "All";
}> = [
  { value: "all", label: "All", category: "All" },
  { value: "top-stocks", label: "Top Stocks", category: "Top Stocks" },
  { value: "trending-stocks", label: "Trending Stocks", category: "Trending Stocks" },
  { value: "growth-stocks", label: "Growth Stocks", category: "Growth Stocks" },
  { value: "value-stocks", label: "Value Stocks", category: "Value Stocks" },
];

export const MORE_CATEGORIES_STOCKS: StocksCategory[] = ["Tech Stocks"];
