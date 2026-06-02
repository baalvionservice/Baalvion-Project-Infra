'use strict';
// Real GitHub repo metadata for submitted code URLs. Works UNAUTHENTICATED for public
// repos (rate-limited); set GITHUB_TOKEN for higher limits + private-repo access.
const TOKEN = process.env.GITHUB_TOKEN || '';
const API = 'https://api.github.com';

// GitHub owners/repos only ever contain these characters. Validating against this
// allowlist keeps user-supplied values from escaping the api.github.com path and
// breaks the SSRF taint flow (request URL must not depend on unvalidated input).
const SEGMENT = /^[A-Za-z0-9._-]+$/;

function parseRepo(url) {
    if (!url) return null;
    const m = String(url).match(/github\.com[/:]([^/]+)\/([^/#?.]+)(?:\.git)?/i);
    if (!m) return null;
    const owner = m[1];
    const repo = m[2].replace(/\.git$/, '');
    if (!SEGMENT.test(owner) || !SEGMENT.test(repo)) return null;
    return { owner, repo };
}

async function gh(path) {
    const res = await fetch(`${API}${path}`, {
        headers: {
            Accept: 'application/vnd.github+json',
            'User-Agent': 'Baalvion-CTM',
            ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
        },
    });
    if (!res.ok) throw new Error(`GitHub ${res.status} on ${path}`);
    return res.json();
}

// Fetch real metadata for one repo URL. Returns a GitHubRepository-shaped object.
async function fetchRepoMeta(url, ownerName, ownerId) {
    const p = parseRepo(url);
    if (!p) throw new Error('Not a GitHub URL');
    const [repo, commits, branches] = await Promise.all([
        gh(`/repos/${p.owner}/${p.repo}`),
        gh(`/repos/${p.owner}/${p.repo}/commits?per_page=1`).catch(() => []),
        gh(`/repos/${p.owner}/${p.repo}/branches?per_page=100`).catch(() => []),
    ]);
    const lastCommit = Array.isArray(commits) && commits[0];
    return {
        id: String(repo.id),
        name: repo.full_name,
        url: repo.html_url,
        ownerName: ownerName || repo.owner?.login || p.owner,
        ownerId: ownerId || String(repo.owner?.id || ''),
        status: 'Connected',
        lastSync: new Date().toISOString(),
        commitCount: typeof repo.size === 'number' ? undefined : undefined, // GitHub API has no cheap total; left undefined
        branchCount: Array.isArray(branches) ? branches.length : 0,
        lastCommitMessage: lastCommit ? (lastCommit.commit?.message || '').split('\n')[0] : '',
        pushedAt: repo.pushed_at,
        stars: repo.stargazers_count,
        language: repo.language,
    };
}

const isConfigured = () => true; // public repos work without a token
const hasToken = () => Boolean(TOKEN);

module.exports = { parseRepo, fetchRepoMeta, isConfigured, hasToken };
