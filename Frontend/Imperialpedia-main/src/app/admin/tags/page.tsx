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
  Tag as TagIcon, 
  Settings2,
  Globe,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { MOCK_TAGS } from '@/modules/content-engine/models/tag';
import { Tag } from '@/modules/content-engine/types/tag';
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

export default function TagManagementPage() {
  const [tags, setTags] = useState<Tag[]>(MOCK_TAGS);
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentTag, setCurrentTag] = useState<Tag | null>(null);

  const filteredTags = tags.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Topic Updated",
      description: `Intelligence metadata for "${currentTag?.name}" is now live.`,
    });
    setIsEditing(false);
  };

  const handleOpenEdit = (tag: Tag) => {
    setCurrentTag(tag);
    setIsEditing(true);
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Text variant="h1" className="text-3xl font-bold">Topic Matrix</Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Managing the knowledge graph and SEO topic associations.
          </Text>
        </div>
        <Button onClick={() => {
          setCurrentTag({
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
          <Plus className="mr-2 h-4 w-4" /> Create Topic
        </Button>
      </header>

      <div className="flex flex-col md:flex-row gap-4 bg-card/30 p-4 rounded-xl border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search topic matrix..." 
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
              <TableHead className="w-[300px]">Topic Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>pSEO Readiness</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTags.map((tag) => (
              <TableRow key={tag.id}>
                <TableCell className="font-bold">
                  <div className="flex items-center gap-2">
                    <TagIcon className="h-4 w-4 text-secondary" />
                    {tag.name}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  #{tag.slug}
                </TableCell>
                <TableCell>
                  <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold">
                    {tag.articleCount} Insights
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-bold uppercase">
                    <TrendingUp className="h-3 w-3" /> High Impact
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(tag)}>
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
              <DialogTitle>{currentTag?.id ? 'Edit Topic Settings' : 'Create New Topic'}</DialogTitle>
              <DialogDescription>
                Refine the knowledge node and optimize its search engine footprint.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Topic Label</Label>
                  <Input 
                    value={currentTag?.name || ''} 
                    onChange={(e) => {
                      const name = e.target.value;
                      setCurrentTag(prev => prev ? { ...prev, name, slug: slugify(name) } : null);
                    }}
                    placeholder="e.g. Yield Curve"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Canonical Slug</Label>
                  <Input 
                    value={currentTag?.slug || ''} 
                    onChange={(e) => setCurrentTag(prev => prev ? { ...prev, slug: e.target.value } : null)}
                    placeholder="yield-curve"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Knowledge Definition</Label>
                <Textarea 
                  value={currentTag?.description || ''} 
                  onChange={(e) => setCurrentTag(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="A brief definition used for automated knowledge cards..."
                />
              </div>

              <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/20 space-y-4">
                <div className="flex items-center gap-2 text-secondary font-bold text-sm">
                  <Globe className="h-4 w-4" /> SEO Logic Center
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">SEO Headline (H1 Mapping)</Label>
                    <Input 
                      className="bg-background"
                      value={currentTag?.seoTitle || ''} 
                      onChange={(e) => setCurrentTag(prev => prev ? { ...prev, seoTitle: e.target.value } : null)}
                      placeholder="Keyword-rich headline..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Search Snippet</Label>
                    <Textarea 
                      className="bg-background h-20"
                      value={currentTag?.seoDescription || ''} 
                      onChange={(e) => setCurrentTag(prev => prev ? { ...prev, seoDescription: e.target.value } : null)}
                      placeholder="Snippet displayed in search results..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">LSI Keywords</Label>
                    <Input 
                      className="bg-background"
                      value={currentTag?.seoKeywords?.join(', ') || ''} 
                      onChange={(e) => setCurrentTag(prev => prev ? { ...prev, seoKeywords: e.target.value.split(',').map(k => k.trim()) } : null)}
                      placeholder="related terms, latent semantic keywords..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button type="submit">Update Topic</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
