# ADR 0009 — ISO 8583 scheme integration (codec + ASCII link + adapters)

**Status:** Accepted (live connectivity gated on certification)

## Context
NIP/Interswitch settle over ISO 8583. The message format and link framing are public and
implementable offline; live connectivity needs scheme certification, keys/HSMs, and TLS certs.

## Decision
- `Iso8583Codec` — a real ASCII-variant codec: MTI, primary + secondary hex bitmap, and
  FIXED / LLVAR / LLLVAR data elements with a field registry (PAN, processing code, amount,
  STAN, RRN, response code, terminal/merchant, currency, account ids…). Pure, unit-tested
  (`Iso8583CodecTest` round-trips incl. the secondary bitmap).
- `Iso8583Client` — TCP client with the common 2-byte length-prefix framing and connect/read
  timeouts (the seam for TLS + persistent connections at certification).
- `AbstractIso8583SchemeAdapter` — builds a real 0200 from `SchemeRequest` (amount in minor
  units via the currency's fraction digits, ISO numeric currency, STAN/RRN, datetime fields,
  account ids), exchanges it, parses the 0210, and approves on response code "00" (returns
  RRN) else throws (router resilience applies).
- `InterswitchSchemeAdapter` / `NipSchemeAdapter` — `@ConditionalOnProperty` on their endpoint
  host, so they are active **only when configured**; otherwise the simulated fallback handles
  the scheme. Identifiers are config; credentials/keys come from the secret store.
- The `SchemeAdapter` SPI was widened to `SchemeRequest` (amount, currency, accounts,
  reference) so adapters have the context to build real messages.

## Consequences
- The codec and adapters are real, reviewable, and unit-tested offline.
- PIN-block/MAC fields are deliberately omitted — they require the scheme's HSM/keys and are
  added at certification via a `MacProvider` seam. Card schemes (Visa/Mastercard) use
  proprietary, certified stacks + tokenized PANs and remain an onboarding gate; the SPI is ready.
