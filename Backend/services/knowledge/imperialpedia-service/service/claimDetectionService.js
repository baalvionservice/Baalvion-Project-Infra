'use strict';
/**
 * PROMPT 3 — Fact & Source Intelligence, STAGE A: local claim detection.
 *
 * Deterministic, synchronous, no external dependency and no database — same constraint as
 * articleAnalysisService.js, so this is safe to run on every debounced /ai/article-analysis
 * call. It identifies sentences that look like factual claims worth an editor's verification
 * and classifies them; it never decides a claim is true or false, never fabricates a source,
 * and never rewrites the article.
 *
 * Deliberately self-contained (does not require articleAnalysisService.js) to avoid a circular
 * require, since that module requires this one to fold results into analyzeArticle()'s output.
 */

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

/** Strips markdown ATX headings so heading text itself is never treated as a claim sentence. */
function stripHeadingLines(content) {
    return (content || '')
        .split('\n')
        .filter((line) => !/^#{1,6}\s+/.test(line.trim()))
        .join('\n');
}

// ------------------------------------------------------------------------------------------
// Detection signals (§4 of the spec). Each is a regex over a single sentence. Named constants
// so the rules read as editorial judgment calls, not opaque magic.
// ------------------------------------------------------------------------------------------

const CURRENCY_PATTERN = /\$\s?\d[\d,]*(\.\d+)?\s?(million|billion|trillion|k)?\b/i;
const PERCENT_PATTERN = /\b\d+(\.\d+)?\s?%/;
const RATIO_PATTERN = /\b\d+\s+in\s+\d+\b/i;
const LARGE_NUMBER_PATTERN = /\b\d+(\.\d+)?\s?(million|billion|trillion)\b/i;
const PLAIN_NUMBER_WITH_UNIT = /\b\d+(\.\d+)?\s?(years?|months?|days?|percent|percentage points?)\b/i;
const YEAR_PATTERN = /\b(19|20)\d{2}\b/;

// A sentence is "self-referential" (about the article/piece itself, not the world) when it
// names the article as the subject of the count — spec §4A's "five sections" example. This
// alone suppresses a NUMERICAL claim, but a stronger signal (legal/tax/statistical) below can
// still promote the sentence to a claim.
const SELF_REFERENTIAL_PATTERN = /\b(this article|this section|this guide|this piece|this post|the article contains|the following section|in this article)\b/i;

const LEGAL_PATTERN = /\b(federal law|state law|the law requires|is illegal|is legal|lawsuit|litigation|court ruled|statute|legal requirement|legally required|violat(e|es|ion)|the constitution)\b/i;
const REGULATORY_PATTERN = /\b(regulation|regulatory|regulator|must (register|file|report|comply|obtain|disclose|provide|maintain|pay|notify|withhold|verify|submit)|is required to|are required to|applicants? (is|are) required|complian(t|ce)|licens(e|ing|ed)|failure to comply|penalt(y|ies)|eligib(le|ility))\b/i;
const IMMIGRATION_PATTERN = /\b(visa|immigration|green card|permanent residen(t|cy)|deportation|asylum|naturalization|work permit)\b/i;

// IRA/401(k) contribution limits are, in practice, a tax topic (spec's own running example is
// "IRA contribution limits" under TAX throughout) — grouped here rather than under FINANCIAL so
// that example classifies and recommends an IRS/Treasury source rather than a market regulator.
const TAX_PATTERN = /\b(tax(es|ation|able|-free)?|irs\b|capital gains|tax bracket|tax credit|tax deduction|w-2|1099|filing status|\bira\b|401\(?k\)?|contribution limit)\b/i;
const FINANCIAL_PATTERN = /\b(interest rate|apr\b|apy\b|retirement (account|plan)|mortgage rate|credit score|management fee|expense ratio|\bsec\b|federal reserve|the fed\b|treasury\b|fdic\b)\b/i;

const STATISTICAL_PATTERN = /\b(percent(age)?|on average|the average|median|survey(ed)?|studies show|a study (found|shows)|research (shows|found|indicates)|according to|most americans|the majority of|millions of (people|americans|users|households)|annual (rate|growth)|market share|growth rate)\b/i;

const MEDICAL_PATTERN = /\b(diagnos(is|ed)|treatment|medication|clinical trial|the (fda|cdc|who) (approved|recommends|warns)|disease|symptom|vaccine|medical (advice|condition))\b/i;
const SCIENTIFIC_PATTERN = /\b(peer-reviewed|published in|researchers (found|discovered)|the study concluded|scientists (say|found))\b/i;

// Known named organizations worth flagging even without another signal (§4F). Kept short and
// specific rather than a generic capitalized-phrase matcher, to avoid false positives on every
// proper noun in the article.
const KNOWN_ORG_PATTERN = /\b(the irs|the sec|the fdic|the federal reserve|the treasury( department)?|the fda|the cdc|the who\b|the world bank|the imf\b|the ftc|the department of (justice|labor|education|commerce)|congress|the supreme court|eurostat|the european union|the un\b|the united nations)\b/i;
const GENERIC_ORG_PATTERN = /\b([A-Z][a-zA-Z&.]*(?:\s+[A-Z][a-zA-Z&.]*){0,3}\s+(?:Inc\.?|Corp\.?|LLC|Association|Organization|Institute|Agency|Bureau|Administration|Commission|Bank|University|College))\b/;

const PERSON_ATTRIBUTION_PATTERN = /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,2})\s+(?:said|says|stated|noted|explained|argued|wrote|told\s)/;
// "According to <Name>" — matched case-insensitively for the trigger phrase (so it fires at a
// sentence's start), then the captured name itself is validated separately for capitalization
// so a lowercase "according to the report" doesn't get mistaken for a person's name.
const ACCORDING_TO_TRIGGER_PATTERN = /according to\s+((?:Dr\.|Professor|Prof\.)?\s?[A-Za-z][a-zA-Z.]*(?:\s[A-Za-z][a-zA-Z.]*){0,2})/i;
const CAPITALIZED_NAME_PATTERN = /^(?:Dr\.|Professor|Prof\.)?\s?[A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2}$/;

