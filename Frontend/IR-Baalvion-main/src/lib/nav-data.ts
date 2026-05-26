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
      { label: "Overview", href: "#overview" },
      { label: "Investment Thesis", href: "#thesis" },
      { label: "Governance Principles", href: "#governance" },
      { label: "ESG & Risk Management", href: "#risk" },
      { label: "Corporate Highlights", href: "#news" },
    ],
  },
  {
    label: "About Us",
    children: [
      { label: "Mission & Vision", href: "#overview" },
      { label: "Leadership Team", href: "#governance" },
      { label: "Board of Directors", href: "#" },
      { label: "Advisors & Partners", href: "#trust" },
      { label: "History & Milestones", href: "#" },
    ],
  },
  {
    label: "Investments",
    children: [
      { label: "Active Opportunities", isHeader: true },
      { label: "Institutional investor", href: "#" },
      { label: "Private SPVs", href: "#" },
      { label: "Strategic Operator", href: "/strategic-operator" },
      { label: "---" as any }, // Separator
      { label: "Past Investments / Case Studies", href: "#" },
      { label: "Investment Approach & Strategy", href: "#thesis" },
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
      { label: "ESG & Risk Management", href: "#risk" },
      { label: "Policies & Framework", href: "#" },
      { label: "Legal & Regulatory Filings", href: "#" },
      { label: "Compliance Dashboard", href: "/admin/dashboard" },
      { label: "Audit Reports", href: "#" },
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
    label: "Dashboards",
    children: [
      { label: "P1: Investor Dashboard", href: "/dashboard" },
      { label: "P2: SPV Dashboard", href: "/phase2/dashboard" },
      { label: "P3: Operator Dashboard", href: "/phase3/dashboard" },
      { label: "---" as any },
      { label: "Admin Panel", href: "/admin/dashboard" },
    ],
  },
  {
    label: "Data Rooms",
    children: [
      { label: "P1: Institutional Data Room", href: "/data-room" },
      { label: "P2: SPV Data Room", href: "/phase2/data-room" },
      { label: "Download Center", href: "#" },
      { label: "Audit & Version History", href: "/admin/dashboard" },
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
      { label: "My Voting", href: "#" },
      { label: "Board Materials", href: "#" },
      { label: "Compliance Center", href: "#" },
      { label: "Legal & Regulatory Filings", href: "#" },
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
