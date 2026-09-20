'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { validateTeam, validateCompetition, validateSportsInfo } = require('../utils/sportsValidation');

test('a team needs a slug and name; the site url must be https', () => {
    assert.doesNotThrow(() => validateTeam({ slug: 'miami-heat', name: 'Miami Heat', sport: 'Basketball', url: 'https://www.nba.com/heat' }, true));
    assert.throws(() => validateTeam({ slug: 'Miami Heat', name: 'x' }, true));
    assert.throws(() => validateTeam({ slug: 'a', name: 'A', url: 'http://plain.example' }, true));
    assert.throws(() => validateTeam({ slug: 'a', name: 'A', country_code: 'USA' }, true));
});

test('a competition checks its level, date, athletes and videos', () => {
    const ok = { slug: '2016-nba-finals', name: '2016 NBA Finals', level: 'championship', event_date: '2016-06' };
    assert.doesNotThrow(() => validateCompetition({ ...ok, people_involved: [{ personSlug: 'lebron-james', role: 'Player', result: 'Champion' }] }, true));
    assert.throws(() => validateCompetition({ ...ok, level: 'friendly' }, true));
    assert.throws(() => validateCompetition({ ...ok, event_date: 'June' }, true));
    assert.throws(() => validateCompetition({ ...ok, people_involved: [{ personSlug: 'LeBron', role: 'x' }] }, true), /athletes row 1/);
    assert.throws(() => validateCompetition({ ...ok, videos: [{ title: 'x', url: 'http://plain.example' }] }, true));
});

test('sports info ties an athlete to a sport and, optionally, a team page', () => {
    assert.doesNotThrow(() => validateSportsInfo({}));
    assert.doesNotThrow(() => validateSportsInfo({ sport: 'Basketball', position: 'Forward', teamSlug: 'los-angeles-lakers' }));
    assert.throws(() => validateSportsInfo({ position: 'Forward' }));
    assert.throws(() => validateSportsInfo({ sport: 'Basketball', teamSlug: 'Los Angeles Lakers' }));
    assert.throws(() => validateSportsInfo('basketball'));
});

test('unpublished cannot be indexable', () => {
    assert.throws(() => validateTeam({ indexable: true, published: false }, false));
    assert.throws(() => validateCompetition({ indexable: true, published: false }, false));
});
