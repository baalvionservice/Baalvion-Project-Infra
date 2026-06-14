import Link from "next/link";
import {
  Users,
  Landmark,
  ShieldCheck,
  Scale,
  ScrollText,
  FileCheck2,
  Eye,
  Vote,
  ClipboardCheck,
  Compass,
  Cog,
  Banknote,
  Cpu,
  TrendingDown,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Governance Framework — light, server-rendered section establishing the
// corporate-governance posture institutional investors expect: leadership and
// board structure, a pillar-based framework, compliance and ethics statements,
// and a risk-management matrix. Server component (no interactivity).

const GOVERNANCE_PILLARS = [
  {
    icon: Landmark,
    title: "Board oversight",
    body: "The board sets strategic direction and holds management accountable for performance, capital allocation and risk.",
  },
  {
    icon: ClipboardCheck,
    title: "Committee structure",
    body: "Dedicated committees provide focused oversight of audit, risk and governance matters with clear mandates.",
  },
  {
    icon: Eye,
    title: "Disclosure & transparency",
    body: "Material information is communicated to investors clearly, consistently and on a timely basis.",
  },
  {
    icon: Vote,
    title: "Shareholder & investor rights",
    body: "The rights of shareholders and investors are protected through fair process and equitable treatment.",
  },
  {
    icon: FileCheck2,
    title: "Audit & controls",
    body: "Robust internal controls and independent assurance safeguard the integrity of financial and operational reporting.",
  },
] as const;

const RISK_DOMAINS = [
  {
    icon: Compass,
    title: "Strategic risk",
    body: "Managed through disciplined corridor sequencing, scenario review and board-level oversight of long-term direction.",
  },
  {
    icon: Cog,
    title: "Operational risk",
    body: "Mitigated by standardised processes, platform reliability engineering and clear accountability across functions.",
  },
  {
    icon: Banknote,
    title: "Financial risk",
    body: "Controlled through conservative capital deployment, reserves discipline and independent financial oversight.",
  },
  {
    icon: Scale,
    title: "Regulatory & compliance risk",
    body: "Addressed by embedded AML, KYC and sanctions controls and continuous monitoring across jurisdictions.",
  },
  {
    icon: Cpu,
    title: "Technology & cyber risk",
    body: "Managed through secure-by-design architecture, AI model evaluation, human oversight and data-protection controls.",
  },
  {
    icon: TrendingDown,
    title: "Market risk",
    body: "Mitigated by diversifying across corridors and pacing expansion against demonstrated customer adoption.",
  },
] as const;

export default function GovernanceFrameworkSection({ id }: { id: string }) {
  return (
    <section id={id} className="w-full bg-white text-black">
      <div className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Corporate Governance
          </p>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight leading-[1.08]">
            Governance built for institutional trust.
          </h2>
          <p className="mt-6 text-lg text-gray-600">
            Baalvion Industries Private Limited (CIN U43121OD2025PTC048479)
            operates under a governance framework designed to meet the
            standards institutional and accredited investors expect — clear
            accountability, independent oversight and disciplined risk
            management across every domain in which we operate.
          </p>
        </div>

        {/* Leadership + Board. */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="border-gray-200">
            <CardHeader>
              <Users className="h-9 w-9 text-primary" />
              <CardTitle className="mt-3 text-xl text-black">
                Leadership structure
              </CardTitle>
              <CardDescription className="text-gray-600">
                Baalvion is led by a focused executive team accountable to the
                board for strategy, execution and the responsible stewardship of
                investor capital. Roles and reporting lines are defined to keep
                decision-making clear and accountability unambiguous.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/governance/leadership">View leadership</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <Landmark className="h-9 w-9 text-primary" />
              <CardTitle className="mt-3 text-xl text-black">
                Board of Directors
              </CardTitle>
              <CardDescription className="text-gray-600">
                Our board is composed with attention to relevant expertise,
                independence and objectivity, so that oversight of management is
                genuine rather than procedural. The board guides strategic
                direction while holding the executive team accountable for
                results and risk.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/governance/board-of-directors">
                  Board of directors
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Governance framework pillars. */}
        <div className="mt-16">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h3 className="text-2xl font-bold tracking-tight text-black">
                Governance framework
              </h3>
              <p className="mt-3 text-gray-600">
                Five pillars define how oversight, transparency and control
                operate across the company.
              </p>
            </div>
            <Link
              href="/governance/committee-composition"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
            >
              Committee composition
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 sm:grid-cols-2 lg:grid-cols-3">
            {GOVERNANCE_PILLARS.map((pillar) => (
              <div
                key={pillar.title}
                className="bg-white p-7 transition-colors hover:bg-gray-50"
              >
                <pillar.icon className="h-6 w-6 text-primary" />
                <p className="mt-4 text-base font-bold text-black">
                  {pillar.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {pillar.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance + Ethics statements. */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="border-gray-200 bg-gray-50">
            <CardHeader>
              <ShieldCheck className="h-9 w-9 text-primary" />
              <CardTitle className="mt-3 text-xl text-black">
                Compliance statement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-gray-600">
                Baalvion is committed to operating in full compliance with the
                trade, financial-services and data-protection laws of every
                jurisdiction in which it operates. Anti-money-laundering, know-
                your-customer and sanctions obligations are treated as
                foundational, not optional. These commitments are reinforced by
                the company&apos;s own AI compliance and sanctions tooling, which
                strengthens screening and monitoring as a core capability of the
                platform rather than an external dependency.
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-gray-50">
            <CardHeader>
              <ScrollText className="h-9 w-9 text-primary" />
              <CardTitle className="mt-3 text-xl text-black">
                Ethics &amp; code of conduct
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-gray-600">
                Integrity is non-negotiable at Baalvion. The company maintains a
                clear expectation of ethical conduct across the organisation,
                including a firm stance against bribery and corruption and a
                requirement that conflicts of interest be disclosed and managed
                transparently. Every employee, officer and director is expected
                to act honestly, fairly and in the long-term interest of the
                company and its stakeholders.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Risk management framework. */}
        <div className="mt-16">
          <div className="max-w-2xl">
            <h3 className="text-2xl font-bold tracking-tight text-black">
              Risk management framework
            </h3>
            <p className="mt-3 text-gray-600">
              We identify, assess and manage risk systematically across six
              domains, with board-level visibility into the most material
              exposures.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {RISK_DOMAINS.map((domain) => (
              <Card
                key={domain.title}
                className="border-gray-200 transition-colors hover:border-primary/40"
              >
                <CardHeader className="pb-3">
                  <domain.icon className="h-6 w-6 text-primary" />
                  <CardTitle className="mt-2 text-base text-black">
                    {domain.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-gray-600">
                    {domain.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
