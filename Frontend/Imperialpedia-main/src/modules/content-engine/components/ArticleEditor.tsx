'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/design-system/typography/text';
import { Save, Send, Image as ImageIcon, Plus, X, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const articleSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  summary: z.string().min(20, 'Summary must be at least 20 characters'),
  body: z.string().min(100, 'Article body must be at least 100 characters'),
  category: z.string().min(1, 'Please select a category'),
});

type ArticleFormValues = z.infer<typeof articleSchema>;

/**
 * A professional article editor for creators and writers.
 * Supports metadata management and drafting workflows.
 */
export const ArticleEditor = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [tags, setTags] = useState<string[]>(['Macro', 'Economics']);
  const [currentTag, setCurrentTag] = useState('');

  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: '',
      summary: '',
      body: '',
      category: 'Economics',
    },
  });

  const handleAddTag = () => {
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  async function onSubmit(values: ArticleFormValues) {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
    
    toast({
      title: "Article Submitted",
      description: "Your financial insight has been sent for editorial review.",
    });
  }

  const handleSaveDraft = () => {
    toast({
      title: "Draft Saved",
      description: "Progress has been saved to your local workspace.",
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Text variant="h1" className="text-3xl font-bold">Write Financial Intelligence</Text>
          <Text variant="bodySmall" className="text-muted-foreground">Draft your next expert analysis for the Imperialpedia Index.</Text>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleSaveDraft}>
            <Save className="mr-2 h-4 w-4" /> Save Draft
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Submit for Review
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Form {...form}>
            <form className="space-y-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Core Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Article Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., The Impact of Quantitative Tightening on Emerging Markets" {...field} className="h-12 text-lg font-bold" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Executive Summary</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Provide a brief, SEO-friendly summary of your findings..." {...field} className="min-h-[100px] resize-none" />
                        </FormControl>
                        <FormDescription>This appears in search results and social previews.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Article Body</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Write your analysis here. Use professional terminology..." 
                            {...field} 
                            className="min-h-[500px] font-body text-lg leading-relaxed" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>

        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Classification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Financial Category</label>
                <Select
                  defaultValue={form.getValues("category")}
                  onValueChange={(value) => form.setValue("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Economics">Economics</SelectItem>
                    <SelectItem value="Investing">Investing</SelectItem>
                    <SelectItem value="Markets">Markets</SelectItem>
                    <SelectItem value="Personal Finance">Personal Finance</SelectItem>
                    <SelectItem value="Crypto">Crypto & Web3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Intelligence Tags</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Add tag..." 
                    value={currentTag} 
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Media Attachments</CardTitle>
              <CardDescription>Support your analysis with charts and visuals.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-xl p-8 text-center space-y-4 hover:border-primary/50 transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <ImageIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <Text variant="bodySmall" weight="bold">Upload Analysis Assets</Text>
                  <Text variant="caption" className="text-muted-foreground">PNG, JPG or SVG up to 10MB</Text>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="p-6 rounded-xl bg-primary/5 border border-primary/20">
            <Text variant="bodySmall" weight="bold" className="text-primary mb-2 flex items-center gap-2">
              <ImageIcon className="h-4 w-4" /> Publishing Standards
            </Text>
            <ul className="text-xs space-y-2 text-muted-foreground list-disc pl-4">
              <li>Ensure all claims are backed by data.</li>
              <li>Maintain a professional, objective tone.</li>
              <li>Attribute all external sources properly.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
