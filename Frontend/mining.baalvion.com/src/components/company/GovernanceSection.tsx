import { ShieldCheck, Scale, Users, FileCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PendingDisclosure } from "./PendingDisclosure";

interface GovernancePillar {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const PILLARS: GovernancePillar[] = [
  {
    icon: <ShieldCheck className="h-7 w-7 text-secondary" />,
    title: "Board Oversight",
    description:
      "Strategic direction and risk supervision are overseen at board level, with accountability for the conduct of the business.",
  },
  {
    icon: <Scale className="h-7 w-7 text-secondary" />,
    title: "Compliance-First Governance",
    description:
      "Trade, KYC, and sanctions compliance are embedded into governance rather than treated as an afterthought.",
  },
  {
    icon: <Users className="h-7 w-7 text-secondary" />,
    title: "Committees",
    description:
      "Specialised committees support oversight of audit, risk, and compliance functions.",
  },
];

/**
 * Governance overview for leadership / investor surfaces. Specific committee
 * compositions and member details are not yet public, so they render via the
 * PendingDisclosure component instead of invented values.
 */
export function GovernanceSection() {
  return (
    <section aria-labelledby="governance-heading" className="space-y-8">
      <div className="space-y-3">
        <h2
          id="governance-heading"
          className="text-3xl font-headline font-bold tracking-tight text-primary md:text-4xl"
        >
          Corporate Governance
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          Baalvion Mining Inc. is committed to disciplined, compliance-first
          governance appropriate to a global B2B mineral trading and commodity
          supply network.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {PILLARS.map((pillar) => (
          <Card key={pillar.title} className="border-border/60 shadow-sm">
            <CardContent className="space-y-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                {pillar.icon}
              </div>
              <h3 className="text-lg font-bold text-primary">{pillar.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {pillar.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="space-y-4 p-6 md:p-8">
          <div className="flex items-center gap-3">
            <FileCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <h3 className="text-lg font-bold text-primary">
              Committee Composition &amp; Charters
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Detailed committee membership, charters, and governance policies will
            be published as the company formalises its public disclosures.
          </p>
          <PendingDisclosure />
        </CardContent>
      </Card>
    </section>
  );
}
