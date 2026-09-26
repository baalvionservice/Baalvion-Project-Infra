'use strict';

/**
 * Word budgets by format, in one place so drafting and the publish gate can never disagree.
 *
 * The site's own rule (publication policy `wordCountRules`) always wins. `brief` is the only format with a built-in
 * default: a short news item of 150 to 350 words, meant for stories that honestly have only a few sourced facts.
 * There is deliberately no padding to reach a bigger number: a thin story is either a brief or is held.
 */

const DEFAULTS = { brief: { min: 150, max: 350 } };

/** { min, max } from the policy rule for this format, else the built-in default, else null. */
function ruleFor(rules, format) {
    const rule = (Array.isArray(rules) ? rules : []).find((r) => r && r.format === format);
    if (rule && (Number.isFinite(Number(rule.min)) || Number.isFinite(Number(rule.max)))) {
        return { min: Number.isFinite(Number(rule.min)) ? Number(rule.min) : null, max: Number.isFinite(Number(rule.max)) ? Number(rule.max) : null };
    }
    return DEFAULTS[format] || null;
}

module.exports = { ruleFor, DEFAULTS };
