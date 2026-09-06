// NOTE: no /admin/* links here. middleware.ts redirects every /admin request to the central CMS
// console, so an investor clicking one leaves the site — and lands nowhere at all when that
// console is not deployed. Staff reach those surfaces from the console itself, not from here.
export type NavItem = {
  label: string;
  href?: string;
  children?: NavItem[];
  isHeader?: boolean;
};

export const publicNav: NavItem[] = [
  {
    label: "Home",
    href: "/",
    children: [
      { label: "Why Invest", href: "/why-invest" },
      { label: "Investment Thesis", href: "/investment-thesis" },
      { label: "Governance Framework", href: "/governance/framework" },
      { label: "Governance Overview", href: "/governance/overview" },
      { label: "News & Events", href: "/news-and-events/news" },
    ],
  },
  {
    label: "About Us",
    children: [
      { label: "Our Story", href: "/company/story" },
      { label: "Leadership Team", href: "/governance/leadership" },
      { label: "Board of Directors", href: "/governance/board-of-directors" },
      { label: "Committee Composition", href: "/governance/committee-composition" },
      { label: "Market Opportunity", href: "/market-opportunity" },
    ],
  },
  {
    label: "Investments",
    href: "/invest",
    children: [
      { label: "For Investors", isHeader: true },
      { label: "Browse Opportunities", href: "/invest" },
      { label: "Strategic Operator", href: "/strategic-operator" },
      { label: "---" as any },
      { label: "For Founders", isHeader: true },
      { label: "List Your Business", href: "/invest/list-your-business" },
      { label: "My Business", href: "/invest/my-business" },
      { label: "---" as any },
      { label: "Investment Thesis", href: "/investment-thesis" },
      { label: "Use of Proceeds", href: "/use-of-proceeds" },
    ],
  },
  {
    label: "News & Events",
    href: "/news-and-events/news",
    children: [
      { label: "News", href: "/news-and-events/news" },
      { label: "Press Releases", href: "/news-and-events/press-releases" },
      { label: "Events & Presentations", href: "/news-and-events/events" },
      { label: "Investor Day", href: "/news-and-events/investor-day" },
      { label: "Webcast", href: "/news-and-events/webcast" },
    ],
  },
  {
    label: "Governance",
    children: [
      { label: "Governance Overview", href: "/governance/overview" },
      { label: "Leadership", href: "/governance/leadership" },
      { label: "Board of Directors", href: "/governance/board-of-directors" },
      {
        label: "Committee Composition",
        href: "/governance/committee-composition",
      },
      { label: "---" as any },
      { label: "Governance Framework", href: "/governance/framework" },
      { label: "Regulatory Filings", href: "/news-and-events/filings" },
      { label: "Financial Reports", href: "/news-and-events/financial-reports" },
    ],
  },
  {
    label: "Resources",
    children: [
      { label: "Investor Email Alerts", href: "/resources/email-alerts" },
      { label: "Contact IR", href: "/resources/contact-ir" },
    ],
  },
];

export const loggedInNav: NavItem[] = [
  {
    label: "Invest",
    href: "/invest",
    children: [
      { label: "Browse Opportunities", href: "/invest" },
      { label: "My Deal Pipeline", href: "/invest/deals" },
      { label: "---" as any },
      { label: "For Founders", isHeader: true },
      { label: "List Your Business", href: "/invest/list-your-business" },
      { label: "My Business", href: "/invest/my-business" },
    ],
  },
  {
    label: "Dashboards",
    children: [
      { label: "P1: Investor Dashboard", href: "/dashboard" },
      { label: "Capital Operations", href: "/capital-ops" },
      { label: "Review Queue", href: "/review" },
      { label: "P2: SPV Dashboard", href: "/phase2/dashboard" },
      { label: "P3: Operator Dashboard", href: "/phase3/dashboard" },
    ],
  },
  {
    label: "Data Rooms",
    children: [
      { label: "SPV Data Room", href: "/phase2/data-room" },
      { label: "Documents", href: "/news-and-events/documents" },
    ],
  },
  {
    label: "Governance",
    children: [
      { label: "Governance Overview", href: "/governance/overview" },
      { label: "Leadership", href: "/governance/leadership" },
      { label: "Board of Directors", href: "/governance/board-of-directors" },
      {
        label: "Committee Composition",
        href: "/governance/committee-composition",
      },
      { label: "---" as any },
      { label: "My Voting", href: "/governance/my-voting" },
      { label: "Governance Framework", href: "/governance/framework" },
      { label: "Regulatory Filings", href: "/news-and-events/filings" },
    ],
  },
  {
    label: "Company",
    children: [
      { label: "News", href: "/news-and-events/news" },
      { label: "Press Releases", href: "/news-and-events/press-releases" },
      { label: "Events & Presentations", href: "/news-and-events/events" },
      { label: "Investor Day", href: "/news-and-events/investor-day" },
      { label: "Webcast", href: "/news-and-events/webcast" },
    ],
  },
  {
    label: "Resources",
    children: [
      { label: "Investor Email Alerts", href: "/resources/email-alerts" },
      { label: "Contact IR", href: "/resources/contact-ir" },
    ],
  },
];
