# Security Policy

The security of the Baalvion platform and the data it processes is a
first-class engineering concern. This document explains how to report
vulnerabilities and what to expect from us in return.

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Report suspected vulnerabilities privately to **security@baalvion.com**, or via
GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
("Report a vulnerability" under the repository **Security** tab).

Please include, where possible:

- A description of the issue and its potential impact.
- The affected service, package, or frontend application and version/commit.
- Step-by-step reproduction (proof-of-concept, request/response samples, logs).
- Any suggested remediation.

## Our Commitment

| Stage                | Target                                  |
|----------------------|-----------------------------------------|
| Acknowledgement      | within **2 business days**              |
| Triage & severity    | within **5 business days**              |
| Fix or mitigation    | prioritized by CVSS severity            |
| Disclosure           | coordinated with the reporter           |

We will keep you informed throughout remediation and credit reporters who wish
to be acknowledged once a fix has shipped.

## Scope

In scope: backend services (`Backend/services/**`), shared packages
(`Backend/packages/**`), the auth gateway and identity stack, and the frontend
applications (`Frontend/**`).

Out of scope: findings that require physical access, social engineering,
denial-of-service via volumetric load, or vulnerabilities in third-party
dependencies already tracked upstream (report those to the upstream project,
and let us know so we can pin/upgrade).

## Safe Harbor

We will not pursue legal action against researchers who:

- Make a good-faith effort to avoid privacy violations, data destruction, and
  service degradation;
- Only interact with accounts they own or have explicit permission to test;
- Give us a reasonable opportunity to remediate before any public disclosure.

## Secrets & Sensitive Data

This repository must never contain live secrets. The following are
`.gitignore`d and are injected at deploy time via the environment or a secrets
manager:

- `.env` files, credentials, API keys, tokens
- Private keys / certificates (`*.pem`, `*.key`, `*.crt`, `*.p12`, `*.pfx`)
- Database dumps and snapshots

If you discover a committed secret, **treat it as compromised**: report it to
security@baalvion.com, rotate the credential immediately, and do not include the
value in any public communication.

## Supported Versions

Only the default branch (`main`) and the current production release line receive
security updates. Older branches and tags are archived and unsupported.
