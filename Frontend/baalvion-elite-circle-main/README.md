# Baalvion Elite Circle

Members-only network connecting founders, investors, and operators.

## Tech stack

- Vite + React SPA (TypeScript)
- Tailwind CSS + shadcn-ui components
- Backend: `Backend/services/ecosystem/elite-circle-service` (Node.js + PostgreSQL, port 3051)

## Local development

```sh
# Install dependencies (from monorepo root)
pnpm install

# Start dev server (port 8081)
pnpm run dev
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `https://api.baalvion.com/api/v1/ecosystem/elite-circle/v1` | Elite Circle backend base URL |
| `VITE_AUTH_URL` | `http://localhost:3001/v1/auth` | Baalvion auth service base URL |
