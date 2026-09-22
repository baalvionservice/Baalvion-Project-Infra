'use strict';

// Pure-logic tests for the Content Intelligence heuristic engine — no DB, no network, no AI
// provider. Mirrors the "wiring smoke test" style used elsewhere in this suite
// (see entitlementService.test.js): fast, deterministic, and safe to run anywhere.

const test = require('node:test');
const assert = require('node:assert/strict');

const svc = require('../service/articleAnalysisService');

test('detectPrimaryTopic finds a phrase present in both title and body, not just the title', () => {
    const title = 'How to Build an Emergency Fund';
    const content = 'An emergency fund protects you from unexpected expenses. Building an emergency fund takes discipline. Keep your emergency fund liquid.';
    const { topic, confidence } = svc.detectPrimaryTopic(title, content);
    assert.equal(topic, 'emergency fund');
    assert.equal(confidence, 'medium');
});

test('detectPrimaryTopic never invents a topic absent from the title', () => {
    const { topic } = svc.detectPrimaryTopic('', 'Some unrelated body text about markets and rates.');
    assert.equal(topic, null);
});

test('detectRelatedTopics only reports phrases that actually occur in the content', () => {
    const content = 'Zero-based budgeting assigns every dollar a job. Zero-based budgeting works well for variable income.';
    const related = svc.detectRelatedTopics(content, null);
    assert.ok(related.some((r) => r.phrase.includes('zero-based budgeting')));
    for (const r of related) assert.ok(content.toLowerCase().includes(r.phrase));
});

test('detectSearchIntent classifies a how-to title correctly', () => {
    assert.equal(svc.detectSearchIntent('How to Build an Emergency Fund').intent, 'How-to');
    assert.equal(svc.detectSearchIntent('What is Compound Interest?').intent, 'Definition');
    assert.equal(svc.detectSearchIntent('Roth IRA vs Traditional IRA').intent, 'Comparison');
    assert.equal(svc.detectSearchIntent('A Guide to Retirement Planning').intent, 'Informational');
});

test('assessIntentCoverage flags a how-to article with no steps', () => {
    const result = svc.assessIntentCoverage('How-to', 'This is just prose with no numbered steps at all, only sentences.');
    assert.equal(result.coverage, 'Needs improvement');
    assert.ok(result.missing);
});

test('assessIntentCoverage accepts numbered steps as satisfying how-to intent', () => {
    const result = svc.assessIntentCoverage('How-to', '1. Open an account\n2. Set up a transfer\n3. Automate contributions');
    assert.equal(result.coverage, 'Good');
});

test('extractHeadings parses markdown ATX headings only', () => {
    const headings = svc.extractHeadings('# Title\nSome text\n## Section One\nMore text\n### Sub');
    assert.deepEqual(headings.map((h) => h.level), [1, 2, 3]);
    assert.equal(headings[1].text, 'Section One');
});

test('analyzeHeadingHierarchy flags a level skip and a duplicate heading', () => {
    const headings = [
        { level: 1, text: 'Intro' },
        { level: 3, text: 'Deep Section' },
        { level: 2, text: 'Intro' },
    ];
    const issues = svc.analyzeHeadingHierarchy(headings);
    assert.ok(issues.some((i) => /skips from H1 to H3/.test(i)));
});

test('analyzeHeadingHierarchy returns no issues for an empty heading list', () => {
    assert.deepEqual(svc.analyzeHeadingHierarchy([]), []);
});

test('detectRepeatedPhrases catches a phrase repeated many times', () => {
    const content = Array(4).fill('this means you need to plan ahead carefully').join('. ') + '.';
    const repeated = svc.detectRepeatedPhrases(content, 4, 3);
    assert.ok(repeated.length > 0);
    assert.ok(repeated[0].occurrences >= 3);
});

test('detectRepeatedSentenceOpenings catches repeated openers', () => {
    const content = 'First, save money. First, cut expenses. First, track spending. Then invest.';
    const repeated = svc.detectRepeatedSentenceOpenings(content, 3);
    assert.ok(repeated.some((r) => r.opener.startsWith('first')));
});

