# Changelog

All notable changes to this repository are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Repository governance suite: `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`,
  `CODE_OF_CONDUCT.md`, `SUPPORT.md`, `CHANGELOG.md`.
- GitHub community health files: pull-request template, issue forms, Dependabot
  configuration, and CodeQL code-scanning workflow.
- Repository configuration: `.editorconfig`, `.gitattributes`, `.nvmrc`.

### Changed
- Rewrote the root `README.md` into a clean architectural overview.
- Updated `CODEOWNERS` to the domain-based service paths
  (`Backend/services/<domain>/<service>`).
- Pointed CI triggers at the `main` trunk.

### Removed
- Untracked development scratch artifacts from the repository root.

## [2.0.0] — 2026

### Added
- Auth Foundation v1: centralized RS256 JWT authentication, auth gateway
  federation, Redis-backed sessions, multi-schema PostgreSQL, and RBAC
  foundation across the platform.
- Federated monorepo migration to the six-domain model
  (`commerce`, `ecosystem`, `identity`, `infrastructure`, `knowledge`,
  `platform`) with an enforced service-catalog architecture contract.

## [1.0.0]

### Added
- Initial platform bootstrap.

[Unreleased]: https://github.com/baalvionservice/Baalvion-Project-Infra/compare/V2.0.0...HEAD
[2.0.0]: https://github.com/baalvionservice/Baalvion-Project-Infra/releases/tag/V2.0.0
[1.0.0]: https://github.com/baalvionservice/Baalvion-Project-Infra/releases/tag/v1.0.0
