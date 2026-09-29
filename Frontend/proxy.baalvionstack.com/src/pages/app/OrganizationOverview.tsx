import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Users, Globe, Key, Activity, TrendingUp, Clock } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { useOrganization, useOrgMembers, useOrgActivity, useApiKeys } from "@/hooks/usePlatform";
import { formatDistanceToNow } from "date-fns";

export default function OrganizationOverview() {
  const { data: org, isLoading: loadingOrg } = useOrganization();
  const { data: members } = useOrgMembers();
  const { data: apiKeys } = useApiKeys();
  const { data: activityPage } = useOrgActivity();

  const activity = activityPage?.data ?? [];

  const usedPct = org
    ? Math.round((org.bandwidthUsedGb / org.bandwidthLimitGb) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <SEOHead title="Organization Overview" description="Overview of your organization." />

      <div>
        <h1 className="text-2xl font-bold">Organization</h1>
        <p className="text-muted-foreground">Overview of your workspace.</p>
      </div>

      {/* Org info */}
      {loadingOrg ? (
        <Skeleton className="h-24 rounded-xl" />
      ) : org ? (
        <Card>
          <CardContent className="pt-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
              {org.name[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">{org.name}</h2>
                <Badge variant="outline">{org.planSlug}</Badge>
                <Badge variant={org.status === "active" ? "success" : "warning"}>{org.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{org.slug} · ID: {org.id}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Team Members", value: members?.length ?? "–", icon: Users, color: "text-primary" },
          { label: "API Keys", value: apiKeys?.filter(k => !k.revokedAt).length ?? "–", icon: Key, color: "text-accent" },
          { label: "Bandwidth Used", value: org ? `${org.bandwidthUsedGb} GB` : "–", icon: Globe, color: "text-warning" },
          { label: "Usage %", value: org ? `${usedPct}%` : "–", icon: TrendingUp, color: usedPct > 90 ? "text-destructive" : "text-success" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg bg-secondary flex items-center justify-center ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No recent activity.</p>
          ) : (
            <div className="space-y-3">
              {activity.slice(0, 10).map(a => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{a.action.replace(/\./g, " ")}</p>
                    {a.entityType && (
                      <p className="text-xs text-muted-foreground">{a.entityType}: {a.entityId}</p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
