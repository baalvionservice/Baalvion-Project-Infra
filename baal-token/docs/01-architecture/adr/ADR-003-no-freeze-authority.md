# ADR-003: No freeze authority

**Status:** Accepted (Phase 0, founder-approved). **Date:** 2026-10-04.

## Context

A freeze authority can freeze any holder's token account. That is a centralised power over holders and a high-value attack target.

## Decision

The mint is created without a freeze authority. Configs require `freezeAuthority: null` and the validator rejects anything else.

## Consequences

- Nobody can freeze, or be compelled by technical means to freeze, holders' balances.
- Stolen or mis-sent tokens cannot be frozen either. Incident response relies on prevention and communication, not freezing.
- Not reversible after mint creation; if the legal analysis ever requires a freeze capability, that means a new token, not an edit.
