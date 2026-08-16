/**
 * Substantive, indexable copy for the /financial-tools hub — explains why each
 * category of calculator matters before the reader ever touches an input field.
 * Mirrors the per-tool ToolExplainer pattern: real content the page would
 * otherwise lack, since the calculators themselves are interactive widgets
 * with no descriptive text of their own.
 */

export const financialToolsHubIntro =
  "A financial calculator only earns its place on a page if it changes a real decision — how much to save, what a loan actually costs, how big a position to take before a stop-loss. The nine tools below cover the calculations that come up most often across personal finance, investing, and trading: figuring out what compounding actually does to a balance over decades, what a fixed monthly loan payment really costs in total interest, whether a retirement plan is on pace, and how to size and score individual trades without guessing. Each one uses the same math a financial professional would use by hand or in a spreadsheet — the tools just remove the arithmetic, not the judgment. Below is a category-by-category breakdown of why each group of calculators exists and when reaching for one actually helps.";

export const financialToolsCategoryBlurbs: Record<string, string> = {
  "Wealth Building":
    "Compounding is the single biggest lever in long-term savings, and it is also the hardest thing to estimate in your head — a 7% return over 20 years doesn't feel intuitively different from a 5% return until you see the final balances side by side. The Compound Interest calculator here handles the exponential math directly: principal, rate, time horizon, and compounding frequency all interact in ways that are easy to underestimate over a 10- or 30-year window. Use it before committing to a savings vehicle or comparing two rate offers, since even a one-point difference in APY compounds into a meaningfully different balance over a long enough term.",
  "Debt Management":
    "A loan's monthly payment number hides two very different questions: what you'll pay each month, and how much of that payment is actually interest versus principal at any given point in the term. The Loan Repayment calculator runs the full amortization schedule so both answers are visible — critical before signing a mortgage, auto loan, or personal loan, since the same monthly payment can represent very different total interest costs depending on the rate and term length. It's also the fastest way to see why refinancing to a lower rate, or shortening a term, changes total cost more than it changes the monthly payment.",
  Investing:
    "Two tools live here for different stages of the same question: what will my money actually turn into? Investment ROI projects a starting balance plus regular contributions forward at an assumed rate of return, simulated month by month rather than as a single formula, so it reflects how contributions made early in the term do more compounding work than contributions made near the end. Portfolio ROI Architect extends that same thinking across multiple asset classes at once, so you can see an aggregate expected return across a diversified allocation instead of evaluating each holding in isolation. Both are projection tools, not guarantees — the value is in comparing scenarios (higher contribution, longer horizon, different allocation) against each other, not in treating any single output as a prediction.",
  Retirement:
    "Retirement is the one financial goal where the cost of being wrong isn't a bad month — it's finding out too late, when there's no more working-years runway left to fix it. The Retirement Planner takes your current savings, ongoing contributions, expected return, current age, and target retirement age, and projects whether that trajectory actually reaches a sustainable number. Its real value isn't the single output number, it's how easy it makes running the plan again with a higher contribution rate, a later retirement age, or a more conservative return assumption — the kind of scenario comparison that's tedious to do by hand but takes seconds here.",
  Economics:
    "Inflation is the quiet variable that erodes every other financial plan on this page if it's ignored. The Inflation Impact calculator projects what a fixed amount of today's spending will cost in the future at a given average inflation rate, which reframes savings and investment goals in real terms rather than nominal ones. A retirement number or a savings target that looks sufficient today can fall meaningfully short once 20 or 30 years of inflation are priced in — this tool exists specifically to make that gap visible before it becomes a problem, not after.",
  Stocks:
    "Four tools cover the calculations that come up specifically around individual stock trades. CAGR compresses an investment's return over multiple years into one annualized percentage, which is the only fair way to compare two investments that grew unevenly over different holding periods. The Dividend Calculator estimates the cash income a position generates from its yield, useful for income-focused investors sizing a dividend portfolio. Position Size answers the risk-management question that most new traders skip entirely: given an account size, a risk tolerance, and a stop-loss level, how many shares can you actually buy without risking more than you intended if the trade goes wrong. And Profit/Loss calculates the realized dollar and percentage return on a completed trade, fees included, so a win on a small trade and a win on a large trade can be compared on equal footing rather than by dollar amount alone.",
};

export const financialToolsHubClosing =
  "None of these calculators replace a licensed financial advisor, a CPA, or your own judgment about risk tolerance and goals — they exist to make the underlying math fast, visible, and easy to re-run under different assumptions, so the decision you eventually make is an informed one rather than a guess. If a specific scenario isn't covered here, each calculator's own page includes the exact formula it uses, a worked example, and answers to the questions people most often ask about that calculation, so you can verify the math yourself rather than taking the output on faith.";

/** General FAQ about the calculator library itself — separate from each tool's
 * own formula-specific FAQ (see tool-explainer-content.ts), which covers the
 * math. These cover the tools as a product: cost, accuracy, and data handling. */
export const financialToolsHubFAQ: { question: string; answer: string }[] = [
  {
    question: "Are Imperialpedia's financial calculators free to use?",
    answer:
      "Yes. Every calculator on this page is free, requires no account or signup, and has no usage limit. There's no premium tier that unlocks additional precision or removes a paywall on results.",
  },
  {
    question: "How accurate are the results?",
    answer:
      "Each calculator uses the exact formula shown on its own page — the same standard formulas used in finance textbooks and by financial professionals (e.g., the standard amortization formula for loans, or A = P(1 + r/n)^(nt) for compound interest). Accuracy is only as good as the numbers you enter; the tools don't forecast future rates or returns for you.",
  },
  {
    question: "Do you store the numbers I enter?",
    answer:
      "No. Calculations run entirely in your browser from the values you type in. Nothing you enter into a calculator — principal, rate, account size, trade prices — is sent to Imperialpedia's servers or stored.",
  },
  {
    question: "Where do the formulas come from?",
    answer:
      "Standard, published financial formulas — not a proprietary model. Each calculator's page shows the formula, defines every variable, and walks through a hand-verified worked example, so you can check the math independently instead of trusting a black box.",
  },
  {
    question: "Can I use these for tax or legal decisions?",
    answer:
      "Treat them as planning and estimation tools, not tax or legal advice. Real-world numbers involve variables these calculators don't model — taxes, fees beyond what's explicitly asked for, and individual circumstances — so confirm anything consequential with a CPA, tax professional, or financial advisor.",
  },
];