function matchAccordingToPerson(sentence) {
    const m = ACCORDING_TO_TRIGGER_PATTERN.exec(sentence);
    if (!m) return null;
    const candidate = m[1].trim();
    return CAPITALIZED_NAME_PATTERN.test(candidate) ? [m[0], candidate] : null;
}

// Jurisdiction keywords — not authoritative geolocation, just a text signal that the sentence
// already scopes itself to a jurisdiction (spec §22). Deliberately does not assume US law
// applies globally: presence of ANY of these (US or otherwise) counts as "jurisdiction stated".
const JURISDICTION_PATTERN = /\b(united states|u\.s\.|usa\b|federal(ly)?|the irs|state of \w+|(alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming)|united kingdom|\buk\b|england|canada|european union|\beu\b|australia|germany|france|japan|india|china)\b/i;

// Time-sensitivity keywords — combined with a year (or on their own for "current X") mark a
// claim as likely to go stale (spec §4B / §23).
const TIME_SENSITIVE_KEYWORD_PATTERN = /\b(current(ly)?|as of|this year|latest|updated|contribution limit|tax bracket|interest rate|deadline|threshold|eligib(le|ility)|effective (date|as of)|for \d{4}|in \d{4})\b/i;

// Citation already present near this sentence — markdown link, explicit "(source: ...)", or a
// bare URL. Mirrors detectSourceOpportunities()'s hasNearbyCitation in articleAnalysisService.js
// (kept duplicated here rather than imported — see the module header comment on circularity).
const CITATION_PATTERN = /\[[^\]]*\]\(https?:\/\/[^)]+\)|\(source[:\s][^)]*\)|https?:\/\/\S+/i;

