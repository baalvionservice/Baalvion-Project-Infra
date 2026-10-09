# ci

`workflow-policy.ts` is a fail-closed text check run by `pnpm run check:workflows` and by tests. It rejects any workflow that mentions mainnet, deploy/mint/release steps, Solana/SPL/Anchor mutation commands, key generation, the deploy script, non-`GITHUB_TOKEN` secrets, `secrets: inherit`, `workflow_dispatch`, `environment:` gates or `id-token: write`.

The workflow itself is `.github/workflows/baal-token-ci.yml` at the monorepo root (see the repository README for why). Actions are pinned by major version tag; pinning by commit SHA is a recommended hardening step.