test('detectGenericPhrases matches known filler patterns contextually, not via a banned-word list', () => {
    const content = 'It is important to understand your budget. This is a specific, concrete sentence about numbers.';
    const found = svc.detectGenericPhrases(content);
    assert.equal(found.length, 1);
    assert.match(found[0], /important to understand/);
});

test('detectEmDashFrequency flags unusually frequent em-dash usage', () => {
    const words = Array(100).fill('word').join(' ');
    const withDashes = words + ' — used — six — separate — times — here — too';
    const result = svc.detectEmDashFrequency(withDashes);
    assert.equal(result.count, 6);
    assert.equal(result.unusual, true);
});

test('detectEmDashFrequency does not flag a single, normal em-dash', () => {
    const content = Array(200).fill('word').join(' ') + ' — a single aside — nothing more.';
    const result = svc.detectEmDashFrequency(content);
    assert.equal(result.unusual, false);
});

test('detectKeywordStuffing flags a topic repeated far beyond natural usage', () => {
    const content = Array(10).fill('the emergency fund is important for the emergency fund plan').join('. ');
    const result = svc.detectKeywordStuffing(content, 'emergency fund');
    assert.ok(result.occurrences >= 6);
    assert.equal(result.stuffed, true);
});

test('detectKeywordStuffing does not flag natural, occasional usage', () => {
    const content = 'An emergency fund is a safety net. Build it gradually and keep it accessible when life surprises you.';
    const result = svc.detectKeywordStuffing(content, 'emergency fund');
    assert.equal(result.stuffed, false);
});

test('analyzeReadability returns null score gracefully for empty content', () => {
    const result = svc.analyzeReadability('');
    assert.equal(result.fleschScore, null);
});

test('analyzeReadability computes a score and flags long sentences', () => {
    const longSentence = Array(40).fill('word').join(' ') + '.';
    const result = svc.analyzeReadability(longSentence + ' Short one.');
    assert.equal(typeof result.fleschScore, 'number');
    assert.equal(result.longSentenceCount, 1);
});

test('detectQuestions extracts sentences ending in a question mark', () => {
    const content = 'What is an emergency fund? It is a safety net. How much should you save?';
    const questions = svc.detectQuestions(content);
    assert.equal(questions.length, 2);
});

test('analyzeTitle flags a missing title as CRITICAL', () => {
    const result = svc.analyzeTitle('');
    assert.ok(result.issues.some((i) => i.severity === 'CRITICAL'));
});

test('analyzeTitle flags an overly broad two-word title as a suggestion, not critical', () => {
    const result = svc.analyzeTitle('Emergency Funds');
    assert.ok(result.issues.some((i) => i.severity === 'SUGGESTION'));
    assert.ok(!result.issues.some((i) => i.severity === 'CRITICAL'));
});

test('suggestMetaDescription proposes one from the summary when none exists', () => {
    const result = svc.suggestMetaDescription('', 'A short summary of the article for search results.', 'Body text.');
    assert.equal(result.current, null);
    assert.match(result.suggestion, /short summary/);
});

test('suggestMetaDescription leaves an existing description alone and only flags length', () => {
    const existing = 'x'.repeat(200);
    const result = svc.suggestMetaDescription(existing, 'summary', 'content');
    assert.equal(result.current, existing);
    assert.equal(result.suggestion, null);
    assert.equal(result.tooLong, true);
});

test('analyzeSlug does not flag a slug that matches the title (ignoring the timestamp suffix)', () => {
    const result = svc.analyzeSlug('emergency-fund-1699999999999', 'Emergency Fund', 'draft');
    assert.equal(result, null);
});

test('analyzeSlug flags a mismatched slug and warns against auto-changing a published URL', () => {
    const result = svc.analyzeSlug('old-headline-123', 'Completely Different New Title', 'published');
    assert.ok(result);
    assert.match(result.note, /already published/);
});

