// Policy check for CI workflow files: there must be no way for CI to deploy,
// mint, sign, or touch Mainnet (ADR-005). This is a text-level check on
// purpose: it fails closed on anything that even looks like deployment.

export interface PolicyViolation {
  readonly line: number;
  readonly rule: string;
}

interface PolicyRule {
  readonly id: string;
  readonly re: RegExp;
}

const RULES: readonly PolicyRule[] = [
  {
    id: 'solana-cli-mutation',
    re: /\bsolana\s+(program\s+deploy|transfer|airdrop|program\s+write-buffer)\b/i,
  },
  {
    id: 'spl-token-cli-mutation',
    re: /\bspl-token\s+(create-token|mint|authorize|transfer|burn|create-account)\b/i,
  },
  { id: 'keygen', re: /\bsolana-keygen\b/i },
  { id: 'anchor-deploy', re: /\banchor\s+(deploy|migrate|upgrade)\b/i },
  { id: 'deploy-script-invocation', re: /deployment\/src\/deploy\.ts/i },
  { id: 'secret-reference', re: /\$\{\{\s*secrets\.(?!GITHUB_TOKEN\b)/ },
  { id: 'secrets-passthrough', re: /\$\{\{\s*secrets\s*[}[]|secrets:\s*inherit/ },
  { id: 'mainnet-reference', re: /mainnet/i },
  { id: 'deploy-job-or-step', re: /^\s*-?\s*(name|id):\s*.*\b(deploy|release|publish|mint)\b/i },
  { id: 'manual-trigger', re: /^\s*workflow_dispatch\s*:/ },
  { id: 'environment-gate', re: /^\s*environment\s*:/ },
  { id: 'id-token-write', re: /^\s*id-token\s*:\s*write/ },
];

export function checkWorkflowText(text: string): PolicyViolation[] {
  const violations: PolicyViolation[] = [];
  text.split(/\r?\n/).forEach((line, index) => {
    if (/^\s*#/.test(line)) return;
    for (const rule of RULES) {
      if (rule.re.test(line)) violations.push({ line: index + 1, rule: rule.id });
    }
  });
  return violations;
}
