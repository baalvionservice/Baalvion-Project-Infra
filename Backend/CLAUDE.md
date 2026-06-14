# Backend AI Agent Instructions

## Primary Development Areas

Focus only on:

- services/
- packages/
- catalog/
- gateway/
- infra/
- database/

## Ignore Completely

Never inspect:

- node_modules/**
- .claude/**
- _reconcile/**
- coverage/**
- dist/**
- build/**
- .next/**
- .turbo/**

## Documentation Rules

Do not recursively scan markdown files.

Only read documentation when explicitly required.

Preferred documentation:

- docs/
- service README files
- architecture ADRs

Ignore:

- CHANGELOG.md
- HISTORY.md
- RELEASE_NOTES.md
- generated reports
- third-party package documentation

## Search Strategy

When investigating code:

1. Open package.json first
2. Open source code second
3. Open tests third
4. Open documentation only if necessary

Avoid repository-wide scans.


## Documentation Filtering

Read freely:

- ARCHITECTURE.md
- SYSTEM_MAP.md
- docs/**
- catalog/**
- packages/**/README.md
- services/**/README.md
- packages/auth-node/CONTRACT.md

Do not read unless explicitly requested:

- PENDING_WORK.md
- PENDING_WORK_SUMMARY.md
- TASKS.md
- EXECUTION_BACKLOG.md
- REPAIR_PLAN.md
- GAP_ANALYSIS.md
- ARCHITECTURE_FINDINGS.md
- RECONSTRUCTION.md
- MIGRATION.md
- INTEGRATION_SUMMARY.md
- CHANGELOG.md
- RUN_LOCAL.md

Avoid planning, audit, backlog, reconstruction, migration, and status-tracking documents during normal development work.


## Experimental / Reconciliation Layer (DO NOT USE)

The `_reconcile/` directory is a generated experimental sandbox containing:

- AI runtime experiments
- synthetic architecture replicas
- kubernetes/gitops simulations
- infrastructure prototypes

This folder is NOT production code.

Never:
- modify it
- use it as reference for backend design
- base implementation decisions on it

Only inspect if explicitly debugging reconciliation systems.