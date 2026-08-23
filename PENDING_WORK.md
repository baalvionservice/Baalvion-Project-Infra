# Pending Work

## Imperialpedia article structure de-templating (deferred — do later)

**Status:** Not started. Tracked here per explicit user instruction to defer it until after the current commit/PR lands.

**Context:** All 477 published Imperialpedia articles now have real-data, sourced content
(published via `Backend/services/knowledge/cms-service/scripts/publish-imperialpedia-content-rewrites.cjs`),
and a site-wide topic-matched author/reviewer/fact-checker byline
(via `Backend/services/knowledge/cms-service/scripts/assign-imperialpedia-contributors.cjs`).

A mechanical cleanup pass has already been run and published across all 477 articles: the
repeated `"real"/"genuinely"` filler adjective (was ~5,600 occurrences, now ~260 and all
legitimate — "real estate," "real-time," "real GDP," "real interest rate," etc.) and the
identical `"Insider move:"` callout label (now removed/varied) are fixed.

**What's still outstanding:** ~387 of the 477 articles (everything written before the
"no formulaic AI content" feedback landed mid-session) still share one identical paragraph
skeleton:

```
intro paragraph
  → H2
  → definition/mechanism paragraph
  → one callout-tip box
  → exactly two callout-info "Someone doing X:" persona boxes
  → H2 ("... the Real Way" style)
  → 3-item <ol> action list
  → closing paragraph with 1-2 internal links
```

This structural sameness across ~387 pages is a genuine content-quality issue distinct from
the word-choice tic already fixed — a script can safely strip a repeated word, but cannot
safely rewrite paragraph shape without a real risk of breaking meaning, so it needs the same
manual, per-article treatment given to the last ~90 articles written after the feedback (varied
openers, tables vs. prose vs. straight lists, varied/absent callouts, topic-specific insight
instead of a templated tip).

**Scope:** ~387 articles across every non-final category in
`Backend/services/knowledge/cms-service/scripts/publish-imperialpedia-content-rewrites.cjs`.
Realistically this is comparable in size to the batches already done for the later categories
in this session — i.e., a large multi-batch effort, not a quick pass.

**How to resume:** pick up the same workflow used for the later categories in this session —
draft a batch of rewrites with genuinely varied structure (no repeated skeleton, no filler
tic), `node --check` + duplicate-slug + tag-balance validation, then publish with a fresh
`CMS_TOKEN` from the user (each token is short-lived, ~15 min). The
`Backend/services/knowledge/cms-service/scripts/publish-imperialpedia-content-rewrites.cjs`
script already re-publishes the full `REWRITES` array on every run, so replacing an entry's
`body` in place and re-running is sufficient — no separate "which articles changed" tracking
needed.
