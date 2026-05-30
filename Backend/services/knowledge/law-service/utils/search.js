'use strict';
// Builds a SAFE, prefix-aware Postgres tsquery string from raw user input.
// Directory search is "as you type", so each token becomes a prefix match:
//   "ame sto"  ->  "ame:* & sto:*"   (matches "Amelia Stone")
// Non-alphanumerics are stripped (prevents tsquery syntax injection/errors), and
// the empty case returns null so callers can fall back to an unfiltered list.
function toPrefixTsQuery(raw) {
    if (raw == null) return null;
    const tokens = String(raw)
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ') // keep letters/digits across all scripts
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 10); // cap token count (cheap DoS guard)
    if (!tokens.length) return null;
    return tokens.map((t) => `${t}:*`).join(' & ');
}

module.exports = { toPrefixTsQuery };
