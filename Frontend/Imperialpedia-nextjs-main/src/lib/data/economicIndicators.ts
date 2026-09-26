import type { Indicator } from "@/lib/data/worldRegions";

/**
 * Demo macro snapshot for the Economy hub's "Economic Snapshot" dashboard —
 * same illustrative-data convention already used site-wide for `marketIndicators`
 * (src/lib/data/worldData.ts). The Federal Funds Rate figure matches the range
 * already cited in the seeded FOMC article (src/lib/data.news.ts) so the two
 * don't contradict each other.
 */
export const economicIndicators: Indicator[] = [
  {
    name: "Inflation Rate (CPI)",
    value: "3.1%",
    change: "-0.2",
    percent: "-0.2pt",
    positive: true,
  },
  {
    name: "GDP Growth",
    value: "2.4%",
    change: "+0.3",
    percent: "+0.3pt",
    positive: true,
  },
  {
    name: "Unemployment Rate",
    value: "3.9%",
    change: "+0.1",
    percent: "+0.1pt",
    positive: false,
  },
  {
    name: "Federal Funds Rate",
    value: "5.25%-5.50%",
    change: "0.00",
    percent: "Held",
    positive: true,
  },
  {
    name: "10-Year Treasury Yield",
    value: "4.32%",
    change: "+0.03",
    percent: "+0.03pt",
    positive: false,
  },
  {
    name: "Consumer Confidence",
    value: "102.3",
    change: "+1.8",
    percent: "+1.8%",
    positive: true,
  },
  {
    name: "Oil (WTI)",
    value: "$83.17",
    change: "-0.43",
    percent: "-0.51%",
    positive: false,
  },
];
