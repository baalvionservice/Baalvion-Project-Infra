import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  FileEdit, 
  Send, 
  BookOpen, 
  Plus, 
  Clock, 
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';
import Link from 'next/link';

/**
 * The Writer Dashboard Landing Page.
 */
export default function WriterDashboardPage() {
  // Mock Writer Stats
  const stats = [
    { title: 'In Progress', value: '3', icon: FileEdit, color: 'text-amber-500', description: 'Updated today' },
    { title: 'Under Review', value: '1', icon: Send, color: 'text-primary', description: 'Submitted 2 days ago' },
    { title: 'Published Insights', value: '12', icon: BookOpen, color: 'text-emerald-500', description: '+2 this month' },
    { title: 'Total Read Time', value: '85h', icon: TrendingUp, color: 'text-secondary', description: 'Accumulated across articles' },
  ];

  // Mock Drafts
  const drafts = [
    { id: '1', title: 'Macro Trends in 2026', category: 'Economics', lastModified: '2 hours ago', status: 'Draft' },
    { id: '2', title: 'Quantitative Easing vs Tightening', category: 'Investing', lastModified: 'Yesterday', status: 'Draft' },
    { id: '3', title: 'The Future of DeFi', category: 'Crypto', lastModified: '3 days ago', status: 'Submitted' },
  ];

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Text variant="h1" className="text-3xl font-bold">Writer Studio</Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Welcome back, Expert. You have 3 active drafts requiring attention.
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild>
            <Link href="/writer/new"><Plus className="mr-2 h-4 w-4" /> New Article</Link>
          </Button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <Card key={idx} className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Drafts Table */}
        <Card className="lg:col-span-2 glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Drafts & Submissions</CardTitle>
              <CardDescription>Continue working on your saved analyses.</CardDescription>
            </div>
            <Button variant="outline" size="sm">View All</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Article Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Last Modified</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drafts.map((draft) => (
                  <TableRow key={draft.id}>
                    <TableCell className="font-medium">{draft.title}</TableCell>
                    <TableCell>{draft.category}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        draft.status === 'Submitted' ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {draft.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs">{draft.lastModified}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Resources & Guidelines */}
        <div className="space-y-6">
          <Card className="glass-card bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Creator Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Text variant="bodySmall" weight="bold">Editorial Standards</Text>
                <Text variant="caption" className="text-muted-foreground block">Learn about our tone, sourcing, and fact-checking requirements.</Text>
                <Button variant="link" className="p-0 h-auto text-primary text-xs">Read Guidelines <ArrowRight className="ml-1 h-3 w-3" /></Button>
              </div>
              <div className="space-y-2 border-t pt-4">
                <Text variant="bodySmall" weight="bold">SEO Best Practices</Text>
                <Text variant="caption" className="text-muted-foreground block">How to optimize your analysis for maximum platform reach.</Text>
                <Button variant="link" className="p-0 h-auto text-primary text-xs">View SEO Guide <ArrowRight className="ml-1 h-3 w-3" /></Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" /> Platform Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                  <div>
                    <Text variant="caption" weight="bold">Editorial Review Complete</Text>
                    <Text variant="caption" className="text-muted-foreground block text-[10px]">Your article "Yield Curve Basics" was published.</Text>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5" />
                  <div>
                    <Text variant="caption" weight="bold">Feedback Received</Text>
                    <Text variant="caption" className="text-muted-foreground block text-[10px]">Editor left comments on "Macro Trends 2026".</Text>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
