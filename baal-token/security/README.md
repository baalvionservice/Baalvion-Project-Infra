# security

- `src/secret-scan.ts`: dependency-free scanner for Solana keypair arrays, base58 secret keys, seed phrases, PEM keys, tokens, credentialed URLs, assigned secrets and forbidden filenames. Run: `pnpm run scan:secrets`. Skip a line with `secret-scan:allow` (use sparingly and say why).
- `gitleaks.toml`: config for gitleaks in CI, with Solana-specific rules.
- [threat-model.md](threat-model.md), [key-management-policy.md](key-management-policy.md).

Enable GitHub secret-scanning push protection on the repository (a repository setting, not a file).
