# 07 Deployment

**Phase 1 cannot deploy.** `node deployment/src/deploy.ts deploy` always exits with code 2 and lists why. It has no RPC client or signer.

## Future ceremony (outline only, not implemented, not approved)

1. Devnet rehearsal with throwaway keys that never touch this repository.
2. Independent review of the exact launch procedure and parameters.
3. Legal review completed ([11-legal](../11-legal/README.md)).
4. Hardware-wallet signing, multiple people, outside CI, from a clean machine.
5. Verify RPC genesis hash equals Solana mainnet-beta; type the confirmation phrase.
6. Create mint (9 decimals, no freeze authority) -> mint 1,000,000,000 BAAL once -> revoke mint authority -> verify on-chain ([08-verification](../08-verification/README.md)).
7. Only then publish addresses.

Each step needs explicit founder approval in a later phase. Details: [operations/](../../operations/README.md).
