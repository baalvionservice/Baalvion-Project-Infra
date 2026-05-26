"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Text } from "@/design-system/typography/text";
import { ArrowLeft, Save, Loader2, X } from "lucide-react";
import { adminKernel } from "@/lib/services/admin-service";
import { NewsArticle, NewsCategory, NewsBodyBlock } from "@/lib/data.news";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { NewsBodyBlockEditor } from "@/components/editor/news-body-block";

const articleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  excerpt: z.string().min(1, "Excerpt is required"),
  category: z.string().min(1, "Category is required"),
  authorName: z.string().min(1, "Author name is required"),
  authorTitle: z.string().optional(),
  readTimeMinutes: z.number().min(1, "Read time must be at least 1 minute"),
  imageUrl: z.string().url("Must be a valid URL"),
  imageCaption: z.string().optional(),
  featured: z.boolean().optional(),
  keyTakeaways: z.array(z.string()).optional(),
  body: z.array(z.any()).min(1, "Article body is required"),
  tags: z.array(z.string()).optional(),
});

type ArticleFormData = z.infer<typeof articleSchema>;

const categories: NewsCategory[] = [
  "Markets",
  "Economy",
  "Stocks",
  "Crypto",
  "PersonalFinance",
  "RealEstate",
  "ETFs",
  "Editorial",
  "Guides",
  "Bonds",
];

export default function NewArticlePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [takeawayInput, setTakeawayInput] = useState("");

  const form = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      category: "",
      authorName: "",
      authorTitle: "",
      readTimeMinutes: 1,
      imageUrl: "",
      imageCaption: "",
      featured: false,
      keyTakeaways: [],
      body: [],
      tags: [],
    },
  });

  const onSubmit = async (data: ArticleFormData) => {
    setSaving(true);
    try {
      const newArticle: NewsArticle = {
        id: Date.now().toString(),
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        category: data.category as NewsCategory,
        author: {
          name: data.authorName,
          title: data.authorTitle,
        },
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        readTimeMinutes: data.readTimeMinutes,
        imageUrl: data.imageUrl,
        imageCaption: data.imageCaption,
        featured: data.featured,
        keyTakeaways: data.keyTakeaways,
        body: data.body as NewsBodyBlock[],
        tags: data.tags,
      };

      adminKernel.saveArticle(newArticle);
      toast({
        title: "Article Created",
        description: "Your new article has been created successfully.",
      });
      router.push("/admin/content");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create article. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !form.getValues("tags")?.includes(tagInput.trim())) {
      const currentTags = form.getValues("tags") || [];
      form.setValue("tags", [...currentTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue(
      "tags",
      currentTags.filter((tag) => tag !== tagToRemove)
    );
  };

  const addTakeaway = () => {
    if (
      takeawayInput.trim() &&
      !form.getValues("keyTakeaways")?.includes(takeawayInput.trim())
    ) {
      const currentTakeaways = form.getValues("keyTakeaways") || [];
      form.setValue("keyTakeaways", [
        ...currentTakeaways,
        takeawayInput.trim(),
      ]);
      setTakeawayInput("");
    }
  };

  const removeTakeaway = (takeawayToRemove: string) => {
    const currentTakeaways = form.getValues("keyTakeaways") || [];
    form.setValue(
      "keyTakeaways",
      currentTakeaways.filter((takeaway) => takeaway !== takeawayToRemove)
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault();
      action();
    }
  };

  // Auto-generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (value: string) => {
    form.setValue("title", value);
    if (!form.getValues("slug")) {
      form.setValue("slug", generateSlug(value));
    }
  };

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-700">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/content">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <Text variant="h1" className="text-2xl font-bold">
              Create New Article
            </Text>
            <Text variant="body" className="text-muted-foreground">
              Add a new article to your content library
            </Text>
          </div>
        </div>
      </header>

      <Card className="glass-card border-none shadow-2xl">
        <CardHeader>
          <CardTitle>Article Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter article title"
                          onChange={(e) => {
                            field.onChange(e);
                            handleTitleChange(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="article-slug" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Excerpt</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Brief excerpt of the article"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category and Author */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="authorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Author Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Author name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="authorTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Author Title</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Author title (optional)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Image and Meta */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageCaption"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image Caption</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Image caption (optional)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="readTimeMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Read Time (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="1"
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 1)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Featured */}
              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Featured Article</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Mark this article as featured
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              {/* Key Takeaways */}
              <div>
                <Label>Key Takeaways</Label>
                <div className="flex gap-2 mt-2 mb-3 flex-wrap">
                  {form.watch("keyTakeaways")?.map((takeaway) => (
                    <Badge
                      key={takeaway}
                      variant="secondary"
                      className="gap-1 max-w-md"
                    >
                      <span className="truncate">{takeaway}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removeTakeaway(takeaway)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Textarea
                    value={takeawayInput}
                    onChange={(e) => setTakeawayInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, addTakeaway)}
                    placeholder="Add a key takeaway"
                    rows={2}
                  />
                  <Button type="button" onClick={addTakeaway} variant="outline">
                    Add
                  </Button>
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mt-2 mb-3 flex-wrap">
                  {form.watch("tags")?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, addTag)}
                    placeholder="Add a tag"
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    Add
                  </Button>
                </div>
              </div>

              {/* Article Body */}
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <NewsBodyBlockEditor
                        blocks={field.value as NewsBodyBlock[]}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-6">
                <Button type="button" variant="outline" asChild>
                  <Link href="/admin/content">Cancel</Link>
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create Article
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
