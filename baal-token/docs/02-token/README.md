# 02 Token

| Property         | Value                                                                         |
| ---------------- | ----------------------------------------------------------------------------- |
| Symbol / name    | BAAL / BAAL (name is a placeholder pending founder confirmation)              |
| Standard         | Classic SPL Token (`TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`)             |
| Decimals         | 9                                                                             |
| Total supply     | 1,000,000,000 BAAL = 10^18 base units                                         |
| Mint authority   | Revoked permanently after the one-time mint                                   |
| Freeze authority | None                                                                          |
| Metadata         | Draft in `token/metadata.json`; image and URL are placeholders until approved |
| Mint address     | None. No token exists.                                                        |

Machine-readable definition: [token/allocation.json](../../token/allocation.json). The metadata schema is enforced by `token/src/metadata.ts` (name <= 32 chars, symbol 2-10 uppercase, no promissory language, https-only URLs without credentials, placeholders forbidden once `published`).

BAAL does not represent equity, ownership, revenue rights, or assets of Baalvion.
