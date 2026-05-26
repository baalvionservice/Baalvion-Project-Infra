import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockUsers } from "@/lib/auth";

export function DemoCredentials() {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Demo Accounts</CardTitle>
        <CardDescription>
          Use these credentials to test different role-based dashboards
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockUsers.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{user.name}</p>
                <Badge variant="outline">{user.role.replace("_", " ")}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground">
                Password: {user.password}
              </p>
            </div>
          </div>
        ))}
        <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="font-medium mb-1">Role Differences:</p>
          <ul className="space-y-1">
            <li>
              <strong>Admin:</strong> Full access to all features and businesses
            </li>
            <li>
              <strong>Co-Founder:</strong> Business management and strategic
              overview
            </li>
            <li>
              <strong>Investor:</strong> Financial metrics and portfolio view
            </li>
            <li>
              <strong>Employee:</strong> Task management and attendance tracking
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
