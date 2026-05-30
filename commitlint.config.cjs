/**
 * Conventional Commits enforcement.
 * Run in CI by .github/workflows/commitlint.yml (no local devDependency required).
 * See CONTRIBUTING.md for the commit message specification.
 */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Scope is free-form (service or package name, e.g. auth-service, pkg/auth-node).
    "scope-enum": [0],
    "scope-case": [0],
    // Allow longer bodies (e.g. trailers such as Co-Authored-By).
    "body-max-line-length": [0],
    "footer-max-line-length": [0],
    "header-max-length": [2, "always", 100],
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "perf",
        "refactor",
        "docs",
        "test",
        "build",
        "ci",
        "chore",
        "revert",
        "style",
      ],
    ],
  },
};