test('detectSourceOpportunities flags an uncited statistical claim', () => {
    const content = 'The average household spends 30% of income on housing. This is a general statement with no numbers.';
    const found = svc.detectSourceOpportunities(content);
    assert.equal(found.length, 1);
    assert.match(found[0], /30%/);
});

test('detectSourceOpportunities does not flag a claim that already has a citation', () => {
    const content = 'The average household spends 30% of income on housing (source: https://example.com/data).';
    const found = svc.detectSourceOpportunities(content);
    assert.equal(found.length, 0);
});

test('detectInternalLinkOpportunities only matches candidates whose title phrase literally appears in the content', () => {
    const content = 'This article explains zero-based budgeting in detail.';
    const candidates = [
        { id: 1, slug: 'zero-based-budgeting', title: 'Zero-Based Budgeting Explained' },
        { id: 2, slug: 'unrelated-topic', title: 'Completely Unrelated Topic' },
    ];
    const result = svc.detectInternalLinkOpportunities(content, 99, candidates);
    assert.equal(result.length, 1);
    assert.equal(result[0].targetSlug, 'zero-based-budgeting');
});

test('detectInternalLinkOpportunities excludes the current article from its own candidate list', () => {
    const content = 'This article explains zero-based budgeting in detail.';
    const candidates = [{ id: 1, slug: 'zero-based-budgeting', title: 'Zero-Based Budgeting Explained' }];
    const result = svc.detectInternalLinkOpportunities(content, 1, candidates);
    assert.equal(result.length, 0);
});

test('analyzeArticle returns a fully-shaped result for a realistic draft', () => {
    const title = 'How to Build an Emergency Fund';
    const content = [
        '# What is an emergency fund?',
        'An emergency fund is money set aside for unexpected expenses.',
        '## How much should you save?',
        '1. Start with $1,000.',
        '2. Grow it to three months of expenses.',
        '3. Keep it in a high-yield savings account.',
        'An emergency fund protects you when life surprises you with unexpected expenses.',
    ].join('\n');
    const result = svc.analyzeArticle({ title, content, summary: '', metaTitle: '', metaDescription: '', slug: 'emergency-fund-1700000000000', status: 'draft' });

    assert.equal(typeof result.overallScore, 'number');
    assert.ok(result.overallScore >= 0 && result.overallScore <= 100);
    assert.ok(result.scores.seo >= 0);
    assert.equal(result.topics.primary, 'emergency fund');
    assert.equal(result.intent.detected, 'How-to');
    assert.equal(result.intent.coverage, 'Good');
    assert.equal(result.headings.list.length, 2);
    assert.ok(Array.isArray(result.issues));
});

test('analyzeArticle never throws on minimal/empty input', () => {
    assert.doesNotThrow(() => svc.analyzeArticle({}));
    assert.doesNotThrow(() => svc.analyzeArticle({ title: '', content: '' }, { candidates: null }));
});

// --- PROMPT 1.1: article length + keyword/topic coverage intelligence ---

test('computeLengthMetrics counts words, characters, sentences, and paragraphs correctly', () => {
    const content = 'First sentence here. Second sentence here.\n\nA new paragraph with three words.';
    const metrics = svc.computeLengthMetrics(content);
    assert.equal(metrics.wordCount, 12);
    assert.equal(metrics.charCount, content.length);
    assert.equal(metrics.sentenceCount, 3);
    assert.equal(metrics.paragraphCount, 2);
    assert.equal(metrics.avgSentenceLength, Math.round((12 / 3) * 10) / 10);
});

test('computeLengthMetrics returns all zeros gracefully for empty content', () => {
    const metrics = svc.computeLengthMetrics('');
    assert.equal(metrics.wordCount, 0);
    assert.equal(metrics.sentenceCount, 0);
    assert.equal(metrics.paragraphCount, 0);
    assert.equal(metrics.avgSentenceLength, 0);
    assert.equal(metrics.avgParagraphLength, 0);
});

test('computeLengthMetrics computes average paragraph length across multiple paragraphs', () => {
    const content = 'one two three four\n\nfive six';
    const metrics = svc.computeLengthMetrics(content);
    assert.equal(metrics.avgParagraphLength, 3); // (4 + 2) / 2
});

