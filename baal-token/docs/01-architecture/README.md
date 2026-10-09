# 01 Architecture

```
token/allocation.json ─┐                       ┌─> website (generated tables)
token/metadata.json  ──┼─> validators/tests ───┤
config/{devnet,mainnet}.json ─┘                └─> deployment/ safety gate (always refuses in Phase 1)
```

- **Single source of truth:** `token/allocation.json`. Everything else (website tables, plan output, tests) derives from or is checked against it.
- **Integer arithmetic only:** amounts are BigInt base units or decimal strings; percentages are parsed to basis points. No floating point touches token quantities.
- **Strict parsing:** documents are validated as `unknown`; unknown fields, numbers-instead-of-strings and negative values are rejected.
- **No chain access:** the package has no RPC client, signer or SDK. The guard in `deployment/src/guard.ts` is pure (no I/O) and its decision type is `allowed: false` in Phase 1.
- **Inert Mainnet:** `config/mainnet.json` has no RPC URL, no mint, deployment disabled; it is validated but never used.

## Architecture decision records

| ADR                                                              | Decision                                               |
| ---------------------------------------------------------------- | ------------------------------------------------------ |
| [ADR-001](adr/ADR-001-classic-spl-token.md)                      | Classic SPL Token, not Token-2022                      |
| [ADR-002](adr/ADR-002-fixed-supply-revoked-mint.md)              | Fixed supply, mint authority revoked                   |
| [ADR-003](adr/ADR-003-no-freeze-authority.md)                    | No freeze authority                                    |
| [ADR-004](adr/ADR-004-no-custom-program-v1.md)                   | No custom program in v1                                |
| [ADR-005](adr/ADR-005-no-automated-mainnet-deployment.md)        | No automated Mainnet deployment                        |
| [ADR-006](adr/ADR-006-founder-vesting-interpretation.md)         | Founder/team vesting interpretation                    |
| [ADR-007](adr/ADR-007-unspecified-allocation-schedules.md)       | Unspecified allocation release schedules (TBD)         |
| [ADR-008](adr/ADR-008-vesting-enforcement-decision-framework.md) | Vesting enforcement decision framework (decision OPEN) |
| [ADR-009](adr/ADR-009-treasury-multisig.md)                      | Treasury multisig: 3-of-5, one independent signer      |
