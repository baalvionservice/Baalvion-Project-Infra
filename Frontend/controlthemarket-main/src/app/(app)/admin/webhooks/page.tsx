
import { getWebhooks } from "@/lib/api";
import { WebhookList } from "./webhook-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default async function WebhooksPage() {
  const webhooks = await getWebhooks();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
         <div>
            <h2 className="font-headline text-3xl font-bold tracking-tight">
                Webhook Management
            </h2>
            <p className="text-muted-foreground">
                Configure and monitor outbound webhooks for platform events.
            </p>
        </div>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Webhook
        </Button>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Configured Webhooks</CardTitle>
            <CardDescription>
                An overview of all active and inactive webhooks.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <WebhookList initialData={webhooks} />
        </CardContent>
      </Card>
    </div>
  );
}
