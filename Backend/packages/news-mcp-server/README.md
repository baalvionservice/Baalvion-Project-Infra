# @baalvion/news-mcp-server

An [MCP](https://modelcontextprotocol.io) server for the [Baalvion Intelligence](https://signal.baalvion.com) news API. Gives Claude and any other MCP-compatible agent three tools:

| Tool | Description |
|---|---|
| `search_news` | Search articles by keyword, country, category, sentiment, source, or date range |
| `get_trending` | Fastest-moving categories/countries/sources over a recent time window |
| `get_article` | Fetch a single article by ID |

## Get an API key

Free — [signal.baalvion.com/signup](https://signal.baalvion.com/signup), no credit card. 100 requests/day.

## Configure your MCP client

Add to your client's MCP config (e.g. `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "baalvion-intelligence": {
      "command": "npx",
      "args": ["-y", "@baalvion/news-mcp-server"],
      "env": { "BAALVION_API_KEY": "bk_live_..." }
    }
  }
}
```

### Running from source (until the package is published to npm)

```bash
cd Backend/packages/news-mcp-server
pnpm install
pnpm build
```

Then point your MCP client at the built file directly:

```json
{
  "mcpServers": {
    "baalvion-intelligence": {
      "command": "node",
      "args": ["/absolute/path/to/Backend/packages/news-mcp-server/dist/index.js"],
      "env": { "BAALVION_API_KEY": "bk_live_..." }
    }
  }
}
```

## Environment variables

| Variable | Required | Default |
|---|---|---|
| `BAALVION_API_KEY` | Yes | — |
| `BAALVION_API_BASE_URL` | No | `https://news.baalvion.com` |

## Development

```bash
pnpm dev          # tsup --watch
pnpm type-check
pnpm build
```
