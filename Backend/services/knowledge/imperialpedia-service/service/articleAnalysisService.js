'use strict';
/**
 * Local, deterministic heuristic engine behind POST /ai/article-analysis.
 *
 * Everything here runs with NO external dependency and NO database, so it is fully unit
 * testable and always available even when AI_API_KEY is unset (see aiService.js — the
 * controller layers an optional LLM-generated "related subtopics" pass on top of this when a
 * key is configured; this module never assumes one exists).
 *
 * Design constraints carried over from the product spec this implements:
 *   - Suggestions only. Nothing here rewrites the article or silently changes stored fields.
 *   - No fabricated facts, sources, or "you're missing X" claims beyond what the text itself
 *     shows — every "related topic" reported is a phrase actually present in the content.
 *   - No arbitrary keyword-density targets enforced as hard rules; flags describe the
 *     situation ("appears N times in close proximity") rather than dictate a number.
 */

const { detectClaims } = require('./claimDetectionService');

const STOPWORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'else', 'of', 'to', 'in', 'on', 'for',
    'with', 'without', 'by', 'at', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'this', 'that', 'these', 'those', 'it', 'its', 'you', 'your', 'yours', 'we', 'our', 'i', 'my',
    'they', 'their', 'he', 'she', 'his', 'her', 'them', 'do', 'does', 'did', 'can', 'could',
    'should', 'would', 'will', 'shall', 'may', 'might', 'must', 'not', 'no', 'so', 'than', 'too',
    'very', 'just', 'about', 'into', 'over', 'under', 'up', 'down', 'out', 'off', 'again',
    'further', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both',
    'each', 'few', 'more', 'most', 'other', 'some', 'such', 'only', 'own', 'same', 'what',
    'which', 'who', 'whom', 'have', 'has', 'had', 'having', 'am', 'get', 'gets', 'getting',
]);

const GENERIC_PHRASE_PATTERNS = [
    /\bit is important to (understand|note|remember|realize)\b/i,
    /\bin today'?s (world|market|economy|society)\b/i,
    /\bthere are many (things|factors|ways) to consider\b/i,
    /\bone of the most important (things|factors|aspects)\b/i,
    /\bas we all know\b/i,
    /\bneedless to say\b/i,
    /\bat the end of the day\b/i,
    /\bwhen it comes to\b/i,
    /\bin conclusion\b/i,
    /\bit goes without saying\b/i,
    /\bin order to\b/i,
    /\ba wide range of\b/i,
    /\bin this article\b/i,
    /\bwhether you are\b/i,
    /\blet'?s dive in\b/i,
    /\bin the world of\b/i,
];

const HOWTO_STEP_PATTERN = /(^|\n)\s*(step\s*\d+|[0-9]+[.)]\s)/im;

// --- Writing-signal thresholds (Prompt 2) ---
// Named and commented so they read as adjustable editorial judgment calls, not hidden magic
// numbers pretending to be scientific facts about "human" vs "AI" writing.
const TRANSITION_WORDS = [
    'however', 'therefore', 'furthermore', 'moreover', 'additionally', 'consequently',
    'in conclusion', 'first,', 'second,', 'finally,',
];
// A transition word used this many times per 1000 words (and at least this many times
// absolutely, so a short draft with one "however" isn't flagged) reads as overused.
const TRANSITION_OVERUSE_PER_1000_WORDS = 8;
const TRANSITION_OVERUSE_MIN_COUNT = 4;
// Sentence-length distribution: "very short" / "very long" cutoffs, and how much of the
// article needs to fall in one bucket before we call the distribution unusually clustered.
const VERY_SHORT_SENTENCE_WORDS = 6;
const VERY_LONG_SENTENCE_WORDS = 30;
const UNUSUAL_CLUSTER_RATIO = 0.4;
// Punctuation: occurrences per 1000 words before a mark is called unusually frequent.
const SEMICOLON_PER_1000_WORDS = 4;
const COLON_PER_1000_WORDS = 6;
const PARENTHETICAL_PER_1000_WORDS = 6;
// Internal-similarity: shingle (n-word run) size and the Jaccard-overlap floor that earns a
// "similar passage" flag against another published article.
const SHINGLE_SIZE = 8;
const INTERNAL_SIMILARITY_JACCARD_FLOOR = 0.12;
const INTERNAL_SIMILARITY_MIN_SHARED_SHINGLES = 6;

function tokenizeWords(text) {
    return (text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s'-]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);
}

function splitSentences(text) {
    return (text || '')
        .replace(/\n+/g, ' ')
        .split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/)
        .map((s) => s.trim())
        .filter(Boolean);
}

function splitParagraphs(text) {
    return (text || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

function countSyllables(word) {
    const w = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!w) return 0;
    const matches = w.match(/[aeiouy]+/g);
    let count = matches ? matches.length : 1;
    if (w.endsWith('e') && count > 1) count -= 1;
    return Math.max(1, count);
}

function ngrams(words, n) {
    const out = [];
    for (let i = 0; i <= words.length - n; i++) out.push(words.slice(i, i + n).join(' '));
    return out;
}

/** Frequency map of non-stopword n-grams (1..3 words), used for topic detection. */
function phraseFrequency(text, maxN = 3) {
    const words = tokenizeWords(text);
    const freq = new Map();
    for (let n = 1; n <= maxN; n++) {
        for (const phrase of ngrams(words, n)) {
            const parts = phrase.split(' ');
            // Skip phrases that are entirely stopwords, or start/end on one (avoids
            // "the emergency" / "emergency the"-style fragments).
            if (parts.every((p) => STOPWORDS.has(p))) continue;
            if (STOPWORDS.has(parts[0]) || STOPWORDS.has(parts[parts.length - 1])) continue;
            if (parts.some((p) => p.length <= 1)) continue;
            freq.set(phrase, (freq.get(phrase) || 0) + 1);
        }
    }
    return freq;
}

/**
 * Detects the article's likely primary topic from title + body. Prefers a phrase that is
 * both present in the title and repeated in the body — never invents a topic the text
 * doesn't contain.
 */
function detectPrimaryTopic(title, content) {
    const titleFreq = phraseFrequency(title, 4);
    const bodyFreq = phraseFrequency(content, 4);
    if (!titleFreq.size) return { topic: null, confidence: 'low' };

    let best = null;
    let bestScore = 0;
    for (const [phrase, titleCount] of titleFreq) {
        const bodyCount = bodyFreq.get(phrase) || 0;
        // Favor longer, more specific phrases; require the phrase to also appear in the body.
        const score = phrase.split(' ').length * 10 + bodyCount * 3 + titleCount;
        if (bodyCount > 0 && score > bestScore) {
            best = phrase;
            bestScore = score;
        }
    }
    if (!best) {
        // Nothing from the title recurs in the body yet — still surface the title's core
        // phrase (longest non-stopword n-gram) but mark confidence low.
        const longest = [...titleFreq.keys()].sort((a, b) => b.split(' ').length - a.split(' ').length)[0];
        return { topic: longest || null, confidence: 'low' };
    }
    const bodyCount = bodyFreq.get(best) || 0;
    const confidence = bodyCount >= 4 ? 'high' : bodyCount >= 2 ? 'medium' : 'low';
    return { topic: best, confidence };
}

/**
 * Related topics = other frequently-recurring non-stopword phrases in the body, distinct
 * from the primary topic. These describe what the article ALREADY covers — this module never
 * asserts a topic is missing, since that would require external knowledge this heuristic
 * doesn't have (the AI-enhancement layer in the controller can add genuine gap suggestions
 * when a provider key is configured).
 */
function detectRelatedTopics(content, primaryTopic, limit = 8) {
    const freq = phraseFrequency(content, 3);
    const entries = [...freq.entries()]
        .filter(([phrase, count]) => count >= 2 && phrase !== primaryTopic && phrase.split(' ').length >= 2)
        .filter(([phrase]) => !primaryTopic || !primaryTopic.includes(phrase))
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);
    return entries.map(([phrase, count]) => ({ phrase, occurrences: count, status: 'covered' }));
}

