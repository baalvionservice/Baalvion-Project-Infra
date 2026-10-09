import { REPO_ROOT, ValidationError } from '../token/src/guards.ts';
import { describePlan, runPreflight } from '../deployment/src/preflight.ts';

try {
  const result = runPreflight(REPO_ROOT);
  console.log(describePlan(result).join('\n'));
  console.log('\nOK: allocation, metadata and network configs are valid and consistent.');
} catch (error) {
  console.error(
    error instanceof ValidationError || error instanceof Error ? error.message : String(error),
  );
  process.exitCode = 1;
}