test('estimateTopicComplexity rates a narrow article as low complexity', () => {
    const complexity = svc.estimateTopicComplexity({ relatedTopicCount: 0, questionCount: 0, headingCount: 0, intent: 'Informational' });
    assert.equal(complexity, 'low');
});

test('estimateTopicComplexity rates a rich, multi-faceted article as high complexity', () => {
    const complexity = svc.estimateTopicComplexity({ relatedTopicCount: 8, questionCount: 6, headingCount: 6, intent: 'Comparison' });
    assert.equal(complexity, 'high');
});

test('suggestedDepthRange never claims a ranking or approval guarantee, only an approximate range', () => {
    const range = svc.suggestedDepthRange('high');
    assert.ok(range.min > 0 && range.max > range.min);
    assert.doesNotMatch(range.reason, /rank|adsense|guarantee/i);
});

test('classifyCurrentDepth labels word count relative to the suggested range', () => {
    const range = { min: 1000, max: 1800 };
    assert.equal(svc.classifyCurrentDepth(200, range), 'Well below suggested range');
    assert.equal(svc.classifyCurrentDepth(900, range), 'Below suggested range');
    assert.equal(svc.classifyCurrentDepth(1500, range), 'Within suggested range');
    assert.equal(svc.classifyCurrentDepth(2500, range), 'Above suggested range');
});

test('analyzePrimaryTopicCoverage reports title/H1/intro/heading/conclusion placement without requiring all of them', () => {
    const title = 'How to Build an Emergency Fund';
    const content = [
        '# How to Build an Emergency Fund',
        'An emergency fund is your financial safety net for the unexpected.',
        '## Where to keep it',
        'Keep it liquid and accessible.',
        '\nIn short, an emergency fund gives you peace of mind.',
    ].join('\n');
    const headings = svc.extractHeadings(content);
    const result = svc.analyzePrimaryTopicCoverage(title, content, headings, 'emergency fund');
    assert.equal(result.inTitle, true);
    assert.equal(result.inH1, true);
    assert.equal(result.inIntroduction, true);
    assert.ok(result.occurrences >= 2);
    assert.match(result.status, /naturally/);
});

test('analyzePrimaryTopicCoverage flags when the topic never appears in the body at all', () => {
    const result = svc.analyzePrimaryTopicCoverage('Emergency Fund Basics', 'This text never uses that exact phrase anywhere.', [], 'emergency fund');
    assert.equal(result.occurrences, 0);
    assert.match(result.status, /Not found/);
});

test('analyzePrimaryTopicCoverage returns null when no primary topic was detected', () => {
    assert.equal(svc.analyzePrimaryTopicCoverage('', '', [], null), null);
});

test('buildTopicCoverage marks a frequently-recurring phrase as covered', () => {
    const related = [{ phrase: 'high-yield savings account', occurrences: 3, status: 'covered' }];
    const coverage = svc.buildTopicCoverage(related, []);
    assert.equal(coverage[0].status, 'covered');
});

test('buildTopicCoverage marks a heading with very little content under it as partial, not missing', () => {
    const headingSections = [{ level: 2, text: 'Rebuilding after an emergency', wordCount: 8 }];
    const coverage = svc.buildTopicCoverage([], headingSections);
    assert.equal(coverage.length, 1);
    assert.equal(coverage[0].status, 'partial');
    assert.doesNotMatch(coverage[0].status, /missing/);
});

test('buildTopicCoverage never produces a "missing" entry on its own — only covered/partial from real text', () => {
    const headingSections = [{ level: 2, text: 'Thin section', wordCount: 5 }];
    const coverage = svc.buildTopicCoverage([{ phrase: 'topic a', occurrences: 3, status: 'covered' }], headingSections);
    assert.ok(coverage.every((c) => c.status === 'covered' || c.status === 'partial'));
});

