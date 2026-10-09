# 08 Verification

After a real launch, anyone must be able to verify, from a block explorer or RPC, without trusting the project:

- Token program is the classic SPL Token program.
- Decimals = 9; raw supply = 1,000,000,000,000,000,000.
- Mint authority = none; freeze authority = none.
- The mint address matches the one on the website's verify page and in the project's official channels.
- Allocation wallet balances match `allocation.json`.

Until launch, the website's verify page shows explicit placeholders and never a fabricated address. Verification of the _repository_ today: `pnpm run verify`.
