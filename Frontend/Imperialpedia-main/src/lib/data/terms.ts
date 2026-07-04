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
    slug: "revocable-trust",
    seoTitle: "Revocable Trust",
    title: "Revocable Trust: Flexibility in Estate Planning",
    author: "Imperialpedia Staff",
    categoryNames: "Economy",
    seoDescription:
      "A trust that can be modified or terminated during the grantor's lifetime, offering estate planning benefits while maintaining control.",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "A revocable trust, also known as a living trust, is an estate planning tool that allows the grantor to maintain control over assets while providing benefits for estate administration and privacy.",
          },
        ],
      },
      {
        type: "heading",
        text: "Benefits of Revocable Trusts",
        id: "benefits-revocable-trusts",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Revocable trusts help avoid probate, provide privacy for estate matters, and allow for seamless management of assets during incapacity. Unlike irrevocable trusts, they can be modified during the grantor's lifetime.",
          },
        ],
      },
      {
        type: "heading",
        text: "How Probate Avoidance Actually Works",
        id: "probate-avoidance",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Probate is the court-supervised process of validating a will and distributing an estate, which can be time-consuming, costly, and entirely a matter of public record. Assets titled in the name of a revocable trust, rather than in the individual's own name, bypass this process because the trust — not the deceased person — is the legal owner, and the trust's terms (not a probate court) dictate how those assets are distributed.",
          },
        ],
      },
      {
        type: "heading",
        text: "Revocable vs. Irrevocable Trusts",
        id: "revocable-vs-irrevocable",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "The defining feature of a revocable trust is flexibility: the person who creates it (the grantor) can amend its terms, add or remove assets, or dissolve it entirely at any time while they're alive and mentally competent. An irrevocable trust, by contrast, generally cannot be changed once established. That rigidity is precisely what gives irrevocable trusts stronger asset-protection and estate-tax benefits — assets are genuinely removed from the grantor's control and estate — benefits a revocable trust does not provide, since the grantor's continued control means the assets are still considered part of their estate for tax purposes.",
          },
        ],
      },
      {
        type: "callout",
        content: [
          {
            type: "text",
            content:
              "A revocable trust does not, by itself, reduce estate taxes or protect assets from creditors — its primary benefits are avoiding probate, maintaining privacy, and providing a clear plan if the grantor becomes incapacitated.",
          },
        ],
      },
      {
        type: "heading",
        text: "Setting One Up",
        id: "setting-one-up",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Creating a revocable trust generally involves drafting a trust document naming a trustee (often the grantor themselves while they're alive, with a successor named to take over later) and beneficiaries, then formally retitling assets — bank accounts, real estate, investment accounts — into the trust's name. A trust that is never funded with actual assets provides none of its intended benefits, which is why properly retitling assets is one of the most commonly overlooked steps.",
          },
        ],
      },
    ],
  },
  {
    slug: "marital-deduction",
    seoTitle: "Marital Deduction",
    author: "Imperialpedia Staff",
    categoryNames: "Economy",
    title: "Marital Deduction: Unlimited Tax-Free Transfers Between Spouses",
    seoDescription:
      "A tax provision allowing unlimited transfers of assets between spouses without incurring gift or estate taxes.",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "The unlimited marital deduction allows spouses to transfer unlimited amounts of property to each other during life or at death without incurring federal gift or estate taxes, provided both spouses are U.S. citizens.",
          },
        ],
      },
      {
        type: "heading",
        text: "Strategic Considerations",
        id: "strategic-considerations",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "While the marital deduction provides immediate tax benefits, it may result in a larger taxable estate when the surviving spouse dies. Advanced planning strategies like A-B trusts can help optimize the use of both spouses' exemptions.",
          },
        ],
      },
      {
        type: "heading",
        text: "Why It's Called \"Unlimited\"",
        id: "why-unlimited",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Most gifts and inheritances above certain thresholds can trigger gift or estate tax, but transfers between spouses are a specific, deliberate exception — there is no dollar limit on how much one spouse can leave or give to the other tax-free. The policy rationale is that a married couple is typically treated, for this purpose, as a single economic unit, so a transfer between spouses isn't treated as removing wealth from the family the way a transfer to a child or other heir would be.",
          },
        ],
      },
      {
        type: "heading",
        text: "The Deferral, Not Elimination, Effect",
        id: "deferral-not-elimination",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "It's important to understand that the marital deduction generally defers estate tax rather than eliminating it. Assets that pass to a surviving spouse tax-free become part of that spouse's own estate, and will potentially be subject to estate tax when the surviving spouse later dies and leaves assets to the next generation — unless further planning (such as portability elections or bypass trusts) is used to manage that eventual transfer.",
          },
        ],
      },
      {
        type: "callout",
        content: [
          {
            type: "text",
            content:
              "The unlimited marital deduction generally only applies when both spouses are U.S. citizens. Special, more limited rules apply when the recipient spouse is not a U.S. citizen, often requiring a specific type of trust to claim any marital deduction at all.",
          },
        ],
      },
    ],
  },
  {
    slug: "compound-interest",
    seoTitle: "Compound Interest",
    author: "Imperialpedia Staff",
    categoryNames: "PersonalFinance",
    title: "Compound Interest: The Power of Exponential Growth",
    seoDescription:
      "Interest calculated on both the initial principal and accumulated interest, creating exponential growth over time.",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Compound interest is the addition of interest to the principal sum of a loan or deposit, where interest earned also earns interest. This creates exponential growth and is fundamental to long-term wealth building.",
          },
        ],
      },
      {
        type: "heading",
        text: "The Rule of 72",
        id: "rule-of-72",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "The Rule of 72 is a quick way to estimate how long it takes for an investment to double. Simply divide 72 by the annual interest rate to get the approximate number of years for doubling.",
          },
        ],
      },
      {
        type: "heading",
        text: "Simple vs. Compound Interest",
        id: "simple-vs-compound",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Simple interest is calculated only on the original principal, so it grows in a straight line — a $10,000 deposit at 5% simple interest earns exactly $500 every year. Compound interest is calculated on the principal plus all interest already earned, so the base it's calculated on grows every period, producing a curve that accelerates over time rather than a straight line.",
          },
        ],
      },
      {
        type: "heading",
        text: "Compounding Frequency",
        id: "compounding-frequency",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "The same annual interest rate can produce slightly different results depending on how often it compounds — annually, quarterly, monthly, or daily. More frequent compounding means interest starts earning its own interest sooner, producing marginally faster growth at the same headline rate. This is why the \"effective annual rate\" (which accounts for compounding frequency) can be a more accurate comparison tool than the stated annual rate alone.",
          },
        ],
      },
      {
        type: "callout",
        content: [
          {
            type: "text",
            content:
              "Compounding works in both directions — the same mechanism that grows savings also grows unpaid debt, which is why carrying a balance on a high-interest credit card can become expensive so quickly.",
          },
        ],
      },
    ],
  },
  {
    slug: "diversification",
    seoTitle: "Diversification",
    author: "Imperialpedia Staff",
    categoryNames: "Markets",
    title: "Diversification: Risk Management Through Asset Allocation",
    seoDescription:
      "An investment strategy that spreads risk across different assets, sectors, and geographic regions to reduce portfolio volatility.",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Diversification is a risk management strategy that mixes a wide variety of investments within a portfolio to limit exposure to any single asset or risk. The rationale is that a diversified portfolio will yield higher returns and pose lower risk.",
          },
        ],
      },
      {
        type: "heading",
        text: "Types of Diversification",
        id: "types-diversification",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Effective diversification includes asset class diversification (stocks, bonds, real estate), geographic diversification (domestic and international), and sector diversification (technology, healthcare, finance).",
          },
        ],
      },
      {
        type: "heading",
        text: "What Diversification Can and Can't Do",
        id: "what-it-can-and-cant-do",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Diversification primarily reduces unsystematic risk — the risk specific to a single company, sector, or asset, such as a product recall or a management scandal. Spreading investments across many holdings means one company's bad news doesn't sink the whole portfolio. It does much less to reduce systematic (market-wide) risk — the risk that affects nearly all assets at once, such as a broad recession or a market-wide downturn, since even a well-diversified portfolio can decline when the overall market falls.",
          },
        ],
      },
      {
        type: "heading",
        text: "Correlation Is the Key Concept",
        id: "correlation-key-concept",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Diversification only works as intended when the assets held don't move in lockstep with each other. Owning ten different technology stocks, for example, provides far less real diversification than owning a mix of technology, healthcare, utilities, and bonds, because assets in the same sector tend to react similarly to the same news and economic conditions. The goal is combining assets whose prices are not highly correlated, so that a decline in one is more likely to be offset by stability or gains in another.",
          },
        ],
      },
      {
        type: "callout",
        content: [
          {
            type: "text",
            content:
              "A simple, low-cost way many investors achieve broad diversification is through index funds or ETFs, which hold hundreds or thousands of securities in a single investment rather than requiring an investor to purchase many individual holdings themselves.",
          },
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
    slug: "fiduciary",
    seoTitle: "Fiduciary",
    author: "Imperialpedia Staff",
    categoryNames: "PersonalFinance",
    title: "Fiduciary: What the Legal Duty Actually Means for Investors",
    seoDescription:
      "A fiduciary is legally required to act in a client's best interest, a stricter standard than the suitability standard some financial professionals follow.",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "A fiduciary is a person or firm legally and ethically obligated to act in the best interest of their client, putting the client's interests ahead of their own. In financial services, this duty is a meaningful distinction — not every financial professional is legally held to it.",
          },
        ],
      },
      {
        type: "heading",
        text: "Fiduciary Standard vs. Suitability Standard",
        id: "fiduciary-vs-suitability",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Some financial professionals are only held to a \"suitability\" standard, meaning a recommendation just has to be reasonably suitable for the client — it doesn't have to be the lowest-cost or objectively best option available. A fiduciary standard is stricter: the recommendation must genuinely be in the client's best interest, which can rule out higher-fee products when a comparable lower-cost option exists.",
          },
        ],
      },
      {
        type: "heading",
        text: "Who Is (and Isn't) Typically a Fiduciary",
        id: "who-is-a-fiduciary",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Registered Investment Advisers (RIAs) are generally held to a fiduciary standard. Many, though not all, financial professionals working on commission at brokerage firms have historically operated under a suitability standard instead, though regulations in this area have evolved over time and vary by the specific type of account and service being offered.",
          },
        ],
      },
      {
        type: "callout",
        content: [
          {
            type: "text",
            content:
              "It's reasonable, and increasingly common, for a prospective client to directly ask a financial professional whether they are acting as a fiduciary for the specific account or service in question — the answer can differ by product even within the same firm.",
          },
        ],
      },
      {
        type: "heading",
        text: "Why the Distinction Matters",
        id: "why-it-matters",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Fees and product selection can differ meaningfully between a fiduciary and a non-fiduciary relationship over time, since a fiduciary duty removes some of the incentive to recommend higher-commission products when a lower-cost alternative would serve the client just as well or better.",
          },
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
    slug: "liquidity",
    seoTitle: "Liquidity",
    author: "Imperialpedia Staff",
    categoryNames: "Markets",
    title: "Liquidity: Why It Matters Beyond Just Having Cash",
    seoDescription:
      "Liquidity describes how quickly and cheaply an asset can be converted to cash without significantly affecting its price — a key factor in both investing and personal finance.",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Liquidity describes how quickly and cheaply an asset can be converted into cash without significantly affecting its price. Cash itself is the most liquid asset by definition; real estate and stakes in private companies are examples of comparatively illiquid assets.",
          },
        ],
      },
      {
        type: "heading",
        text: "Market Liquidity vs. Personal Liquidity",
        id: "market-vs-personal-liquidity",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Market liquidity describes how easily an asset trades in general — a heavily traded large-cap stock is highly liquid, while shares of a small, thinly traded company are less so. Personal liquidity, in a household finance context, refers to how much of an individual's own money is readily accessible — for example, in a checking or savings account — versus tied up in illiquid assets like a retirement account or home equity.",
          },
        ],
      },
      {
        type: "heading",
        text: "Why Liquidity Matters",
        id: "why-liquidity-matters",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "For markets, low liquidity typically means wider bid-ask spreads and more volatile prices, since even modest buy or sell orders can move the price meaningfully. For individuals, insufficient liquidity — too much wealth tied up in illiquid assets — can create real problems if cash is needed quickly for an emergency, which is a core reason financial planners emphasize maintaining a liquid emergency fund separate from long-term investments.",
          },
        ],
      },
      {
        type: "callout",
        content: [
          {
            type: "text",
            content:
              "A \"liquidity crunch\" in markets refers to a period when even normally liquid assets become hard to sell without accepting a significantly lower price, often during periods of broad financial stress.",
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
    slug: "opportunity-cost",
    seoTitle: "Opportunity Cost",
    author: "Imperialpedia Staff",
    categoryNames: "PersonalFinance",
    title: "Opportunity Cost: The Hidden Price of Every Financial Choice",
    seoDescription:
      "Opportunity cost is the value of the next-best alternative you give up when making a choice, a core concept for evaluating any financial or investment decision.",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Opportunity cost is the value of the next-best alternative you give up when you make a choice. Every financial decision — spending, saving, or investing a given dollar in one way — has an opportunity cost equal to what that same dollar could have achieved if used differently.",
          },
        ],
      },
      {
        type: "heading",
        text: "A Simple Example",
        id: "a-simple-example",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Choosing to keep a large cash balance in a low-interest checking account has an opportunity cost equal to the return that money could have earned in a higher-yield savings account or in the market. The cost isn't a cash outflow — it's the foregone gain from the path not taken.",
          },
        ],
      },
      {
        type: "heading",
        text: "Applying It to Real Decisions",
        id: "applying-it-to-decisions",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Opportunity cost is a useful lens for comparing paying off low-interest debt early versus investing extra cash, choosing between two job offers with different compensation and growth trajectories, or deciding between a large upfront purchase and investing that same amount instead. In each case, the right choice is the one whose expected benefit outweighs what's given up.",
          },
        ],
      },
      {
        type: "callout",
        content: [
          {
            type: "text",
            content:
              "Opportunity cost applies to time as well as money — time spent on one activity is time that can't be spent on another, which is why the concept shows up in career and lifestyle decisions, not just investment choices.",
          },
        ],
      },
    ],
  },
  {
    slug: "price-to-earnings-ratio",
    seoTitle: "Price-to-Earnings (P/E) Ratio",
    author: "Imperialpedia Staff",
    categoryNames: "Stocks",
    title: "Price-to-Earnings (P/E) Ratio: A Core Valuation Metric Explained",
    seoDescription:
      "The P/E ratio compares a company's share price to its earnings per share, a widely used starting point for judging whether a stock looks expensive or cheap.",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "The price-to-earnings (P/E) ratio compares a company's current share price to its earnings per share (EPS), giving investors a quick sense of how much they're paying for each dollar of the company's profit.",
          },
        ],
      },
      {
        type: "heading",
        text: "How to Interpret the Number",
        id: "how-to-interpret",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "A P/E of 20 means investors are paying $20 for every $1 of the company's annual earnings. A higher P/E can reflect strong expected future growth, or it can mean a stock is simply expensive relative to its current profits; a lower P/E can signal an undervalued stock, or it can reflect real concerns about the company's future prospects.",
          },
        ],
      },
      {
        type: "heading",
        text: "Why Comparisons Should Stay Within an Industry",
        id: "why-compare-within-industry",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Average P/E ratios vary significantly by industry — fast-growing technology companies have historically traded at higher average P/E ratios than mature utility companies, for example, reflecting different growth expectations baked into each sector. Comparing a company's P/E to close industry peers, rather than to the market as a whole, is a more meaningful exercise.",
          },
        ],
      },
      {
        type: "callout",
        content: [
          {
            type: "text",
            content:
              "The P/E ratio uses past or currently reported earnings by default (a \"trailing\" P/E), though a \"forward\" P/E based on projected future earnings is also commonly cited and can tell a different story than the trailing figure.",
          },
        ],
      },
    ],
  },
  {
    slug: "quantitative-easing",
    seoTitle: "Quantitative Easing",
    author: "Imperialpedia Staff",
    categoryNames: "Economy",
    title: "Quantitative Easing: How Central Banks Stimulate the Economy",
    seoDescription:
      "Quantitative easing is a monetary policy tool where a central bank purchases large quantities of securities to inject liquidity and lower long-term interest rates.",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Quantitative easing (QE) is a monetary policy tool in which a central bank purchases large quantities of government bonds or other securities, injecting liquidity into the financial system and putting downward pressure on long-term interest rates.",
          },
        ],
      },
      {
        type: "heading",
        text: "When Central Banks Turn to QE",
        id: "when-banks-turn-to-qe",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "QE is typically used when a central bank's standard interest-rate tool has limited room left to work — for example, when short-term rates are already near zero — but the economy still needs additional monetary stimulus. By buying large volumes of longer-term bonds, a central bank can push down longer-term borrowing costs even when it can't cut short-term rates any further.",
          },
        ],
      },
      {
        type: "heading",
        text: "How It's Meant to Work",
        id: "how-its-meant-to-work",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "By buying bonds, a central bank increases their price and lowers their yield, and adds newly created reserves to the banking system. The intended effect is cheaper borrowing across the economy — for mortgages, corporate debt, and other loans — encouraging spending and investment during a period of economic weakness.",
          },
        ],
      },
      {
        type: "callout",
        content: [
          {
            type: "text",
            content:
              "The reverse process, in which a central bank reduces its bond holdings or lets them mature without reinvesting, is often called quantitative tightening, and tends to push in the opposite direction on interest rates and liquidity.",
          },
        ],
      },
    ],
  },
  {
    slug: "simple-interest",
    seoTitle: "Simple Interest",
    author: "Imperialpedia Staff",
    categoryNames: "PersonalFinance",
    title: "Simple Interest: How It Works and How It Differs From Compounding",
    seoDescription:
      "Simple interest is calculated only on the original principal amount, producing steady, linear growth rather than the accelerating curve of compound interest.",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Simple interest is calculated only on the original principal amount of a loan or deposit, without factoring in any interest that has already accumulated. This produces steady, linear growth over time, in contrast to the accelerating growth curve of compound interest.",
          },
        ],
      },
      {
        type: "heading",
        text: "The Formula",
        id: "the-formula",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Simple interest is calculated as: principal × interest rate × time. A $10,000 deposit at a 5% simple annual interest rate earns exactly $500 every year, regardless of how many years have passed, because each year's interest is calculated only on the original $10,000.",
          },
        ],
      },
      {
        type: "heading",
        text: "Where Simple Interest Is Actually Used",
        id: "where-its-used",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Simple interest is less common for long-term savings and investment products, where compounding is the norm, but it does appear in some short-term consumer loans and certain bond structures, where the more straightforward, predictable calculation suits the product.",
          },
        ],
      },
      {
        type: "callout",
        content: [
          {
            type: "text",
            content:
              "Over short time periods, the difference between simple and compound interest is often small; over long time periods, compounding pulls meaningfully ahead, which is why the distinction matters most for long-term savings and debt.",
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
  {
    slug: "underwriting",
    seoTitle: "Underwriting",
    author: "Imperialpedia Staff",
    categoryNames: "PersonalFinance",
    title: "Underwriting: The Risk-Assessment Process Behind Loans and Insurance",
    seoDescription:
      "Underwriting is the process a lender or insurer uses to evaluate risk before approving a loan, mortgage, insurance policy, or securities offering.",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Underwriting is the process a financial institution uses to evaluate and price risk before approving a loan, mortgage, insurance policy, or new securities offering. An underwriter assesses the likelihood of a favorable or unfavorable outcome and decides on what terms, if any, to proceed.",
          },
        ],
      },
      {
        type: "heading",
        text: "Underwriting in Lending",
        id: "underwriting-in-lending",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "For a mortgage or other loan, underwriting typically reviews income, credit history, existing debt, and the value of any collateral, to judge how likely the borrower is to repay and what interest rate appropriately compensates the lender for the assessed risk.",
          },
        ],
      },
      {
        type: "heading",
        text: "Underwriting in Insurance",
        id: "underwriting-in-insurance",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "For insurance, underwriting evaluates the likelihood and potential cost of a future claim — based on factors like health, age, driving history, or property characteristics — to determine whether to offer coverage and at what premium.",
          },
        ],
      },
      {
        type: "callout",
        content: [
          {
            type: "text",
            content:
              "In securities markets, underwriting also refers to the process investment banks use to price and distribute a new stock or bond offering, taking on the risk of selling the securities to investors.",
          },
        ],
      },
    ],
  },
  {
    slug: "volatility",
    seoTitle: "Volatility",
    author: "Imperialpedia Staff",
    categoryNames: "Markets",
    title: "Volatility: What It Measures and Why It Isn't the Same as Risk",
    seoDescription:
      "Volatility measures how much and how quickly an asset's price fluctuates, a widely used proxy for risk that captures uncertainty but not necessarily the direction of loss.",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Volatility measures how much, and how quickly, an asset's price fluctuates over a given period. A highly volatile asset can swing sharply in either direction; a low-volatility asset tends to move in smaller, steadier increments.",
          },
        ],
      },
      {
        type: "heading",
        text: "Volatility Isn't Purely Bad — or Purely Risk",
        id: "not-purely-bad",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Volatility is commonly used as a proxy for risk, but it technically measures the size of price swings in both directions, not just the potential for loss. A stock that has risen sharply and unevenly still registers as \"volatile\" even though those swings benefited a holder — which is a nuance often lost when volatility and risk are used interchangeably.",
          },
        ],
      },
      {
        type: "heading",
        text: "What Drives Volatility",
        id: "what-drives-volatility",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Volatility tends to rise around earnings announcements, economic data releases, geopolitical events, and periods of general market uncertainty, and tends to fall during calmer, more predictable stretches. Smaller, less-established companies and certain sectors, like early-stage technology or biotech, have historically shown higher average volatility than large, established, diversified businesses.",
          },
        ],
      },
      {
        type: "callout",
        content: [
          {
            type: "text",
            content:
              "The VIX index, often called the \"fear gauge,\" estimates the market's expectation of near-term volatility in the S&P 500 based on options pricing, and is widely watched as a barometer of overall investor anxiety.",
          },
        ],
      },
    ],
  },
  {
    slug: "wealth-management",
    seoTitle: "Wealth Management",
    author: "Imperialpedia Staff",
    categoryNames: "PersonalFinance",
    title: "Wealth Management: What the Service Actually Includes",
    seoDescription:
      "Wealth management is a comprehensive financial advisory service combining investment management, tax planning, estate planning, and other services, typically for higher-net-worth clients.",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Wealth management is a comprehensive financial advisory service that combines investment management with broader planning — tax strategy, estate planning, retirement planning, and sometimes insurance and philanthropic planning — typically offered to clients with significant investable assets.",
          },
        ],
      },
      {
        type: "heading",
        text: "How It Differs From Basic Investment Management",
        id: "how-it-differs",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Basic investment management focuses primarily on selecting and managing a portfolio. Wealth management typically wraps that service inside a broader relationship addressing the client's full financial picture — coordinating with accountants and estate attorneys, planning around major liquidity events, and managing tax implications across accounts, not just picking investments.",
          },
        ],
      },
      {
        type: "heading",
        text: "Typical Fee Structures",
        id: "typical-fee-structures",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Wealth management services are commonly billed as a percentage of assets under management, though flat-fee and hourly arrangements also exist. Given the broader scope of services relative to basic portfolio management, understanding exactly what's included in a given fee — and confirming whether the advisor operates under a fiduciary standard — is an important part of evaluating any wealth management relationship.",
          },
        ],
      },
      {
        type: "callout",
        content: [
          {
            type: "text",
            content:
              "Wealth management typically becomes more relevant as financial complexity grows — multiple account types, business ownership, concentrated stock positions, or significant estate-planning needs — rather than being defined by a single fixed asset threshold across every firm.",
          },
        ],
      },
    ],
  },
  {
    slug: "xbrl-reporting",
    seoTitle: "XBRL",
    author: "Imperialpedia Staff",
    categoryNames: "Markets",
    title: "XBRL: The Standard Behind Machine-Readable Financial Filings",
    seoDescription:
      "XBRL (eXtensible Business Reporting Language) is a standardized data format that regulators require for financial filings, making company financial data machine-readable and comparable.",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "XBRL (eXtensible Business Reporting Language) is a standardized, machine-readable data format used for financial reporting. Regulators in many jurisdictions, including the U.S. Securities and Exchange Commission, require public companies to file financial statements in XBRL format alongside traditional filings.",
          },
        ],
      },
      {
        type: "heading",
        text: "Why It Was Created",
        id: "why-it-was-created",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Before XBRL, financial filings existed mainly as documents meant for human reading, making it labor-intensive to extract and compare specific data points — like revenue or net income — across many companies at scale. XBRL tags each individual financial figure with a standardized label, allowing software to automatically extract, compare, and analyze data across thousands of filings.",
          },
        ],
      },
      {
        type: "heading",
        text: "Who Actually Uses XBRL Data",
        id: "who-uses-it",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Regulators use XBRL data for oversight and analysis at scale, financial data providers use it to power screening and analytics tools, and researchers use it for large-scale academic and industry studies. Most individual investors never interact with raw XBRL data directly — they benefit from it indirectly, through the financial data platforms and stock screeners built on top of it.",
          },
        ],
      },
      {
        type: "callout",
        content: [
          {
            type: "text",
            content:
              "XBRL is a data format, not an accounting standard itself — it's used to tag and transmit figures that are still prepared according to standard accounting rules like GAAP or IFRS.",
          },
        ],
      },
    ],
  },
  {
    slug: "yield-curve",
    seoTitle: "Yield Curve",
    author: "Imperialpedia Staff",
    categoryNames: "Bonds",
    title: "Yield Curve: What Its Shape Signals About the Economy",
    seoDescription:
      "The yield curve plots interest rates across bond maturities of equal credit quality. Its shape, especially an inversion, is closely watched as an economic signal.",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "The yield curve plots interest rates for bonds of equal credit quality — most commonly U.S. Treasuries — across a range of maturities, from short-term to long-term. Its shape at any given moment offers a snapshot of what bond investors expect about future interest rates and economic conditions.",
          },
        ],
      },
      {
        type: "heading",
        text: "The Normal, Upward-Sloping Shape",
        id: "normal-shape",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Under typical conditions, longer maturities pay higher yields than shorter ones, since lenders generally demand extra compensation for the added uncertainty of tying up money for longer. This produces the normal upward-sloping curve most textbooks describe.",
          },
        ],
      },
      {
        type: "heading",
        text: "Inversions and What They Signal",
        id: "inversions-and-signals",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "An inverted yield curve — where short-term yields exceed long-term yields — has historically preceded most U.S. recessions, often by many months. It's generally read as a sign that bond investors expect the central bank to eventually cut rates in response to weakening economic conditions.",
          },
        ],
      },
      {
        type: "callout",
        content: [
          {
            type: "text",
            content:
              "An inversion is a probability signal, not a guarantee — the time lag between an inversion and any eventual downturn has varied significantly across past economic cycles.",
          },
        ],
      },
    ],
  },
  {
    slug: "zero-coupon-bond",
    seoTitle: "Zero-Coupon Bond",
    author: "Imperialpedia Staff",
    categoryNames: "Bonds",
    title: "Zero-Coupon Bond: How a Bond With No Interest Payments Works",
    seoDescription:
      "A zero-coupon bond pays no periodic interest, instead sold at a discount to its face value and redeemed at full value at maturity, with the discount representing the investor's return.",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "A zero-coupon bond pays no periodic interest at all. Instead, it's sold at a discount to its face value and redeemed at full face value at maturity — the difference between the discounted purchase price and the face value is the investor's entire return.",
          },
        ],
      },
      {
        type: "heading",
        text: "A Simple Example",
        id: "a-simple-example",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "A zero-coupon bond with a $1,000 face value maturing in 10 years might be purchased today for roughly $650, depending on prevailing interest rates. The investor receives no interest payments along the way, but collects the full $1,000 at maturity — the $350 difference represents the return, effectively compounded over the bond's life.",
          },
        ],
      },
      {
        type: "heading",
        text: "Why Investors Use Them",
        id: "why-investors-use-them",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "Zero-coupon bonds are useful for matching a known future expense with a known future payout — for example, planning for a specific future date like a child's college enrollment — since the maturity value is fixed and known in advance, with no reinvestment-rate uncertainty from periodic coupon payments.",
          },
        ],
      },
      {
        type: "callout",
        content: [
          {
            type: "text",
            content:
              "Zero-coupon bonds can trigger a tax obligation on \"imputed\" interest each year even though no cash payment is actually received until maturity, an important planning consideration in taxable accounts.",
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