const PRIMARY_SOURCE_DOMAIN_PATTERN = /\.gov(\/|$|\W)|\.mil(\/|$|\W)|irs\.gov|sec\.gov|federalreserve\.gov|treasury\.gov|congress\.gov|supremecourt\.gov|courtlistener\.com|europa\.eu|un\.org|worldbank\.org|imf\.org/i;
const SECONDARY_SOURCE_DOMAIN_PATTERN = /\.edu(\/|$|\W)|reuters\.com|apnews\.com|bloomberg\.com|wsj\.com|nytimes\.com|ft\.com|brookings\.edu|nber\.org|pewresearch\.org|nature\.com|science\.org/i;

const CLAIM_CATEGORIES = [
    'GENERAL_FACT', 'NUMERICAL', 'STATISTICAL', 'DATE_SENSITIVE', 'LEGAL', 'REGULATORY',
    'FINANCIAL', 'TAX', 'ECONOMIC', 'SCIENTIFIC', 'MEDICAL', 'IMMIGRATION', 'GOVERNMENT',
    'ORGANIZATION', 'PERSON_ATTRIBUTION', 'GEOGRAPHIC', 'BUSINESS', 'OTHER',
];

/** Extracts a bounded URL from the citation match, if any, for source-quality classification. */
function extractCitationUrl(text) {
    const m = /https?:\/\/[^\s)]+/i.exec(text || '');
    return m ? m[0] : null;
}

function classifySourceQuality(url) {
    if (!url) return 'unknown';
    if (PRIMARY_SOURCE_DOMAIN_PATTERN.test(url)) return 'primary';
    if (SECONDARY_SOURCE_DOMAIN_PATTERN.test(url)) return 'secondary';
    return 'general';
}

const RECOMMENDED_SOURCE_TYPE = {
    TAX: 'Government / IRS or Treasury',
    FINANCIAL: 'Government / financial regulator (SEC, Federal Reserve, FDIC)',
    LEGAL: 'Government / official legislation or court record',
    REGULATORY: 'Government / the relevant regulator',
    IMMIGRATION: 'Government / official immigration authority',
    GOVERNMENT: 'Government / official agency',
    ECONOMIC: 'Government statistical agency or established research organization',
    STATISTICAL: 'Primary dataset or the original study/survey',
    MEDICAL: 'Government health agency or peer-reviewed research',
    SCIENTIFIC: 'Peer-reviewed original research',
};

/**
 * Classifies a single sentence. Returns null when no detection signal fired — NOT every
 * sentence is a claim (spec §35: "never call every sentence a citation-required claim").
 */
