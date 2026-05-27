# Changelog

All notable changes to **Baalvion-Project-Infra** will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
and the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) specification.

---

## [Unreleased]

### Added
- Roadmap items targeting Kubernetes migration and Terraform IaC adoption.

---

## [1.0.0] — 2026-05-27

### Summary
Inaugural production-grade release of the Baalvion infrastructure monorepo.
This release establishes the foundational engineering substrate for the
Baalvion platform: a hermetic, build-cache-aware, polyglot monorepo with
end-to-end TypeScript, PNPM workspaces, TurboRepo orchestration, and a
hardened CI/CD pipeline.

### Added
- **Monorepo foundation** — PNPM workspaces with TurboRepo task graph.
- **Frontend layer** — Next.js + React + TailwindCSS application shell.
- **Backend layer** — Node.js + Fastify service scaffolding with typed RPC.
- **Shared packages** — `@baalvion/config`, `@baalvion/telemetry`,
  `@baalvion/auth`, `@baalvion/schema`, `@baalvion/rpc`, `@baalvion/ui`,
  `@baalvion/testing`.
- **Platform CLI** — `baalvion` CLI for scaffolding, environment management,
  and deployment promotion.
- **Infrastructure-as-code** baseline under `infra/`.
- **Service catalog** under `catalog/` with ownership manifests and SLO
  declarations.
- **Docker substrate** — multi-stage Dockerfiles, distroless runtime images,
  and a local-fidelity `docker-compose.yml`.
- **CI/CD pipeline** — GitHub Actions workflows for lint, type-check, unit
  tests, integration tests, container build, security scan, and E2E.
- **Quality engineering** — Jest unit/integration suites, Playwright E2E
  suite under `e2e/`, Lighthouse CI budgets in `lighthouserc.json`.
- **Process supervision** — PM2 configuration (`pm2.config.js`) for
  non-containerized deployment targets.
- **Operational tooling** — `start.ps1` / `stop.ps1` bootstrap scripts.
- **Governance** — CODEOWNERS, `.npmrc`, `.gitignore`, canonical
  `.env.example`.
- **Documentation** — comprehensive README, architecture overview,
  contributing guidelines, runbook conventions.

### Security
- Strict dependency resolution via PNPM lockfile integrity.
- Schema-validated environment configuration (fail-closed loader).
- Secret scanning enabled on push.
- Required two-factor authentication for all contributors.

### Infrastructure
- Container-first deployment model with OCI-compliant images.
- Health (`/healthz`) and readiness (`/readyz`) probes on every service.
- Structured JSON logging with correlation IDs.
- Prometheus-compatible metrics exposition.

### Known Limitations
- Kubernetes orchestration is roadmapped for v2.0.0.
- Terraform IaC modules are roadmapped for v2.0.0.
- Multi-region active-active topology is roadmapped for v3.0.0.

---

## Release Tagging Convention

| Tag Format         | Meaning                          | Example          |
|--------------------|----------------------------------|------------------|
| `vMAJOR.MINOR.PATCH` | Stable production release      | `v1.0.0`         |
| `vX.Y.Z-rc.N`      | Release candidate                | `v1.1.0-rc.1`    |
| `vX.Y.Z-beta.N`    | Beta pre-release                 | `v1.1.0-beta.2`  |
| `vX.Y.Z-alpha.N`   | Alpha pre-release                | `v1.2.0-alpha.1` |

[Unreleased]: https://github.com/baalvionservice/Baalvion-Project-Infra/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/baalvionservice/Baalvion-Project-Infra/releases/tag/v1.0.0
