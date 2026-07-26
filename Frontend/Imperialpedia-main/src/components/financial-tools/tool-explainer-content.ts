import type { ToolExplainerContent } from "./ToolExplainer";

// Every formula and worked-example figure below matches the implementation
// in src/modules/calculators/utils/calculations.ts exactly (verified by hand
// against financialMath's source) — none of these numbers are invented.

export const compoundInterestExplainer: ToolExplainerContent = {
  toolName: "Compound Interest Calculator",
  intro:
    "Compound interest is interest calculated on both your original principal and the interest that has already accumulated. Because each period's interest is added back to the balance before the next period is calculated, growth accelerates over time rather than staying flat, as it would with simple interest.",
  formula: "A = P × (1 + r/n)^(n×t)",
  formulaLegend: [
    { symbol: "A", meaning: "final balance after compounding" },
    { symbol: "P", meaning: "initial principal" },
    { symbol: "r", meaning: "annual interest rate, as a decimal" },
    { symbol: "n", meaning: "compounding periods per year" },
    { symbol: "t", meaning: "number of years" },
  ],
  howItWorks: [
    "The calculator applies this formula using the principal, rate, time horizon, and compounding frequency you enter. A higher compounding frequency (daily vs. annually) produces a slightly larger final balance for the same nominal rate, because interest starts earning its own interest sooner.",
    "If you add a recurring monthly contribution, the tool also compounds each future contribution for the time remaining until the end of the term, so the final balance reflects both principal growth and new capital added along the way.",
  ],
  example: {
    title: "$10,000 at 7% for 20 years, compounded annually",
    steps: [
      "P = $10,000, r = 0.07, n = 1, t = 20",
      "A = 10,000 × (1 + 0.07/1)^(1×20) = 10,000 × 1.07^20",
      "1.07^20 ≈ 3.8697",
    ],
    result: "A ≈ $38,697 — more than 3.8× the original principal, with no additional contributions.",
  },
  faq: [
    {
      question: "How is compound interest different from simple interest?",
      answer:
        "Simple interest is calculated only on the original principal for the entire term. Compound interest is recalculated each period on the running balance (principal plus all interest earned so far), which is why it grows faster the longer money stays invested.",
    },
    {
      question: "Does compounding frequency matter much?",
      answer:
        "It matters, but less than the rate or time horizon. Moving from annual to monthly compounding at a given rate typically adds a small amount to the final balance — the bigger levers are a higher rate and a longer time horizon.",
    },
  ],
};

export const dividendExplainer: ToolExplainerContent = {
  toolName: "Dividend Income Calculator",
  intro:
    "This tool estimates the cash income a stock position would generate from dividends, based on how many shares you hold, the price per share, and the stock's dividend yield.",
  formula: "Annual Income = (Shares × Price per Share) × Yield%",
  formulaLegend: [
    { symbol: "Shares", meaning: "number of shares held" },
    { symbol: "Price per Share", meaning: "current market price of one share" },
    { symbol: "Yield%", meaning: "annual dividend yield, as a percentage of price" },
  ],
  howItWorks: [
    "The calculator first multiplies shares by price to get your total position value, then applies the dividend yield to that value to estimate annual dividend income. Monthly income shown is simply the annual figure divided by twelve — most dividend stocks actually pay quarterly, so this is an averaged estimate, not a payment schedule.",
    "Dividend yield moves with price: if the share price rises while the per-share dividend stays flat, yield falls, and vice versa. Use a current, not historical, yield figure for an accurate estimate.",
  ],
  example: {
    title: "200 shares at $45, yielding 3.2%",
    steps: [
      "Position value = 200 × $45 = $9,000",
      "Annual income = $9,000 × 0.032 = $288",
      "Monthly income = $288 / 12 = $24",
    ],
    result: "Estimated annual dividend income: $288 ($24/month average).",
  },
  faq: [
    {
      question: "Is dividend income guaranteed?",
      answer:
        "No. Dividend yield is based on the current or trailing payout rate, and companies can raise, cut, or suspend dividends at any time. This calculator estimates income at today's rate — it does not forecast future payouts.",
    },
    {
      question: "Should I use trailing yield or forward yield?",
      answer:
        "Forward yield (based on the company's most recently declared payout, annualized) is generally more useful for estimating near-term income than trailing yield, which reflects the past twelve months and can lag a recent dividend change.",
    },
  ],
};

