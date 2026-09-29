import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// NOTE: In the gateway-BFF auth model there are no hardcoded demo passwords in source.
// This card now documents the role-based views only; sign in with a real account to test them.
export function DemoCredentials() {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Role-Based Dashboards</CardTitle>
        <CardDescription>
          Sign in with an account to see the dashboard for its role
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
