# ADR-0001: Federated monorepo (not multi-repo, not classic monolith repo)

**Status:** Accepted · **Date:** 2026-05-26 · **Deciders:** Architecture, Platform Core

## Context
Baalvion is a multi-business group sharing one repo. We need independently
deployable services with clear ownership, but also cheap cross-cutting changes
and one shared platform layer. The repo already uses pnpm workspaces + Turbo
(`packages/* + Backend/* + Frontend/*`).

## Decision
Keep a **federated monorepo**: one repository, many independently deployable
units, governed by a **service catalog** + **CODEOWNERS** + **per-service CI/CD**.

- Shared platform code lives in `packages/*` (versioned `workspace:*`).
- Each service owns its build, image, DB, deploy and on-call.
- Boundaries are enforced by code (CODEOWNERS, buf breaking-change gate, catalog
  referential-integrity gate) — not by repo walls.

## Alternatives
- **Multi-repo:** strongest isolation, but cross-cutting platform changes become
  N coordinated PRs; dependency drift; weaker atomicity. Rejected for our team size.
- **Classic monolith repo (status quo):** no deploy isolation, no ownership
  boundaries. Rejected — it's the problem.

## Consequences
- (+) Atomic refactors across contract + producers + consumers in one PR.
- (+) One toolchain, one CI, shared packages with instant propagation.
- (−) Requires discipline (Turbo affected-graph builds, CODEOWNERS, catalog gates)
  to avoid the monorepo becoming a coupling magnet. We accept + tool against it.
- Build isolation via Turbo `--filter` (affected only); deploy isolation via the
  ArgoCD ApplicationSet (per-service apps).
