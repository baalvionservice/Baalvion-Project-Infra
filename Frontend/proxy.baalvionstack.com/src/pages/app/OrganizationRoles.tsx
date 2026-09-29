import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { useOrgRoles } from "@/hooks/usePlatform";

const SYSTEM_PERMISSIONS = [
  "proxy:view", "proxy:create", "proxy:update", "proxy:delete",
  "preset:view", "preset:create", "preset:update", "preset:delete",
  "analytics:view", "billing:view", "billing:update",
  "org:view", "org:update", "org:member:view", "org:member:invite", "org:member:update", "org:member:remove",
  "apikey:view", "apikey:create", "apikey:revoke",
  "security:view", "security:update",
];

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-warning/10 text-warning border-warning/30",
  admin: "bg-primary/10 text-primary border-primary/30",
  developer: "bg-accent/10 text-accent border-accent/30",
  viewer: "bg-muted text-muted-foreground",
};

export default function OrganizationRoles() {
  const { data: roles, isLoading } = useOrgRoles();

  return (
    <div className="space-y-6">
      <SEOHead title="Roles & Permissions" description="View organization roles and permissions." />

      <div>
        <h1 className="text-2xl font-bold">Roles & Permissions</h1>
        <p className="text-muted-foreground">Access control matrix for your organization.</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : !roles || roles.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No roles defined. Using system defaults.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-primary" />Permission Matrix</CardTitle>
            <CardDescription>Which roles can perform which actions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 pr-4 font-medium text-muted-foreground w-48">Permission</th>
                    {roles.map(r => (
                      <th key={r.id} className="text-center py-3 px-3">
                        <Badge variant="outline" className={`text-xs ${ROLE_COLORS[(r.name ?? "").toLowerCase()] ?? ""}`}>
                          {r.name}
                        </Badge>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SYSTEM_PERMISSIONS.map(perm => (
                    <tr key={perm} className="border-b border-border/30 hover:bg-secondary/20">
                      <td className="py-2.5 pr-4">
                        <code className="text-xs bg-secondary/50 px-1.5 py-0.5 rounded">{perm}</code>
                      </td>
                      {roles.map(r => {
                        const has = Array.isArray(r.permissions) && r.permissions.includes(perm);
                        return (
                          <td key={r.id} className="text-center py-2.5 px-3">
                            {has
                              ? <CheckCircle className="w-4 h-4 text-success mx-auto" />
                              : <XCircle className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                            }
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
