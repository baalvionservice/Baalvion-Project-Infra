import { REPO_ROOT } from '../token/src/guards.ts';
import { scanDirectory } from '../security/src/secret-scan.ts';

const findings = scanDirectory(REPO_ROOT);
if (findings.length > 0) {
  for (const f of findings) console.error(`${f.file}:${f.line} [${f.rule}]`);
  console.error(
    `\n${findings.length} potential secret(s) found. Matched text is intentionally not printed.`,
  );
  process.exitCode = 1;
} else {
  console.log('Secret scan clean.');
}
