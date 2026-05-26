'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Text } from '@/design-system/typography/text';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Layers, 
  Settings2,
  Globe,
  Tag as TagIcon,
  CheckCircle2
} from 'lucide-react';
import { MOCK_CATEGORIES } from '@/modules/content-engine/models/category';
import { Category } from '@/modules/content-engine/types/category';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { slugify } from '@/modules/content-engine/utils/slugify';
import { toast } from '@/hooks/use-toast';

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Category Saved",
      description: `Hierarchy metadata for "${currentCategory?.name}" has been updated.`,
    });
    setIsEditing(false);
  };

  const handleOpenEdit = (category: Category) => {
    setCurrentCategory(category);
    setIsEditing(true);
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Text variant="h1" className="text-3xl font-bold">Category Hierarchy</Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Manage top-level intelligence classification and SEO optimization.
          </Text>
        </div>
        <Button onClick={() => {
          setCurrentCategory({
            id: Math.random().toString(),
            name: '',
            slug: '',
            description: '',
            articleCount: 0,
            seoTitle: '',
            seoDescription: '',
            seoKeywords: []
          });
          setIsEditing(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </header>

      <div className="flex flex-col md:flex-row gap-4 bg-card/30 p-4 rounded-xl border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Filter categories..." 
            className="pl-10 bg-background/50" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[300px]">Category Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Insights</TableHead>
              <TableHead>SEO Health</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-bold">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    {category.name}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  /{category.slug}
                </TableCell>
                <TableCell>
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                    {category.articleCount} Articles
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-bold uppercase">
                    <CheckCircle2 className="h-3 w-3" /> Optimized
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(category)}>
                      <Settings2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{currentCategory?.id ? 'Edit Category' : 'Create Category'}</DialogTitle>
              <DialogDescription>
                Configure classification settings and automate SEO performance.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category Name</Label>
                  <Input 
                    value={currentCategory?.name || ''} 
                    onChange={(e) => {
                      const name = e.target.value;
                      setCurrentCategory(prev => prev ? { ...prev, name, slug: slugify(name) } : null);
                    }}
                    placeholder="e.g. Economics"
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL Slug</Label>
                  <Input 
                    value={currentCategory?.slug || ''} 
                    onChange={(e) => setCurrentCategory(prev => prev ? { ...prev, slug: e.target.value } : null)}
                    placeholder="economics"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Internal Description</Label>
                <Textarea 
                  value={currentCategory?.description || ''} 
                  onChange={(e) => setCurrentCategory(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="Describe the scope of this intelligence hub..."
                />
              </div>

              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <Globe className="h-4 w-4" /> pSEO Metadata Engine
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">SEO Title Tag</Label>
                    <Input 
                      className="bg-background"
                      value={currentCategory?.seoTitle || ''} 
                      onChange={(e) => setCurrentCategory(prev => prev ? { ...prev, seoTitle: e.target.value } : null)}
                      placeholder="Title displayed in search results..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Meta Description</Label>
                    <Textarea 
                      className="bg-background h-20"
                      value={currentCategory?.seoDescription || ''} 
                      onChange={(e) => setCurrentCategory(prev => prev ? { ...prev, seoDescription: e.target.value } : null)}
                      placeholder="High-converting summary for SERPs..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Focus Keywords (Comma separated)</Label>
                    <Input 
                      className="bg-background"
                      value={currentCategory?.seoKeywords?.join(', ') || ''} 
                      onChange={(e) => setCurrentCategory(prev => prev ? { ...prev, seoKeywords: e.target.value.split(',').map(k => k.trim()) } : null)}
                      placeholder="economics, macro analysis, finance..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button type="submit">Update Taxonomy</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
