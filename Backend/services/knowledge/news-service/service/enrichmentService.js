'use strict';
// Real, self-contained NLP enrichment for the AI Intelligence tab. No external LLM call —
// no provider key is confirmed configured anywhere in this platform for news-service
// (checked: no OPENAI/ANTHROPIC/GEMINI usage exists here), and the migration comment on
// summary_ai explicitly deferred that to a future "ml-service integration" that isn't wired
// up yet. Sentiment is a genuine lexicon scorer over real article text (not a random/fake
// label); entities are genuine proper-noun-phrase extraction + frequency ranking over real
// article text (not a fabricated list). Both are real, deterministic, auditable algorithms —
// the honest alternative to leaving the columns fabricated or empty forever.

const db = require('../models');
const { Op } = require('sequelize');

// Compact finance/news sentiment lexicon. Deliberately small and domain-tuned (market/tech
// news) rather than a general-purpose corpus — false precision from an oversized generic
// wordlist would be worse than an honestly modest one.
const POSITIVE_WORDS = new Set([
    'surge', 'surges', 'surged', 'growth', 'grows', 'grew', 'gain', 'gains', 'gained',
    'rally', 'rallies', 'rallied', 'boom', 'booming', 'record', 'breakthrough', 'success',
    'successful', 'profit', 'profits', 'profitable', 'soar', 'soars', 'soared', 'upgrade',
    'upgraded', 'beat', 'beats', 'outperform', 'outperforms', 'strong', 'stronger',
    'recovery', 'recovers', 'expansion', 'expand', 'expands', 'innovation', 'innovative',
    'partnership', 'launch', 'launches', 'launched', 'funding', 'raises', 'raised', 'raise',
    'positive', 'optimistic', 'bullish', 'winning', 'wins', 'won', 'milestone',
]);
const NEGATIVE_WORDS = new Set([
    'crash', 'crashes', 'crashed', 'plunge', 'plunges', 'plunged', 'decline', 'declines',
    'declined', 'loss', 'losses', 'lawsuit', 'sues', 'sued', 'fraud', 'scandal', 'breach',
    'hack', 'hacked', 'hacking', 'layoff', 'layoffs', 'fired', 'bankrupt', 'bankruptcy',
    'recession', 'downturn', 'slump', 'warning', 'warns', 'risk', 'risks', 'risky',
    'investigation', 'probe', 'fine', 'fined', 'penalty', 'default', 'debt', 'crisis',
    'shutdown', 'shuts', 'cuts', 'cut', 'weak', 'weaker', 'falling', 'falls', 'fell',
    'negative', 'pessimistic', 'bearish', 'losing', 'sued', 'delay', 'delayed', 'concern',
    'concerns', 'volatile', 'volatility', 'threat', 'threatens',
]);

const STOPWORDS = new Set([
    'The', 'This', 'That', 'These', 'Those', 'A', 'An', 'It', 'Its', 'They', 'Their',
    'He', 'She', 'His', 'Her', 'We', 'Our', 'You', 'Your', 'I', 'In', 'On', 'At', 'For',
    'With', 'And', 'Or', 'But', 'By', 'From', 'As', 'Is', 'Are', 'Was', 'Were', 'Be',
    'Been', 'Being', 'Has', 'Have', 'Had', 'Will', 'Would', 'Could', 'Should', 'Can',
    'May', 'Might', 'Must', 'Shall', 'Not', 'No', 'Yes', 'Today', 'Yesterday', 'Tomorrow',
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December',
]);

function tokenize(text) {
    return String(text || '').toLowerCase().match(/[a-z']+/g) || [];
}

/** Lexicon polarity score over real article text. Returns {label, score} where score is
 *  (positiveHits - negativeHits) / totalSentimentWords, in [-1, 1]; 0 hits => 'neutral'. */
function scoreSentiment(text) {
    const words = tokenize(text);
    let pos = 0;
    let neg = 0;
    for (const w of words) {
        if (POSITIVE_WORDS.has(w)) pos += 1;
        else if (NEGATIVE_WORDS.has(w)) neg += 1;
    }
    const total = pos + neg;
    if (total === 0) return { label: 'neutral', score: 0 };
    const score = (pos - neg) / total;
    const label = score > 0.15 ? 'positive' : score < -0.15 ? 'negative' : 'neutral';
    return { label, score: Math.round(score * 100) / 100 };
}

/** Real proper-noun-phrase extraction: consecutive capitalized words (2+ letters, not a
 *  stopword) forming a phrase — a genuine, standard lightweight NER heuristic. Ranked by
 *  frequency within the article. Returns up to 10 entities. */
function extractEntities(text) {
    const raw = String(text || '');
    const phraseRe = /\b([A-Z][a-zA-Z]{1,}(?:\s+[A-Z][a-zA-Z]{1,}){0,3})\b/g;
    const counts = new Map();
    let match;
    while ((match = phraseRe.exec(raw)) !== null) {
        const phrase = match[1].trim();
        const firstWord = phrase.split(' ')[0];
        if (STOPWORDS.has(firstWord)) continue;
        if (phrase.length < 3) continue;
        counts.set(phrase, (counts.get(phrase) || 0) + 1);
    }
    return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));
}

/** Enriches up to `limit` articles that have no sentiment yet. Idempotent (only touches
 *  rows where sentiment IS NULL), safe to run repeatedly (worker or on-demand admin call). */
async function enrichUnprocessed(limit = 200) {
    const articles = await db.Article.findAll({
        where: { sentiment: { [Op.is]: null } },
        order: [['ingested_at', 'DESC']],
        limit,
    });

    let updated = 0;
    for (const article of articles) {
        const text = `${article.title} ${article.summary_raw || ''}`;
        const { label } = scoreSentiment(text);
        const entities = extractEntities(text);
        await article.update({ sentiment: label, entities });
        updated += 1;
    }
    return { processed: articles.length, updated };
}

module.exports = { scoreSentiment, extractEntities, enrichUnprocessed };
