import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MCP Server",
  description: "Connect Claude or any MCP-compatible agent to the Baalvion Intelligence news API in one config block.",
};

const configExample = `{
  "mcpServers": {
    "baalvion-intelligence": {
      "command": "npx",
      "args": ["-y", "@baalvion/news-mcp-server"],
      "env": { "BAALVION_API_KEY": "bk_live_..." }
    }
  }
}`;

const tools = [
  {
    name: "search_news",
    description: "Search articles by keyword, country, category, sentiment, source, or date range.",
  },
  {
    name: "get_trending",
    description: "Fastest-moving categories, countries, or sources over a recent time window.",
  },
  {
    name: "get_article",
    description: "Fetch a single article's full detail by its article ID.",
  },
];

export default function McpServerDocsPage() {
  return (
    <article className="prose-invert max-w-none">
      <span className="eyebrow">MCP Server</span>
      <h1>Connect your agent in one config block</h1>
      <p>
        <code className="font-mono text-sm">@baalvion/news-mcp-server</code> wraps the News Intelligence API as an{" "}
        <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          MCP
        </a>{" "}
        server, so Claude Desktop, Claude Code, or any other MCP-compatible client gets three tools without you
        writing any API glue code.
      </p>

      <h2 className="mt-10 text-2xl">1. Get an API key</h2>
      <p>
        <a href="/signup" className="text-primary hover:underline">
          Create a free account
        </a>{" "}
        and copy the key shown on first login to <span className="font-medium text-foreground">Dashboard &rarr; API</span>.
      </p>

      <h2 className="mt-10 text-2xl">2. Configure your MCP client</h2>
      <p>
        Add this to your client&apos;s MCP config (for Claude Desktop, that&apos;s{" "}
        <code className="font-mono text-sm">claude_desktop_config.json</code>):
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-background p-4 font-mono text-sm text-foreground/90">
        <code>{configExample}</code>
      </pre>

      <h2 className="mt-10 text-2xl">3. Available tools</h2>
      <ul>
        {tools.map((tool) => (
          <li key={tool.name}>
            <code className="font-mono text-sm">{tool.name}</code> — {tool.description}
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-2xl">Free tier and rate limits</h2>
      <p>
        The MCP server uses the same API key and quota as direct API access — 100 requests/day on the free plan.
        Every tool call counts as one request.
      </p>
    </article>
  );
}
