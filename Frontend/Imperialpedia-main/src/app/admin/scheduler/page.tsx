'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Text } from '@/design-system/typography/text';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Edit, 
  Trash2, 
  Plus,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { getScheduledArticles, ScheduledArticle } from '@/services/mock-api/scheduler';
import { format } from 'date-fns';

/**
 * Content Publishing Scheduler Page.
 * Visual calendar and list view for managing upcoming publication dates.
 */
export default function SchedulerPage() {
  const [scheduled, setScheduled] = useState<ScheduledArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    async function loadData() {
      try {
        const response = await getScheduledArticles();
        setScheduled(response.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Text variant="h1" className="text-3xl font-bold">Publishing Scheduler</Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Orchestrating the release of financial intelligence.
          </Text>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Schedule Article
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendar View */}
        <Card className="lg:col-span-4 glass-card h-fit">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" /> Content Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border bg-card/50"
            />
          </CardContent>
        </Card>

        {/* List View */}
        <Card className="lg:col-span-8 glass-card">
          <CardHeader>
            <CardTitle>Upcoming Intelligence</CardTitle>
            <CardDescription>Articles queued for automated publication.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Article Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduled.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-bold">{item.title}</TableCell>
                      <TableCell className="text-xs">{item.author}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold">{format(new Date(item.scheduledDate), 'MMM d, yyyy')}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" /> {format(new Date(item.scheduledDate), 'HH:mm')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.status === 'scheduled' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {item.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
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