const INTENT_RULES = [
    { intent: 'How-to', re: /^\s*how\s+(to|do|can|should|does)\b/i },
    { intent: 'Definition', re: /^\s*what\s+(is|are)\b|\bdefinition of\b|\bmeaning of\b/i },
    { intent: 'Comparison', re: /\bvs\.?\b|\bversus\b|\bcompar(e|ison|ing)\b/i },
    { intent: 'Commercial investigation', re: /\bbest\b.*\bfor\b|\btop\s+\d+\b|\breview(s)?\b/i },
    { intent: 'Transactional', re: /\bbuy\b|\bprice(s)?\b|\bcost(s)?\b|\bwhere to\b/i },
    { intent: 'Navigational', re: /\bofficial\b|\blogin\b|\bwebsite\b/i },
];

function detectSearchIntent(title) {
    for (const rule of INTENT_RULES) {
        if (rule.re.test(title || '')) return { intent: rule.intent, confidence: 'high' };
    }
    return { intent: 'Informational', confidence: 'medium' };
}

function assessIntentCoverage(intent, content) {
    if (intent === 'How-to') {
        const hasSteps = HOWTO_STEP_PATTERN.test(content || '');
        return hasSteps
            ? { coverage: 'Good', missing: null }
            : { coverage: 'Needs improvement', missing: 'Step-by-step implementation section' };
    }
    if (intent === 'Definition') {
        const hasEarlyDefinition = /^.{0,400}?\bis\b.{0,120}?[.]/is.test((content || '').slice(0, 500));
        return hasEarlyDefinition
            ? { coverage: 'Good', missing: null }
            : { coverage: 'Needs improvement', missing: 'A clear definition near the top of the article' };
    }
    if (intent === 'Comparison') {
        const hasComparisonStructure = /\bpros\b|\bcons\b|\btable\b|\bversus\b|\bvs\.?\b/i.test(content || '');
        return hasComparisonStructure
            ? { coverage: 'Good', missing: null }
            : { coverage: 'Needs improvement', missing: 'A direct side-by-side comparison section' };
    }
    return { coverage: 'Good', missing: null };
}

/** Markdown ATX headings only (## Heading) — matches this editor's plain-text/markdown content. */
function extractHeadings(content) {
    const lines = (content || '').split('\n');
    const headings = [];
    for (const line of lines) {
        const m = /^(#{1,6})\s+(.+)$/.exec(line.trim());
        if (m) headings.push({ level: m[1].length, text: m[2].trim() });
    }
    return headings;
}

function analyzeHeadingHierarchy(headings) {
    const issues = [];
    if (!headings.length) return issues;
    let prevLevel = null;
    const seen = new Map();
    for (const h of headings) {
        if (prevLevel !== null && h.level > prevLevel + 1) {
            issues.push(`Heading level skips from H${prevLevel} to H${h.level} at "${h.text}"`);
        }
        prevLevel = h.level;
        const key = h.text.toLowerCase();
        seen.set(key, (seen.get(key) || 0) + 1);
    }
    for (const [text, count] of seen) {
        if (count > 1) issues.push(`Heading "${text}" repeats ${count} times`);
    }
    return issues;
}

function detectRepeatedPhrases(content, minWords = 4, minOccurrences = 3) {
    const words = tokenizeWords(content);
    const freq = new Map();
    for (const phrase of ngrams(words, minWords)) {
        if (phrase.split(' ').every((p) => STOPWORDS.has(p))) continue;
        freq.set(phrase, (freq.get(phrase) || 0) + 1);
    }
    return [...freq.entries()]
        .filter(([, count]) => count >= minOccurrences)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([phrase, count]) => ({ phrase, occurrences: count }));
}

function detectRepeatedSentenceOpenings(content, minOccurrences = 3) {
    const sentences = splitSentences(content);
    // Track both a 1-word opener ("First, ...") and a 2-word opener ("This means...") since
    // repetitive discourse markers show up at either length, and prefer reporting the longer
    // match when both fire for the same sentences.
    const oneWord = new Map();
    const twoWord = new Map();
    for (const s of sentences) {
        const words = tokenizeWords(s).slice(0, 2);
        if (!words.length) continue;
        oneWord.set(words[0], (oneWord.get(words[0]) || 0) + 1);
        if (words.length === 2) {
            const key = words.join(' ');
            twoWord.set(key, (twoWord.get(key) || 0) + 1);
        }
    }
    const results = [];
    const coveredFirstWords = new Set();
    for (const [opener, count] of twoWord) {
        if (count >= minOccurrences) {
            results.push({ opener, occurrences: count });
            coveredFirstWords.add(opener.split(' ')[0]);
        }
    }
    for (const [opener, count] of oneWord) {
        if (count >= minOccurrences && !coveredFirstWords.has(opener)) results.push({ opener, occurrences: count });
    }
    return results;
}

function detectGenericPhrases(content) {
    const sentences = splitSentences(content);
    const found = [];
    for (const sentence of sentences) {
        for (const pattern of GENERIC_PHRASE_PATTERNS) {
            if (pattern.test(sentence)) {
                found.push(sentence.trim());
                break;
            }
        }
    }
    return found.slice(0, 8);
}

function detectEmDashFrequency(content) {
    const words = tokenizeWords(content);
    const count = ((content || '').match(/—/g) || []).length;
    if (!words.length) return { count: 0, per1000Words: 0, unusual: false };
    const per1000Words = (count / words.length) * 1000;
    return { count, per1000Words: Math.round(per1000Words * 10) / 10, unusual: per1000Words > 6 && count >= 5 };
}

