"use client";

import { useEffect, useState } from "react";
import { subscriptionService } from "@/core/services/subscription.service";
import { Subscription } from "@/core/content/schemas";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Mail, ShieldCheck, Search, Users, Settings2, Power } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function SubscriberManagerPage() {
  const [subscribers, setSubscribers] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    const data = await subscriptionService.getSubscribers();
    setSubscribers(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('subscription-updated', loadData);
    return () => window.removeEventListener('subscription-updated', loadData);
  }, []);

  const filtered = subscribers.filter(s => 
    s.email.toLowerCase().includes(search.toLowerCase()) || 
    s.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Investor Registry</h1>
        <p className="text-muted-foreground">Manage distribution lists, opt-in preferences, and segmentation.</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by email or role..." 
            className="pl-10" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Badge variant="secondary" className="h-10 px-4 flex items-center gap-2">
          <Users className="h-4 w-4" /> {subscribers.length} Total Registered
        </Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Investor / Segment</TableHead>
                <TableHead>Notification Preferences</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Access Control</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                        {sub.email.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold">{sub.email}</p>
                        <p className="text-xs text-primary font-medium">{sub.role}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {Object.entries(sub.preferences).map(([key, val]) => (
                        <Badge key={key} variant={val ? 'outline' : 'secondary'} className="text-[8px] opacity-80">
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={sub.active} onCheckedChange={() => subscriptionService.toggleActive(sub.id)} />
                      <span className="text-xs font-medium">{sub.active ? 'Active' : 'Paused'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline">
                        <Settings2 className="h-4 w-4 mr-1" /> Preferences
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10">
                        <Power className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
