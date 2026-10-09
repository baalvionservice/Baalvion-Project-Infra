# Key management policy (draft, not yet approved)

1. No private key, seed phrase or keypair file is ever created by, stored in, or passed to this repository, its scripts or CI. Tooling must not read key files.
2. Production keys live only on hardware wallets; seed backups are offline, split and never digitised.
3. Mainnet actions need multiple humans and a documented, rehearsed procedure; the temporary mint authority is revoked in the same ceremony.
4. Devnet rehearsal keys are throwaway and kept outside the repository (`.gitignore` blocks common names, but is not a safety net).
5. Anyone who suspects exposure follows [12-incident-response](../docs/12-incident-response/README.md) immediately.

Treasury design: 3-of-5 multisig with at least one independent signer (ADR-009); signer roles and recovery requirements are in `token/treasury-policy.json`. Signers are not named and no key exists. Open: independence count, device models, custody locations, recovery procedures.
