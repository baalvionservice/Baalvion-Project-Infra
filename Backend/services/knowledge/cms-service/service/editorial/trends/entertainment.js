'use strict';

// What counts as "entertainment", by Wikidata class. Every ID here was checked against Wikidata's own
// English label before it was listed (a wrong ID silently mis-files topics, so do not add one from memory).

const WORK_CLASSES = new Set([
    'Q11424',   // film
    'Q202866',  // animated film
    'Q506240',  // television film
    'Q93204',   // documentary film
    'Q24856',   // film series
    'Q5398426', // television series
    'Q15416',   // television program
    'Q526877',  // web series
    'Q482994',  // album
    'Q7366',    // song
    'Q134556',  // single
]);
const ACT_CLASSES = new Set(['Q215380']); // musical group
const PERSON_OCCUPATIONS = new Set([
    'Q33999', 'Q10800557', 'Q10798782', 'Q2405480', // actor, film actor, television actor, voice actor
    'Q177220', 'Q488205', 'Q639669', 'Q2252262', 'Q130857', 'Q36834', // singer, singer-songwriter, musician, rapper, DJ, composer
    'Q2526255', 'Q2059704', 'Q3282637', 'Q28389', // film director, television director, film producer, screenwriter
    'Q947873', 'Q17125263', 'Q15077007', 'Q4610556', // TV presenter, YouTuber, podcaster, model
]);
const PERSON = 'Q5';

const ids = (entity, prop) => ((entity && entity.claims && entity.claims[prop]) || [])
    .map((c) => c.mainsnak && c.mainsnak.datavalue && c.mainsnak.datavalue.value && c.mainsnak.datavalue.value.id).filter(Boolean);

/** 'person' | 'act' | 'work' when the Wikidata entity is entertainment, else null. */
function classifyEntity(entity) {
    const types = ids(entity, 'P31');
    if (types.some((t) => WORK_CLASSES.has(t))) return 'work';
    if (types.some((t) => ACT_CLASSES.has(t))) return 'act';
    if (types.includes(PERSON) && ids(entity, 'P106').some((o) => PERSON_OCCUPATIONS.has(o))) return 'person';
    return null;
}

module.exports = { classifyEntity, WORK_CLASSES, PERSON_OCCUPATIONS };
