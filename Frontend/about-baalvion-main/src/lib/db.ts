export type ProjectStatus = "Active" | "In Development" | "Planned";

export interface SEOMetadata {
  title?: string;
  description?: string;
  ogImage?: string;
  canonical?: string;
  keywords?: string[];
}

export interface Project {
  id: string;
  name: string;
  category: string;
  type: string;
  description: string;
  longDescription?: string;
  ecosystemRole?: string;
  futureScope?: string;
  status: ProjectStatus;
  domain?: string;
  subdomain?: string;
  isFeatured: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  seo?: SEOMetadata;
}

export interface ProjectCategory {
  id: string;
  name: string;
  description: string;
  priority: number;
}

export interface EcosystemItem {
  id: string;
  layer:
    | "Infrastructure"
    | "Intelligence"
    | "Governance"
    | "Commerce"
    | "Finance";
  name: string;
  description: string;
  domain?: string;
}

export interface Section {
  id: string;
  type: string;
  title: string;
  description: string;
  data: Record<string, any>;
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  sections: string[];
  seo?: SEOMetadata;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  status: "New" | "In Progress" | "Resolved" | "Archived";
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  date: string;
  image: string;
  author: string;
  readTime: string;
  content?: string;
  status: "Published" | "Draft";
  isTrending?: boolean;
  seo?: SEOMetadata;
}

export type UpdateCategory =
  | "Finance"
  | "Banking"
  | "Platform"
  | "System"
  | "Legal"
  | "Partner"
  | "Payment Gateway"
  | "HR"
  | "Other";
export type UpdateStatus = "Pending" | "Completed" | "In Progress";
export type ImpactLevel = "Low" | "Medium" | "High";

export interface OperationalUpdate {
  id: string;
  updateId: string;
  date: string;
  category: UpdateCategory;
  title: string;
  description: string;
  responsiblePerson: string;
  reference?: string;
  status: UpdateStatus;
  impactLevel: ImpactLevel;
  followUpActions?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  seo?: SEOMetadata;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  module: string;
  timestamp: string;
  details: string;
}

export const projectCategories: ProjectCategory[] = [
  {
    id: "cat-core",
    name: "Core Platform",
    description: "Foundation systems powering global trade infrastructure.",
    priority: 1,
  },
  {
    id: "cat-industrial",
    name: "Industrial",
    description: "Mining, manufacturing, and high-scale industrial projects.",
    priority: 2,
  },
  {
    id: "cat-internal",
    name: "Internal Systems",
    description: "Internal tools and operational management dashboards.",
    priority: 3,
  },
  {
    id: "cat-intel",
    name: "Intelligence",
    description: "AI-driven research, analytics, and market insights.",
    priority: 4,
  },
  {
    id: "cat-gov",
    name: "Governance",
    description: "Compliance, legal frameworks, and corporate policy tools.",
    priority: 5,
  },
  {
    id: "cat-comm",
    name: "Commerce",
    description: "Verified luxury brands and high-end trade operations.",
    priority: 6,
  },
];

