/* Generic: upsert entity rows from a JSON file (array of {type,name,slug,description,
   category,image,tags,attributes}) into imperialpedia.entities. Idempotent by (type,slug).
   Run with inline DB env: node scripts/_seedEntitiesFromJson.cjs <file.json> */
const path = require('path');
const db = require('../models');

const file = process.argv[2];
if (!file) { console.error('usage: node _seedEntitiesFromJson.cjs <file.json>'); process.exit(1); }
const rows = require(path.isAbsolute(file) ? file : path.join(__dirname, file));

async function main() {
  await db.sequelize.authenticate();
  await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS imperialpedia');
  await db.sequelize.sync();
  let n = 0;
  for (const r of rows) {
    const base = {
      type: r.type, name: r.name, slug: r.slug,
      description: r.description || '', category: r.category || null,
      country: r.country || null, industry: r.industry || null,
      image: r.image || null, tags: r.tags || [], attributes: r.attributes || {},
    };
    const [row, created] = await db.Entity.findOrCreate({ where: { type: r.type, slug: r.slug }, defaults: base });
    if (!created) await row.update(base);
    n++;
  }
  console.log(JSON.stringify({ ok: true, type: rows[0] && rows[0].type, seeded: n }));
  process.exit(0);
}
main().catch((e) => { console.error('seed failed:', e.message); process.exit(1); });
