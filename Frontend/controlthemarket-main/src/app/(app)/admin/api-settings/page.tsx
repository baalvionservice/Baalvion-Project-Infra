
import { getApiIntegrations } from "@/lib/api";
import { ApiIntegrationDashboard } from "./api-integration-dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default async function ApiSettingsPage() {
  const integrations = await getApiIntegrations();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
         <div>
            <h2 className="font-headline text-3xl font-bold tracking-tight">
                Third-Party Integrations
            </h2>
            <p className="text-muted-foreground">
                Manage and monitor integrations with external tools and services.
            </p>
        </div>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Integration
        </Button>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Configured Integrations</CardTitle>
            <CardDescription>
                An overview of all active and inactive third-party connections.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <ApiIntegrationDashboard initialData={integrations} />
        </CardContent>
      </Card>
    </div>
  );
}