let projects: Project[] = [
  {
    id: "p1",
    name: "Baalvion Trade Platform",
    category: "Core Platform",
    type: "SaaS",
    description:
      "Global trade infrastructure connecting businesses, finance, and compliance.",
    status: "In Development",
    isFeatured: true,
    priority: 1,
    domain: "baalvionstack.com",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    seo: {
      title: "Global Trade Platform | Baalvion Operating System",
      description:
        "The primary SaaS infrastructure for international commerce connectivity.",
    },
  },
  {
    id: "p2",
    name: "Mining Operations Dashboard",
    category: "Industrial",
    type: "Industrial Tool",
    description:
      "Real-time monitoring and management for high-scale mining initiatives.",
    status: "Active",
    isFeatured: true,
    priority: 2,
    domain: "mining.baalvion.com",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "p3",
    name: "Employee Monitoring App",
    category: "Internal Systems",
    type: "Internal Tool",
    description:
      "Track and optimize internal team productivity and node performance.",
    status: "Active",
    isFeatured: true,
    priority: 3,
    domain: "app.baalvionstack.com",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let articles: Article[] = [
  {
    id: "art-1",
    title: "What you need to know about Baalvion today: March 24, 2026",
    slug: "today",
    category: "updates",
    date: "March 24, 2026",
    image: "https://picsum.photos/seed/news1/600/400",
    author: "Baalvion Staff",
    readTime: "2 min read",
    status: "Published",
    isTrending: true,
    content: `Baalvion is accelerating the deployment of the Baalvion Operating System (BOS) across multiple global nodes. 

Recent expansions in the Middle East trade corridors have demonstrated a 40% reduction in clearing latency for mid-market partners. Additionally, our satellite production facility has reached a new milestone, with production capacity now at 30 units per week. 

In the UK, the AI compliance scoring system has officially launched, providing real-time risk assessment for cross-border transactions.`,
    seo: {
      title: "Daily Update: March 24, 2026 | Baalvion News",
      description:
        "Latest headlines from the Baalvion Operating System expansion and global trade corridors.",
    },
  },
];

let sections: Section[] = [
  {
    id: "sec-hero-home",
    type: "hero",
    title: "Operating the Global Trade Infrastructure",
    description:
      "Connecting businesses, finance, compliance, and logistics across 198 countries — all through a single unified system.",
    data: {
      ctaPrimary: "Explore Our Platform",
      ctaSecondary: "Partner With Us",
      label: "Baalvion Operating System (BOS)",
      stats: [
        { label: "Markets", value: "198" },
        { label: "Active Partners", value: "125+" },
        { label: "Transactions", value: "500K+" },
      ],
    },
  },
  {
    id: "sec-problem-home",
    type: "problem",
    title: "The Terminal Fragmentation of Trade",
    description:
      "Legacy commerce systems are siloed, inefficient, and slow. Global trade requires a unified execution layer.",
    data: {
      points: [
        {
          title: "Siloed Data",
          desc: "Information is locked in disparate systems across jurisdictions.",
        },
        {
          title: "Clearing Latency",
          desc: "Manual compliance and banking checks slow down value movement.",
        },
        {
          title: "Scaling Friction",
          desc: "Businesses struggle to integrate across modular market layers.",
        },
      ],
    },
  },
  {
    id: "sec-solution-home",
    type: "solution",
    title: "A Unified Protocol for Global Value",
    description:
      "The Baalvion Operating System (BOS) orchestrates every node of international commerce into one transparent ledger.",
    data: {
      features: [
        {
          title: "Real-Time Clearing",
          desc: "Automated settlement protocols for cross-border finance.",
        },
        {
          title: "AI Scoring",
          desc: "Intelligent compliance mapping for 180+ countries.",
        },
        {
          title: "Node Scalability",
          desc: "Modular architecture allowing seamless partner integration.",
        },
      ],
    },
  },
  {
    id: "sec-cta-home",
    type: "cta-final",
    title: "Join the Future of Infrastructure",
    description:
      "Connect your business to the most advanced trade operating system in the world.",
    data: {
      ctaPrimary: "Get Started",
      ctaSecondary: "Contact Strategy Team",
    },
  },
];

let pages: Page[] = [
  {
    id: "pg-home",
    slug: "home",
    title: "Baalvion — Global Trade Infrastructure Platform",
    sections: [
      "sec-hero-home",
      "sec-problem-home",
      "sec-solution-home",
      "sec-cta-home",
    ],
    seo: {
      title: "Baalvion Operating System (BOS) | Global Trade Infrastructure",
      description:
        "The unified operating system for international commerce, finance, and compliance.",
    },
  },
  {
    id: "pg-platform",
    slug: "platform",
    title: "Baalvion Platform | How It Works",
    sections: ["sec-platform-features"],
    seo: {
      title: "How It Works | Baalvion Platform Architecture",
      description:
        "Explore the modular layers of the Baalvion Operating System.",
    },
  },
];

let ecosystem: EcosystemItem[] = [
  {
    id: "eco-1",
    layer: "Infrastructure",
    name: "Infrastructure Layer",
    description: "The backbone for global business operations.",
    domain: "baalvionstack.com",
  },
];

let inquiries: Inquiry[] = [];

let operationalUpdates: OperationalUpdate[] = [
  {
    id: "u-1",
    updateId: "U001",
    date: "2024-03-20",
    category: "Banking",
    title: "SBI Corporate Account Integration",
    description:
      "Successfully integrated the State Bank of India corporate API for real-time automated clearing across the Indian Baalvion Operating System (BOS) node.",
    responsiblePerson: "Finance Team / Dev Ops",
    reference: "https://sbi.co.in/corporate",
    status: "Completed",
    impactLevel: "High",
    followUpActions: "Monitor transaction latency for the first 48 hours.",
    tags: ["banking", "india", "automation"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const db = {
  projects: {
    getAll: () => projects,
    getById: (id: string) => projects.find((p) => p.id === id),
    add: (p: any) => {
      const newP = {
        ...p,
        id: `p-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      projects.push(newP);
      return newP;
    },
    update: (id: string, p: any) => {
      projects = projects.map((item) =>
        item.id === id
          ? { ...item, ...p, updatedAt: new Date().toISOString() }
          : item
      );
      return projects.find((item) => item.id === id);
    },
    delete: (id: string) => {
      projects = projects.filter((p) => p.id !== id);
    },
  },
  articles: {
    getAll: () => articles,
    getBySlug: (slug: string) => articles.find((a) => a.slug === slug),
    add: (a: any) => {
      const newA = {
        ...a,
        id: `art-${Math.random().toString(36).substring(2, 7)}`,
      };
      articles.push(newA);
      return newA;
    },
    update: (id: string, a: any) => {
      articles = articles.map((item) =>
        item.id === id ? { ...item, ...a } : item
      );
      return articles.find((item) => item.id === id);
    },
    delete: (id: string) => {
      articles = articles.filter((a) => a.id !== id);
    },
  },
  pages: {
    getAll: () => pages,
    getBySlug: (slug: string, populate: boolean = false) => {
      const page = pages.find((p) => p.slug === slug);
      if (!page) return null;
      if (populate) {
        return {
          ...page,
          sectionData: page.sections
            .map((sid) => sections.find((s) => s.id === sid))
            .filter(Boolean),
        };
      }
      return page;
    },
    update: (id: string, p: Partial<Page>) => {
      pages = pages.map((item) => (item.id === id ? { ...item, ...p } : item));
    },
  },
  sections: {
    getAll: () => sections,
    add: (s: any) => {
      const newS = {
        ...s,
        id: `sec-${Math.random().toString(36).substring(2, 7)}`,
      };
      sections.push(newS);
      return newS;
    },
    update: (id: string, s: Partial<Section>) => {
      sections = sections.map((item) =>
        item.id === id ? { ...item, ...s } : item
      );
      return sections.find((item) => item.id === id);
    },
    delete: (id: string) => {
      sections = sections.filter((s) => s.id !== id);
    },
  },
  ecosystem: {
    getAll: () => ecosystem,
    add: (e: any) => {
      const newE = {
        ...e,
        id: `eco-${Math.random().toString(36).substring(2, 7)}`,
      };
      ecosystem.push(newE);
      return newE;
    },
    update: (id: string, e: any) => {
      ecosystem = ecosystem.map((item) =>
        item.id === id ? { ...item, ...e } : item
      );
      return ecosystem.find((item) => item.id === id);
    },
    delete: (id: string) => {
      ecosystem = ecosystem.filter((e) => e.id !== id);
    },
  },
  inquiries: {
    getAll: () => inquiries,
    add: (i: any) => {
      const newI: Inquiry = {
        ...i,
        id: `inq-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
        status: "New",
      };
      inquiries.push(newI);
      return newI;
    },
    updateStatus: (id: string, status: Inquiry["status"]) => {
      inquiries = inquiries.map((item) =>
        item.id === id ? { ...item, status } : item
      );
    },
    delete: (id: string) => {
      inquiries = inquiries.filter((i) => i.id !== id);
    },
  },
  operationalUpdates: {
    getAll: () => operationalUpdates,
    getById: (id: string) => operationalUpdates.find((u) => u.id === id),
    add: (u: any) => {
      const newU: OperationalUpdate = {
        ...u,
        id: `u-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      operationalUpdates.push(newU);
      return newU;
    },
    update: (id: string, u: any) => {
      operationalUpdates = operationalUpdates.map((item) =>
        item.id === id
          ? { ...item, ...u, updatedAt: new Date().toISOString() }
          : item
      );
      return operationalUpdates.find((item) => item.id === id);
    },
    delete: (id: string) => {
      operationalUpdates = operationalUpdates.filter((u) => u.id !== id);
    },
  },
};
