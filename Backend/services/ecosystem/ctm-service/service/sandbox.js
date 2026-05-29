'use strict';
// Code-execution sandbox adapter (Judge0). Env-gated: set JUDGE0_URL (+ optional
// JUDGE0_KEY for RapidAPI-hosted) to enable REAL automated test runs. When unset,
// runTestCases() returns null so callers fall back to manual/pending test cases.
//
//   JUDGE0_URL=https://judge0-ce.p.rapidapi.com   JUDGE0_KEY=...   JUDGE0_HOST=...
const URL = process.env.JUDGE0_URL || '';
const KEY = process.env.JUDGE0_KEY || '';
const HOST = process.env.JUDGE0_HOST || '';

const LANG = { javascript: 63, js: 63, python: 71, py: 71, java: 62, c: 50, cpp: 54, 'c++': 54, go: 60, ruby: 72, rust: 73, typescript: 74 };

const isConfigured = () => Boolean(URL);

function headers() {
    return {
        'Content-Type': 'application/json',
        ...(KEY ? { 'X-RapidAPI-Key': KEY } : {}),
        ...(HOST ? { 'X-RapidAPI-Host': HOST } : {}),
    };
}

// cases: [{ name, stdin, expected_output, language }]. Returns test_cases-shaped results,
// or null when the sandbox is not configured.
async function runTestCases({ sourceCode, language, cases }) {
    if (!URL || !sourceCode) return null;
    const language_id = LANG[String(language || 'javascript').toLowerCase()] || 63;
    const results = [];
    for (const c of cases || []) {
        const t0 = Date.now();
        try {
            const res = await fetch(`${URL.replace(/\/$/, '')}/submissions?base64_encoded=false&wait=true`, {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify({ source_code: sourceCode, language_id, stdin: c.stdin || '', expected_output: c.expected_output }),
            });
            const data = await res.json();
            const actual = (data.stdout || data.compile_output || data.stderr || '').trim();
            const expected = (c.expected_output || '').trim();
            const passed = data.status?.id === 3 && (!expected || actual === expected);
            results.push({
                name: c.name || 'case',
                description: c.description || '',
                expected_outcome: expected,
                actual_outcome: actual,
                status: passed ? 'Passed' : (data.status?.id === 6 ? 'Warning' : 'Failed'),
                runtime_ms: Date.now() - t0,
                metadata: { judge0_status: data.status },
            });
        } catch (e) {
            results.push({ name: c.name || 'case', status: 'Failed', actual_outcome: String(e.message), runtime_ms: Date.now() - t0, metadata: {} });
        }
    }
    return results;
}

module.exports = { isConfigured, runTestCases };
