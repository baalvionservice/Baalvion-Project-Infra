# LEN article style guide

Applies to article bodies published on Law Elite Network (Legal, Entertainment, Sports).
Governs prose, structure and formatting only. It does not relax the sourcing, accuracy
and stance rules in `law-elite-entertainment-charter.proposed.json` (banned claims,
required disclosure of what's unknown, quote verification, etc.) — those still apply
on top of this guide.

## Headline & structure

- Don't force every article into the same skeleton (intro → key takeaways → "what is
  X" → conclusion). The right structure depends on the topic.
- Use `##`/`###` to break up long sections, but don't add a subheading after every
  paragraph — let prose run when it can.
- Section headings should describe what the section says, not label its function.
  Avoid "Introduction", "Overview", "In Summary", "Conclusion" as headings.

## Lists

- Numbered lists only for genuinely sequential content: timelines, step-by-step
  instructions, rankings.
- Bullets for unordered collections: takeaways, spec lists, pros/cons, entity
  summaries. Keep bulleted lists to 3–6 items.
- Vary list-item length and format — mix short one-liners with a longer bold-lead
  item where it earns it. Don't make every item the same shape.

## Visual formatting

- Bold 1–2 key phrases per section at most, not every sentence.
- Put a callout / key-takeaways block near the top for quick-reference pieces;
  midway or within a sub-section for analytical deep-dives.
- Turn multi-variable comparisons or specs into a Markdown table instead of a long
  bulleted list.

## Tone & flow

- Open with the central fact or claim, not a meta-introduction ("In this article,
  we will discuss...").
- Vary paragraph length: 1–2 sentence beats for emphasis, 3–4 sentence paragraphs
  for explanation.
- End on a concrete takeaway or next step, not a heading called "Conclusion".

## Status

Adopted 2026-09-27. Studio (`src/lib/editorial/analyze.ts`) flags the two most
mechanically checkable violations (formulaic section headers, meta-introduction
openings) as warnings; the rest is editorial judgment applied at review, not
automatically enforced.
