import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkWorkflowText } from '../ci/workflow-policy.ts';
import { REPO_ROOT } from '../token/src/guards.ts';

/**
 * Workflow files live in the monorepo's .github/workflows (prefix
 * baal-token-) or, if this package is extracted into its own repository, in
 * its own .github/workflows.
 */
function workflowFiles(): string[] {
  const candidates = [
    join(REPO_ROOT, '..', '.github', 'workflows'),
    join(REPO_ROOT, '.github', 'workflows'),
  ];
  return candidates
    .filter((dir) => existsSync(dir))
    .flatMap((dir) =>
      readdirSync(dir)
        .filter(
          (f) => /\.ya?ml$/.test(f) && (dir.startsWith(REPO_ROOT) || f.startsWith('baal-token-')),
        )
        .map((f) => join(dir, f)),
    );
}

const files = workflowFiles();
if (files.length === 0) {
  console.error('No baal-token workflow found: expected .github/workflows/baal-token-ci.yml');
  process.exitCode = 1;
}
for (const file of files) {
  const violations = checkWorkflowText(readFileSync(file, 'utf8'));
  for (const v of violations) console.error(`${file}:${v.line} [${v.rule}]`);
  if (violations.length > 0) process.exitCode = 1;
}
if (process.exitCode !== 1)
  console.log(
    `Workflow policy OK (${files.length} file(s)): no deploy, mint, signing or mainnet path.`,
  );
