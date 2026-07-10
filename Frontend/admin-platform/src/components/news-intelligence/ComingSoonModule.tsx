import type { LucideIcon } from 'lucide-react';
import { Construction } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PlannedCapability {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface ComingSoonModuleProps {
  title: string;
  description: string;
  requiredService: string;
  capabilities: PlannedCapability[];
}

// Honest "not built yet" shell: explains what this module will do once its backend
// service exists, with zero fabricated metrics. Used by ai/, images/, seo/ pages —
// none of those services exist yet (no AI pipeline, no image intelligence, no SEO
// audit engine), so this is a real placeholder, not a fake dashboard.
export function ComingSoonModule({ title, description, requiredService, capabilities }: ComingSoonModuleProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />

      <Card className="border-dashed">
        <CardContent className="pt-6 flex items-start gap-3">
          <Construction className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Not connected yet</p>
            <p className="text-sm text-muted-foreground">
              This module needs <span className="font-mono text-foreground">{requiredService}</span>, which
              hasn&apos;t been built. Nothing below is live data — it&apos;s the planned layout for when that
              service ships.
            </p>
          </div>
          <Badge variant="outline" className="ml-auto shrink-0">Planned</Badge>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {capabilities.map((cap) => (
          <Card key={cap.title} className="opacity-70">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <cap.icon className="h-4 w-4 text-muted-foreground" />
                {cap.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{cap.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