function classifySentence(sentence) {
    const hasCurrency = CURRENCY_PATTERN.test(sentence);
    const hasPercent = PERCENT_PATTERN.test(sentence);
    const hasRatio = RATIO_PATTERN.test(sentence);
    const hasLargeNumber = LARGE_NUMBER_PATTERN.test(sentence);
    const hasUnitNumber = PLAIN_NUMBER_WITH_UNIT.test(sentence);
    const hasYear = YEAR_PATTERN.test(sentence);
    const isSelfReferential = SELF_REFERENTIAL_PATTERN.test(sentence);

    const hasLegal = LEGAL_PATTERN.test(sentence);
    const hasRegulatory = REGULATORY_PATTERN.test(sentence);
    const hasImmigration = IMMIGRATION_PATTERN.test(sentence);
    const hasTax = TAX_PATTERN.test(sentence);
    const hasFinancial = FINANCIAL_PATTERN.test(sentence);
    const hasStatistical = STATISTICAL_PATTERN.test(sentence);
    const hasMedical = MEDICAL_PATTERN.test(sentence);
    const hasScientific = SCIENTIFIC_PATTERN.test(sentence);
    const hasKnownOrg = KNOWN_ORG_PATTERN.test(sentence);
    const hasGenericOrg = GENERIC_ORG_PATTERN.test(sentence);
    const accordingToMatch = matchAccordingToPerson(sentence);
    const saidMatch = PERSON_ATTRIBUTION_PATTERN.exec(sentence);
    const personMatch = accordingToMatch ? [accordingToMatch[0], accordingToMatch[1]] : saidMatch;
    const hasJurisdictionMention = JURISDICTION_PATTERN.test(sentence);
    const hasTimeSensitiveKeyword = TIME_SENSITIVE_KEYWORD_PATTERN.test(sentence);

    const hasNumericSignal = (hasCurrency || hasPercent || hasRatio || hasLargeNumber || hasUnitNumber) && !isSelfReferential;

    let category = null;
    if (hasLegal) category = 'LEGAL';
    else if (hasImmigration) category = 'IMMIGRATION';
    else if (hasTax) category = 'TAX';
    else if (hasFinancial) category = 'FINANCIAL';
    else if (hasRegulatory) category = 'REGULATORY';
    else if (hasMedical) category = 'MEDICAL';
    else if (hasScientific) category = 'SCIENTIFIC';
    else if (hasYear && hasTimeSensitiveKeyword) category = 'DATE_SENSITIVE';
    // A named-person attribution ("According to Jane Rodriguez...") is more specific than the
    // generic STATISTICAL "according to" signal, so it takes priority when a real name was
    // actually captured — otherwise a bare "studies show" style sentence would never reach
    // STATISTICAL because "according to" also lives in STATISTICAL_PATTERN.
    else if (personMatch) category = 'PERSON_ATTRIBUTION';
    else if (hasStatistical) category = 'STATISTICAL';
    else if (hasNumericSignal) category = 'NUMERICAL';
    else if (hasKnownOrg) category = 'GOVERNMENT';
    else if (hasGenericOrg) category = 'ORGANIZATION';

    if (!category) return null;

    // Low-confidence catch-all: a claim-shaped sentence that only weakly matched (e.g. a bare
    // organization mention with nothing else) is still reported, per spec §5, but under a
    // generic bucket rather than an over-specific one when there's little else to go on.
    const timeSensitive = Boolean(hasYear && hasTimeSensitiveKeyword);

    return {
        category,
        timeSensitive,
        jurisdictionRelevant: ['LEGAL', 'REGULATORY', 'TAX', 'FINANCIAL', 'IMMIGRATION', 'ECONOMIC'].includes(category),
        jurisdictionStated: hasJurisdictionMention,
        personAttributed: Boolean(personMatch),
        attributedName: personMatch ? personMatch[1] : null,
    };
}

/** Looks for a citation in the sentence itself or the one immediately following it (footnote-style). */
function findNearbyCitation(sentences, index) {
    const window = [sentences[index], sentences[index + 1]].filter(Boolean).join(' ');
    const match = CITATION_PATTERN.exec(window);
    if (!match) return null;
    return { present: true, url: extractCitationUrl(match[0]) };
}

function severityFor({ category, citationPresent, sourceQuality }) {
    const highStakes = category === 'LEGAL' || category === 'REGULATORY' || category === 'IMMIGRATION';
    if (highStakes && !citationPresent) return 'CRITICAL';
    const verifiable = ['NUMERICAL', 'STATISTICAL', 'DATE_SENSITIVE', 'TAX', 'FINANCIAL', 'ECONOMIC', 'MEDICAL', 'SCIENTIFIC'].includes(category);
    if (verifiable && !citationPresent) return 'WARNING';
    if (highStakes && citationPresent && sourceQuality !== 'primary') return 'WARNING';
    if (citationPresent && sourceQuality && sourceQuality !== 'primary') return 'SUGGESTION';
    if (category === 'PERSON_ATTRIBUTION' && !citationPresent) return 'SUGGESTION';
    if (category === 'ORGANIZATION' && !citationPresent) return 'SUGGESTION';
    return 'SUGGESTION';
}

