'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/design-system/typography/text';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Edit, 
  Trash2, 
  Plus,
  ChevronRight,
  Loader2,
  CalendarCheck,
  FileText,
  AlertCircle
} from 'lucide-react';
import { getScheduledContent } from '@/services/mock-api/creators';
import { ScheduledContent } from '@/types';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

/**
 * Creator Content Scheduling Hub.
 * Manages upcoming publishing dates and drafts for the active expert.
 */
export default function CreatorSchedulePage() {
  const [scheduled, setScheduled] = useState<ScheduledContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    async function loadData() {
      try {
        const response = await getScheduledContent('u-1');
        setScheduled(response.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCancel = (id: string) => {
    setScheduled(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Schedule Cancelled",
      description: "Article has been moved back to drafts.",
    });
  };

  const scheduledCount = scheduled.filter(s => s.status === 'scheduled').length;
  const draftCount = scheduled.filter(s => s.status === 'draft').length;

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <CalendarCheck className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Logistics Hub</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold">Expert Content Calendar</Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Orchestrate your publishing velocity and maintain research momentum.
          </Text>
        </div>
        <Button className="shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" /> New Article
        </Button>
      </header>

      {/* Summary Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="glass-card bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <Text variant="label" className="text-[10px] text-muted-foreground">Queued for Release</Text>
                <div className="text-3xl font-bold mt-1 text-primary">{scheduledCount}</div>
              </div>
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <CalendarIcon className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card bg-secondary/5 border-secondary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <Text variant="label" className="text-[10px] text-muted-foreground">Active Drafts</Text>
                <div className="text-3xl font-bold mt-1 text-secondary">{draftCount}</div>
              </div>
              <div className="p-3 rounded-2xl bg-secondary/10 text-secondary">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <Text variant="label" className="text-[10px] text-muted-foreground">Platform Health</Text>
                <div className="text-3xl font-bold mt-1 text-emerald-500">Stable</div>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendar Visualization */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass-card h-fit">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" /> Visual Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center p-4">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border bg-background/20"
              />
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" /> Scheduling Tip
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Text variant="caption" className="text-muted-foreground leading-relaxed">
                Publishing during peak market hours (9:30 AM - 4:00 PM EST) generally results in 24% higher platform engagement for Macro insights.
              </Text>
            </CardContent>
          </Card>
        </div>

        {/* Queue Management */}
        <Card className="lg:col-span-8 glass-card overflow-hidden">
          <CardHeader className="border-b bg-card/30">
            <CardTitle>Intelligence Queue</CardTitle>
            <CardDescription>Manage the lifecycle of your upcoming analysis.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/20">
                    <TableHead>Research Title</TableHead>
                    <TableHead>Classification</TableHead>
                    <TableHead>Target Schedule</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduled.map((item) => (
                    <TableRow key={item.id} className="group hover:bg-muted/10 transition-colors">
                      <TableCell className="font-bold py-4">
                        <div className="flex flex-col">
                          <span className="text-sm line-clamp-1">{item.title}</span>
                          <div className="flex gap-1 mt-1">
                            {item.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="text-[9px] text-muted-foreground uppercase">#{tag}</span>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-bold border-primary/20 bg-primary/5 text-primary">
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.scheduledAt ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-bold">{format(new Date(item.scheduledAt), 'MMM d, yyyy')}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" /> {format(new Date(item.scheduledAt), 'HH:mm')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          item.status === 'scheduled' 
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                            : 'bg-muted text-muted-foreground border-transparent'
                         + " text-[10px] font-bold uppercase tracking-wider"}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleCancel(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
