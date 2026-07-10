import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { usageSummary } from "@/lib/mock-data";

import { UsageChart } from "./usage-chart";

export default function UsagePage() {
  const usagePct = Math.round((usageSummary.requestsUsed / usageSummary.requestsLimit) * 100);

  return (
    <Card className="glow-card">
      <CardHeader>
        <h2 className="text-base font-semibold text-foreground">Requests over the last 7 days</h2>
        <p className="text-sm text-muted-foreground">
          {usageSummary.requestsUsed.toLocaleString()} of {usageSummary.requestsLimit.toLocaleString()} requests used
          ({usagePct}%) &middot; {usageSummary.planName} plan &middot; renews {usageSummary.renewsOn}
        </p>
      </CardHeader>
      <CardContent>
        <UsageChart />
      </CardContent>
    </Card>
  );
}