function detectKeywordStuffing(content, topic) {
    if (!topic) return { occurrences: 0, per1000Words: 0, stuffed: false };
    const words = tokenizeWords(content);
    const re = new RegExp(`\\b${topic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const occurrences = ((content || '').match(re) || []).length;
    if (!words.length) return { occurrences, per1000Words: 0, stuffed: false };
    const per1000Words = (occurrences / words.length) * 1000;
    return { occurrences, per1000Words: Math.round(per1000Words * 10) / 10, stuffed: per1000Words > 15 && occurrences >= 6 };
}

function analyzeReadability(content) {
    const sentences = splitSentences(content).filter((s) => tokenizeWords(s).length > 0);
    const words = tokenizeWords(content);
    if (!sentences.length || !words.length) {
        return { fleschScore: null, avgSentenceLength: 0, longSentenceCount: 0, label: 'Not enough content' };
    }
    const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    const flesch = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;
    const longSentenceCount = sentences.filter((s) => tokenizeWords(s).length > 30).length;
    // This content targets educated adult readers, so we don't optimize purely for the
    // highest Flesch score — a 30-60 range (standard/fairly difficult) is treated as "Good".
    let label = 'Good';
    if (flesch < 20) label = 'Dense — consider shorter sentences in places';
    else if (flesch > 70) label = 'Simple — fine for an explainer, but check it isn\'t under-explaining';
    return {
        fleschScore: Math.round(flesch * 10) / 10,
        avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
        longSentenceCount,
        label,
    };
}

function detectQuestions(content, limit = 10) {
    return splitSentences(content)
        .filter((s) => s.trim().endsWith('?'))
        .slice(0, limit);
}

function analyzeTitle(title) {
    const issues = [];
    const len = (title || '').length;
    if (!title || !title.trim()) issues.push({ severity: 'CRITICAL', message: 'Missing title.' });
    else {
        const wordCount = tokenizeWords(title).length;
        if (len < 20) issues.push({ severity: 'WARNING', message: 'Title is quite short — consider adding specificity (a number, a qualifier, or the outcome the reader gets).' });
        if (len > 70) issues.push({ severity: 'WARNING', message: 'Title is long and may be truncated in search results (aim for roughly 50–60 characters).' });
        if (wordCount <= 2) issues.push({ severity: 'SUGGESTION', message: 'Title may be too broad. Consider narrowing it to the specific angle the article covers.' });
    }
    return { length: len, issues };
}

function suggestMetaDescription(existing, summary, content) {
    if (existing && existing.trim()) return { current: existing, suggestion: null, tooShort: existing.length < 70, tooLong: existing.length > 160 };
    const source = (summary && summary.trim()) || splitSentences(content)[0] || '';
    let suggestion = source.trim();
    if (suggestion.length > 157) suggestion = suggestion.slice(0, 157).replace(/\s+\S*$/, '') + '…';
    return { current: null, suggestion: suggestion || null, tooShort: false, tooLong: false };
}

function suggestMetaTitle(existing, title) {
    if (existing && existing.trim()) return { current: existing, suggestion: null, tooLong: existing.length > 60 };
    let suggestion = (title || '').trim();
    if (suggestion.length > 60) suggestion = suggestion.slice(0, 57).replace(/\s+\S*$/, '') + '…';
    return { current: null, suggestion: suggestion || null, tooLong: false };
}

function slugify(title) {
    return (title || '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}

function analyzeSlug(slug, title, status) {
    if (!slug) return null;
    // Stored slugs carry a trailing `-<timestamp>` suffix (see buildSlug in
    // articlesController.js) — strip it before comparing to the title-derived slug.
    const base = slug.replace(/-\d{10,}$/, '');
    const expected = slugify(title);
    const matches = !expected || base === expected || expected.startsWith(base) || base.startsWith(expected);
    if (matches) return null;
    return {
        current: slug,
        suggestion: expected,
        note: status === 'published'
            ? 'This article is already published — changing the slug would break its live URL. Do not change it automatically.'
            : 'Slug looks unrelated to the current title.',
    };
}

function escapeRegex(s) {
    return (s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Word/character/sentence/paragraph counts + the two averages the spec asks for. */
function computeLengthMetrics(content) {
    const wordCount = tokenizeWords(content).length;
    const charCount = (content || '').length;
    const sentences = splitSentences(content).filter((s) => tokenizeWords(s).length > 0);
    const paragraphs = splitParagraphs(content);
    const sentenceCount = sentences.length;
    const paragraphCount = paragraphs.length;
    const avgSentenceLength = sentenceCount ? Math.round((wordCount / sentenceCount) * 10) / 10 : 0;
    const avgParagraphLength = paragraphCount
        ? Math.round((paragraphs.reduce((sum, p) => sum + tokenizeWords(p).length, 0) / paragraphCount) * 10) / 10
        : 0;
    return { wordCount, charCount, sentenceCount, paragraphCount, avgSentenceLength, avgParagraphLength };
}

/**
 * Splits content into heading-delimited sections with a word count each. Used to tell a
 * "covered" subtopic (a heading with real content under it) from a "partial" one (a heading
 * declared but barely written) — never used to claim a concept is entirely missing, since a
 * heading's mere absence doesn't mean the concept isn't discussed in prose elsewhere.
 */
function extractHeadingSections(content) {
    const lines = (content || '').split('\n');
    const sections = [];
    let current = null;
    for (const line of lines) {
        const m = /^(#{1,6})\s+(.+)$/.exec(line.trim());
        if (m) {
            if (current) sections.push(current);
            current = { level: m[1].length, text: m[2].trim(), body: [] };
        } else if (current) {
            current.body.push(line);
        }
    }
    if (current) sections.push(current);
    return sections.map((s) => {
        const bodyText = s.body.join(' ');
        return {
            level: s.level,
            text: s.text,
            wordCount: tokenizeWords(bodyText).length,
            // Used by detectTemplateRepetition() to spot a definition-style opening repeated
            // mechanically across most sections — empty string when the section has no prose.
            firstSentence: splitSentences(bodyText)[0] || '',
        };
    });
}

/**
 * Rough proxy for "how much ground this topic normally needs to cover" — based only on
 * signals already detected in THIS article (how many related concepts, questions, and
 * headings it surfaces, plus its search intent), never on an external topic database.
 */
function estimateTopicComplexity({ relatedTopicCount = 0, questionCount = 0, headingCount = 0, intent = 'Informational' } = {}) {
    let score = Math.min(relatedTopicCount, 8) + Math.min(questionCount, 6) + Math.min(headingCount, 6) * 0.5;
    if (intent === 'Comparison' || intent === 'How-to') score += 3;
    if (score >= 12) return 'high';
    if (score >= 6) return 'medium';
    return 'low';
}

const DEPTH_RANGES = {
    low: { min: 600, max: 1000, reason: 'This topic appears narrow in scope based on the related concepts and questions detected so far.' },
    medium: { min: 1000, max: 1800, reason: 'This topic has a moderate number of related concepts worth covering.' },
    high: { min: 1800, max: 2800, reason: 'This topic contains multiple subtopics, questions, and comparison concepts that normally require additional explanation.' },
};

/**
 * Approximate length guidance ONLY — never presented as a ranking, AdSense, or SEO guarantee.
 * See DEPTH_RANGES above; these are starting points for editorial judgment, not a rule.
 */
function suggestedDepthRange(complexity) {
    const range = DEPTH_RANGES[complexity] || DEPTH_RANGES.medium;
    return { min: range.min, max: range.max, reason: range.reason };
}

function classifyCurrentDepth(wordCount, range) {
    if (wordCount < range.min * 0.6) return 'Well below suggested range';
    if (wordCount < range.min) return 'Below suggested range';
    if (wordCount <= range.max) return 'Within suggested range';
    return 'Above suggested range';
}

/**
 * Where (and how naturally) the primary topic phrase shows up. No location is required — this
 * only reports placement so an editor can judge whether it reads naturally, never a checklist
 * to satisfy mechanically.
 */
function analyzePrimaryTopicCoverage(title, content, headings, topic) {
    if (!topic) return null;
    const re = new RegExp(`\\b${escapeRegex(topic)}\\b`, 'i');
    const reGlobal = new RegExp(`\\b${escapeRegex(topic)}\\b`, 'gi');
    const paragraphs = splitParagraphs(content);
    const intro = paragraphs[0] || '';
    const conclusion = paragraphs.length > 1 ? paragraphs[paragraphs.length - 1] : '';
    const h1 = headings.find((h) => h.level === 1);
    const occurrences = ((content || '').match(reGlobal) || []).length;
    const inHeadings = headings.filter((h) => re.test(h.text)).length;

    let status;
    if (occurrences === 0) status = 'Not found in body — confirm the topic is actually discussed under this phrasing';
    else if (occurrences === 1 && !re.test(intro)) status = 'Minimal — appears once, not reinforced early on';
    else status = 'Appears naturally through the article';

    return {
        topic,
        inTitle: re.test(title || ''),
        inH1: h1 ? re.test(h1.text) : false,
        inIntroduction: re.test(intro),
        inHeadings,
        inConclusion: paragraphs.length > 1 ? re.test(conclusion) : null,
        occurrences,
        status,
    };
}

/**
 * Combines three DISTINCT kinds of evidence into one coverage list, keeping the important
 * distinction from the spec: a keyword gap is not automatically a topic gap.
 *   - "covered"  → a related phrase that actually recurs in the body (detectRelatedTopics).
 *   - "partial"  → the author declared a subtopic (gave it a heading) but wrote very little
 *                  under it — a real, text-grounded signal, not a guess.
 *   - "missing"  → ONLY ever populated by the optional AI layer (aiController.js), because
 *                  asserting a concept is genuinely absent requires knowledge beyond this
 *                  article's own text. Local heuristics alone never produce this bucket.
 */
function buildTopicCoverage(relatedTopics, headingSections) {
    const coverage = relatedTopics.map((t) => ({ concept: t.phrase, status: 'covered', note: `Appears ${t.occurrences} times in the body.` }));
    const coveredConcepts = new Set(coverage.map((c) => c.concept));
    for (const section of headingSections) {
        const key = section.text.toLowerCase();
        if ([...coveredConcepts].some((c) => key.includes(c) || c.includes(key))) continue;
        if (section.wordCount > 0 && section.wordCount < 40) {
            coverage.push({ concept: section.text, status: 'partial', note: `This section has a heading but only ~${section.wordCount} words under it — consider expanding.` });
        }
    }
    return coverage;
}

/**
 * Natural-language signals, not a keyword-density rule: headings that are all near-identical
 * restatements of the topic, the topic phrase landing in back-to-back sentences, or repeated
 * parenthetical synonym dumps that read like inserted keyword variants.
 */
function analyzeSemanticCoverage(content, topic, headings) {
    if (!topic) return { headingStuffing: false, consecutiveUsage: false, forcedSynonymPattern: false, issues: [] };
    const re = new RegExp(`\\b${escapeRegex(topic)}\\b`, 'i');
    const issues = [];

    const headingHits = headings.filter((h) => re.test(h.text));
    const headingStuffing = headings.length >= 3 && headingHits.length / headings.length > 0.6;
    if (headingStuffing) issues.push(`The primary topic phrase appears in ${headingHits.length} of ${headings.length} headings — consider more varied, natural heading phrasing.`);

    const sentences = splitSentences(content);
    let consecutiveUsage = false;
    for (let i = 0; i < sentences.length - 1; i++) {
        if (re.test(sentences[i]) && re.test(sentences[i + 1])) { consecutiveUsage = true; break; }
    }
    if (consecutiveUsage) issues.push(`"${topic}" appears in two consecutive sentences — consider varying the phrasing or combining them.`);

    const synonymDumps = (content || '').match(/\([^)]*\b(or|also known as|aka)\b[^)]*\)/gi) || [];
    const forcedSynonymPattern = synonymDumps.length >= 2;
    if (forcedSynonymPattern) issues.push('Multiple parenthetical synonym lists detected — check they read naturally rather than as inserted keyword variants.');

    return { headingStuffing, consecutiveUsage, forcedSynonymPattern, issues };
}

/**
 * Surfaces POSSIBLE overlap with other published Imperialpedia articles — title-word overlap
 * plus a matching detected search intent. This is a heads-up for an editor to review, never an
 * automatic merge/redirect/delete: those actions are explicitly out of scope here.
 */
function detectCannibalization(current, candidates, limit = 3) {
    if (!current.title || !Array.isArray(candidates) || !candidates.length) return [];
    const currentWords = new Set(tokenizeWords(current.title).filter((w) => !STOPWORDS.has(w) && w.length > 2));
    if (!currentWords.size) return [];
    const currentIntent = current.intent;
    const results = [];
    for (const candidate of candidates) {
        if (!candidate || !candidate.title || candidate.slug === current.slug) continue;
        const words = new Set(tokenizeWords(candidate.title).filter((w) => !STOPWORDS.has(w) && w.length > 2));
        if (!words.size) continue;
        const shared = [...currentWords].filter((w) => words.has(w));
        const overlapRatio = shared.length / Math.min(currentWords.size, words.size);
        const candidateIntent = detectSearchIntent(candidate.title).intent;
        if (shared.length >= 2 && overlapRatio >= 0.5 && candidateIntent === currentIntent) {
            results.push({
                slug: candidate.slug,
                title: candidate.title,
                sharedWords: shared,
                note: 'Possible topic overlap with another Imperialpedia article.',
            });
        }
        if (results.length >= limit) break;
    }
    return results;
}

function detectSourceOpportunities(content, limit = 5) {
    const sentences = splitSentences(content);
    const claimPattern = /\b(\d+(\.\d+)?%|\$[\d,.]+|according to|studies show|research shows|on average|the average)\b/i;
    const hasNearbyCitation = (s) => /\[source|\(source|https?:\/\//i.test(s);
    return sentences
        .filter((s) => claimPattern.test(s) && !hasNearbyCitation(s))
        .slice(0, limit);
}

/**
 * Internal link opportunities: given a small candidate list of OTHER published articles
 * ({ id, slug, title }), find title phrases that literally occur in this article's body.
 * Never invents a target — only surfaces matches against real, currently-published articles.
 */
function detectInternalLinkOpportunities(content, currentArticleId, candidates, limit = 5) {
    if (!Array.isArray(candidates) || !candidates.length) return [];
    const lowerContent = (content || '').toLowerCase();
    const opportunities = [];
    for (const candidate of candidates) {
        if (!candidate || candidate.id === currentArticleId || !candidate.title) continue;
        const words = tokenizeWords(candidate.title).filter((w) => !STOPWORDS.has(w));
        if (words.length < 2) continue;
        // Try the full non-stopword title phrase first, then progressively shorter
        // contiguous windows — a title like "Zero-Based Budgeting Explained" should still
        // match content that only says "zero-based budgeting", not require the whole title.
        let anchor = null;
        for (let len = words.length; len >= 2 && !anchor; len--) {
            for (let start = 0; start + len <= words.length; start++) {
                const candidatePhrase = words.slice(start, start + len).join(' ');
                if (lowerContent.includes(candidatePhrase)) { anchor = candidatePhrase; break; }
            }
        }
        if (anchor) opportunities.push({ anchor, targetSlug: candidate.slug, targetTitle: candidate.title });
        if (opportunities.length >= limit) break;
    }
    return opportunities;
}

// ============================================================================================
// PROMPT 2 — originality & writing-signal intelligence
//
// Everything below is a WRITING SIGNAL for a human editor to review — never a verdict on
// authorship. Nothing here computes or implies an "AI probability", a "human score", or any
// percentage claiming to detect who/what wrote the text. See computeOriginalityStatus() for
// the article-level status, which is deliberately one of a small fixed enum (never "100%
// original" or "100% human").
// ============================================================================================

/**
 * Same "first 1-2 words repeat verbatim" heuristic as detectRepeatedSentenceOpenings, applied
 * to paragraphs instead of sentences — kept as a separate function (rather than refactoring the
 * sentence version) so existing sentence-opening tests/behavior are untouched.
 */
function detectRepeatedParagraphOpenings(content, minOccurrences = 3) {
    const paragraphs = splitParagraphs(content);
    const oneWord = new Map();
    const twoWord = new Map();
    for (const p of paragraphs) {
        const words = tokenizeWords(p).slice(0, 2);
        if (!words.length) continue;
        oneWord.set(words[0], (oneWord.get(words[0]) || 0) + 1);
        if (words.length === 2) {
            const key = words.join(' ');
            twoWord.set(key, (twoWord.get(key) || 0) + 1);
        }
    }
    const results = [];
    const coveredFirstWords = new Set();
    for (const [opener, count] of twoWord) {
        if (count >= minOccurrences) {
            results.push({ opener, occurrences: count });
            coveredFirstWords.add(opener.split(' ')[0]);
        }
    }
    for (const [opener, count] of oneWord) {
        if (count >= minOccurrences && !coveredFirstWords.has(opener)) results.push({ opener, occurrences: count });
    }
    return results;
}

/**
 * Flags OVERUSE of specific transition words — not their normal, expected presence. A short
 * article using "however" once is not a problem; the same word appearing far more than natural
 * usage would predict is a writing signal worth an editor's attention.
 */
function detectTransitionOveruse(content) {
    const words = tokenizeWords(content);
    const wordCount = words.length || 1;
    const flagged = [];
    const counts = {};
    for (const term of TRANSITION_WORDS) {
        const clean = term.replace(/,$/, '');
        const re = new RegExp(`\\b${escapeRegex(clean)}\\b,?`, 'gi');
        const count = ((content || '').match(re) || []).length;
        if (!count) continue;
        counts[clean] = count;
        const per1000Words = (count / wordCount) * 1000;
        if (count >= TRANSITION_OVERUSE_MIN_COUNT && per1000Words > TRANSITION_OVERUSE_PER_1000_WORDS) {
            flagged.push({ word: clean, count, per1000Words: Math.round(per1000Words * 10) / 10 });
        }
    }
    return { counts, flagged };
}

/**
 * Describes the sentence-length distribution — average, spread, and how much of the article
 * sits at the extremes. Purely descriptive: neither uniform nor highly varied sentence length
 * proves anything about authorship, so this never labels a distribution "AI-like" or
 * "human-like", only "uniform" / "clustered" / "varied" as a writing-style observation.
 */
function analyzeSentenceLengthDistribution(content) {
    const sentences = splitSentences(content).filter((s) => tokenizeWords(s).length > 0);
    if (!sentences.length) return { count: 0, avgLength: 0, stdDev: 0, veryShortRatio: 0, veryLongRatio: 0, label: 'Not enough content' };
    const lengths = sentences.map((s) => tokenizeWords(s).length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, l) => sum + (l - avgLength) ** 2, 0) / lengths.length;
    const stdDev = Math.sqrt(variance);
    const veryShortRatio = lengths.filter((l) => l <= VERY_SHORT_SENTENCE_WORDS).length / lengths.length;
    const veryLongRatio = lengths.filter((l) => l >= VERY_LONG_SENTENCE_WORDS).length / lengths.length;
    let label = 'Varied';
    if (stdDev < 3 && lengths.length >= 5) label = 'Unusually uniform';
    else if (veryShortRatio >= UNUSUAL_CLUSTER_RATIO) label = 'Many very short sentences';
    else if (veryLongRatio >= UNUSUAL_CLUSTER_RATIO) label = 'Many very long sentences';
    return {
        count: lengths.length,
        avgLength: Math.round(avgLength * 10) / 10,
        stdDev: Math.round(stdDev * 10) / 10,
        veryShortRatio: Math.round(veryShortRatio * 100) / 100,
        veryLongRatio: Math.round(veryLongRatio * 100) / 100,
        label,
    };
}

/**
 * Paragraph-level structure signal: repeated near-identical paragraph lengths (rounded to the
 * nearest 10 words) across a meaningful share of the article, plus repeated openings. A signal
 * to review, not evidence of anything — plenty of well-written articles have consistent
 * paragraph rhythm on purpose.
 */
function analyzeParagraphStructure(content) {
    const paragraphs = splitParagraphs(content);
    if (paragraphs.length < 3) return { count: paragraphs.length, repeatedLengthBucket: null, repeatedOpenings: [], label: 'Not enough paragraphs to assess' };
    const lengths = paragraphs.map((p) => tokenizeWords(p).length);
    const buckets = new Map();
    lengths.forEach((len) => {
        const bucket = Math.round(len / 10) * 10;
        buckets.set(bucket, (buckets.get(bucket) || 0) + 1);
    });
    let repeatedLengthBucket = null;
    for (const [bucket, count] of buckets) {
        if (count / paragraphs.length >= 0.5 && count >= 3) repeatedLengthBucket = { wordsNear: bucket, paragraphCount: count };
    }
    const repeatedOpenings = detectRepeatedParagraphOpenings(content);
    const label = repeatedLengthBucket || repeatedOpenings.length ? 'Formulaic pattern detected' : 'Varied';
    return { count: paragraphs.length, repeatedLengthBucket, repeatedOpenings, label };
}

/**
 * Punctuation usage — semicolons, colons, parentheticals, plus the existing em-dash check.
 * Thresholds are named constants above (SEMICOLON_PER_1000_WORDS etc.) so they read as
 * adjustable editorial calls, not hardcoded "human writing" rules.
 */
function analyzePunctuationPatterns(content) {
    const words = tokenizeWords(content);
    const wordCount = words.length || 1;
    const per1000 = (count) => Math.round((count / wordCount) * 1000 * 10) / 10;

    const semicolonCount = ((content || '').match(/;/g) || []).length;
    const colonCount = ((content || '').match(/:/g) || []).length;
    const parentheticalCount = ((content || '').match(/\(/g) || []).length;
    const emDash = detectEmDashFrequency(content);

    const semicolonPer1000 = per1000(semicolonCount);
    const colonPer1000 = per1000(colonCount);
    const parentheticalPer1000 = per1000(parentheticalCount);

    const flags = [];
    if (semicolonCount >= 3 && semicolonPer1000 > SEMICOLON_PER_1000_WORDS) flags.push('Semicolon usage is unusually frequent.');
    if (colonCount >= 3 && colonPer1000 > COLON_PER_1000_WORDS) flags.push('Colon usage is unusually frequent.');
    if (parentheticalCount >= 3 && parentheticalPer1000 > PARENTHETICAL_PER_1000_WORDS) flags.push('Parenthetical asides are unusually frequent.');
    if (emDash.unusual) flags.push(`Em-dash usage is unusually frequent (${emDash.count} in this article).`);

    return {
        semicolon: { count: semicolonCount, per1000Words: semicolonPer1000 },
        colon: { count: colonCount, per1000Words: colonPer1000 },
        parenthetical: { count: parentheticalCount, per1000Words: parentheticalPer1000 },
        emDash,
        label: flags.length ? 'Warning' : 'Good',
        flags,
    };
}

// A sentence that opens "<Subject> is/are/was/were ..." — used to spot mechanically repeated
// "X is ... Y is ... Z is ..." construction across CONSECUTIVE sentences.
const SIMPLE_PREDICATE_PATTERN = /^\S+(\s+\S+){0,3}\s+(is|are|was|were)\s/i;

/**
 * Flags long runs of consecutive sentences sharing the same simple "X is/are ..." construction.
 * A signal only — this is completely normal in short bursts (definitions, lists of facts) and
 * only becomes formulaic when it repeats mechanically across many sentences in a row.
 */
function detectFormulaicSentenceStructure(content, minRun = 4) {
    const sentences = splitSentences(content).filter((s) => tokenizeWords(s).length > 0);
    let longestRun = 0;
    let currentRun = 0;
    const runs = [];
    for (const s of sentences) {
        if (SIMPLE_PREDICATE_PATTERN.test(s)) {
            currentRun += 1;
            longestRun = Math.max(longestRun, currentRun);
        } else {
            if (currentRun >= minRun) runs.push(currentRun);
            currentRun = 0;
        }
    }
    if (currentRun >= minRun) runs.push(currentRun);
    const level = longestRun >= minRun + 2 ? 'High' : longestRun >= minRun ? 'Medium' : 'Low';
    return { longestRun, runs, level };
}

// A section that OPENS with a definition-style sentence ("X is ...", "X refers to ...",
// "X means ..."). Not suspicious on its own — only mechanical repetition across most sections
// of the SAME article is a template-repetition signal.
const DEFINITION_OPENING_PATTERN = /^\S+(\s+\S+){0,4}\s+(is|are|refers to|means|describes)\s/i;

/**
 * Detects the same section-opening template (e.g. every section starting with a dictionary-
 * style definition sentence) repeated mechanically across most of the article's headed
 * sections. Standard article structure itself is never flagged — only repetition well beyond
 * what normal writing produces.
 */
function detectTemplateRepetition(headingSections, minSections = 3) {
    const withBody = headingSections.filter((s) => s.wordCount > 0);
    if (withBody.length < minSections) return { detected: false, matchingSections: 0, totalSections: withBody.length };
    let matching = 0;
    for (const section of headingSections) {
        const firstSentence = (section.firstSentence || '').trim();
        if (firstSentence && DEFINITION_OPENING_PATTERN.test(firstSentence)) matching += 1;
    }
    const ratio = withBody.length ? matching / withBody.length : 0;
    return { detected: matching >= minSections && ratio >= 0.6, matchingSections: matching, totalSections: withBody.length };
}

/** Lowercased, whitespace-normalized `n`-word shingles, for cheap local similarity comparison. */
function buildShingles(text, n = SHINGLE_SIZE) {
    const words = tokenizeWords(text);
    const shingles = new Set();
    for (let i = 0; i + n <= words.length; i++) shingles.add(words.slice(i, i + n).join(' '));
    return shingles;
}

/**
 * Compares this draft's content against a small set of OTHER published Imperialpedia articles
 * (full text) using n-word shingle overlap (Jaccard similarity) — a cheap, local, deterministic
 * technique, not a call to any external service. Reports overlap as "internal content overlap",
 * never as "plagiarism" — overlap with another article on the SAME site can be entirely
 * legitimate (shared boilerplate disclaimers, glossary-style definitions, etc.) and is only ever
 * an editorial review signal here.
 */
function detectInternalSimilarity(content, candidates, currentSlug, limit = 3) {
    if (!Array.isArray(candidates) || !candidates.length) return [];
    const currentShingles = buildShingles(content);
    if (!currentShingles.size) return [];
    const results = [];
    for (const candidate of candidates) {
        if (!candidate || !candidate.content || candidate.slug === currentSlug) continue;
        const candidateShingles = buildShingles(candidate.content);
        if (!candidateShingles.size) continue;
        let shared = 0;
        let sampleMatch = null;
        for (const shingle of currentShingles) {
            if (candidateShingles.has(shingle)) {
                shared += 1;
                if (!sampleMatch) sampleMatch = shingle;
            }
        }
        if (!shared) continue;
        const union = currentShingles.size + candidateShingles.size - shared;
        const jaccard = union ? shared / union : 0;
        if (shared >= INTERNAL_SIMILARITY_MIN_SHARED_SHINGLES && jaccard >= INTERNAL_SIMILARITY_JACCARD_FLOOR) {
            results.push({
                slug: candidate.slug,
                title: candidate.title,
                sharedShingles: shared,
                similarity: Math.round(jaccard * 1000) / 1000,
                matchingPassage: sampleMatch,
                note: 'Internal content overlap detected — editorial review recommended, not automatically flagged as plagiarism.',
            });
        }
    }
    return results.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
}

/**
 * Aggregates the individual local writing signals into the compact summary the panel renders
 * (spec §9's "Writing signals" block). Every field here is a COUNT or a descriptive LABEL —
 * never a score presented as authoritative, and never anything resembling an AI/human
 * probability.
 */
function buildWritingSignals({ repeatedPhrases, repeatedOpenings, genericPhrases, transitionOveruse, sentenceDistribution, paragraphStructure, punctuation, formulaicStructure }) {
    return {
        repeatedPhrasesCount: repeatedPhrases.length,
        repeatedOpeningsCount: repeatedOpenings.length,
        genericWordingCount: genericPhrases.length,
        transitionOveruse: transitionOveruse.flagged,
        formulaicStructure: formulaicStructure.level,
        sentenceVariation: sentenceDistribution.label === 'Varied' ? 'Good' : 'Warning',
        sentenceVariationDetail: sentenceDistribution,
        paragraphVariation: paragraphStructure.label === 'Varied' ? 'Good' : 'Warning',
        paragraphVariationDetail: paragraphStructure,
        punctuationPattern: punctuation.label,
        punctuationDetail: punctuation,
    };
}

const ORIGINALITY_STATUSES = ['Clean', 'Review recommended', 'External check required', 'Provider unavailable', 'Not checked'];

/**
 * Article-level originality status — always one of ORIGINALITY_STATUSES above. Deliberately
 * NEVER "100% original" or "100% human": this only reflects whether local/external SIGNALS
 * suggest an editor should look closer, not a determination of authorship or originality.
 */
function computeOriginalityStatus({ internalOverlap = [], writingSignals, providerResult = null } = {}) {
    if (providerResult && providerResult.status === 'error') return 'Provider unavailable';

    const strongOverlap = internalOverlap.some((m) => m.similarity >= 0.3);
    const providerFlagged = providerResult && providerResult.status === 'checked' && typeof providerResult.similarity === 'number' && providerResult.similarity >= 0.3;
    if (strongOverlap || providerFlagged) return 'External check required';

    let warningSignalCount = 0;
    if (internalOverlap.length) warningSignalCount += 1;
    if (writingSignals.repeatedPhrasesCount > 0) warningSignalCount += 1;
    if (writingSignals.repeatedOpeningsCount > 0) warningSignalCount += 1;
    if (writingSignals.sentenceVariation === 'Warning') warningSignalCount += 1;
    if (writingSignals.paragraphVariation === 'Warning') warningSignalCount += 1;
    if (writingSignals.punctuationPattern === 'Warning') warningSignalCount += 1;
    if (writingSignals.formulaicStructure !== 'Low') warningSignalCount += 1;

    if (warningSignalCount >= 1) return 'Review recommended';
    return 'Clean';
}

function clampScore(n) {
    return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Orchestrates the full local analysis. `candidates` is an optional array of other
 * published articles ({ id, slug, title }) for internal-link detection — omit it (or pass
 * an empty array) and that section simply reports no opportunities, it never fails.
 */
function analyzeArticle({ title = '', content = '', summary = '', metaTitle = '', metaDescription = '', slug = '', status = 'draft' } = {}, { candidates = [] } = {}) {
    const wordCount = tokenizeWords(content).length;
    const { topic, confidence } = detectPrimaryTopic(title, content);
    const relatedTopics = detectRelatedTopics(content, topic);
    const { intent, confidence: intentConfidence } = detectSearchIntent(title);
    const intentCoverage = assessIntentCoverage(intent, content);
    const headings = extractHeadings(content);
    const headingIssues = analyzeHeadingHierarchy(headings);
    const questions = detectQuestions(content, 50);
    const length = computeLengthMetrics(content);
    const headingSections = extractHeadingSections(content);
    const topicComplexity = estimateTopicComplexity({
        relatedTopicCount: relatedTopics.length,
        questionCount: questions.length,
        headingCount: headings.length,
        intent,
    });
    const depthRange = suggestedDepthRange(topicComplexity);
    const depth = {
        wordCount: length.wordCount,
        topicComplexity,
        suggestedMin: depthRange.min,
        suggestedMax: depthRange.max,
        reason: depthRange.reason,
        currentDepth: classifyCurrentDepth(length.wordCount, depthRange),
    };
    const primaryTopicCoverage = analyzePrimaryTopicCoverage(title, content, headings, topic);
    const topicCoverage = buildTopicCoverage(relatedTopics, headingSections);
    const semanticCoverage = analyzeSemanticCoverage(content, topic, headings);
    const cannibalization = detectCannibalization({ title, slug, intent }, candidates);
    const repeatedPhrases = detectRepeatedPhrases(content);
    const repeatedOpenings = detectRepeatedSentenceOpenings(content);
    const genericPhrases = detectGenericPhrases(content);
    const emDash = detectEmDashFrequency(content);
    const keywordStuffing = detectKeywordStuffing(content, topic);
    const readability = analyzeReadability(content);
    const titleAnalysis = analyzeTitle(title);
    const metaTitleSuggestion = suggestMetaTitle(metaTitle, title);
    const metaDescriptionSuggestion = suggestMetaDescription(metaDescription, summary, content);
    const slugAnalysis = analyzeSlug(slug, title, status);
    const sourceOpportunities = detectSourceOpportunities(content);
    const internalLinks = detectInternalLinkOpportunities(content, null, candidates);
    const existingInternalLinkCount = ((content || '').match(/\]\(\/[a-z0-9/-]+\)/gi) || []).length;

    // --- Prompt 2: originality & writing-signal intelligence (local, deterministic, no
    // external calls — see the "PROMPT 2" comment block above for the guiding principles). ---
    const transitionOveruse = detectTransitionOveruse(content);
    const sentenceDistribution = analyzeSentenceLengthDistribution(content);
    const paragraphStructure = analyzeParagraphStructure(content);
    const punctuation = analyzePunctuationPatterns(content);
    const formulaicStructure = detectFormulaicSentenceStructure(content);
    const templateRepetition = detectTemplateRepetition(headingSections);
    // Internal similarity needs OTHER articles' full text, not just title — candidates only
    // carry `content` when the controller opts in (see aiController.js); omitted candidates
    // simply produce no matches, this never fails the rest of the analysis.
    const internalOverlap = detectInternalSimilarity(content, candidates, slug);
    const writingSignals = buildWritingSignals({
        repeatedPhrases, repeatedOpenings, genericPhrases, transitionOveruse, sentenceDistribution, paragraphStructure, punctuation, formulaicStructure,
    });
    const originalityReview = { status: computeOriginalityStatus({ internalOverlap, writingSignals }) };

    // --- Prompt 3: fact & source intelligence (local, deterministic, Stage A — see
    // claimDetectionService.js). Additive only: never removes or reshapes anything above. ---
    const factSourceIntelligence = detectClaims({ title, content });

    const issues = [];
    for (const i of titleAnalysis.issues) issues.push({ area: 'title', ...i });
    if (!metaDescription || !metaDescription.trim()) issues.push({ area: 'seo', severity: 'WARNING', message: 'Missing meta description.' });
    if (headingIssues.length) headingIssues.forEach((m) => issues.push({ area: 'structure', severity: 'WARNING', message: m }));
    if (!headings.length && wordCount > 500) issues.push({ area: 'structure', severity: 'SUGGESTION', message: 'No subheadings detected — consider breaking a long article into sections.' });
    if (keywordStuffing.stuffed) issues.push({ area: 'seo', severity: 'WARNING', message: `"${topic}" appears frequently in close proximity (${keywordStuffing.occurrences} times). Consider natural variations where appropriate.` });
    if (repeatedPhrases.length) repeatedPhrases.forEach((r) => issues.push({ area: 'writing', severity: 'SUGGESTION', message: `The phrase "${r.phrase}" repeats ${r.occurrences} times. Consider varying the wording.` }));
    if (repeatedOpenings.length) repeatedOpenings.forEach((r) => issues.push({ area: 'writing', severity: 'SUGGESTION', message: `Multiple sentences open with "${r.opener}" (${r.occurrences} times). Consider varying sentence structure.` }));
    if (genericPhrases.length) issues.push({ area: 'writing', severity: 'SUGGESTION', message: `${genericPhrases.length} sentence(s) use generic language that could be more specific.` });
    if (emDash.unusual) issues.push({ area: 'writing', severity: 'SUGGESTION', message: `Em-dash usage is unusually frequent (${emDash.count} in this article). Review whether some read more naturally as separate sentences or commas.` });
    if (intentCoverage.coverage !== 'Good') issues.push({ area: 'coverage', severity: 'SUGGESTION', message: `Detected intent is "${intent}" — missing: ${intentCoverage.missing}.` });
    if (sourceOpportunities.length) issues.push({ area: 'sources', severity: 'SUGGESTION', message: `${sourceOpportunities.length} factual/statistical claim(s) may benefit from a citation.` });
    if (internalLinks.length) issues.push({ area: 'internal-links', severity: 'SUGGESTION', message: `${internalLinks.length} internal link opportunit${internalLinks.length === 1 ? 'y' : 'ies'} found.` });
    if (wordCount < 50) issues.unshift({ area: 'content', severity: 'CRITICAL', message: 'Article body is very short — add more content before publishing.' });
    if (depth.currentDepth === 'Well below suggested range') {
        issues.push({ area: 'depth', severity: 'SUGGESTION', message: `Suggested depth for this topic is approximately ${depth.suggestedMin}–${depth.suggestedMax} words; the draft is well below that. ${depth.reason}` });
    }
    const partialCoverage = topicCoverage.filter((c) => c.status === 'partial');
    if (partialCoverage.length) {
        partialCoverage.forEach((c) => issues.push({ area: 'coverage', severity: 'SUGGESTION', message: `"${c.concept}" — ${c.note}` }));
    }
    if (semanticCoverage.issues.length) {
        semanticCoverage.issues.forEach((m) => issues.push({ area: 'semantic', severity: 'SUGGESTION', message: m }));
    }
    if (cannibalization.length) {
        cannibalization.forEach((c) => issues.push({ area: 'cannibalization', severity: 'SUGGESTION', message: `Possible topic overlap with "${c.title}" (/${c.slug}).` }));
    }
    // Writing-signal issues — all phrased as review prompts, never authorship verdicts.
    if (repeatedPhrases.some((r) => r.occurrences >= 5)) {
        issues.push({ area: 'writing-signal', severity: 'WARNING', message: `Possible repetition: a phrase repeats ${Math.max(...repeatedPhrases.map((r) => r.occurrences))} times — worth a closer look.` });
    }
    if (repeatedOpenings.some((r) => r.occurrences >= 4)) {
        issues.push({ area: 'writing-signal', severity: 'WARNING', message: 'Highly repetitive sentence openings detected.' });
    }
    if (transitionOveruse.flagged.length) {
        transitionOveruse.flagged.forEach((t) => issues.push({ area: 'writing-signal', severity: 'SUGGESTION', message: `Repeated transition: "${t.word}" appears ${t.count} times — consider varying it.` }));
    }
    if (formulaicStructure.level !== 'Low') {
        issues.push({ area: 'writing-signal', severity: 'SUGGESTION', message: `Formulaic sentence structure: a run of ${formulaicStructure.longestRun} consecutive similarly-built sentences.` });
    }
    if (templateRepetition.detected) {
        issues.push({ area: 'writing-signal', severity: 'SUGGESTION', message: `Formulaic section structure: ${templateRepetition.matchingSections} of ${templateRepetition.totalSections} sections open the same way.` });
    }
    if (paragraphStructure.label === 'Formulaic pattern detected') {
        issues.push({ area: 'writing-signal', severity: 'SUGGESTION', message: 'Paragraph structure looks formulaic (repeated lengths or openings) — consider more variation.' });
    }
    if (punctuation.flags.length) {
        punctuation.flags.forEach((m) => issues.push({ area: 'writing-signal', severity: 'SUGGESTION', message: m }));
    }
    internalOverlap.forEach((m) => {
        issues.push({
            area: 'internal-overlap',
            severity: m.similarity >= 0.3 ? 'WARNING' : 'SUGGESTION',
            message: `Internal content overlap detected with "${m.title}" (/${m.slug}) — similar passage found. Editorial review recommended.`,
        });
    });
    // Fact & source claims — only surfaced in the main issues list at CRITICAL/WARNING severity
    // (unsupported legal/regulatory claims, uncited verifiable claims); SUGGESTION-level claims
    // live only in the dedicated factSourceIntelligence.claims list so this panel isn't flooded.
    factSourceIntelligence.claims
        .filter((c) => c.severity === 'CRITICAL' || c.severity === 'WARNING')
        .forEach((c) => {
            issues.push({
                area: 'fact-source',
                severity: c.severity,
                message: c.severity === 'CRITICAL'
                    ? `Unsupported ${c.category.toLowerCase().replace('_', ' ')} claim: "${c.text}" — verification strongly recommended before publishing.`
                    : `Claim may need a citation: "${c.text}"`,
            });
        });

    // --- Scoring (internal editorial convenience only — never a "ranking" or "AI-detection" score) ---
    let seoScore = 100;
    if (!title || !title.trim()) seoScore -= 40;
    if (!metaDescription || !metaDescription.trim()) seoScore -= 15;
    if (!metaTitle || !metaTitle.trim()) seoScore -= 5;
    if (keywordStuffing.stuffed) seoScore -= 15;
    if (titleAnalysis.issues.some((i) => i.severity === 'WARNING')) seoScore -= 10;
    seoScore = clampScore(seoScore);

    let structureScore = 100;
    structureScore -= headingIssues.length * 10;
    if (!headings.length && wordCount > 500) structureScore -= 15;
    structureScore = clampScore(structureScore);

    const readabilityScore = readability.fleschScore == null
        ? 50
        : clampScore(100 - Math.abs(45 - Math.max(0, Math.min(100, readability.fleschScore))) - readability.longSentenceCount * 2);

    let writingQualityScore = 100;
    writingQualityScore -= repeatedPhrases.length * 8;
    writingQualityScore -= repeatedOpenings.length * 6;
    writingQualityScore -= genericPhrases.length * 4;
    if (emDash.unusual) writingQualityScore -= 8;
    writingQualityScore = clampScore(writingQualityScore);

    const internalLinkingScore = clampScore(50 + existingInternalLinkCount * 15 - (internalLinks.length ? 10 : 0));

    const overallScore = clampScore(
        seoScore * 0.25 + structureScore * 0.2 + readabilityScore * 0.2 + writingQualityScore * 0.2 + internalLinkingScore * 0.15
    );

    return {
        wordCount,
        overallScore,
        scores: {
            seo: seoScore,
            structure: structureScore,
            readability: readabilityScore,
            writingQuality: writingQualityScore,
            internalLinking: internalLinkingScore,
        },
        length,
        depth,
        topics: { primary: topic, confidence, related: relatedTopics },
        primaryTopicCoverage,
        topicCoverage,
        semanticCoverage,
        cannibalization,
        intent: { detected: intent, confidence: intentConfidence, coverage: intentCoverage.coverage, missing: intentCoverage.missing },
        title: titleAnalysis,
        headings: { list: headings, issues: headingIssues },
        readability,
        questions: questions.slice(0, 10),
        writingQuality: { repeatedPhrases, repeatedOpenings, genericPhrases, emDash, keywordStuffing },
        seo: { metaTitle: metaTitleSuggestion, metaDescription: metaDescriptionSuggestion, slug: slugAnalysis },
        internalLinks,
        sourceOpportunities,
        writingSignals,
        templateRepetition,
        internalOverlap,
        originalityReview,
        factSourceIntelligence,
        // Prompt 4 (editorial audit) reads this to show "relevant published articles found"
        // without re-running the candidate lookup — the size of the SAME candidate pool
        // already used above for cannibalization/internal-link/internal-overlap detection.
        internalLinkCandidatePoolSize: Array.isArray(candidates) ? candidates.length : 0,
        issues,
    };
}

module.exports = {
    analyzeArticle,
    // Exported individually for focused unit tests.
    tokenizeWords,
    splitSentences,
    detectPrimaryTopic,
    detectRelatedTopics,
    detectSearchIntent,
    assessIntentCoverage,
    extractHeadings,
    analyzeHeadingHierarchy,
    detectRepeatedPhrases,
    detectRepeatedSentenceOpenings,
    detectGenericPhrases,
    detectEmDashFrequency,
    detectKeywordStuffing,
    analyzeReadability,
    detectQuestions,
    analyzeTitle,
    suggestMetaDescription,
    suggestMetaTitle,
    analyzeSlug,
    detectSourceOpportunities,
    detectInternalLinkOpportunities,
    computeLengthMetrics,
    extractHeadingSections,
    estimateTopicComplexity,
    suggestedDepthRange,
    classifyCurrentDepth,
    analyzePrimaryTopicCoverage,
    buildTopicCoverage,
    analyzeSemanticCoverage,
    detectCannibalization,
    // Prompt 2 — originality & writing-signal intelligence.
    detectRepeatedParagraphOpenings,
    detectTransitionOveruse,
    analyzeSentenceLengthDistribution,
    analyzeParagraphStructure,
    analyzePunctuationPatterns,
    detectFormulaicSentenceStructure,
    detectTemplateRepetition,
    buildShingles,
    detectInternalSimilarity,
    buildWritingSignals,
    computeOriginalityStatus,
    ORIGINALITY_STATUSES,
};