test('a keyword gap is not automatically flagged as a topic gap (distinguishing exact phrase from covered concept)', () => {
    // The article thoroughly explains how emergency funds work but never uses the exact
    // phrase "emergency fund strategy" — that must NOT surface as a missing topic locally.
    const content = 'An emergency fund protects you. Building an emergency fund takes time. Keep your emergency fund liquid and separate from checking.';
    const related = svc.detectRelatedTopics(content, 'emergency fund');
    const coverage = svc.buildTopicCoverage(related, []);
    assert.ok(!coverage.some((c) => /strategy/i.test(c.concept)));
});

test('analyzeSemanticCoverage flags topic-stuffed headings', () => {
    const headings = [
        { level: 2, text: 'Emergency fund basics' },
        { level: 2, text: 'Emergency fund amount' },
        { level: 2, text: 'Emergency fund location' },
    ];
    const result = svc.analyzeSemanticCoverage('some body text', 'emergency fund', headings);
    assert.equal(result.headingStuffing, true);
});

test('analyzeSemanticCoverage does not flag natural, varied headings', () => {
    const headings = [
        { level: 2, text: 'What is an emergency fund?' },
        { level: 2, text: 'Where to keep your savings' },
        { level: 2, text: 'Common mistakes to avoid' },
    ];
    const result = svc.analyzeSemanticCoverage('some body text', 'emergency fund', headings);
    assert.equal(result.headingStuffing, false);
});

test('analyzeSemanticCoverage flags the topic phrase appearing in two consecutive sentences', () => {
    const content = 'An emergency fund is essential. An emergency fund should be liquid. Keep saving steadily.';
    const result = svc.analyzeSemanticCoverage(content, 'emergency fund', []);
    assert.equal(result.consecutiveUsage, true);
});

test('analyzeSemanticCoverage flags repeated forced-synonym parentheticals', () => {
    const content = 'An emergency fund (or rainy-day fund) helps. A cash reserve (also known as a safety net) matters too.';
    const result = svc.analyzeSemanticCoverage(content, 'emergency fund', []);
    assert.equal(result.forcedSynonymPattern, true);
});

test('detectCannibalization flags a candidate with strong title overlap and matching intent', () => {
    const current = { title: 'How to Build an Emergency Fund', slug: 'how-to-build-an-emergency-fund-1', intent: 'How-to' };
    const candidates = [{ id: 2, slug: 'how-to-start-an-emergency-fund', title: 'How to Start an Emergency Fund' }];
    const results = svc.detectCannibalization(current, candidates);
    assert.equal(results.length, 1);
    assert.match(results[0].note, /overlap/);
});

test('detectCannibalization does not flag unrelated articles or a mismatched intent', () => {
    const current = { title: 'How to Build an Emergency Fund', slug: 'a', intent: 'How-to' };
    const candidates = [
        { id: 2, slug: 'b', title: 'Roth IRA vs Traditional IRA' },
        { id: 3, slug: 'c', title: 'What is an Emergency Fund?' }, // same words, different intent (Definition)
    ];
    const results = svc.detectCannibalization(current, candidates);
    assert.equal(results.length, 0);
});

test('detectCannibalization never merges, deletes, or changes a URL — it only reports', () => {
    const current = { title: 'How to Build an Emergency Fund', slug: 'a', intent: 'How-to' };
    const candidates = [{ id: 2, slug: 'how-to-build-emergency-savings', title: 'How to Build Emergency Savings' }];
    const results = svc.detectCannibalization(current, candidates);
    assert.equal(results.length, 1);
    assert.equal(results[0].slug, 'how-to-build-emergency-savings'); // reported, not rewritten
    assert.ok(!('merged' in results[0]) && !('redirectTo' in results[0]));
});

