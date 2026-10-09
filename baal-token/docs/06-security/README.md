# 06 Security

Controls implemented in Phase 1:

| Control                                                                                                                        | Where                               |
| ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| No chain/RPC/signer code; no blockchain dependencies; no install scripts                                                       | tests/policy.test.ts                |
| Deployment refused unconditionally; refused in CI; refused when signing-material env vars exist (names reported, never values) | deployment/src/guard.ts             |
| Mainnet: explicit `--network mainnet-beta` only (never default/env), genesis-hash check, exact typed phrase                    | deployment/src/guard.ts             |
| Genesis hashes pinned in code, not just config                                                                                 | deployment/src/config.ts            |
| Config rejects secret-like fields/values, credentialed RPC URLs, unknown fields                                                | deployment/src/config.ts            |
| Mainnet config inert (no RPC URL, no mint, disabled)                                                                           | config/mainnet.json                 |
| Secret scanning: local Solana-aware scanner + gitleaks (CI)                                                                    | security/, scripts/scan-secrets.ts  |
| `.gitignore` for env files, keys, keypairs, wallets, seed material                                                             | .gitignore                          |
| CI policy: no deploy/mint/signing/mainnet/secrets/manual trigger/OIDC in workflows                                             | ci/workflow-policy.ts               |
| Least-privilege CI (`contents: read`), pinned toolchain, frozen lockfile, dependency audit, CodeQL                             | .github/workflows/baal-token-ci.yml |

See also [threat model](../../security/threat-model.md) and [key management policy](../../security/key-management-policy.md). **No independent audit has been performed.**
