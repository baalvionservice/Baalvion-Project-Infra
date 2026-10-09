# config

- `devnet.json`: the default network. Public RPC URL only; API-keyed endpoints go in `DEVNET_RPC_URL` (see `.env.example`).
- `mainnet.json`: **inert**. No RPC URL, no mint, `deploymentEnabled: false`, `ciExecutionAllowed: false`. Selecting it requires `--network mainnet-beta`, genesis-hash verification and the typed confirmation, and Phase 1 still refuses.

Both are validated by `deployment/src/config.ts` (strict fields, pinned genesis hashes, no secret-shaped content).
