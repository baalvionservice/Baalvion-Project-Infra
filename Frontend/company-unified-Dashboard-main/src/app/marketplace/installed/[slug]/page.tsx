"use client";
import { notFound, useRouter } from "next/navigation";
import { useState, use } from "react";
import appsData from "@/lib/data/apps.json";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowLeft, CheckCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

export default function AppSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const app = appsData.find((a) => a.slug === slug);
  const router = useRouter();
  const { toast } = useToast();

  if (!app) {
    notFound();
  }

  const [isActive, setIsActive] = useState(true);

  const handleSaveChanges = () => {
    toast({
      title: "Settings Saved",
      description: `Your settings for ${app.name} have been updated.`,
    });
  };

  const handleUninstall = () => {
    toast({
      title: "App Uninstalled",
      description: `${app.name} has been uninstalled.`,
      variant: "destructive",
    });
    router.push("/marketplace/installed");
  };

  return (
    <div className="space-y-8">
      <div>
        <Button
          variant="outline"
          size="sm"
          className="mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Installed Apps
        </Button>
        <div className="flex items-center gap-4">
          <Image
            src={app.icon}
            alt={`${app.name} logo`}
            width={64}
            height={64}
            className="rounded-lg border bg-card"
            data-ai-hint="logo"
          />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{app.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={isActive ? "default" : "secondary"}
                className={isActive ? "bg-green-100 text-green-800" : ""}
              >
                {isActive ? "Active" : "Disabled"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Version {app.version}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Configure how {app.name} integrates with your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              defaultValue="********************"
            />
            <p className="text-xs text-muted-foreground">
              Enter the API key provided by the integration partner.
            </p>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label>Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive Baalvion notifications from this app.
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sync-frequency">Sync Frequency</Label>
            <Select defaultValue="daily">
              <SelectTrigger
                id="sync-frequency"
                className="w-full sm:w-[240px]"
              >
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveChanges}>Save Changes</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This app has been granted the following permissions. To change them,
            you must uninstall and reinstall the app.
          </p>
          <div className="space-y-2">
            {app.permissions.map((p) => (
              <div
                key={p}
                className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-md"
              >
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{p}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle /> Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label className="font-bold">Disable App</Label>
              <p className="text-sm text-muted-foreground">
                Temporarily turn off all functionality for this app.
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label className="font-bold">Uninstall App</Label>
              <p className="text-sm text-muted-foreground">
                Permanently remove this app and all its data.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Uninstall</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently uninstall {app.name} and delete all
                    associated data. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleUninstall}>
                    Confirm Uninstall
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
