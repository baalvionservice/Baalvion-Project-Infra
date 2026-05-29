const fs = require('fs');
const path = require('path');
const db = require('./models');
const config = require('./config/appConfig');

async function run() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const appliedMigrations = [];

  try {
    // Create migrations table if it doesn't exist
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        migration_name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Get list of applied migrations
    const [applied] = await db.sequelize.query(
      `SELECT migration_name FROM schema_migrations ORDER BY applied_at ASC`
    );
    const appliedNames = applied.map((row) => row.migration_name);

    // Read all migration files
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

    for (const file of files) {
      if (!appliedNames.includes(file)) {
        console.log(`Running migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
        await db.sequelize.query(sql);
        await db.sequelize.query(`INSERT INTO schema_migrations (migration_name) VALUES (?)`, {
          replacements: [file],
        });
        appliedMigrations.push(file);
      }
    }

    console.log(`[ledger-service] Migrations completed. Applied: ${appliedMigrations.length}`);
    return { applied: appliedMigrations, total: files.length };
  } catch (err) {
    console.error('[ledger-service] Migration error:', err.message);
    throw err;
  }
}

if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { run };
