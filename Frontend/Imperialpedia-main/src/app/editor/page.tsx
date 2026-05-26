import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Text } from "@/design-system/typography/text";
import {
  FileSearch,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Clock,
  User,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { getSubmittedArticles } from "@/services/mock-api/articles";

/**
 * The Central Editor Dashboard.
 * High-level overview of the review queue and editorial stats.
 */
export default async function EditorDashboardPage() {
  const pendingArticles = await getSubmittedArticles();

  // Mock Stats
  const stats = [
    {
      title: "Awaiting Review",
      value: pendingArticles.length.toString(),
      icon: FileSearch,
      color: "text-amber-500",
    },
    {
      title: "Approved Today",
      value: "4",
      icon: CheckCircle,
      color: "text-emerald-500",
    },
    {
      title: "Revision Requested",
      value: "2",
      icon: AlertCircle,
      color: "text-primary",
    },
    {
      title: "Average Review Time",
      value: "4.2h",
      icon: Clock,
      color: "text-secondary",
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      <header>
        <Text variant="h1" className="text-3xl font-bold">
          Editorial Command
        </Text>
        <Text variant="bodySmall" className="text-muted-foreground mt-1">
          Maintain the integrity of the Imperialpedia Intelligence Index.
        </Text>
      </header>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <Card key={idx} className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Review Queue Table */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Priority Review Queue</CardTitle>
                <CardDescription>
                  Expert submissions requiring editorial validation.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/editor/pending">View Full Queue</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Article Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingArticles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell className="font-bold">{article.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">{article.authorId}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(article.submittedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">
                        {article.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/editor/review/${article.id}`}>
                          Review <ArrowRight className="ml-2 h-3 w-3" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
