import { ArticleStatus } from "@/modules/content-engine/types";
import { NewsCategory } from "../data.news";
import { articleArtDataUri } from "@baalvion/illustrations";

export type TextSegment =
  | { type: "text"; content: string }
  | { type: "link"; content: string; href: string }
  | { type: "list"; content: LinkType[] };

export type LinkType =
  | { type: "link"; content: string; href: string }
  | { type: "text"; content: string };

type answerType = {
  text: string;
  link: string;
};

export type accordionType = {
  question: string;
  answer: answerType[];
};

export type TermsBodyBlock =
  | {
      type: "paragraph";
      content: TextSegment[]; // 👈 upgraded
      id?: string;
    }
  | { type: "heading"; text: string; id: string }
  | { type: "subheading"; text: string }
  | { type: "quote"; text: string; attribution?: string; id?: string }
  | { type: "callout"; content: TextSegment[]; id?: string }
  | { type: "list"; items: string[]; id?: string }
  | { type: "image"; url: string; caption?: string; id?: string }
  | {
      type: "accordion";
      title: string;
      content: accordionType[];
      id?: string;
    }
  | {
      type: "expandable";
      content: TextSegment[]; // 👈 also upgraded for links
      id?: string;
    };
export type Term = {
  slug: string;
  featuredImageUrl?: string;
  author?: string;
  title: string;
  categoryNames?: NewsCategory;
  seoTitle?: string;
  status?: ArticleStatus;
  seoDescription?: string;
  content: TermsBodyBlock[];
  relatedTerms?: string[];
};