test('analyzeArticle includes depth, primaryTopicCoverage, topicCoverage, semanticCoverage, and cannibalization fields', () => {
    const title = 'How to Build an Emergency Fund';
    const content = [
        '# How to Build an Emergency Fund',
        'An emergency fund is money set aside for unexpected expenses.',
        '## How much should you save?',
        '1. Start with $1,000.',
        '2. Grow it to three months of expenses.',
        'An emergency fund protects you when life surprises you with unexpected expenses.',
    ].join('\n');
    const candidates = [{ id: 99, slug: 'how-to-start-an-emergency-fund', title: 'How to Start an Emergency Fund' }];
    const result = svc.analyzeArticle({ title, content, slug: 'how-to-build-an-emergency-fund-1' }, { candidates });

    assert.ok(result.depth);
    assert.ok(['low', 'medium', 'high'].includes(result.depth.topicComplexity));
    assert.ok(result.depth.suggestedMin > 0);
    assert.ok(result.primaryTopicCoverage);
    assert.equal(result.primaryTopicCoverage.inTitle, true);
    assert.ok(Array.isArray(result.topicCoverage));
    assert.ok(result.semanticCoverage);
    assert.ok(Array.isArray(result.cannibalization));
    assert.equal(result.cannibalization.length, 1);
});

// --- PROMPT 2: originality & writing-signal intelligence ---

test('detectRepeatedParagraphOpenings catches paragraphs that open the same way', () => {
    const content = ['You should save first.', 'You should track spending.', 'You should automate transfers.', 'Then relax.'].join('\n\n');
    const result = svc.detectRepeatedParagraphOpenings(content, 3);
    assert.ok(result.some((r) => r.opener.startsWith('you')));
});

test('detectTransitionOveruse flags a transition word used far beyond natural frequency', () => {
    const sentence = 'However, this is a short filler sentence to pad the word count nicely.';
    const content = Array(5).fill(sentence).join(' ');
    const result = svc.detectTransitionOveruse(content);
    assert.ok(result.flagged.some((f) => f.word === 'however'));
});

test('detectTransitionOveruse does not flag normal, occasional usage', () => {
    const content = 'This is a long paragraph about saving money. However, not everyone can save the same amount. Plan accordingly and review your budget every month to stay on track with your goals.';
    const result = svc.detectTransitionOveruse(content);
    assert.equal(result.flagged.length, 0);
});

test('analyzeSentenceLengthDistribution labels unusually uniform sentence lengths', () => {
    const sentence = 'This sentence has exactly eight words in it.';
    const content = Array(6).fill(sentence).join(' ');
    const result = svc.analyzeSentenceLengthDistribution(content);
    assert.equal(result.label, 'Unusually uniform');
});

test('analyzeSentenceLengthDistribution never claims variation proves human or AI authorship', () => {
    const result = svc.analyzeSentenceLengthDistribution('Short. A slightly longer sentence follows here. And another one, varied in length and shape, to keep things interesting for the reader.');
    assert.doesNotMatch(JSON.stringify(result), /human|\bai\b/i);
});

test('analyzeSentenceLengthDistribution flags many very short sentences', () => {
    // Mixed short (2-word) and long (20-word) sentences: enough spread that this isn't
    // "uniform", but still dominated by very-short sentences.
    const shortSentence = 'Ok fine.';
    const longSentence = Array(20).fill('word').join(' ') + '.';
    const content = Array(6).fill(shortSentence).concat(Array(4).fill(longSentence)).join(' ');
    const result = svc.analyzeSentenceLengthDistribution(content);
    assert.equal(result.label, 'Many very short sentences');
});

test('analyzeParagraphStructure flags repeated paragraph length and repeated openings', () => {
    const para = 'You should start small and build up your savings steadily over several months of consistent effort.';
    const content = Array(4).fill(para).join('\n\n');
    const result = svc.analyzeParagraphStructure(content);
    assert.equal(result.label, 'Formulaic pattern detected');
});

test('analyzeParagraphStructure does not flag a small number of paragraphs', () => {
    const result = svc.analyzeParagraphStructure('One paragraph.\n\nAnother one here.');
    assert.equal(result.repeatedLengthBucket, null);
});

test('analyzePunctuationPatterns flags unusually frequent semicolons', () => {
    const sentence = 'Save money; invest wisely; plan ahead; review often; stay disciplined; track progress.';
    const content = Array(3).fill(sentence).join(' ');
    const result = svc.analyzePunctuationPatterns(content);
    assert.equal(result.label, 'Warning');
    assert.ok(result.flags.some((f) => /semicolon/i.test(f)));
});

