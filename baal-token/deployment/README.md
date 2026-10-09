# deployment

No deployment capability exists in Phase 1.

- `src/guard.ts`: pure decision function; `allowed` is always `false`, with every failed gate listed.
- `src/config.ts`: network config validation.
- `src/preflight.ts`: loads and cross-checks all committed data.
- `src/deploy.ts`: CLI. `plan` prints the plan (no network). `deploy` always refuses (exit 2).

Mainnet gates (reported even though everything is refused): explicit `--network mainnet-beta` (not default, not env), genesis hash equal to mainnet-beta, exact typed phrase, not in CI, no signing material in the environment.
