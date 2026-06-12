/**
 * Seed script — creates demo accounts and live opportunities so the platform
 * is usable immediately. Passwords are hashed with the same Argon2id params as
 * the API's PasswordService, so seeded users can log in normally.
 *
 * Run: pnpm --filter @baalvion-invest/database seed
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const ARGON: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

async function hash(pw: string): Promise<string> {
  return argon2.hash(pw, ARGON);
}

async function upsertUser(
  email: string,
  fullName: string,
  password: string,
  country: string,
) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      fullName,
      passwordHash: await hash(password),
      country,
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });
}

async function main() {
  console.log('Seeding…');

  // ── Platform admin ─────────────────────────────────────────────────────────
  const adminUser = await upsertUser(
    'admin@baalvion.invest',
    'Platform Admin',
    'Admin!2026Pass',
    'AE',
  );
  let adminOrg = await prisma.organization.findFirst({
    where: { type: 'PLATFORM' },
  });
  if (!adminOrg) {
    adminOrg = await prisma.organization.create({
      data: { type: 'PLATFORM', legalName: 'Baalvion Invest', status: 'ACTIVE' },
    });
  }
  await prisma.membership.upsert({
    where: { orgId_userId: { orgId: adminOrg.id, userId: adminUser.id } },
    update: { role: 'ADMIN' },
    create: { orgId: adminOrg.id, userId: adminUser.id, role: 'ADMIN' },
  });

  // ── Demo investor ──────────────────────────────────────────────────────────
  const investorUser = await upsertUser(
    'investor@demo.invest',
    'Alex Investor',
    'Investor!2026',
    'SG',
  );
  let investorOrg = await prisma.organization.findFirst({
    where: { memberships: { some: { userId: investorUser.id } }, type: { in: ['INVESTOR_INDIVIDUAL', 'INVESTOR_ENTITY'] } },
  });
  if (!investorOrg) {
    investorOrg = await prisma.organization.create({
      data: {
        type: 'INVESTOR_INDIVIDUAL',
        legalName: 'Alex Investor',
        displayName: 'Alex Investor',
        country: 'SG',
        status: 'ACTIVE',
      },
    });
    await prisma.membership.create({
      data: { orgId: investorOrg.id, userId: investorUser.id, role: 'OWNER' },
    });
  }
  const investorProfile = await prisma.investorProfile.upsert({
    where: { orgId: investorOrg.id },
    update: {},
    create: {
      orgId: investorOrg.id,
      type: 'ANGEL',
      thesis: 'Early-stage fintech and climate across emerging markets.',
      aumBand: '1M-10M',
      contactEmail: 'investor@demo.invest',
    },
  });
  await prisma.investmentPreference.upsert({
    where: { investorProfileId: investorProfile.id },
    update: {},
    create: {
      investorProfileId: investorProfile.id,
      industries: ['FINTECH', 'CLIMATE'],
      stages: ['SEED', 'SERIES_A'],
      geographies: ['SG', 'IN', 'AE'],
      ticketMin: 25000,
      ticketMax: 250000,
      currency: 'USD',
      riskAppetite: 'AGGRESSIVE',
    },
  });
  await prisma.accreditation.create({
    data: {
      investorProfileId: investorProfile.id,
      method: 'NET_WORTH',
      status: 'VERIFIED',
      jurisdiction: 'SG',
      verifiedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000),
    },
  }).catch(() => undefined);

  // ── Demo companies + live opportunities ────────────────────────────────────
  const companies = [
    {
      email: 'founder@novapay.invest',
      founder: 'Maya Chen',
      legalName: 'NovaPay Technologies',
      brand: 'NovaPay',
      country: 'SG',
      industry: 'FINTECH',
      round: 'SEED' as const,
      amount: 2000000,
      pre: 8000000,
      equity: 20,
      summary: 'Cross-border payments rail for Southeast Asian SMEs.',
    },
    {
      email: 'founder@helios.invest',
      founder: 'Omar Farouk',
      legalName: 'Helios Grid',
      brand: 'Helios',
      country: 'AE',
      industry: 'CLIMATE',
      round: 'SERIES_A' as const,
      amount: 6000000,
      pre: 24000000,
      equity: 20,
      summary: 'Distributed solar microgrids for off-grid communities.',
    },
  ];

  for (const c of companies) {
    const founderUser = await upsertUser(c.email, c.founder, 'Founder!2026', c.country);
    let org = await prisma.organization.findFirst({
      where: { memberships: { some: { userId: founderUser.id } }, type: 'COMPANY' },
    });
    if (!org) {
      org = await prisma.organization.create({
        data: { type: 'COMPANY', legalName: c.legalName, displayName: c.brand, country: c.country, status: 'ACTIVE' },
      });
      await prisma.membership.create({
        data: { orgId: org.id, userId: founderUser.id, role: 'OWNER' },
      });
    }
    const company = await prisma.company.upsert({
      where: { orgId: org.id },
      update: {},
      create: {
        orgId: org.id,
        legalName: c.legalName,
        brandName: c.brand,
        country: c.country,
        industryCode: c.industry,
        stage: 'GROWTH',
        status: 'ACTIVE',
      },
    });
    await prisma.companyProfile.upsert({
      where: { companyId: company.id },
      update: {},
      create: {
        companyId: company.id,
        summary: c.summary,
        problem: 'Incumbent infrastructure is slow, costly and exclusionary.',
        solution: c.summary,
        teamSize: 24,
        fundingRaised: c.amount / 2,
        fundingTarget: c.amount,
        valuationTarget: c.pre,
        currency: 'USD',
      },
    });
    await prisma.founder.create({
      data: { companyId: company.id, name: c.founder, role: 'CEO & Founder', equityPct: 45 },
    }).catch(() => undefined);

    const existing = await prisma.opportunity.findFirst({ where: { companyOrgId: org.id } });
    if (!existing) {
      await prisma.opportunity.create({
        data: {
          companyId: company.id,
          companyOrgId: org.id,
          round: c.round,
          amountSought: c.amount,
          currency: 'USD',
          preMoneyValuation: c.pre,
          equityOfferedPct: c.equity,
          securityType: 'EQUITY',
          minTicket: 25000,
          summary: c.summary,
          status: 'LIVE',
          visibility: 'PUBLIC',
        },
      });
    }
  }

  console.log('Seed complete.');
  console.log('  Investor:  investor@demo.invest / Investor!2026');
  console.log('  Founder:   founder@novapay.invest / Founder!2026');
  console.log('  Admin:     admin@baalvion.invest / Admin!2026Pass');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
