# baal-token

Engineering repository for **BAAL**, a planned global token associated with the broader Baalvion vision.

> **Status: Phase 1. Nothing is deployed and BAAL does not exist.**
> This package contains specifications, validators, tests, safety guards and an informational website skeleton. It has no RPC client, no signer, no key-reading code and no deployment capability, and tests enforce that.

BAAL does not represent equity, ownership, revenue rights, or assets of Baalvion unless a future legally valid structure explicitly establishes such rights.

## Approved design (Phase 0)

Classic Solana SPL Token, 1,000,000,000 fixed supply, 9 decimals, mint authority to be permanently revoked, no freeze authority, no custom program in v1, no public sale. Allocation and vesting are in [token/allocation.json](token/allocation.json), the single source of truth. Reasoning is in [docs/01-architecture/adr](docs/01-architecture/adr/).

## Layout

| Path                                                         | Purpose                                                                                                                     |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `token/`                                                     | `allocation.json`, `metadata.json`, `treasury-policy.json`; validators, vesting calculator and supply model in `token/src/` |
| `deployment/`                                                | Network config validation, the deployment safety gate, and a CLI that always refuses in Phase 1                             |
| `contracts/`                                                 | Intentionally empty (ADR-004)                                                                                               |
| `config/`                                                    | `devnet.json`, and `mainnet.json` (inert)                                                                                   |
| `tests/`                                                     | Unit and integration tests, including negative tests                                                                        |
| `scripts/`                                                   | `validate`, `scan-secrets`, `check-workflows`, `build-website`                                                              |
| `security/`                                                  | Secret scanner, gitleaks config, threat model, key policy                                                                   |
| `ci/`                                                        | Workflow policy checker (no deployment path may exist)                                                                      |
| `website/`                                                   | Static informational site (no JavaScript, no wallet connection)                                                             |
| `docs/`, `operations/`, `monitoring/`, `legal/`, `branding/` | Documentation and planning placeholders                                                                                     |

### Deviations from the requested structure

1. **Source code placement.** Code lives next to what it validates (`token/src`, `deployment/src`, `security/src`, `ci/`) rather than in a separate `src/`.
2. **CI workflow location.** GitHub only runs workflows from the repository root's `.github/workflows`. While this package lives inside the Baalvion monorepo, its workflow is `.github/workflows/baal-token-ci.yml` at the monorepo root (path-filtered to `baal-token/**`). If extracted into its own repository, move it to `baal-token/.github/workflows/`; `scripts/check-workflows.ts` finds it in either place. `ci/` holds the policy checker instead.
3. **Standalone package.** `baal-token/` is deliberately outside the monorepo's pnpm workspace globs, has its own `pnpm-workspace.yaml` and `pnpm-lock.yaml`, and does not touch the monorepo's dependencies.
4. **No TypeScript build step.** Node 24+ runs `.ts` directly (type stripping) and `tsc --noEmit` type-checks. "Build" generates and verifies the static website.
5. **Docs inside `docs/`** follow the requested 00-13 numbering; ADRs are under `docs/01-architecture/adr/`.

## Commands

```bash
pnpm install --frozen-lockfile
pnpm run verify          # format, lint, typecheck, tests, secret scan, workflow policy, build
pnpm run validate        # allocation + metadata + configs, cross-checked
node deployment/src/deploy.ts plan      # print the plan (no network)
node deployment/src/deploy.ts deploy    # always refuses in Phase 1
```

Toolchain: Node >= 24 (verified on 26.5.0), pnpm 9.15.0, TypeScript 5.9, ESLint 9, Prettier 3. The only dependencies are dev tools; the runtime has none.

## Rules that must not be relaxed without a recorded decision

- No private key, seed phrase or keypair path in the repository, environment or CI.
- No automated Mainnet deployment, ever (ADR-005). Production signing is human, hardware-wallet, outside CI.
- No fabricated stats, partners, users, volume or activity anywhere, including the website.
