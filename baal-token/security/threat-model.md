# Threat model (Phase 1 scope)

| Threat                                         | Mitigation                                                     | Residual                                                                     |
| ---------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Secret committed (key, seed, keypair, RPC key) | `.gitignore`, local scanner, gitleaks, config validator, tests | Human could paste a secret in an unscanned form; push protection recommended |
| CI compromise leading to launch                | No deploy path, policy check, no secrets, read-only token      | Workflow edits are code-reviewed by humans only                              |
| Dependency compromise                          | Dev-only deps, frozen lockfile, audit, no install scripts      | Dev tooling still executes locally                                           |
| Config tampering re-pointing a network         | Genesis hashes pinned in code, strict schema                   | Needs review of code changes                                                 |
| Accidental launch from a developer machine     | No chain code exists; guard refuses                            | Later phases must re-evaluate                                                |
| Website abuse (fake address, wallet drain)     | Static pages, no JS, no wallet code, tests forbid addresses    | Hosting/DNS/Cloudflare security not yet designed                             |
| Wrong allocation maths                         | Integer-only, exact validation, pinned approved values         | Spec interpretation risks listed in vesting.md                               |

Out of scope until later phases: on-chain attacks, key ceremony, hosting, insider threats at launch.
