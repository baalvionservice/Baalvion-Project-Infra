'use strict';

// TMDB's daily trending list (movies, TV, people). Needs a free API key (env TMDB_API_KEY). Their free
// tier is non-commercial, so a commercial site needs their licence first; this only reads titles and
// dates and never copies their synopses or images.
async function fetchTmdbTrending({ apiKey, getJson }) {
    if (!apiKey) return { items: [], skipped: 'TMDB_API_KEY is not set' };
    const j = await getJson(`https://api.themoviedb.org/3/trending/all/day?api_key=${encodeURIComponent(apiKey)}`);
    const items = (j.results || []).filter((r) => r.media_type === 'movie' || r.media_type === 'tv' || r.media_type === 'person').slice(0, 15).map((r) => ({
        topic: r.title || r.name, type: r.media_type, id: r.id, date: r.release_date || r.first_air_date || null,
        url: `https://www.themoviedb.org/${r.media_type}/${r.id}`,
    })).filter((r) => r.topic);
    return { items, skipped: null };
}

module.exports = { fetchTmdbTrending };
