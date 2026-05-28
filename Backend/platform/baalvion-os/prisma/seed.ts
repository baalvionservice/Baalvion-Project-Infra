/**
 * Baseline RBAC seed — mirrors the Keycloak realm roles into the local
 * roles/permissions tables and grants the admin role every permission.
 * Run: npm run seed  (after `prisma migrate`)
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROLES = [
  { key: 'admin', name: 'Administrator' },
  { key: 'recruiter', name: 'Recruiter' },
  { key: 'creator', name: 'Creator' },
  { key: 'brand', name: 'Brand' },
  { key: 'lawyer', name: 'Lawyer' },
  { key: 'client', name: 'Client' },
];

const PERMISSIONS = [
  'jobs:read', 'jobs:create', 'jobs:update', 'jobs:delete',
  'applications:read', 'applications:manage',
  'campaigns:read', 'campaigns:create', 'campaigns:approve',
  'content:read', 'content:publish',
  'users:read', 'users:manage',
  'settings:manage', 'cms:manage', 'logs:read',
];

async function main() {
  for (const r of ROLES) {
    await prisma.role.upsert({ where: { key: r.key }, update: { name: r.name }, create: r });
  }
  for (const key of PERMISSIONS) {
    await prisma.permission.upsert({ where: { key }, update: {}, create: { key } });
  }

  // admin → all permissions
  const admin = await prisma.role.findUnique({ where: { key: 'admin' } });
  const perms = await prisma.permission.findMany();
  if (admin) {
    for (const p of perms) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: admin.id, permissionId: p.id } },
        update: {},
        create: { roleId: admin.id, permissionId: p.id },
      });
    }
  }

  // recruiter → jobs + applications
  const recruiter = await prisma.role.findUnique({ where: { key: 'recruiter' } });
  if (recruiter) {
    const recruiterPerms = perms.filter((p) => p.key.startsWith('jobs:') || p.key.startsWith('applications:'));
    for (const p of recruiterPerms) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: recruiter.id, permissionId: p.id } },
        update: {},
        create: { roleId: recruiter.id, permissionId: p.id },
      });
    }
  }

  console.log(`Seeded ${ROLES.length} roles, ${PERMISSIONS.length} permissions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