export const cagrExplainer: ToolExplainerContent = {
  toolName: "CAGR Calculator",
  intro:
    "Compound Annual Growth Rate (CAGR) smooths an investment's return over multiple years into a single annualized percentage — useful for comparing investments that grew unevenly year to year on a like-for-like basis.",
  formula: "CAGR = (End Value / Start Value)^(1/years) − 1",
  formulaLegend: [
    { symbol: "Start Value", meaning: "value at the beginning of the period" },
    { symbol: "End Value", meaning: "value at the end of the period" },
    { symbol: "years", meaning: "length of the holding period, in years" },
  ],
  howItWorks: [
    "Unlike a simple total-return percentage, CAGR accounts for the compounding effect of time. Two investments with the same total return over different holding periods will show different CAGRs — the one that got there faster has the higher CAGR.",
    "CAGR assumes smooth, steady growth. It does not capture volatility along the way — an investment that fell sharply and then recovered can have the same CAGR as one that grew steadily, even though the ride was very different.",
  ],
  example: {
    title: "$10,000 growing to $25,000 over 8 years",
    steps: [
      "Start = $10,000, End = $25,000, years = 8",
      "Ratio = 25,000 / 10,000 = 2.5",
      "CAGR = 2.5^(1/8) − 1 ≈ 1.1214 − 1",
    ],
    result: "CAGR ≈ 12.1% per year.",
  },
  faq: [
    {
      question: "Can CAGR be negative?",
      answer:
        "Yes — if the end value is lower than the start value, CAGR is negative, representing the annualized rate at which the investment declined over the period.",
    },
    {
      question: "Is CAGR the same as average annual return?",
      answer:
        "No. A simple average of yearly returns can overstate performance when returns are volatile, because it ignores compounding. CAGR reflects the actual annualized growth rate needed to get from the start value to the end value.",
    },
  ],
};

export const inflationExplainer: ToolExplainerContent = {
  toolName: "Inflation Calculator",
  intro:
    "This tool projects how much a fixed amount of today's spending will cost in the future at a given average inflation rate — a way to see how purchasing power erodes over time.",
  formula: "Future Cost = Current Value × (1 + inflation rate)^years",
  formulaLegend: [
    { symbol: "Current Value", meaning: "the amount, in today's dollars" },
    { symbol: "inflation rate", meaning: "assumed average annual inflation, as a decimal" },
    { symbol: "years", meaning: "number of years projected forward" },
  ],
  howItWorks: [
    "The calculator compounds the inflation rate forward the same way interest compounds on savings, since inflation is itself a compounding process — each year's price increase is applied on top of the prior year's already-higher prices.",
    "The result tells you what it will cost, in future dollars, to buy what your current amount buys today — not what your current amount will be worth. To see the reverse (how much today's purchasing power shrinks), compare the future cost back to your original amount.",
  ],
  example: {
    title: "$1,000 of spending at 3% average inflation for 10 years",
    steps: [
      "Current value = $1,000, rate = 0.03, years = 10",
      "Future cost = 1,000 × (1.03)^10",
      "1.03^10 ≈ 1.3439",
    ],
    result: "Future cost ≈ $1,344 — the same basket of goods costing $1,000 today would cost about $1,344 in 10 years.",
  },
  faq: [
    {
      question: "Why use an average inflation rate instead of actual yearly CPI figures?",
      answer:
        "Actual inflation varies year to year and is only known after the fact. Using a long-run average (historically close to 3% in the U.S.) gives a reasonable planning estimate; you can adjust the rate to model higher- or lower-inflation scenarios.",
    },
    {
      question: "How does this relate to investment returns?",
      answer:
        "If an investment's return is lower than the inflation rate, its purchasing power falls even as the account balance grows. Comparing this tool's output against a compound-interest projection at your expected return shows whether you're outpacing inflation.",
    },
  ],
};

