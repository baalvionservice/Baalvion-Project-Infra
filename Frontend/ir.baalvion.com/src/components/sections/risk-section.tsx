import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Scale, ShieldAlert, FileWarning, Briefcase } from "lucide-react";

export default function RiskSection({ id }: { id: string }) {
  const riskFactors = [
    {
      icon: Scale,
      title: "Regulatory & Legal Risks",
      description: "Operations are subject to a variety of laws and regulations, changes to which could adversely affect our business. This includes financial regulations, data privacy laws (e.g., GDPR), and AML/KYC requirements."
    },
    {
      icon: Briefcase,
      title: "Market Risks",
      description: "The value of our investments can be volatile. Market risks include economic downturns, changes in interest rates, and shifts in industry trends that may impact the performance of our portfolio companies."
    },
    {
      icon: ShieldAlert,
      title: "Execution & Operational Risks",
      description: "Our success depends on the successful execution of our investment thesis and the operational performance of our portfolio companies. There is a risk of strategic missteps or unforeseen operational challenges."
    },
    {
        icon: FileWarning,
        title: "Private Placement & Liquidity",
        description: "Investments are illiquid and subject to restrictions on transfer. As a private placement, this offering is intended for accredited investors who understand and can bear the risks of long-term, illiquid investments."
    }
  ];

  return (
    <section id={id} className="w-full bg-card">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">
            Risk Disclosure & Legal
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            An investment in Baalvion involves a high degree of risk. The following considerations, among others, should be carefully reviewed.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {riskFactors.map((risk) => (
            <Card key={risk.title} className="bg-background/50">
              <CardHeader className="flex flex-row items-center gap-4">
                <risk.icon className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle>{risk.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{risk.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
