import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/design-system/typography/text';
import { Section } from '@/components/ui/Section';
import { UserRound } from 'lucide-react';
import { CompanyEntity } from '@/types/entity';

interface CompanyLeadershipProps {
  company: CompanyEntity;
}

/**
 * "Leadership" section — founders (a stable historical fact) plus current CEO/executives
 * when the entity actually has them set. Renders nothing when none of these are present,
 * rather than showing an empty or "unknown" placeholder.
 */
export const CompanyLeadership = ({ company }: CompanyLeadershipProps) => {
  const hasFounders = (company.founders?.length ?? 0) > 0;
  const hasExecutives = (company.executives?.length ?? 0) > 0;
  const hasCeo = Boolean(company.ceo);

  if (!hasFounders && !hasExecutives && !hasCeo) return null;

  return (
    <Section title="Leadership" className="animate-in fade-in duration-1000 delay-250">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {hasCeo && (
          <Card className="glass-card border-none bg-primary/5">
            <CardContent className="p-5 flex items-center gap-3">
              <UserRound className="h-4 w-4 text-primary shrink-0" />
              <div>
                <Text variant="label" className="text-[10px] opacity-50 font-bold uppercase tracking-widest">
                  Chief Executive Officer
                </Text>
                <Text variant="bodySmall" weight="bold">{company.ceo}</Text>
              </div>
            </CardContent>
          </Card>
        )}
        {company.executives?.map((exec) => (
          <Card key={exec.name} className="glass-card border-none bg-card/30">
            <CardContent className="p-5 flex items-center gap-3">
              <UserRound className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <Text variant="label" className="text-[10px] opacity-50 font-bold uppercase tracking-widest">
                  {exec.title}
                </Text>
                <Text variant="bodySmall" weight="bold">{exec.name}</Text>
              </div>
            </CardContent>
          </Card>
        ))}
        {hasFounders && (
          <Card className="glass-card border-none bg-card/30 sm:col-span-2">
            <CardContent className="p-5 flex items-start gap-3">
              <UserRound className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <Text variant="label" className="text-[10px] opacity-50 font-bold uppercase tracking-widest">
                  {company.founders!.length > 1 ? 'Founders' : 'Founder'}
                </Text>
                <Text variant="bodySmall" weight="bold">{company.founders!.join(', ')}</Text>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Section>
  );
};
