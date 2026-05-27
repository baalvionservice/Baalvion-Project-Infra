<div align="center">

# Baalvion-Project-Infra

### The Unified Infrastructure Monorepo Powering the Baalvion Platform

*A production-grade, cloud-native, polyglot engineering monorepo engineered for high-throughput service orchestration, distributed compute, and enterprise-scale platform delivery.*

---

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white)
![PNPM](https://img.shields.io/badge/PNPM-9.x-F69220?style=for-the-badge&logo=pnpm&logoColor=white)
![TurboRepo](https://img.shields.io/badge/TurboRepo-2.x-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)
![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)
![Infrastructure](https://img.shields.io/badge/Infrastructure-Cloud--Native-0db7ed?style=for-the-badge&logo=kubernetes&logoColor=white)
![Enterprise Ready](https://img.shields.io/badge/Enterprise-Ready-success?style=for-the-badge)

</div>

---

## 1. Project Title

**Baalvion-Project-Infra** is the canonical infrastructure monorepo of the **Baalvion Engineering Organization** (`baalvionservice`). It is the singular source of truth for all platform code, system topology, deployment manifests, internal tooling, and operational guardrails that power the Baalvion product surface.

---

## 2. Enterprise-Grade Introduction

Baalvion-Project-Infra is a **polyglot, hermetically-sealed, build-cache-aware monorepo** engineered for predictable software delivery at scale. It consolidates frontend experiences, backend microservices, internal developer platform tooling, infrastructure-as-code definitions, container blueprints, and quality engineering pipelines into a single coherent system. The repository is governed by reproducible builds, deterministic dependency resolution, codified service contracts, automated quality gates, and a unified observability spine. It is the connective tissue between product engineering, platform engineering, and site reliability functions across the Baalvion organization.

This repository is built for organizations that prioritize **velocity without entropy**: every commit traverses a hardened pipeline that compiles, lints, type-checks, tests, scans for vulnerabilities, packages container artifacts, and propagates signed releases to immutable environments. It treats infrastructure as a product, developer experience as a first-class capability, and reliability as a non-negotiable contract.

---

## 3. GitHub Badges

Badges are wired into the CI/CD spine and reflect the live operational posture of the repository. Each badge is sourced from automated checks running against the `main` integration branch and the long-lived `release/*` branches.

| Category | Tooling | Purpose |
|---|---|---|
| Runtime | Node.js 20 LTS | Hermetic JavaScript runtime |
| Package Manager | PNPM 9 | Content-addressable dependency store |
| Orchestrator | TurboRepo 2 | Incremental, distributed task graph |
| Containerization | Docker | Reproducible build & runtime images |
| Language | TypeScript 5 | Strict, end-to-end type safety |
| Delivery | GitHub Actions | Declarative CI/CD pipelines |
| License | Proprietary | Restricted internal distribution |
| Infra Posture | Cloud-Native | Container-first, Kubernetes-ready |
| Maturity | Enterprise Ready | SLO-backed, audited, hardened |

---

## 4. Mission Statement

> **To engineer the most reliable, observable, and developer-friendly platform substrate in our industry — one where shipping a service is as simple as writing a function, and where every system can be reasoned about, recovered, and scaled without heroics.**

Baalvion-Project-Infra exists to compress the distance between an engineering intent and a production-grade outcome. It encodes the organizational belief that **infrastructure is a product** and that the internal developer is its most important customer.

---

## 5. Platform Overview

The Baalvion Platform is a federated, multi-tenant, service-oriented system composed of:

- A **public-facing web experience** delivered via a server-rendered Next.js frontier.
- A **backend services mesh** of independently deployable Node.js services communicating over typed RPC and asynchronous events.
- A **shared package layer** providing cross-cutting capabilities — auth, telemetry, configuration, schema, and domain primitives.
- An **infrastructure-as-code substrate** defining environments, networking, secrets, and runtime topology.
- An **internal developer platform** (IDP) exposed through a first-party CLI that abstracts away environment provisioning, code scaffolding, deployment promotion, and operational diagnostics.
- A **quality engineering layer** containing unit, integration, contract, and end-to-end suites with deterministic execution semantics.

The platform is designed under the operating principle of **progressive decomposition**: monolithic boundaries are intentionally preserved early, then surgically decomposed into services as load characteristics, ownership boundaries, and reliability requirements justify the cost.

---

## 6. High-Level Architecture Overview

```text
                            ┌────────────────────────────────────────┐
                            │              EDGE / CDN                │
                            │   (TLS termination, WAF, caching)      │
                            └───────────────────┬────────────────────┘
                                                │
                                                ▼
            ┌───────────────────────────────────────────────────────────────┐
            │                        FRONTEND LAYER                          │
            │   Next.js (SSR/ISR) · React · TailwindCSS · TypeScript        │
            └───────────────────────────┬───────────────────────────────────┘
                                        │  (typed RPC / REST / SSE)
                                        ▼
            ┌───────────────────────────────────────────────────────────────┐
            │                       API GATEWAY                              │
            │     Routing · AuthN/Z · Rate Limiting · Request Tracing       │
            └───────────────────────────┬───────────────────────────────────┘
                                        │
              ┌─────────────────────────┼──────────────────────────┐
              ▼                         ▼                          ▼
      ┌──────────────┐         ┌──────────────┐           ┌──────────────┐
      │  Service A   │         │  Service B   │   ...     │  Service N   │
      │  (Fastify)   │         │  (Fastify)   │           │  (Fastify)   │
      └──────┬───────┘         └──────┬───────┘           └──────┬───────┘
             │                        │                          │
             ▼                        ▼                          ▼
      ┌──────────────────────────────────────────────────────────────────┐
      │            DATA & EVENTING SUBSTRATE                              │
      │   Relational Store · Document Store · Object Store · Event Bus   │
      └──────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
      ┌──────────────────────────────────────────────────────────────────┐
      │     OBSERVABILITY · LOGGING · METRICS · TRACING · ALERTING       │
      └──────────────────────────────────────────────────────────────────┘
```

The diagram captures the canonical request and event path. Every horizontal layer is independently deployable, independently scalable, and instrumented with structured telemetry from the first commit.

---

## 7. Infrastructure Philosophy

Baalvion infrastructure is governed by five immutable tenets:

1. **Everything is code.** Topology, secrets schemas, deployment intent, runbooks, and dashboards are version-controlled artifacts. No production change exists outside of source control.
2. **Reproducibility over convenience.** Builds are hermetic, dependencies are pinned, container images are immutable, and environments are bit-identical across local, staging, and production.
3. **Boring beats clever.** Battle-tested primitives — containers, queues, relational databases, blue/green deploys — are preferred over novel paradigms whose failure modes are not yet socialized.
4. **Observability is a precondition, not an afterthought.** Code is not considered complete until it emits structured logs, metrics with cardinality budgets, and distributed traces.
5. **Operational empathy.** Every system is designed to be debugged at 3 AM by an engineer who did not write it.

---

## 8. Monorepo Philosophy

The monorepo is not a folder — it is an engineering doctrine. Baalvion-Project-Infra adopts the monorepo model to achieve:

- **Atomic, cross-cutting refactors** that traverse frontend, backend, and shared package boundaries in a single commit.
- **Single-version policy** on shared dependencies to eliminate dependency skew and the "two versions of React" class of bugs.
- **Shared CI economy** through TurboRepo's distributed task graph and remote build caching.
- **Centralized governance** of linting, formatting, type-checking, security scanning, and license enforcement.
- **Discoverability** — every engineer can grep the entire platform from a single working tree.

The monorepo is not a substitute for service boundaries. Services remain independently deployable; the monorepo merely ensures their evolution stays coherent.

---

## 9. Repository Structure Tree

```bash
.
├── Backend/                  # Backend services, APIs, workers, schedulers
├── Frontend/                 # Web experiences, design system consumers, SSR shells
├── catalog/                  # Service catalog, ownership manifests, SLOs
├── docker/                   # Dockerfiles, base images, build contexts
├── docs/                     # Architecture decisions, runbooks, onboarding
├── e2e/                      # End-to-end test suites (Playwright)
├── infra/                    # Infrastructure-as-code, environment definitions
├── packages/                 # Shared libraries, SDKs, contracts
├── platform/
│   └── cli/                  # Internal developer platform CLI
├── scripts/                  # Operational scripts, codemods, generators
├── .claude/                  # Agent prompts, automation surfaces
├── .github/
│   └── workflows/            # CI/CD pipeline definitions
├── .env.example              # Canonical environment variable template
├── docker-compose.yml        # Local orchestration manifest
├── package.json              # Root workspace manifest
├── pnpm-workspace.yaml       # PNPM workspace topology
├── turbo.json                # TurboRepo task graph
├── pm2.config.js             # PM2 process supervision
├── tsconfig.base.json        # Canonical TypeScript compiler contract
├── jest.config.ts            # Root Jest configuration
└── lighthouserc.json         # Lighthouse CI budgets and assertions
```

---

## 10. Folder-by-Folder Explanation

| Path | Purpose | Ownership |
|---|---|---|
| `Backend/` | Houses every backend service. Each subdirectory is an independently deployable unit with its own `package.json`, Dockerfile, and service manifest. Services follow the hexagonal architecture pattern. | Service teams |
| `Frontend/` | Contains user-facing applications — primarily the Next.js web shell, marketing surfaces, and admin consoles. Bundled per surface for independent deployment. | Web platform team |
| `catalog/` | Service catalog metadata: ownership, tier, SLOs, runbook URLs, dependency graphs. Consumed by the IDP CLI and dashboards. | Platform engineering |
| `docker/` | Hardened base images, multi-stage build contexts, distroless runtime images, and Compose overlays. | Platform engineering |
| `docs/` | Architecture decision records (ADRs), runbooks, onboarding guides, and platform reference documentation. | All teams |
| `e2e/` | Playwright-based end-to-end test suites that exercise complete user journeys against ephemeral environments. | Quality engineering |
| `infra/` | Declarative infrastructure manifests, environment definitions, network policies, and IaC entrypoints. | SRE / platform |
| `packages/` | Shared libraries: design system, telemetry client, configuration loader, schema contracts, domain primitives. | Platform engineering |
| `platform/cli/` | The `baalvion` CLI — the entrypoint for scaffolding, environment management, and deployment promotion. | Platform engineering |
| `scripts/` | Operational scripts, one-shot codemods, generators, dependency hygiene utilities. | All teams |
| `.claude/` | Codified agent prompts, automation playbooks, and AI-assisted workflows. | Platform engineering |
| `.github/workflows/` | CI/CD pipeline definitions, reusable workflows, composite actions. | Platform engineering |

---

## 11. Technology Stack

The Baalvion stack is intentionally narrow. Every additional technology incurs operational debt; new tools are admitted only after a documented evaluation against incumbent options.

| Concern | Technology | Rationale |
|---|---|---|
| Language | TypeScript 5 | Strict types, ecosystem leverage, single language across the stack |
| Runtime | Node.js 20 LTS | Mature, performant, broad library support |
| Package Manager | PNPM 9 | Strict dependency resolution, content-addressable store |
| Build Orchestrator | TurboRepo 2 | Incremental, cached, parallel task execution |
| Frontend Framework | Next.js | SSR/ISR, edge-ready, mature ecosystem |
| Styling | TailwindCSS | Atomic, deterministic, build-time pruned |
| Backend Framework | Fastify (Express compatibility) | Schema-first, performant, plugin architecture |
| Process Supervision | PM2 | Daemonized process lifecycle for VM-class deploys |
| Containerization | Docker | Industry-standard image format |
| CI/CD | GitHub Actions | Native integration, composable workflows |
| Testing | Jest + Playwright | Unit/integration + E2E coverage |
| Quality Gates | ESLint + Prettier | Style and correctness enforcement |

---

## 12. Frontend Stack

The frontend layer is engineered for **time-to-first-byte**, **interactivity**, and **accessibility-by-default**.

- **Next.js** as the rendering substrate — supporting server components, incremental static regeneration, and edge runtimes.
- **React 18+** with concurrent features, suspense boundaries, and streaming SSR.
- **TypeScript** in strict mode with no implicit `any` and exhaustive switch enforcement.
- **TailwindCSS** with a design-token-driven configuration that mirrors the shared design system in `packages/`.
- **Component contracts** generated from shared schemas to guarantee end-to-end type safety from API to pixel.
- **Bundle budgets** enforced in CI via Lighthouse and `next-bundle-analyzer`.

---

## 13. Backend Stack

The backend mesh is composed of small, ownership-clear services that prefer **explicit contracts** over **implicit coupling**.

- **Node.js 20 LTS** as the canonical runtime.
- **Fastify** for new services (Express remains supported for legacy paths).
- **Schema-first APIs** — every endpoint is described by a JSON Schema / Zod definition before code is written.
- **Typed RPC** between services using auto-generated clients from shared schema packages.
- **Asynchronous integration** through an event bus for any cross-service workflow that does not require synchronous semantics.
- **Idempotency keys** and **request correlation IDs** are mandatory on every mutating endpoint.

---

## 14. DevOps Stack

DevOps at Baalvion is defined by **declarative intent**, **immutable artifacts**, and **progressive delivery**.

- **GitHub Actions** orchestrates the entire CI/CD spine.
- **TurboRepo** provides the incremental task graph with remote caching to keep CI feedback loops under a few minutes.
- **Docker BuildKit** produces multi-stage, layer-cached, distroless runtime images.
- **PM2** supervises Node.js processes in non-containerized deployment targets.
- **PNPM Workspaces** govern dependency resolution and the workspace protocol.

---

## 15. Infrastructure Stack

The current infrastructure surface is intentionally container-centric and Kubernetes-ready:

- **Docker Compose** for local-fidelity orchestration.
- **OCI-compliant container images** as the universal deployment artifact.
- **Environment-scoped configuration** sourced from a typed configuration loader.
- **Health, readiness, and startup probes** on every service.

**Future infrastructure vision** (see roadmap):

- **Kubernetes** with progressive delivery via Argo Rollouts.
- **Terraform** as the single source of truth for cloud topology.
- **Service mesh** for mTLS, traffic shaping, and policy enforcement.
- **Distributed tracing** via OpenTelemetry collectors.
- **AI infrastructure orchestration** for model serving and inference pipelines.

---

## 16. CI/CD Architecture

The CI/CD pipeline is the load-bearing artifact of the entire repository. It is composed of reusable workflows that execute as a directed acyclic graph against every pull request and every push to a protected branch.

```text
┌─────────────────┐
│  Commit / PR    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌───────────────────┐
│  Static Checks  │─────▶│  Type Checking    │
│  (lint, format) │      │  (tsc --noEmit)   │
└────────┬────────┘      └─────────┬─────────┘
         │                         │
         ▼                         ▼
┌─────────────────┐      ┌───────────────────┐
│  Unit Tests     │      │  Integration      │
│  (Jest)         │      │  Tests            │
└────────┬────────┘      └─────────┬─────────┘
         │                         │
         ▼                         ▼
┌──────────────────────────────────────────┐
│         Container Image Build            │
│      (multi-stage, BuildKit, SBOM)       │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────┐
│   Security Scan · Vulnerability Audit    │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────┐
│      E2E Tests on Ephemeral Env          │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────┐
│   Signed Release · Promotion to Staging  │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────┐
│   Manual Approval · Production Rollout   │
└──────────────────────────────────────────┘
```

Every stage emits structured telemetry and is observable through the platform dashboards.

---

## 17. Local Development Setup

The local development experience is a first-class deliverable. A new engineer should be productive within **thirty minutes** of cloning the repository.

```bash
# 1. Clone the repository
git clone git@github.com:baalvionservice/Baalvion-Project-Infra.git
cd Baalvion-Project-Infra

# 2. Install Node.js 20 (via nvm)
nvm install 20 && nvm use 20

# 3. Enable corepack and install PNPM
corepack enable
corepack prepare pnpm@latest --activate

# 4. Install workspace dependencies
pnpm install

# 5. Provision local environment
cp .env.example .env

# 6. Boot the local stack
docker compose up -d
pnpm dev
```

---

## 18. Prerequisites

| Tool | Minimum Version | Notes |
|---|---|---|
| Node.js | 20.x LTS | Managed via `nvm` |
| PNPM | 9.x | Installed via `corepack` |
| Docker | 24.x | With BuildKit enabled |
| Docker Compose | v2 | Bundled with modern Docker |
| Git | 2.40+ | LFS support required |
| Make | 4.x | Optional, for legacy entrypoints |

---

## 19. Installation Guide

```bash
# Install dependencies across the workspace
pnpm install

# Generate workspace-aware tooling caches
pnpm turbo run prepare

# Validate the toolchain
pnpm doctor
```

The `pnpm doctor` script — exposed by the platform CLI — verifies Node version, PNPM version, Docker availability, port reservations, and required environment variables.

---

## 20. Environment Setup

Environment configuration is centralized in `.env.example`, which serves as the canonical schema. The configuration loader in `packages/config` validates every variable against a strict schema at process startup; missing or malformed variables fail fast.

```bash
cp .env.example .env
# Edit .env to populate local secrets
pnpm baalvion env validate
```

Secrets in non-local environments are sourced from the centralized secret manager (see Section 38).

---

## 21. Docker Setup

Local fidelity is achieved through `docker-compose.yml`, which provisions dependencies (databases, message brokers, object stores) in containers that mirror production semantics.

```bash
# Boot the dependency layer
docker compose up -d

# Tail logs across services
docker compose logs -f

# Tear down and reclaim volumes
docker compose down -v
```

Production images are built from the contexts in `docker/` and follow a multi-stage pattern: a build stage with full toolchain, then a distroless runtime stage that contains only the compiled artifact.

---

## 22. PNPM Workspace Explanation

PNPM workspaces are declared in `pnpm-workspace.yaml` and provide the foundation for dependency hoisting, the `workspace:` protocol, and deterministic installs.

```yaml
packages:
  - "Backend/*"
  - "Frontend/*"
  - "packages/*"
  - "platform/*"
  - "e2e"
```

Cross-workspace dependencies are declared with the `workspace:*` protocol to guarantee that internal consumers always resolve to the in-tree version.

---

## 23. TurboRepo Explanation

TurboRepo is the task orchestrator. Its task graph — defined in `turbo.json` — encodes the dependencies between build, lint, test, and deploy targets and enables remote caching across local development, CI, and ephemeral environments.

```bash
# Run the build for affected projects only
pnpm turbo run build --filter=...[origin/main]

# Run all tests with remote cache
pnpm turbo run test --remote-cache
```

The remote cache is the single most important developer-experience investment in the repository: it reduces feedback loops from minutes to seconds.

---

## 24. Running Development Servers

```bash
# Start every dev server (frontend + backend + workers)
pnpm dev

# Start a specific workspace
pnpm --filter @baalvion/web dev
pnpm --filter @baalvion/api dev

# Start with file-watching telemetry enabled
pnpm dev:trace
```

Dev servers expose `/healthz` and `/readyz` endpoints from the first moment they boot.

---

## 25. Production Deployment

Production deployment is **declarative**, **auditable**, and **reversible**. No engineer SSHs into a production host. Every change ships through the pipeline.

| Stage | Mechanism |
|---|---|
| Build | Multi-stage Docker image with SBOM |
| Promote | Image tagged and signed |
| Deploy | Declarative manifest applied to target environment |
| Verify | Synthetic checks + SLO validation |
| Rollback | Single-command revert to prior immutable revision |

---

## 26. PM2 Deployment

For deployment targets that are not yet containerized, PM2 provides daemonized process supervision with clustering, log aggregation, and zero-downtime reloads.

```bash
# Boot the production process tree
pm2 start pm2.config.js --env production

# Zero-downtime reload
pm2 reload all

# Persist process list across reboots
pm2 save && pm2 startup
```

The `pm2.config.js` file encodes process count, memory ceilings, log destinations, and graceful shutdown hooks.

---

## 27. Docker Deployment

The default deployment substrate is OCI containers.

```bash
# Build the API image
docker build -f docker/api.Dockerfile -t baalvion/api:$(git rev-parse --short HEAD) .

# Run the container with environment isolation
docker run --rm -p 8080:8080 --env-file .env.production baalvion/api:latest

# Push to the registry
docker push baalvion/api:$(git rev-parse --short HEAD)
```

Every image is signed with cosign and accompanied by an SPDX SBOM.

---

## 28. Testing Strategy

Testing at Baalvion follows the classical **testing pyramid** with a deliberate bias toward the base. Fast, deterministic unit tests dominate; integration tests cover boundaries; end-to-end tests are reserved for critical user journeys.

| Layer | Tooling | Cardinality | Execution Target |
|---|---|---|---|
| Unit | Jest | Thousands | Every commit |
| Integration | Jest + Testcontainers | Hundreds | Every PR |
| Contract | Pact / Schema diff | Dozens | Every PR |
| End-to-End | Playwright | Tens | Pre-release |
| Smoke | Synthetic monitors | Continuous | Production |

---

## 29. Unit Testing

```bash
# Run unit tests across the workspace
pnpm test

# Run with coverage
pnpm test --coverage

# Watch mode for a specific workspace
pnpm --filter @baalvion/api test --watch
```

Unit tests are colocated with the code they exercise. Test files use the `.test.ts` suffix. Mocking is restricted to module boundaries; in-module mocking is treated as a design smell.

---

## 30. Integration Testing

Integration tests exercise real dependencies — databases, message brokers, object stores — via **Testcontainers**, which provisions ephemeral containers per test suite.

```bash
pnpm test:integration
```

Suites are tagged so CI can shard execution across runners.

---

## 31. End-to-End Testing

End-to-end tests live in `e2e/` and run against **ephemeral preview environments** spun up per pull request.

```bash
pnpm --filter e2e test
pnpm --filter e2e test --ui
```

E2E tests are governed by a strict budget — they must complete in under fifteen minutes wall-clock.

---

## 32. Linting and Formatting

```bash
# Lint the entire workspace
pnpm lint

# Auto-fix where safe
pnpm lint --fix

# Verify formatting
pnpm format:check
```

ESLint and Prettier configurations are centralized in shared packages and consumed by every workspace. There are no per-project style overrides without a documented exemption.

---

## 33. Code Quality Standards

The repository enforces, without exception:

- Strict TypeScript with `noImplicitAny`, `strictNullChecks`, and `noUncheckedIndexedAccess`.
- Zero ESLint errors on the integration branch.
- No `// eslint-disable-next-line` without an accompanying ticket.
- No `any` types without a documented rationale.
- Conventional Commits for all commit messages.
- Required code review by a CODEOWNER for every change.

---

## 34. Infrastructure Management

Infrastructure is defined declaratively in `infra/`. Every environment — development, staging, production — is a directory of manifests that describe networks, services, secrets, and policies. Changes traverse the same pipeline as application code: pull request, review, automated checks, approval, deployment.

---

## 35. Observability and Monitoring

Observability is built on the **three pillars**: metrics, logs, and traces, unified by a correlation ID that propagates from the edge to the database.

| Signal | Implementation |
|---|---|
| Metrics | Prometheus-compatible exposition with cardinality budgets |
| Logs | Structured JSON, shipped to a central log lake |
| Traces | OpenTelemetry SDK with W3C trace context |
| Dashboards | Versioned alongside the services they observe |
| Alerts | Defined as code, paged via the on-call rotation |

Every service exposes the **Four Golden Signals**: latency, traffic, errors, and saturation.

---

## 36. Logging Strategy

Logs are structured, leveled, and correlation-aware.

- **Format:** JSON, one event per line.
- **Levels:** `trace`, `debug`, `info`, `warn`, `error`, `fatal`.
- **Required fields:** `timestamp`, `level`, `service`, `traceId`, `spanId`, `message`.
- **PII:** Redacted at the logger boundary via the shared telemetry package.
- **Retention:** Tiered — hot for seven days, warm for thirty, cold for one year.

---

## 37. Security Practices

Security is a horizontal concern owned by every engineer and enforced by automation.

- Dependency scanning on every commit (Snyk / GitHub Advanced Security).
- Container image scanning before promotion.
- Static analysis (CodeQL) on every pull request.
- Secret scanning on push.
- Signed commits required on protected branches.
- Mandatory two-factor authentication for all contributors.
- Least-privilege IAM with quarterly access reviews.

---

## 38. Secret Management

Secrets are never committed to source control. The repository contains only the `.env.example` schema. Live secrets are sourced from a centralized secret manager (Vault / cloud-native KMS) and injected at process boot through the configuration loader. The loader validates the shape of every secret against the schema and fails closed if a required secret is missing.

```bash
# Fetch secrets for the active environment
pnpm baalvion secrets pull --env staging
```

---

## 39. Environment Isolation

| Environment | Purpose | Data | Promotion |
|---|---|---|---|
| `local` | Developer workstations | Synthetic | Manual |
| `preview` | Per-PR ephemeral | Synthetic | Automated on PR |
| `staging` | Pre-production verification | Sanitized snapshot | Automated on merge |
| `production` | Live customer traffic | Production | Manual approval |

Environments are **bit-identical** at the artifact level. The only difference between staging and production is configuration and traffic.

---

## 40. Scaling Strategy

Scaling is governed by **measured signals**, not intuition.

- **Horizontal-first.** Services are stateless by default and scale via replica count.
- **Autoscaling** keyed off saturation signals — CPU, request concurrency, queue depth.
- **Backpressure** at every async boundary; no unbounded queues.
- **Circuit breakers** on every cross-service call.
- **Read replicas** for read-heavy workloads.
- **Sharding** introduced only after measured contention.

---

## 41. Documentation Structure

The `docs/` directory is the operational and architectural reference for the platform.

| Subdirectory | Contents |
|---|---|
| `docs/adr/` | Architecture decision records |
| `docs/runbooks/` | Operational procedures for known incidents |
| `docs/onboarding/` | New-engineer ramp-up materials |
| `docs/reference/` | API references, schemas, glossaries |
| `docs/playbooks/` | Recurring operational workflows |

Documentation is treated as production code: reviewed, versioned, and kept in lockstep with the systems it describes.

---

## 42. Scripts Explanation

The `scripts/` directory holds operational utilities — codemods, generators, and one-shot maintenance tasks. Scripts are written in TypeScript and executed via the platform CLI to guarantee a uniform runtime contract.

```bash
pnpm baalvion script run rotate-keys
pnpm baalvion script run generate-service --name=payments
```

---

## 43. CLI Tooling Overview

The `baalvion` CLI — implemented in `platform/cli/` — is the **front door** to the internal developer platform. It abstracts away the underlying mechanics of scaffolding, environment management, deployment promotion, and operational diagnostics.

```bash
baalvion init                       # Bootstrap a workstation
baalvion service create <name>      # Scaffold a new service
baalvion env validate               # Validate environment variables
baalvion deploy --target=staging    # Promote an image to staging
baalvion logs <service>             # Tail structured logs
baalvion incident open              # Open an incident channel
```

The CLI is the **canonical interface**. Every operation that has a CLI command should be performed through the CLI; bespoke scripts are a sign of a missing CLI capability.

---

## 44. Shared Packages Explanation

The `packages/` directory contains the cross-cutting libraries that keep the platform coherent.

| Package | Purpose |
|---|---|
| `@baalvion/config` | Schema-validated configuration loader |
| `@baalvion/telemetry` | Logger, metrics, and tracing facade |
| `@baalvion/auth` | Authentication and authorization primitives |
| `@baalvion/schema` | Shared domain schemas and types |
| `@baalvion/rpc` | Typed RPC client/server scaffolding |
| `@baalvion/ui` | Design system components |
| `@baalvion/testing` | Shared test utilities and fixtures |

Shared packages follow **semantic versioning** internally and are consumed via the `workspace:*` protocol.

---

## 45. API Architecture

APIs are **schema-first**, **versioned**, and **explicitly contracted**.

- Every endpoint is described by a JSON Schema / Zod definition before code is written.
- Breaking changes require a new major version and a deprecation window.
- Pagination, error envelopes, and idempotency are standardized across all APIs.
- Authentication is centralized in the gateway; services trust the gateway's signed claims.

---

## 46. Service Communication

| Pattern | Use Case | Mechanism |
|---|---|---|
| Synchronous RPC | Request/response with tight latency requirements | Typed HTTP / gRPC |
| Asynchronous events | Cross-service workflows, fan-out | Event bus with at-least-once delivery |
| Streaming | Continuous data | Server-Sent Events / WebSocket |
| Batch | Bulk data movement | Object store + manifest |

All cross-service calls carry a correlation ID, propagate the trace context, and respect a deadline.

---

## 47. Dependency Management

- **Single-version policy** for shared third-party dependencies.
- **Renovate** opens dependency-update pull requests on a weekly cadence.
- **License gate** in CI blocks any dependency outside the approved license allowlist.
- **Lockfile integrity** verified on every install.
- **Provenance** verified via npm provenance attestations where available.

---

## 48. Engineering Principles

> **Optimize for the engineer who joins next year, not the engineer who wrote it last year.**

1. **Clarity over cleverness.**
2. **Boring technology unless proven otherwise.**
3. **Make the change easy, then make the easy change.**
4. **Reversible decisions get made fast; irreversible decisions get made carefully.**
5. **Every system has an owner; every alert has a runbook.**
6. **Document the *why*, not the *what*.**

---

## 49. Development Workflow

```text
ticket → branch → commits → pull request → review → CI → merge → deploy
```

Every step is automated where possible and codified where automation is not yet feasible.

---

## 50. Branching Strategy

The repository follows a **trunk-based** model with short-lived feature branches.

| Branch | Purpose | Lifetime |
|---|---|---|
| `main` | Integration trunk; always releasable | Permanent |
| `feature/*` | Short-lived feature work | Hours to days |
| `release/*` | Release stabilization | Days |
| `hotfix/*` | Emergency production patches | Hours |

Long-lived feature branches are an anti-pattern.

---

## 51. Pull Request Workflow

1. Open a PR against `main` with a Conventional Commit title.
2. CI executes the full quality gate.
3. CODEOWNERS are auto-assigned for review.
4. At least one approving review is required.
5. The PR is merged via squash with a clean commit message.
6. The merge triggers an automated deployment to `staging`.

PRs are kept small. A PR larger than ~400 changed lines is split unless the change is mechanically motivated.

---

## 52. Release Strategy

Releases are **continuous**, **versioned**, and **observable**.

- Every merge to `main` produces a release candidate image.
- Release candidates are auto-promoted to staging.
- Production promotion requires manual approval and SLO validation.
- Releases are tagged with semantic version numbers and accompanied by automatically generated release notes.

---

## 53. Incident Management

When a service breaches an SLO or a critical alert fires, the incident workflow is:

1. The on-call engineer is paged via the rotation.
2. An incident channel is opened via `baalvion incident open`.
3. An incident commander is designated.
4. A scribe records the timeline.
5. Mitigation precedes diagnosis — restore service first, understand later.
6. A blameless post-mortem is published within five business days.

---

## 54. Disaster Recovery Philosophy

Disaster recovery is a **practiced capability**, not a theoretical document.

- **RPO** (Recovery Point Objective) and **RTO** (Recovery Time Objective) are defined per service tier.
- **Backups** are encrypted, immutable, and tested through periodic restore drills.
- **Cross-region replication** is the long-term posture for tier-zero services.
- **Game days** exercise failure modes quarterly.

---

## 55. Performance Optimization Strategy

Performance is treated as a **feature**, not a finishing step.

- Performance budgets are defined for every user-facing surface and enforced in CI.
- Backend services publish latency histograms with explicit percentile targets.
- Hot paths are profiled before optimization; no premature micro-optimization.
- Capacity planning is data-driven, sourced from production telemetry.

---

## 56. Lighthouse and Performance Audits

Lighthouse CI is wired into the pipeline via `lighthouserc.json`. Every pull request that touches a frontend surface produces a Lighthouse report; regressions against the configured budgets block the merge.

```bash
pnpm lighthouse
```

Budgets are defined for Performance, Accessibility, Best Practices, and SEO. Accessibility is non-negotiable: a score below the threshold is a blocking failure.

---

## 57. Future Roadmap

The roadmap is divided into three horizons. Each horizon answers a different question: *what must we ship*, *what must we strengthen*, and *what must we reimagine*.

---

## 58. Version 1 Goals — *Foundation*

- Solidify the monorepo, CI/CD pipeline, and shared package layer.
- Standardize every service on the schema-first API pattern.
- Achieve 80%+ test coverage on tier-zero services.
- Codify all runbooks for production services.
- Reach sub-five-minute CI feedback on the median pull request.

---

## 59. Version 2 Goals — *Platformization*

- Migrate the runtime substrate to **Kubernetes** with progressive delivery.
- Adopt **Terraform** as the source of truth for cloud topology.
- Stand up the **OpenTelemetry collector** as the canonical telemetry pipeline.
- Introduce a **service mesh** for mTLS, traffic shaping, and policy enforcement.
- Expose **self-service environment provisioning** through the IDP CLI.

---

## 60. Version 3 Goals — *Distribution*

- **Multi-region active-active** deployment for tier-zero services.
- **Edge compute** for latency-sensitive user journeys.
- **AI infrastructure orchestration** — model serving, inference pipelines, evaluation harnesses — as a first-class platform capability.
- **Cell-based architecture** for blast-radius containment.
- **Chaos engineering** as a continuous practice, not a quarterly exercise.

---

## 61. Enterprise Scaling Vision

The long-horizon vision is an **internal developer platform** that abstracts the entire infrastructure substrate behind a typed, declarative interface. An engineer should be able to describe an intent — *"I need a service that consumes from this topic, writes to this database, and exposes this API"* — and the platform should produce the scaffolding, the deployment manifests, the dashboards, the alerts, and the runbook stubs. Infrastructure becomes a compiler target; the engineer writes the program.

This vision is anchored by:

- **A unified control plane** for environments, services, and policies.
- **Golden paths** that encode the org's accumulated operational wisdom.
- **Federated identity and authorization** across all platform surfaces.
- **Policy-as-code** enforced at admission time.
- **Cost observability** as a first-class signal.

---

## 62. Contributing Guidelines

Contributions are welcomed from every engineer within the organization. The contribution lifecycle is:

1. Open or claim a ticket describing the intent.
2. Branch from `main` with a descriptive branch name.
3. Implement the change with accompanying tests and documentation.
4. Open a pull request with a Conventional Commit title and a populated PR template.
5. Address review feedback iteratively.
6. Merge once CI is green and a CODEOWNER has approved.

External contributions are not currently accepted — the repository is internal to the Baalvion organization.

---

## 63. Internal Team Standards

| Standard | Expectation |
|---|---|
| Commit messages | Conventional Commits, imperative mood |
| PR size | Ideally < 400 lines changed |
| Review SLA | First response within one business day |
| Test coverage | No net regression on changed files |
| Documentation | Every public API documented |
| Telemetry | Every endpoint emits logs, metrics, traces |
| Ownership | Every directory has a CODEOWNER |
| Runbooks | Every service has a runbook |

---

## 64. License

This repository is **proprietary and confidential**. All rights are reserved by the Baalvion organization. No part of this repository — including source code, configuration, documentation, and architectural artifacts — may be reproduced, distributed, or transmitted in any form or by any means without prior written authorization from the Baalvion engineering leadership.

Unauthorized access, use, modification, or distribution is strictly prohibited and may result in civil and criminal penalties.

---

## 65. Copyright

© 2026 **Baalvion Organization** (`baalvionservice`). All rights reserved.

*Baalvion*, the Baalvion logo, and all related product and platform names are trademarks of the Baalvion organization. All other trademarks are the property of their respective owners.

---

<div align="center">

**Engineered with rigor. Operated with empathy. Scaled without heroics.**

*Baalvion Platform Engineering — building the substrate beneath the product.*

</div>