const rawTerms: Term[] = [
  {
    slug: "0x-protocol",
    seoTitle: "0x Protocol",
    author: "Imperialpedia Staff",
    categoryNames: "Crypto",
    title: "0x Protocol: A Decentralized Exchange Infrastructure for Ethereum",
    seoDescription:  "An open protocol that enables the peer-to-peer exchange of assets on the Ethereum blockchain, facilitating decentralized trading and liquidity.",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "The 0x Protocol is an open-source framework that allows developers to build decentralized exchanges (DEXs) on the Ethereum blockchain. It provides a standard set of smart contracts and tools for facilitating peer-to-peer trading of ERC-20 tokens without relying on a centralized intermediary.",
          },
        ],
      },
      {
        type: "heading",
        text: "How 0x Protocol Works",
        id: "how-0x-protocol-works",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "0x Protocol uses off-chain order relay with on-chain settlement. Traders create orders off-chain and broadcast them to relayers, who facilitate order discovery and matching. When a trade is executed, the settlement occurs on-chain through smart contracts, ensuring security and transparency.",
          },
        ],
      },
      {
        type: "heading",
        text: "Why Off-Chain Order Relay Matters",
        id: "why-off-chain-relay-matters",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Recording every single order directly on the Ethereum blockchain would be slow and expensive, since each order would require its own transaction and gas fee even if it never gets filled. By keeping order creation and discovery off-chain, 0x lets traders and relayers exchange and negotiate potential trades for free, and only pay gas fees for the final on-chain settlement step when a trade actually executes.",
          },
        ],
      },
      {
        type: "heading",
        text: "Relayers and Liquidity",
        id: "relayers-and-liquidity",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Relayers are platforms or applications that host 0x order books and help match buyers with sellers, similar to how a traditional exchange's order book works, but without ever taking custody of user funds. Because the underlying protocol is shared and open-source, liquidity from one relayer can in principle be shared or aggregated across others building on the same standard, rather than being fragmented across incompatible, closed systems.",
          },
        ],
      },
      {
        type: "callout",
        content: [
          {
            type: "text",
            content:
              "Because 0x is a protocol rather than a single exchange, users never deposit funds into a central custodian — trades settle directly between wallets via smart contracts, which is the core appeal of decentralized exchange infrastructure.",
          },
        ],
      },
    ],
  },


  {
    slug: "a-b-trust",
    seoTitle: "A-B Trust",
    author: "Imperialpedia Staff",
    categoryNames: "PersonalFinance",
    title: "A-B Trust: Definition, How It Works, and Tax Benefits",
    seoDescription:
      "An estate planning tool used by married couples to split assets into two trusts on the first spouse's death, historically used to minimize estate taxes.",
    content: [
      {
        type: "heading",
        text: "What Is an A-B Trust?",
        id: "what-is-an-ab-trust",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "An A-B trust is an estate-planning structure created by a married couple that splits into two separate trusts when the first spouse dies. Trust A (sometimes called the survivor's trust or marital trust) holds the surviving spouse's share and remains under their control. Trust B (the decedent's trust, sometimes called a bypass or credit-shelter trust) holds the deceased spouse's share, uses their available estate-tax exemption, and passes to the couple's chosen final beneficiaries — typically their children — rather than to the surviving spouse outright.",
          },
        ],
      },
      {
        type: "heading",
        text: "Why Couples Used to Set These Up",
        id: "why-couples-used-these",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "The core purpose of an A-B trust is to make sure both spouses' individual federal estate-tax exemptions get used, rather than only the surviving spouse's. Without this structure, if the first spouse's assets pass directly to the survivor, their personal exemption can effectively go unused, potentially leaving a larger combined estate exposed to estate tax when the second spouse later dies.",
          },
        ],
      },
      {
        type: "callout",
        content: [
          {
            type: "text",
            content:
              "Because assets held in Trust B are not counted as part of the surviving spouse's estate, they avoid being taxed a second time when that spouse later passes away — one of the main tax benefits of the structure.",
          },
        ],
      },
      {
        type: "heading",
        text: "Why A-B Trusts Have Become Less Common",
        id: "why-less-common",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Since 2011, U.S. tax law has allowed a surviving spouse to claim any unused portion of a deceased spouse's federal estate-tax exemption directly, through an election called \"portability,\" without needing a trust to preserve it. Combined with a federal exemption threshold that now covers the vast majority of estates, this has significantly reduced how often an A-B trust is strictly necessary purely for federal estate-tax purposes. A-B trusts can still serve other goals, however — such as controlling how assets are ultimately distributed, protecting assets for children from a prior marriage, or addressing state-level estate taxes with lower exemption thresholds than the federal one.",
          },
        ],
      },
      {
        type: "heading",
        text: "A Simplified Example",
        id: "simplified-example",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Suppose a married couple has a combined estate and the first spouse dies. Their share of the assets, up to their available exemption amount, funds Trust B and bypasses the surviving spouse's taxable estate entirely. The surviving spouse can typically still receive income from Trust B, and often has some access to principal under specific terms, but the assets themselves are earmarked for the couple's chosen final beneficiaries and are not taxed again in the survivor's estate.",
          },
        ],
      },
      {
        type: "heading",
        text: "Considerations Before Setting One Up",
        id: "considerations",
      },
      {
        type: "list",
        items: [
          "Portability may already achieve the core federal tax benefit without a trust, depending on the estate's size.",
          "State estate taxes often have much lower exemption thresholds than the federal exemption, which can still make this structure useful.",
          "Trust B's terms limit the surviving spouse's flexibility with those assets compared to owning them outright.",
          "This is a complex area of estate law — a qualified estate-planning attorney should structure any trust based on the couple's specific situation.",
        ],
      },
    ],
  },
  {
    slug: "estate-tax",
    seoTitle: "Estate Tax",
    author: "Imperialpedia Staff",
    categoryNames: "PersonalFinance",
    title: "Estate Tax: Understanding Federal and State Tax Implications",
    seoDescription:
      "A tax imposed on the transfer of property at death, affecting high-value estates and requiring strategic planning.",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Estate tax is a federal tax on the transfer of property at death. It applies to estates exceeding the federal exemption threshold and can significantly impact wealth transfer to beneficiaries.",
          },
        ],
      },
      {
        type: "heading",
        text: "How Estate Tax Works",
        id: "how-estate-tax-works",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "The estate tax applies to the fair market value of all property owned at death, including real estate, investments, business interests, and personal property. Proper planning with tools like trusts can help minimize this tax burden.",
          },
        ],
      },
      {
        type: "heading",
        text: "The Exemption Threshold",
        id: "exemption-threshold",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Federal estate tax only applies to the portion of an estate's value that exceeds a specific exemption threshold, which is adjusted periodically and has historically been set high enough that only a small percentage of estates owe any federal estate tax at all. Amounts below the threshold pass to heirs free of federal estate tax; only the excess above the threshold is taxed, and typically at a significant marginal rate.",
          },
        ],
      },
      {
        type: "heading",
        text: "Federal vs. State Estate Tax",
        id: "federal-vs-state",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Estate tax exists at both the federal and, in some states, the state level, and these are separate systems with separate exemption thresholds. A number of states impose their own estate tax with a considerably lower exemption than the federal threshold, meaning an estate can owe state estate tax even when it owes no federal estate tax at all. Where a person resides and where certain property is located both affect which state rules, if any, apply.",
          },
        ],
      },
      {
        type: "callout",
        content: [
          {
            type: "text",
            content:
              "Estate tax is separate from inheritance tax, which (where it exists) is levied on the heir receiving the property rather than on the estate itself, and separate from income tax, which generally does not apply to inherited assets themselves.",
          },
        ],
      },
      {
        type: "heading",
        text: "Common Planning Tools",
        id: "common-planning-tools",
      },
      {
        type: "list",
        items: [
          "The unlimited marital deduction, allowing tax-free transfers between spouses.",
          "Lifetime gifting strategies that use annual and lifetime gift-tax exclusions to reduce a taxable estate over time.",
          "Irrevocable trusts that remove specific assets from a taxable estate.",
          "Life insurance held in an appropriately structured trust to help cover any eventual estate tax liability.",
        ],
      },
    ],
  },
  {
    slug: "bear-market",
    seoTitle: "Bear Market",
    author: "Imperialpedia Staff",
    categoryNames: "Markets",
    title: "Bear Market: Definition, Causes, and How to Navigate One",
    seoDescription:
      "A bear market is a sustained decline of 20% or more in a broad market index from its recent high, often accompanied by pessimism and reduced investor confidence.",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "A bear market describes a sustained decline of 20% or more in a broad market index, such as the S&P 500, from its most recent high. Bear markets are typically accompanied by widespread investor pessimism, weak economic data, and reduced risk appetite across the market.",
          },
        ],
      },
      {
        type: "heading",
        text: "What Triggers a Bear Market",
        id: "what-triggers-a-bear-market",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Bear markets are commonly associated with economic recessions, but they can also be triggered by sharp interest-rate increases, geopolitical shocks, asset-price bubbles bursting, or a sudden loss of investor confidence even without an official recession. There is no single cause — different bear markets throughout history have had different underlying triggers.",
          },
        ],
      },
      {
        type: "heading",
        text: "Bear Market vs. Correction",
        id: "bear-market-vs-correction",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "A market correction refers to a smaller decline, typically 10% to 20% from a recent high. A bear market is the more severe classification, starting at a 20% decline. Not every correction turns into a bear market — many corrections recover before reaching that threshold.",
          },
        ],
      },
      {
        type: "callout",
        content: [
          {
            type: "text",
            content:
              "Historically, bear markets have eventually been followed by a recovery and new market highs, though the timing and depth of any individual bear market cannot be predicted in advance.",
          },
        ],
      },
      {
        type: "heading",
        text: "How Long-Term Investors Typically Respond",
        id: "how-investors-respond",
      },
      {
        type: "list",
        items: [
          "Avoid panic-selling a diversified, long-term portfolio purely in reaction to a decline.",
          "Continue regular contributions if possible, buying more shares at lower prices.",
          "Review — but don't necessarily abandon — the original investment plan and risk tolerance.",
          "Recognize that trying to precisely time an exit and a re-entry is extremely difficult even for professionals.",
        ],
      },
    ],
  },
  {
    slug: "gross-domestic-product",
    seoTitle: "Gross Domestic Product (GDP)",
    author: "Imperialpedia Staff",
    categoryNames: "Economy",
    title: "Gross Domestic Product (GDP): What It Measures and Why It Matters",
    seoDescription:
      "GDP measures the total monetary value of all goods and services produced within a country's borders over a specific period, the broadest single measure of economic output.",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Gross Domestic Product (GDP) measures the total monetary value of all finished goods and services produced within a country's borders over a specific period, typically a quarter or a year. It is the most widely cited single measure of the overall size and health of an economy.",
          },
        ],
      },
      {
        type: "heading",
        text: "The Three Ways to Calculate GDP",
        id: "three-ways-to-calculate",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "GDP can be calculated three ways that should, in theory, arrive at the same figure: the expenditure approach (adding up consumption, investment, government spending, and net exports), the income approach (adding up wages, profits, and other income earned), and the production approach (adding up the value added at each stage of production across the economy).",
          },
        ],
      },
      {
        type: "heading",
        text: "Real vs. Nominal GDP",
        id: "real-vs-nominal-gdp",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Nominal GDP is measured using current prices, while real GDP adjusts for inflation to reflect actual changes in output rather than changes caused purely by rising prices. Real GDP growth is generally the more meaningful figure for understanding whether an economy's actual production is expanding.",
          },
        ],
      },
      {
        type: "callout",
        content: [
          {
            type: "text",
            content:
              "Two consecutive quarters of declining real GDP is a commonly cited informal rule of thumb for a recession, though official recession determinations typically consider a broader range of indicators beyond GDP alone.",
          },
        ],
      },
      {
        type: "heading",
        text: "What GDP Doesn't Capture",
        id: "what-gdp-doesnt-capture",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "GDP measures the scale of economic activity, not how evenly that activity's benefits are distributed, nor does it directly capture quality of life, unpaid household labor, or environmental costs. Economists often pair GDP with other measures — like median income or unemployment — for a fuller picture of economic well-being.",
          },
        ],
      },
    ],
  },
  {
    slug: "hedge-fund",
    seoTitle: "Hedge Fund",
    author: "Imperialpedia Staff",
    categoryNames: "Markets",
    title: "Hedge Fund: How These Pooled Investment Vehicles Work",
    seoDescription:
      "A hedge fund is a pooled investment vehicle that uses a wide range of strategies, often including leverage and derivatives, typically restricted to accredited or institutional investors.",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "A hedge fund is a pooled investment vehicle that uses a wide range of strategies — including leverage, derivatives, short selling, and concentrated positions — with the goal of generating returns that aren't purely tied to the direction of the broader market.",
          },
        ],
      },
      {
        type: "heading",
        text: "Who Can Invest in a Hedge Fund",
        id: "who-can-invest",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Hedge funds are typically restricted to accredited investors and institutions, and are subject to lighter regulatory oversight than mutual funds partly because of this restriction — the assumption being that sophisticated, well-resourced investors need less regulatory protection than the general retail public.",
          },
        ],
      },
      {
        type: "heading",
        text: "Common Hedge Fund Strategies",
        id: "common-strategies",
      },
      {
        type: "list",
        items: [
          "Long/short equity — holding some positions expecting a rise and others expecting a decline.",
          "Global macro — betting on broad economic trends across currencies, rates, and commodities.",
          "Event-driven — trading around specific corporate events like mergers or restructurings.",
          "Quantitative — using algorithmic, data-driven models to identify trading opportunities.",
        ],
      },
      {
        type: "callout",
        content: [
          {
            type: "text",
            content:
              "Hedge funds commonly charge a \"two and twenty\" fee structure — roughly 2% of assets under management annually, plus 20% of profits — though fee structures vary and have faced downward pressure industry-wide in recent years.",
          },
        ],
      },
      {
        type: "heading",
        text: "Risk Considerations",
        id: "risk-considerations",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "The same tools that let hedge funds pursue uncorrelated returns — leverage, derivatives, concentrated bets — can also amplify losses. Hedge funds are also typically far less liquid than mutual funds or ETFs, often requiring investors to commit capital for extended lock-up periods.",
          },
        ],
      },
    ],
  },
  {
    slug: "index-fund",
    seoTitle: "Index Fund",
    author: "Imperialpedia Staff",
    categoryNames: "Markets",
    title: "Index Fund: A Simple, Low-Cost Way to Own the Market",
    seoDescription:
      "An index fund is a mutual fund or ETF designed to track the performance of a specific market index, offering broad diversification and low fees.",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "An index fund is a mutual fund or ETF built to track the performance of a specific market index, such as the S&P 500, by holding the same securities in similar proportions rather than trying to pick individual winners.",
          },
        ],
      },
      {
        type: "heading",
        text: "Passive vs. Active Management",
        id: "passive-vs-active",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Index funds are \"passively managed\" — there's no fund manager selecting individual stocks or trying to time the market. This keeps costs low and has, over long time periods, allowed many index funds to outperform a significant share of actively managed funds in the same category, largely because of the persistent drag of higher fees on active strategies.",
          },
        ],
      },
      {
        type: "heading",
        text: "Why Low Fees Matter So Much",
        id: "why-low-fees-matter",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Because an index fund simply replicates an index rather than paying for active research and trading, its expense ratio is typically a small fraction of an actively managed fund's. That fee difference compounds against an investor's returns every single year, which is why cost has become one of the most emphasized factors in long-term fund selection.",
          },
        ],
      },
      {
        type: "callout",
        content: [
          {
            type: "text",
            content:
              "An index fund cannot outperform its underlying index — its goal is to match it as closely as possible, minus a small fee. Investors seeking to beat the market entirely need a different strategy, with its own additional risks.",
          },
        ],
      },
    ],
  },
  {
    slug: "junk-bond",
    seoTitle: "Junk Bond",
    author: "Imperialpedia Staff",
    categoryNames: "Bonds",
    title: "Junk Bond: High-Yield, Higher-Risk Corporate Debt Explained",
    seoDescription:
      "A junk bond, or high-yield bond, is a bond rated below investment grade, offering higher interest payments to compensate investors for greater default risk.",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "A junk bond — more formally called a high-yield bond — is a bond rated below investment grade by credit rating agencies. Because the issuer is considered more likely to default than an investment-grade issuer, junk bonds pay a higher interest rate to compensate investors for that added risk.",
          },
        ],
      },
      {
        type: "heading",
        text: "How Credit Ratings Determine the Label",
        id: "how-ratings-determine-label",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Credit rating agencies assign letter grades reflecting an issuer's perceived ability to repay its debt. Bonds rated below a certain threshold (commonly BB+ and lower, or the equivalent from a different agency) are classified as high-yield or \"junk,\" while bonds above that threshold are considered investment-grade.",
          },
        ],
      },
      {
        type: "heading",
        text: "Why Investors Buy Them Anyway",
        id: "why-investors-buy-them",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Junk bonds offer meaningfully higher yields than investment-grade bonds of similar maturity, which appeals to income-focused investors willing to accept additional credit risk. Many investors access this asset class through diversified high-yield bond funds rather than individual bonds, spreading default risk across many issuers.",
          },
        ],
      },
      {
        type: "callout",
        content: [
          {
            type: "text",
            content:
              "Junk bond prices tend to be more sensitive to the issuing company's own financial health and to the broader economic cycle than high-quality government bonds, and can behave more like equities during periods of economic stress.",
          },
        ],
      },
    ],
  },
  {
    slug: "kiddie-tax",
    seoTitle: "Kiddie Tax",
    author: "Imperialpedia Staff",
    categoryNames: "PersonalFinance",
    title: "Kiddie Tax: How a Child's Investment Income Gets Taxed",
    seoDescription:
      "The kiddie tax taxes a child's unearned investment income above a certain threshold at the parent's marginal tax rate, to prevent income-shifting for tax avoidance.",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "The \"kiddie tax\" is a rule that taxes a child's unearned income — such as interest, dividends, and capital gains — above a certain threshold at rates associated with trusts and estates, rather than the child's typically lower individual tax rate.",
          },
        ],
      },
      {
        type: "heading",
        text: "Why This Rule Exists",
        id: "why-this-rule-exists",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "The rule was created to prevent parents from shifting investment assets into a child's name purely to have that income taxed at the child's lower tax bracket rather than the parents' typically higher bracket. Without this rule, a family could reduce its overall tax bill simply by retitling investment accounts in a child's name.",
          },
        ],
      },
      {
        type: "heading",
        text: "What Income Is Affected",
        id: "what-income-is-affected",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "The kiddie tax applies to unearned income — investment-type income the child didn't work for — not to a child's earned wages from a job, which are generally taxed at the child's own rate regardless of amount. A specific threshold of unearned income is typically taxed at the child's rate before the kiddie tax rules apply to the excess.",
          },
        ],
      },
      {
        type: "callout",
        content: [
          {
            type: "text",
            content:
              "Families investing on behalf of a child — for example, through a custodial account — should factor the kiddie tax into their planning, since it can meaningfully change the after-tax return on assets held in a child's name once unearned income exceeds the threshold.",
          },
        ],
      },
    ],
  },
  {
    slug: "net-worth",
    seoTitle: "Net Worth",
    author: "Imperialpedia Staff",
    categoryNames: "PersonalFinance",
    title: "Net Worth: How to Calculate Your Real Financial Scorecard",
    seoDescription:
      "Net worth is the value of everything you own minus everything you owe — a single number that tracks overall financial progress better than income alone.",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Net worth is calculated as total assets minus total liabilities — everything you own, minus everything you owe. It's a snapshot of financial position at a single point in time, rather than a measure of income or cash flow.",
          },
        ],
      },
      {
        type: "heading",
        text: "What Counts as an Asset",
        id: "what-counts-as-an-asset",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Assets include cash and savings, investment and retirement accounts, real estate at current market value, vehicles, and other items of significant resale value. Liabilities include mortgages, auto loans, student loans, credit card balances, and any other outstanding debt.",
          },
        ],
      },
      {
        type: "heading",
        text: "Why Net Worth Beats Income as a Scorecard",
        id: "why-net-worth-beats-income",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "A high income doesn't automatically mean strong financial health — someone earning a large salary but carrying heavy debt and minimal savings can have a lower net worth than someone with a modest income who saves consistently. Tracking net worth over time, rather than focusing on income alone, gives a clearer picture of whether financial decisions are actually building wealth.",
          },
        ],
      },
      {
        type: "callout",
        content: [
          {
            type: "text",
            content:
              "Tracking net worth on a regular schedule — quarterly or annually — is more useful than a single calculation, since the trend over time reveals far more about financial progress than any one snapshot.",
          },
        ],
      },
    ],
  },
  {
    slug: "treasury-bond",
    seoTitle: "Treasury Bond",
    author: "Imperialpedia Staff",
    categoryNames: "Bonds",
    title: "Treasury Bond: The Government Debt Behind the Yield Curve",
    seoDescription:
      "A Treasury bond is a long-term debt security issued by the U.S. government, widely considered one of the safest fixed-income investments available.",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "A Treasury bond is a long-term debt security issued by the U.S. government, typically with a maturity of 20 or 30 years, paying a fixed interest rate every six months until maturity, at which point the original face value is repaid.",
          },
        ],
      },
      {
        type: "heading",
        text: "Why They're Considered So Safe",
        id: "why-considered-so-safe",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Treasury bonds are backed by the full faith and credit of the U.S. government, making default risk essentially the lowest available among widely traded securities. This safety is why Treasury yields serve as a benchmark reference point for pricing risk across nearly every other type of bond and loan in the economy.",
          },
        ],
      },
      {
        type: "heading",
        text: "Treasury Bonds vs. Notes vs. Bills",
        id: "bonds-vs-notes-vs-bills",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "The U.S. government issues debt across different maturity ranges under different names: Treasury bills mature in a year or less, Treasury notes mature in 2 to 10 years, and Treasury bonds mature in 20 or 30 years. All three share the same government backing, differing mainly in maturity length and how that affects yield and price sensitivity to interest-rate changes.",
          },
        ],
      },
      {
        type: "callout",
        content: [
          {
            type: "text",
            content:
              "Even \"safe\" Treasury bond prices can decline before maturity if interest rates rise, since the price of an existing bond falls to make its fixed coupon competitive with newly issued, higher-rate bonds. Safety from default risk isn't the same as safety from price fluctuation.",
          },
        ],
      },
    ],
  },
];

// Original, deterministic artwork per glossary term (no stock/placeholder images) —
// generated from each term's own title/category, computed after the literal above
// since object literals can't reference their own sibling properties.
export const terms: Term[] = rawTerms.map((term) => ({
  ...term,
  featuredImageUrl: articleArtDataUri({
    title: term.title,
    category: term.categoryNames,
    seed: term.slug,
  }),
}));
