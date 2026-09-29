export interface DocsNavItem {
  slug: string;
  title: string;
  available: boolean;
}

export const docsNav: DocsNavItem[] = [
  { slug: "getting-started", title: "Getting Started", available: true },
  { slug: "authentication", title: "Authentication", available: true },
  { slug: "mcp-server", title: "MCP Server", available: true },
  { slug: "endpoints", title: "Endpoints", available: false },
  { slug: "sdks", title: "SDKs", available: false },
  { slug: "webhooks", title: "Webhooks", available: false },
  { slug: "examples", title: "Examples", available: false },
  { slug: "rate-limits", title: "Rate Limits", available: false },
  { slug: "faq", title: "FAQ", available: false },
];
