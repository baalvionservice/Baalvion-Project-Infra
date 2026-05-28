const db = require('../models');
db.sequelize.authenticate()
  .then(() => db.sequelize.query("SELECT tablename FROM pg_tables WHERE schemaname='public'"))
  .then(([rows]) => { console.log('Tables:', rows.map(r=>r.tablename).join(', ')); process.exit(0); })
  .catch(e => { console.error('ERROR:', e.message); process.exit(1); });
