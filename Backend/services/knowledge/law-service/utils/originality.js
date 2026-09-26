'use strict';
// Measures how much of a text is copied word-for-word from a source. Facts
// (dates, names, titles) are not copyrightable, but sentences are, and search
// engines and AdSense treat copied sentences as duplicate content.
const words = (s) => String(s || '').toLowerCase().match(/[a-z0-9’']+/g) || [];

function overlap(text, source) {
    const t = words(text);
    const src = ' ' + words(source).join(' ') + ' ';
    const grams = (n) => Array.from({ length: Math.max(0, t.length - n + 1) }, (_, i) => t.slice(i, i + n).join(' '));
    const g6 = grams(6);
    const copied6 = g6.filter((g) => src.includes(' ' + g + ' ')).length;

    let longest = 0;
    let longestText = '';
    for (let i = 0; i < t.length; i++) {
        let j = i + longest + 1;
        while (j <= t.length && src.includes(' ' + t.slice(i, j).join(' ') + ' ')) {
            longest = j - i;
            longestText = t.slice(i, j).join(' ');
            j++;
        }
    }
    return { sixGramPct: g6.length ? Math.round((100 * copied6) / g6.length) : 0, longestRun: longest, longestText };
}

// Limits a reviewed biography must stay under against every cited source.
const LIMITS = { sixGramPct: 8, longestRun: 10 };

const passes = (r) => r.sixGramPct <= LIMITS.sixGramPct && r.longestRun <= LIMITS.longestRun;

module.exports = { overlap, passes, LIMITS };
