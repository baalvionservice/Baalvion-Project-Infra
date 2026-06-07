Write-Host "Starting Full Build..."

pnpm build *> Reports/Builds/full-build.log
pnpm lint *> Reports/Lint/full-lint.log
pnpm test *> Reports/Tests/full-test.log
pnpm typecheck *> Reports/Typecheck/full-typecheck.log

Write-Host "All reports generated."
