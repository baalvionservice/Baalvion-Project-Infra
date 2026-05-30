'use strict';
/**
 * Provider-agnostic LLM generation, key-gated. Configure via env:
 *   AI_API_KEY   — provider key (when ABSENT, generate() returns null → callers use a
 *                  templated fallback, so the app works fully without a key).
 *   AI_PROVIDER  — 'anthropic' (default) | 'openai'
 *   AI_MODEL     — model id (defaults per provider)
 * This is the single "one key away" integration point for all generative AI features.
 */
const KEY = process.env.AI_API_KEY || '';
const PROVIDER = (process.env.AI_PROVIDER || 'anthropic').toLowerCase();
const MODEL = process.env.AI_MODEL || (PROVIDER === 'openai' ? 'gpt-4o-mini' : 'claude-3-5-haiku-latest');

const isEnabled = () => !!KEY;

async function generate({ system, prompt, maxTokens = 700 }) {
    if (!KEY) return null; // no key configured → caller falls back to templated content
    try {
        if (PROVIDER === 'anthropic') {
            const r = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: { 'content-type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
                body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: 'user', content: prompt }] }),
            });
            if (!r.ok) throw new Error(`anthropic ${r.status}`);
            const j = await r.json();
            return (j.content || []).map((c) => c.text || '').join('').trim() || null;
        }
        // OpenAI-compatible
        const r = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'content-type': 'application/json', authorization: `Bearer ${KEY}` },
            body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }] }),
        });
        if (!r.ok) throw new Error(`openai ${r.status}`);
        const j = await r.json();
        return j.choices?.[0]?.message?.content?.trim() || null;
    } catch (e) {
        console.error('[AI] generate failed:', e.message);
        return null; // graceful — caller falls back
    }
}

module.exports = { generate, isEnabled, provider: PROVIDER, model: MODEL };