export const loanExplainer: ToolExplainerContent = {
  toolName: "Loan Payment Calculator",
  intro:
    "This calculator computes the fixed monthly payment (principal plus interest) required to fully repay a loan over a set term — the same amortization method lenders use for mortgages, auto loans, and personal loans.",
  formula: "M = P × [i(1+i)^n] / [(1+i)^n − 1]",
  formulaLegend: [
    { symbol: "M", meaning: "fixed monthly payment" },
    { symbol: "P", meaning: "loan principal" },
    { symbol: "i", meaning: "monthly interest rate (annual rate ÷ 12)" },
    { symbol: "n", meaning: "total number of monthly payments (years × 12)" },
  ],
  howItWorks: [
    "Because the payment is fixed but the balance declines each month, the split between interest and principal shifts over the life of the loan: early payments are mostly interest, later payments are mostly principal, even though the total payment never changes.",
    "Total interest paid over the loan's life is simply the sum of all monthly payments minus the original principal — for long terms at meaningful interest rates, this can add up to more than the amount originally borrowed.",
  ],
  example: {
    title: "$300,000 loan at 6.5% over 30 years",
    steps: [
      "P = $300,000, i = 0.065/12 ≈ 0.005417, n = 360",
      "(1+i)^n ≈ 6.992",
      "M = 300,000 × (0.005417 × 6.992) / (6.992 − 1)",
    ],
    result: "Monthly payment ≈ $1,897 — totaling roughly $682,900 repaid, of which about $382,900 is interest.",
  },
  faq: [
    {
      question: "Does this include property taxes or insurance?",
      answer:
        "No — this calculates only principal and interest on the loan itself. For a mortgage, actual monthly housing cost is typically higher once property taxes, homeowners insurance, and any HOA or PMI fees are added.",
    },
    {
      question: "Why does a small rate difference matter so much on a 30-year loan?",
      answer:
        "Interest compounds against you on the outstanding balance every month for the full term, so even a fraction of a percentage point changes the monthly payment and, over 360 payments, can shift total interest paid by tens of thousands of dollars.",
    },
  ],
};

export const investmentExplainer: ToolExplainerContent = {
  toolName: "Investment Growth Calculator",
  intro:
    "This tool projects how a starting balance plus regular monthly contributions could grow over time at an assumed average annual return, compounding monthly — a standard model for long-term investing projections like retirement or brokerage accounts.",
  formula: "Balance(month) = Balance(month − 1) × (1 + r/12) + Contribution",
  formulaLegend: [
    { symbol: "Balance", meaning: "account value, recalculated one month at a time" },
    { symbol: "r", meaning: "assumed annual rate of return, as a decimal" },
    { symbol: "Contribution", meaning: "fixed amount added at the end of each month" },
  ],
  howItWorks: [
    "Rather than using a single-step formula, the calculator simulates the account balance month by month for the full time horizon: each month it applies one month's worth of growth to the existing balance, then adds that month's contribution. This mirrors how a real brokerage or retirement account actually accrues value.",
    "Because contributions compound for less time than the original principal, the earliest dollars — whether from the initial deposit or the first few monthly contributions — end up doing more work than dollars contributed near the end of the term.",
  ],
  example: {
    title: "$5,000 start, $300/month, 6% return, over 15 years",
    steps: [
      "Principal grows for 180 months at a monthly rate of 6%/12 = 0.5%",
      "Each of the 180 monthly $300 contributions compounds for its own remaining time",
      "Summing the compounded principal and all compounded contributions",
    ],
    result: "Projected balance ≈ $99,500 — of which $5,000 was the original deposit and $54,000 was contributed, with the remainder from investment growth.",
  },
  faq: [
    {
      question: "Is a 6% return realistic?",
      answer:
        "Long-run average annual returns for a diversified stock portfolio have historically been in the high single digits before inflation, though any specific year can vary widely and past performance does not guarantee future results. Adjust the rate to stress-test more conservative or optimistic scenarios.",
    },
    {
      question: "Why does contributing early matter more than contributing later?",
      answer:
        "Every contribution only compounds for the months remaining until the end of the projection. A contribution made in month 1 compounds for the full term; a contribution made in the final month compounds for essentially zero additional time.",
    },
  ],
};

