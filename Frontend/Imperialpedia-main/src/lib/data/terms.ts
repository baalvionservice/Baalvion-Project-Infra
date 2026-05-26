import { ArticleStatus } from "@/modules/content-engine/types";
import { NewsCategory } from "../data.news";

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

export const terms: Term[] = [
  {
    slug: "0x-protocol",
    seoTitle: "0x Protocol",
    featuredImageUrl:
      "https://picsum.photos/750/450",
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
    ],
  },


  {
    slug: "a-b-trust",
    seoTitle: "A-B trust",
    featuredImageUrl:
      "https://picsum.photos/750/450",
    author: "Imperialpedia Staff",
    categoryNames: "PersonalFinance",
    title: "A-B Trust: Definition, How It Works, and Tax Benefits",
    seoDescription:
      "An estate planning tool used by married couples to minimize estate taxes through strategic trust splitting.",
    content: [
      {
        type: "accordion",
        title: "Complete Guide to Estate Planning",
        content: [
          {
            question: "Estate-Planning Basics",
            answer: [
              {
                text: "Estate Definition",
                link: `https://imperialpedia.com/terms/a/a-b-trust.asp`,
              },
              {
                text: "What Is a Will and Why Do I Need One Now?",
                link: `https://imperialpedia.com/terms/a/a-b-trust.asp`,
              },
              {
                text: "16 Things for Estate Planning List",
                link: `https://imperialpedia.com/terms/a/a-b-trust.asp`,
              },
              {
                text: "  Using an LLC for Estate Planning",
                link: `https://imperialpedia.com/terms/a/a-b-trust.asp`,
              },
              {
                text: "4 Reasons Estate Planning Is so Important",
                link: `https://imperialpedia.com/terms/a/a-b-trust.asp`,
              },
            ],
          },
          {
            question: "Estate-Planning Basics",
            answer: [
              {
                text: "Estate Definition",
                link: `https://imperialpedia.com/terms/a/a-b-trust.asp`,
              },
              {
                text: "What Is a Will and Why Do I Need One Now?",
                link: `https://imperialpedia.com/terms/a/a-b-trust.asp`,
              },
              {
                text: "16 Things for Estate Planning List",
                link: `https://imperialpedia.com/terms/a/a-b-trust.asp`,
              },
              {
                text: "  Using an LLC for Estate Planning",
                link: `https://imperialpedia.com/terms/a/a-b-trust.asp`,
              },
              {
                text: "4 Reasons Estate Planning Is so Important",
                link: `https://imperialpedia.com/terms/a/a-b-trust.asp`,
              },
            ],
          },
        ],
      },

      {
        type: "image",
        url: "https://picsum.photos/750/450",
        caption: "Estate planning documents and financial structuring",
        id: "ab-trust-image",
      },

      {
        type: "heading",
        text: "What Is an A-B Trust?",
        id: "heading-1234567",
      },

      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "An A-B trust is a joint trust created by a married couple in order to minimize estate taxes. It is formed with each spouse placing ",
          },
          {
            type: "link",
            content: "assets",
            href: "https://www.investopedia.com",
          },
          {
            type: "text",
            content:
              " in the trust and naming the final beneficiary—that is, anyone except the other spouse. The trust gets its name from the fact that it splits into two separate entities when one spouse dies. Trust A is the survivor's trust and trust B is the decedent's trust. A-B trusts have become less popular because the estate tax exemption covers most estates.",
          },
        ],
      },

      {
        type: "heading",
        text: "Understanding an A-B Trust",
        id: "heading-1234565",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "link",
            content: "Estate taxes",
            href: "https://www.investopedia.com",
          },
          {
            type: "text",
            content:
              " can take a sizable portion of a deceased person's assets. For example, consider a married couple who has an estate worth $20 million by the time one of the spouses dies. The surviving spouse is left with the whole $20 million, which is not taxed due to the ",
          },
          {
            type: "link",
            content: "unlimited marital deduction",
            href: "https://www.investopedia.com",
          },

          {
            type: "text",
            content:
              " for assets flowing from a deceased spouse to a surviving spouse.",
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            content:
              "But then, the other spouse dies, leaving the money to their children. The taxable portion of the estate (the amount that exceeds the 2025 exemption threshold of $13.99 million will be $6.01 million). This means that $6.01 million will be taxed at 40% ($3.61 million), leaving $17.6 million ($13.99 million + $3.61 million) for the beneficiaries.",
          },
        ],
      },

      {
        type: "callout",
        content: [
          {
            type: "text",
            content:
              "The decedent’s trust is not considered part of the surviving spouse's estate for purposes of the estate tax, so ",
          },
          {
            type: "link",
            content: "double taxation",
            href: "https://www.investopedia.com",
          },
          {
            type: "text",
            content: " is avoided.",
          },
        ],
      },

      {
        type: "expandable",

        content: [
          {
            type: "text",
            content:
              "Imperialpedia requires writers to use primary sources to support their work. These include white papers, government data, original reporting, and interviews with industry experts. We also reference original research from other reputable publishers where appropriate. You can learn more about the standards we follow in producing accurate, unbiased content in our ",
          },
          {
            type: "link",
            content: " editorial policy.",

            href: "https://youtube.com",
          },
          {
            type: "list",
            content: [
              {
                type: "text",
                content: "Internal Revenue Service.",
              },
              {
                type: "link",
                content: "Estate Tax.",
                href: "https://www.investopedia.com",
              },
            ],
          },
          {
            type: "list",
            content: [
              {
                type: "text",
                content: "Internal Revenue Service.",
              },
              {
                type: "link",
                content: '"Frequently Asked Questions on Estate Taxes."',
                href: "https://www.investopedia.com",
              },
            ],
          },
        ],
      },

      {
        type: "accordion",
        title: "Complete Guide to Estate Planning",
        content: [
          {
            question: "Estate-Planning Basics",
            answer: [
              {
                text: "Estate Definition",
                link: `https://imperialpedia.com/terms/a/a-b-trust.asp`,
              },
              {
                text: "What Is a Will and Why Do I Need One Now?",
                link: `https://imperialpedia.com/terms/a/a-b-trust.asp`,
              },
              {
                text: "16 Things for Estate Planning List",
                link: `https://imperialpedia.com/terms/a/a-b-trust.asp`,
              },
              {
                text: "  Using an LLC for Estate Planning",
                link: `https://imperialpedia.com/terms/a/a-b-trust.asp`,
              },
              {
                text: "4 Reasons Estate Planning Is so Important",
                link: `https://imperialpedia.com/terms/a/a-b-trust.asp`,
              },
            ],
          },
          {
            question: "Estate-Planning Basics",
            answer: [
              {
                text: "Estate Definition",
                link: `https://imperialpedia.com/terms/a/a-b-trust.asp`,
              },
              {
                text: "What Is a Will and Why Do I Need One Now?",
                link: `https://imperialpedia.com/terms/a/a-b-trust.asp`,
              },
              {
                text: "16 Things for Estate Planning List",
                link: `https://imperialpedia.com/terms/a/a-b-trust.asp`,
              },
              {
                text: "  Using an LLC for Estate Planning",
                link: `https://imperialpedia.com/terms/a/a-b-trust.asp`,
              },
              {
                text: "4 Reasons Estate Planning Is so Important",
                link: `https://imperialpedia.com/terms/a/a-b-trust.asp`,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "estate-tax",
    seoTitle: "Estate Tax",
    featuredImageUrl:
      "https://picsum.photos/750/450",
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
    ],
  },
  {
    slug: "revocable-trust",
    seoTitle: "Revocable Trust",
    title: "Revocable Trust: Flexibility in Estate Planning",
    featuredImageUrl:
      "https://picsum.photos/750/450",
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
    ],
  },
  {
    slug: "marital-deduction",
    seoTitle: "Marital Deduction",
    featuredImageUrl:
      "https://picsum.photos/750/450",
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
    ],
  },
  {
    slug: "compound-interest",
    seoTitle: "Compound Interest",
    featuredImageUrl:
      "https://picsum.photos/750/450",
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
    ],
  },
  {
    slug: "diversification",
    seoTitle: "Diversification",
    featuredImageUrl:
      "https://picsum.photos/750/450",
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
    ],
  },
];