const PRIMARY_OPPORTUNITY_CATEGORIES = new Set(['TAX', 'FINANCIAL', 'LEGAL', 'REGULATORY', 'IMMIGRATION', 'GOVERNMENT', 'ECONOMIC', 'MEDICAL', 'SCIENTIFIC']);

/**
 * Runs Stage A over an article's title + content. Never touches the network or a database.
 * Returns the additive `factSourceIntelligence` block described in spec §31.
 */
function detectClaims({ title = '', content = '' } = {}) {
    const body = stripHeadingLines(content);
    const sentences = splitSentences(body);
    const claims = [];

    sentences.forEach((sentence, index) => {
        const classification = classifySentence(sentence);
        if (!classification) return;

        const citation = findNearbyCitation(sentences, index);
        const citationPresent = Boolean(citation && citation.present);
        const sourceQuality = citationPresent ? classifySourceQuality(citation.url) : null;

        const jurisdictionUnclear = classification.jurisdictionRelevant && !classification.jurisdictionStated;
        const primarySourceOpportunity = PRIMARY_OPPORTUNITY_CATEGORIES.has(classification.category) && sourceQuality !== 'primary';

        const severity = severityFor({ category: classification.category, citationPresent, sourceQuality });

        claims.push({
            id: `claim-${index}`,
            text: sentence.length > 400 ? `${sentence.slice(0, 400)}…` : sentence,
            category: classification.category,
            severity,
            citationPresent,
            citationUrl: citation ? citation.url : null,
            sourceQuality, // 'primary' | 'secondary' | 'general' | 'unknown' | null (no citation)
            timeSensitive: classification.timeSensitive,
            jurisdiction: {
                relevant: classification.jurisdictionRelevant,
                stated: classification.jurisdictionStated,
                unclear: jurisdictionUnclear,
            },
            primarySourceOpportunity,
            recommendedSourceType: primarySourceOpportunity ? (RECOMMENDED_SOURCE_TYPE[classification.category] || null) : null,
            attributedTo: classification.attributedName,
            researchStatus: 'not_researched',
        });
    });

    const summary = {
        total: claims.length,
        needsVerification: claims.filter((c) => c.severity === 'CRITICAL' || c.severity === 'WARNING').length,
        citationPresent: claims.filter((c) => c.citationPresent).length,
        timeSensitive: claims.filter((c) => c.timeSensitive).length,
        primarySourceOpportunities: claims.filter((c) => c.primarySourceOpportunity).length,
    };

    return { claims, summary, researchStatus: 'not_researched' };
}

/**
 * Builds a targeted, deterministic search-query string for a claim (spec §21). This is display
 * text / a research-provider hint only — it is never auto-inserted into the article, and does
 * not itself perform any lookup.
 */
function buildResearchQuery(claim) {
    if (!claim || !claim.text) return '';
    const domainHint = {
        TAX: 'site:irs.gov', FINANCIAL: 'site:sec.gov OR site:federalreserve.gov',
        LEGAL: 'site:congress.gov OR site:courtlistener.com', REGULATORY: '', IMMIGRATION: 'site:uscis.gov',
        MEDICAL: 'site:cdc.gov OR site:nih.gov', SCIENTIFIC: '',
    }[claim.category] || '';
    const yearMatch = YEAR_PATTERN.exec(claim.text);
    const core = claim.text.replace(/[.!?]+$/, '').slice(0, 140);
    return [domainHint, core, yearMatch ? yearMatch[0] : ''].filter(Boolean).join(' ').trim();
}

module.exports = {
    detectClaims,
    buildResearchQuery,
    classifySentence,
    classifySourceQuality,
    findNearbyCitation,
    severityFor,
    CLAIM_CATEGORIES,
    // exported for focused unit tests
    tokenizeWords,
    splitSentences,
    stripHeadingLines,
};
