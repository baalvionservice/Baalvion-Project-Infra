"use client";

import { useEffect, useState } from "react";
import { pageService } from "@/core/services/page.service";
import { PageDefinition } from "@/core/content/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit3, Eye, MoreHorizontal, Layout, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function PageManagerPage() {
  const [pages, setPages] = useState<PageDefinition[]>([]);
  const [search, setSearch] = useState("");

  const loadPages = async () => {
    const response = await pageService.getAllPages();
    setPages(response.data || []);
  };

  useEffect(() => {
    loadPages();
  }, []);

  const filteredPages = pages.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Page Manager</h1>
          <p className="text-muted-foreground">Create and manage content layouts and SEO metadata.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Create Page
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search pages..." 
            className="pl-10" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Sections</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="font-semibold">{page.title}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{page.slug}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{page.sections.length} Sections</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap max-w-[200px]">
                      {Array.from(new Set(page.sections.flatMap(s => s.roles))).map(role => (
                        <Badge key={role} variant="outline" className="text-[10px]">{role}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        <Edit3 className="h-4 w-4 mr-2" /> Design
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal size={16}/></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Eye className="mr-2 h-4 w-4"/> View Live</DropdownMenuItem>
                          <DropdownMenuItem><Layout className="mr-2 h-4 w-4"/> SEO Settings</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Delete Page</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
