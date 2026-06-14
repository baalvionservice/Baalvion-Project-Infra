import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

/**
 * Rules-based v1 matching scorer. Produces a 0..1 fit score between an
 * investor's preferences and an opportunity, with explainable reasons.
 * (Pluggable: a later ML model can register against the same `Match` table.)
 */
@Injectable()
export class MatchingService {
  private static readonly MODEL_VERSION = 'rules-v1';

  constructor(private readonly prisma: PrismaService) {}

  async scoreForInvestor(orgId: string) {
    const profile = await this.prisma.investorProfile.findUnique({
      where: { orgId },
      include: { preference: true },
    });
    const pref = profile?.preference;

    const opportunities = await this.prisma.opportunity.findMany({
      where: { status: 'LIVE' },
      include: { company: true },
      take: 100,
    });

    const scored = opportunities.map((opp) => {
      const reasons: string[] = [];
      let score = 0.4; // base

      if (pref?.stages?.includes(opp.round)) {
        score += 0.2;
        reasons.push(`stage ${opp.round} matches preference`);
      }
      if (
        opp.company?.industryCode &&
        pref?.industries?.includes(opp.company.industryCode)
      ) {
        score += 0.2;
        reasons.push('industry match');
      }
      if (
        opp.company?.country &&
        pref?.geographies?.includes(opp.company.country)
      ) {
        score += 0.1;
        reasons.push('geography match');
      }
      if (pref?.ticketMax && opp.minTicket && Number(opp.minTicket) <= Number(pref.ticketMax)) {
        score += 0.1;
        reasons.push('ticket size fits');
      }
      return { opp, score: Math.min(score, 1), reasons };
    });

    scored.sort((a, b) => b.score - a.score);

    // Persist top matches (idempotent upsert keyed by opp+investor).
    await Promise.all(
      scored.slice(0, 20).map(({ opp, score, reasons }) =>
        this.prisma.match.upsert({
          where: {
            opportunityId_investorOrgId: {
              opportunityId: opp.id,
              investorOrgId: orgId,
            },
          },
          create: {
            opportunityId: opp.id,
            investorOrgId: orgId,
            score,
            reasonsJson: reasons,
            modelVersion: MatchingService.MODEL_VERSION,
          },
          update: { score, reasonsJson: reasons },
        }),
      ),
    );

    return scored.slice(0, 20).map(({ opp, score, reasons }) => ({
      opportunity: opp,
      score,
      reasons,
    }));
  }
}