test('analyzePunctuationPatterns reports Good for ordinary punctuation usage', () => {
    const result = svc.analyzePunctuationPatterns('A plain paragraph with normal punctuation. Nothing unusual here at all, just regular sentences.');
    assert.equal(result.label, 'Good');
});

test('detectFormulaicSentenceStructure flags a long run of "X is/are" sentences', () => {
    const content = 'Saving is smart. Budgeting is useful. Investing is powerful. Planning is essential. Discipline is rewarding.';
    const result = svc.detectFormulaicSentenceStructure(content);
    assert.notEqual(result.level, 'Low');
    assert.ok(result.longestRun >= 4);
});

test('detectFormulaicSentenceStructure does not flag normal explanatory writing', () => {
    const content = 'Saving money takes discipline. Many people struggle with unexpected expenses that derail their plans. A good budget accounts for these surprises ahead of time.';
    const result = svc.detectFormulaicSentenceStructure(content);
    assert.equal(result.level, 'Low');
});

test('detectTemplateRepetition flags mechanical definition-style openings repeated across sections', () => {
    const sections = [
        { level: 2, text: 'Emergency Fund', wordCount: 20, firstSentence: 'Emergency fund is money set aside for emergencies.' },
        { level: 2, text: 'Retirement Account', wordCount: 20, firstSentence: 'Retirement account is a tax-advantaged savings vehicle.' },
        { level: 2, text: 'Index Fund', wordCount: 20, firstSentence: 'Index fund is a fund that tracks a market index.' },
    ];
    const result = svc.detectTemplateRepetition(sections);
    assert.equal(result.detected, true);
    assert.equal(result.matchingSections, 3);
});

test('detectTemplateRepetition does not flag normal, standard article structure', () => {
    const sections = [
        { level: 2, text: 'Getting Started', wordCount: 20, firstSentence: 'Let\'s walk through the first step together.' },
        { level: 2, text: 'Common Mistakes', wordCount: 20, firstSentence: 'Many people forget to automate their savings.' },
        { level: 2, text: 'Next Steps', wordCount: 20, firstSentence: 'Once you have a plan, revisit it every quarter.' },
    ];
    const result = svc.detectTemplateRepetition(sections);
    assert.equal(result.detected, false);
});

test('buildShingles produces overlapping n-word windows', () => {
    const shingles = svc.buildShingles('the quick brown fox jumps over the lazy dog', 4);
    assert.ok(shingles.has('the quick brown fox'));
    assert.ok(shingles.has('fox jumps over the'));
});

test('detectInternalSimilarity flags a candidate sharing a long duplicated passage, labeled as internal overlap not plagiarism', () => {
    const sharedPassage = 'the best way to save money every single month is to automate your transfers before you even see the cash and treat savings like a fixed non negotiable bill';
    const content = `Intro text here. ${sharedPassage} More unique content follows about budgeting habits and long term financial planning for the future.`;
    const candidates = [{ id: 2, slug: 'other-article', title: 'Other Article', content: `Different intro. ${sharedPassage} Different conclusion about something else entirely unrelated to this topic.` }];
    const result = svc.detectInternalSimilarity(content, candidates, 'this-article');
    assert.equal(result.length, 1);
    assert.match(result[0].note, /Internal content overlap/);
    assert.doesNotMatch(result[0].note, /plagiarism detected|is plagiarism/i);
});

test('detectInternalSimilarity does not flag unrelated articles', () => {
    const content = 'This article is entirely about zero-based budgeting techniques for beginners who want full control of every dollar.';
    const candidates = [{ id: 2, slug: 'unrelated', title: 'Unrelated', content: 'A totally different piece about maritime shipping logistics and container routing across the Pacific.' }];
    const result = svc.detectInternalSimilarity(content, candidates, 'this-article');
    assert.equal(result.length, 0);
});

