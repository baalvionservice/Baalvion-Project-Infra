"use client";

import { useEffect, useState } from "react";
import { boardMaterialsService } from "@/core/services/board-materials.service";
import { BoardMaterial, WorkflowStatus } from "@/core/content/schemas";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, Lock, ShieldCheck, Eye, Plus, GitPullRequest } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BoardMaterialsManagerPage() {
  const [materials, setMaterials] = useState<BoardMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    const data = await boardMaterialsService.getMaterials();
    setMaterials(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('materials-updated', loadData);
    return () => window.removeEventListener('materials-updated', loadData);
  }, []);

  const handleStatusChange = async (id: string, status: WorkflowStatus) => {
    await boardMaterialsService.updateStatus(id, status);
    toast({ title: "Workflow Updated", description: `Material state changed to ${status}.` });
  };

  if (isLoading) return <div className="py-20 text-center text-muted-foreground">Accessing confidential briefcase...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Board Materials</h1>
          <p className="text-muted-foreground">Distribute confidential briefing books, committee charters, and strategic reports.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Briefing Book
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Meeting / Title</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Workflow</TableHead>
                <TableHead className="text-right">Control</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((mat) => (
                <TableRow key={mat.id}>
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="font-bold">{mat.title}</p>
                        <p className="text-xs text-muted-foreground">Target Date: {mat.meetingDate}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={mat.classification === 'Confidential' ? 'destructive' : 'outline'} className="flex w-fit gap-1">
                      <Lock className="h-3 w-3" /> {mat.classification}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{mat.documentIds.length} Files</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={mat.workflowStatus === 'Published' ? 'default' : 'secondary'}>
                      {mat.workflowStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" /> Briefcase
                      </Button>
                      {mat.workflowStatus === 'Draft' && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleStatusChange(mat.id, 'InReview')}>
                          <GitPullRequest className="h-4 w-4 mr-1" /> Submit
                        </Button>
                      )}
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
