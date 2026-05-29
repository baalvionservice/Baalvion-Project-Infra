'use client';

import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Star } from 'lucide-react';
import { useMarketplace, type MarketApp } from '@/hooks/use-marketplace';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';

type App = MarketApp;

function AppCard({ app, isInstalled, onInstall }: { app: App, isInstalled: boolean, onInstall: (app: App) => void }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-start gap-4">
        <Image src={app.icon} alt={`${app.name} logo`} width={48} height={48} className="rounded-lg border" data-ai-hint="logo" />
        <div>
          <CardTitle className="text-base">{app.name}</CardTitle>
          <CardDescription className="text-xs">{app.category}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-2">{app.description}</p>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
         <div className="flex items-center gap-1 text-sm">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            {app.rating}
         </div>
        {isInstalled ? (
          <Badge variant="secondary">Installed</Badge>
        ) : (
          <Button size="sm" variant="outline" onClick={() => onInstall(app)}>Install</Button>
        )}
      </CardFooter>
    </Card>
  );
}


export default function MarketplacePage() {
  const { apps: appsData, installed } = useMarketplace();
  const [searchTerm, setSearchTerm] = useState('');
  const [installedApps, setInstalledApps] = useState<string[]>([]);
  const [appToInstall, setAppToInstall] = useState<App | null>(null);
  const { toast } = useToast();

  useEffect(() => { setInstalledApps(installed); }, [installed]);

  const featuredApps = appsData.filter(app => app.featured);

  const filteredApps = useMemo(() => {
    return appsData.filter(app =>
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, appsData]);

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
    <>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
          <p className="text-muted-foreground">
            Extend your business with powerful apps and integrations.
          </p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search apps..." 
            className="pl-10 h-12 text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Featured Apps */}
        <section>
          <h2 className="text-2xl font-semibold tracking-tight mb-4">Featured Apps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredApps.map(app => (
              <Link key={app.slug} href={`/marketplace/app/${app.slug}`} className="block">
                <AppCard 
                    app={app} 
                    isInstalled={installedApps.includes(app.slug)}
                    onInstall={(app) => {
                        event?.preventDefault();
                        handleInstall(app);
                    }}
                />
              </Link>
            ))}
          </div>
        </section>

        {/* All Apps */}
        <section>
          <h2 className="text-2xl font-semibold tracking-tight mb-4">All Apps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {filteredApps.map(app => (
               <Link key={app.slug} href={`/marketplace/app/${app.slug}`} className="block">
                <AppCard 
                    app={app} 
                    isInstalled={installedApps.includes(app.slug)}
                    onInstall={(app) => {
                        event?.preventDefault();
                        handleInstall(app);
                    }}
                />
              </Link>
            ))}
          </div>
        </section>
      </div>

      <Dialog open={!!appToInstall} onOpenChange={() => setAppToInstall(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Install {appToInstall?.name}</DialogTitle>
            <DialogDescription>This app requires the following permissions to function:</DialogDescription>
          </DialogHeader>
          <ul className="list-disc list-inside space-y-2 p-4 bg-muted/50 rounded-md">
            {appToInstall?.permissions.map(p => <li key={p}>{p}</li>)}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAppToInstall(null)}>Cancel</Button>
            <Button onClick={confirmInstall}>Confirm & Install</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
