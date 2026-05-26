
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Settings, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import appsData from '@/lib/data/apps.json';
import initialInstalledApps from '@/lib/data/installed-apps.json';
import Image from 'next/image';
import EmptyState from '@/components/empty-state';

export default function InstalledAppsPage() {
  const [installedApps, setInstalledApps] = useState(initialInstalledApps);
  const [statuses, setStatuses] = useState<Record<string, boolean>>(() => {
    const initialStatuses: Record<string, boolean> = {};
    initialInstalledApps.forEach(slug => {
        initialStatuses[slug] = true; // All are active initially
    });
    return initialStatuses;
  });
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const appDetails = useMemo(() => {
    return installedApps.map(slug => appsData.find(app => app.slug === slug)).filter(Boolean);
  }, [installedApps]);
  
  const filteredApps = useMemo(() => {
    return appDetails.filter(app => {
      if (!app) return false;
      const appStatus = statuses[app.slug] ? 'active' : 'disabled';
      if (filter !== 'all' && appStatus !== filter) return false;
      if (searchTerm && !app.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [appDetails, filter, searchTerm, statuses]);

  const handleStatusChange = (slug: string, newStatus: boolean) => {
    setStatuses(prev => ({...prev, [slug]: newStatus}));
  };

  const handleUninstall = (slug: string, appName: string) => {
    setInstalledApps(installedApps.filter(s => s !== slug));
    toast({
        title: "App Uninstalled",
        description: `${appName} has been uninstalled from your workspace.`,
        variant: "destructive"
    });
  };

  if (installedApps.length === 0) {
      return (
          <EmptyState
            title="No apps installed yet"
            description="Browse the marketplace to find apps and integrations that can extend the power of your business."
            imageSeed="empty-box"
            imageHint="empty box"
            actionButton={<Link href="/marketplace"><Button>Browse Marketplace</Button></Link>}
          />
      )
  }

  return (
    <div className="space-y-8">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">Installed Apps</h1>
        <p className="text-muted-foreground">
          Manage the apps and integrations connected to your workspace.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search installed apps..." 
                className="pl-8" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>App</TableHead>
                  <TableHead>Installed</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApps.map(app => {
                    if (!app) return null;
                    return (
                        <TableRow key={app.slug}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                    <Image src={app.icon} alt={`${app.name} logo`} width={40} height={40} className="rounded-md border" />
                                    <div>
                                        <p>{app.name}</p>
                                        <p className="text-xs text-muted-foreground">{app.category}</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>July 31, 2024</TableCell>
                            <TableCell>2 hours ago</TableCell>
                            <TableCell>
                                <Switch 
                                    checked={statuses[app.slug]} 
                                    onCheckedChange={(checked) => handleStatusChange(app.slug, checked)}
                                />
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                <Link href={`/marketplace/installed/${app.slug}`}>
                                    <Button variant="outline" size="sm"><Settings className="mr-2 h-4 w-4" />Settings</Button>
                                </Link>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" />Uninstall</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure you want to uninstall {app.name}?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently remove the app and its associated data from your workspace.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleUninstall(app.slug, app.name)}>Confirm Uninstall</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                </div>
                            </TableCell>
                        </TableRow>
                    )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
