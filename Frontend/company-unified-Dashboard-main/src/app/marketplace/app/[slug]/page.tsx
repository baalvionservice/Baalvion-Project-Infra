"use client";

import { useMarketplace, type MarketApp } from "@/hooks/use-marketplace";
import { useState, use, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import Image from "next/image";

type App = MarketApp;

export default function AppDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { apps, installed, loading } = useMarketplace();
  const app = apps.find((a) => a.slug === slug);
  const [installedApps, setInstalledApps] = useState<string[]>([]);
  const [appToInstall, setAppToInstall] = useState<App | null>(null);
  const { toast } = useToast();

  useEffect(() => { setInstalledApps(installed); }, [installed]);

  if (loading) return null;
  if (!app) {
    return <div className="p-12 text-center text-muted-foreground">App not found.</div>;
  }

  const isInstalled = installedApps.includes(app.slug);

  const handleInstall = (app: App) => {
    setAppToInstall(app);
  };

  const confirmInstall = () => {
    if (appToInstall) {
      setInstalledApps([...installedApps, appToInstall.slug]);
      toast({
        title: "Installation Complete",
        description: `${appToInstall.name} has been successfully installed.`,
      });
      setAppToInstall(null);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Image
            src={app.icon}
            alt={`${app.name} logo`}
            width={80}
            height={80}
            className="rounded-lg border bg-card"
            data-ai-hint="logo"
          />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{app.name}</h1>
            <div className="text-muted-foreground flex items-center gap-2 mt-1">
              <span>By {app.developer}</span>
              <Badge variant="outline">{app.category}</Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="font-bold">{app.rating}</span>
              <span className="text-sm text-muted-foreground">
                ({app.reviews.length} reviews)
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {app.installs.toLocaleString()} installs
            </div>
          </div>
          {isInstalled ? (
            <Badge variant="secondary" className="text-base py-1 px-4">
              <CheckCircle className="mr-2 h-4 w-4" /> Installed
            </Badge>
          ) : (
            <Button size="lg" onClick={() => handleInstall(app)}>
              Install App
            </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <div className="lg:col-span-3">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <p className="text-muted-foreground">{app.description}</p>
                  {app.screenshots.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      {app.screenshots.map((ss, i) => (
                        <Image
                          key={i}
                          src={ss}
                          alt={`Screenshot ${i + 1}`}
                          width={600}
                          height={400}
                          className="rounded-md border object-cover"
                          data-ai-hint="app screenshot"
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="features" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <ul className="space-y-3 list-disc list-inside">
                    {app.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="reviews" className="mt-4">
              <div className="space-y-4">
                {app.reviews.map((review, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <div className="flex justify-between">
                        <span className="font-semibold">{review.user}</span>
                        <div className="flex items-center gap-1">
                          {[...Array(review.rating)].map((_, i) => (
                            <Star
                              key={i}
                              className="w-4 h-4 text-yellow-400 fill-yellow-400"
                            />
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        "{review.comment}"
                      </p>
                    </CardContent>
                  </Card>
                ))}
                {app.reviews.length === 0 && (
                  <p className="text-muted-foreground">No reviews yet.</p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="pricing" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold">{app.pricing}</h3>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        <div className="lg:col-span-1 space-y-4 sticky top-24">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Information</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span>Version</span>{" "}
                <span className="text-muted-foreground">{app.version}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated</span>{" "}
                <span className="text-muted-foreground">{app.lastUpdated}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Permissions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {app.permissions.map((p) => (
                <div key={p} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {p}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={!!appToInstall} onOpenChange={() => setAppToInstall(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Install {appToInstall?.name}</DialogTitle>
            <DialogDescription>
              This app requires the following permissions to function:
            </DialogDescription>
          </DialogHeader>
          <ul className="list-disc list-inside space-y-2 p-4 bg-muted/50 rounded-md">
            {appToInstall?.permissions.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAppToInstall(null)}>
              Cancel
            </Button>
            <Button onClick={confirmInstall}>Confirm & Install</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
