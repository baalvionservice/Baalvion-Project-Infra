const db = require('../models');

async function main() {
  try {
    console.log('Connecting to DB...');
    await db.sequelize.authenticate();
    console.log('DB connected.');

    console.log('Syncing models (create tables if not exist)...');
    await db.sequelize.sync({ force: false, alter: false });
    console.log('Tables synced.');

    // Run startup migrations (add missing columns from platformStore)
    console.log('Running column migrations...');
    await db.sequelize.query(`
      ALTER TABLE proxies ADD COLUMN IF NOT EXISTS name TEXT;
      ALTER TABLE proxies ADD COLUMN IF NOT EXISTS protocol TEXT DEFAULT 'http';
      ALTER TABLE proxies ADD COLUMN IF NOT EXISTS username TEXT;
      ALTER TABLE proxies ADD COLUMN IF NOT EXISTS password TEXT;
      ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';
      ALTER TABLE providers ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'generic';
      ALTER TABLE providers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'healthy';
      ALTER TABLE providers ADD COLUMN IF NOT EXISTS success_rate DECIMAL DEFAULT 100;
      ALTER TABLE providers ADD COLUMN IF NOT EXISTS latency INTEGER DEFAULT 0;
      ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_slug TEXT;
      ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS enforcement_mode TEXT DEFAULT 'pay-as-you-go';
      ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
      ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
      ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS name TEXT;
      ALTER TABLE abuse_logs ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT FALSE;
      ALTER TABLE abuse_logs ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'medium';
      ALTER TABLE abuse_logs ADD COLUMN IF NOT EXISTS reason TEXT;
      CREATE TABLE IF NOT EXISTS presets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL REFERENCES organizations(id),
        name TEXT NOT NULL,
        type TEXT,
        country TEXT,
        protocol TEXT DEFAULT 'http',
        rotation TEXT DEFAULT 'rotating',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_presets_org_id ON presets(org_id);
    `);
    console.log('Migrations done.');

    // Run dev seed
    console.log('Running dev seed...');
    const seeder = require('../seeders/devSeed');
    await seeder.run();
    console.log('All done!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