export const positionSizeExplainer: ToolExplainerContent = {
  toolName: "Position Size Calculator",
  intro:
    "This calculator determines the maximum number of shares (or contracts/units) to buy in a trade so that a single defined risk budget — not the trade's full dollar value — is what you stand to lose if the position hits your stop-loss.",
  formula: "Shares = (Account Size × Risk%) / |Entry Price − Stop-Loss Price|",
  formulaLegend: [
    { symbol: "Account Size", meaning: "total capital in the trading account" },
    { symbol: "Risk%", meaning: "percentage of the account you're willing to risk on this trade" },
    { symbol: "Entry Price", meaning: "planned purchase price" },
    { symbol: "Stop-Loss Price", meaning: "price at which you'd exit to limit losses" },
  ],
  howItWorks: [
    "The calculator first converts your risk percentage into a dollar risk budget (Account Size × Risk%), then divides that budget by the per-share loss if the trade goes against you and hits the stop-loss. The result is the largest position size that keeps your dollar loss, if wrong, capped at the budget — regardless of how far the stop is from the entry.",
    "A tighter stop (closer to entry) allows a larger position for the same dollar risk; a wider stop forces a smaller position. This is why traders with wider stops on volatile assets typically size positions smaller.",
  ],
  example: {
    title: "$50,000 account, 1% risk, entry $120, stop $114",
    steps: [
      "Risk amount = $50,000 × 0.01 = $500",
      "Per-share risk = |$120 − $114| = $6",
      "Shares = $500 / $6 ≈ 83 (rounded down)",
    ],
    result: "Position size: 83 shares (≈$9,960 total position value), risking $500 if the stop is hit.",
  },
  faq: [
    {
      question: "Why risk only 1-2% of an account per trade?",
      answer:
        "Keeping per-trade risk small means no single loss — or even a string of losses — can meaningfully damage the account. It's a risk-management convention, not a guarantee of profitability, and the appropriate number depends on individual risk tolerance and strategy.",
    },
    {
      question: "What if I don't use a stop-loss?",
      answer:
        "This formula requires a defined exit price to calculate risk per share. Without a stop-loss, there's no way to cap downside on a single position, which is the specific risk this calculation is designed to manage.",
    },
  ],
};

export const profitLossExplainer: ToolExplainerContent = {
  toolName: "Profit/Loss Calculator",
  intro:
    "This calculator determines the realized dollar profit or loss and percentage return on a completed stock trade, accounting for the number of shares, entry and exit price, and any trading fees.",
  formula: "Profit/Loss = (Shares × Sell Price) − (Shares × Buy Price) − Fees",
  formulaLegend: [
    { symbol: "Shares", meaning: "number of shares bought and sold" },
    { symbol: "Buy Price", meaning: "price paid per share" },
    { symbol: "Sell Price", meaning: "price received per share" },
    { symbol: "Fees", meaning: "total commissions or trading fees for the round trip" },
  ],
  howItWorks: [
    "The calculator computes cost basis (shares × buy price) and proceeds (shares × sell price) separately, subtracts fees, and expresses the result both as a dollar figure and as a percentage of the original cost basis — so a $500 gain on a $1,000 trade and a $500 gain on a $50,000 trade are shown with very different percentage returns.",
    "Fees reduce both the dollar profit and the percentage return. On smaller trades or high-fee brokers, fees can meaningfully erode returns even on a winning trade.",
  ],
  example: {
    title: "100 shares, bought at $50, sold at $62, $15 in fees",
    steps: [
      "Cost basis = 100 × $50 = $5,000",
      "Proceeds = 100 × $62 = $6,200",
      "Profit = $6,200 − $5,000 − $15 = $1,185",
      "Percent return = $1,185 / $5,000 × 100",
    ],
    result: "Realized profit: $1,185 (23.7% return on cost basis).",
  },
  faq: [
    {
      question: "Does this account for taxes?",
      answer:
        "No — this shows the pre-tax realized profit or loss on the trade itself. Actual after-tax proceeds depend on your holding period (short-term vs. long-term capital gains) and personal tax situation.",
    },
    {
      question: "Why does percentage return matter more than the dollar amount alone?",
      answer:
        "Percentage return lets you compare the efficiency of trades of different sizes on equal footing — a $1,185 profit is a very different result on a $5,000 trade than it would be on a $50,000 trade.",
    },
  ],
};