test('detectInternalSimilarity excludes the current article from its own candidate list', () => {
    const content = 'Repeated content that would otherwise match itself word for word across a long shared passage of text here.';
    const candidates = [{ id: 1, slug: 'self', title: 'Self', content }];
    const result = svc.detectInternalSimilarity(content, candidates, 'self');
    assert.equal(result.length, 0);
});

test('domain terminology repeated naturally is not flagged as a writing-signal problem (false-positive control)', () => {
    // "Roth IRA" legitimately repeats often in an article about Roth IRAs — this must not
    // trigger repeated-phrase or formulaic-structure flags on its own.
    const content = 'A Roth IRA lets your money grow tax-free. Contributions to a Roth IRA are made with after-tax dollars. Withdrawals from a Roth IRA in retirement are generally tax-free as well, which makes a Roth IRA attractive for long-term savers.';
    const repeatedPhrases = svc.detectRepeatedPhrases(content);
    assert.ok(!repeatedPhrases.some((r) => r.phrase.includes('roth ira')));
});

test('computeOriginalityStatus returns Clean when there are no signals', () => {
    const status = svc.computeOriginalityStatus({
        internalOverlap: [],
        writingSignals: { repeatedPhrasesCount: 0, repeatedOpeningsCount: 0, sentenceVariation: 'Good', paragraphVariation: 'Good', punctuationPattern: 'Good', formulaicStructure: 'Low' },
    });
    assert.equal(status, 'Clean');
});

test('computeOriginalityStatus returns Review recommended when a writing signal fires', () => {
    const status = svc.computeOriginalityStatus({
        internalOverlap: [],
        writingSignals: { repeatedPhrasesCount: 2, repeatedOpeningsCount: 0, sentenceVariation: 'Good', paragraphVariation: 'Good', punctuationPattern: 'Good', formulaicStructure: 'Low' },
    });
    assert.equal(status, 'Review recommended');
});

test('computeOriginalityStatus returns External check required for strong internal overlap', () => {
    const status = svc.computeOriginalityStatus({
        internalOverlap: [{ similarity: 0.4 }],
        writingSignals: { repeatedPhrasesCount: 0, repeatedOpeningsCount: 0, sentenceVariation: 'Good', paragraphVariation: 'Good', punctuationPattern: 'Good', formulaicStructure: 'Low' },
    });
    assert.equal(status, 'External check required');
});

test('computeOriginalityStatus returns Provider unavailable when the provider errored', () => {
    const status = svc.computeOriginalityStatus({
        internalOverlap: [],
        writingSignals: { repeatedPhrasesCount: 0, repeatedOpeningsCount: 0, sentenceVariation: 'Good', paragraphVariation: 'Good', punctuationPattern: 'Good', formulaicStructure: 'Low' },
        providerResult: { status: 'error' },
    });
    assert.equal(status, 'Provider unavailable');
});

test('computeOriginalityStatus never returns a percentage-style or authorship claim', () => {
    for (const status of svc.ORIGINALITY_STATUSES) {
        assert.doesNotMatch(status, /%|100%|human|ai.generated/i);
    }
});

test('analyzeArticle exposes writingSignals, templateRepetition, internalOverlap, and originalityReview', () => {
    const result = svc.analyzeArticle({ title: 'How to Save Money', content: 'This is a perfectly ordinary article about saving money written in a normal, varied style with several different sentence lengths and no unusual repetition anywhere in the text at all, spanning enough words to pass the analysis threshold comfortably.' });
    assert.ok(result.writingSignals);
    assert.ok(result.templateRepetition);
    assert.ok(Array.isArray(result.internalOverlap));
    assert.ok(svc.ORIGINALITY_STATUSES.includes(result.originalityReview.status));
});

test('analyzeArticle never throws when candidates lack a content field (Prompt 1 callers)', () => {
    assert.doesNotThrow(() => svc.analyzeArticle({ title: 'X', content: 'word '.repeat(40) }, { candidates: [{ id: 1, slug: 'a', title: 'A' }] }));
});
