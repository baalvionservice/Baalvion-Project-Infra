/**
 * @file scripts/gckb-status.cjs
 * @description Read-only: how many published reference records the database holds, by type.
 * Use it to see whether the public directories (/countries, /ports, /fta, /authorities) have
 * anything to show. It writes nothing.
 *
 *   node scripts/gckb-status.cjs
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.gckbRecord.groupBy({
    by: ['entityType', 'status'],
    where: { organizationId: null, deletedAt: null },
    _count: { _all: true },
  });
  if (rows.length === 0) console.log('No platform-global reference records. The public directories will be empty.');
  for (const r of rows.sort((a, b) => a.entityType.localeCompare(b.entityType))) {
    console.log(`${r.entityType.padEnd(18)} ${String(r.status).padEnd(10)} ${r._count._all}`);
  }
}

main()
  .catch((err) => {
    console.error('Status check failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
