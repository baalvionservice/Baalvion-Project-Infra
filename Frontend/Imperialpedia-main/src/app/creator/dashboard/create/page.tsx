"use client";

// Prevent prerendering for this page since it uses client-side form hooks
export const dynamic = "force-dynamic";

import React, { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/design-system/typography/text";
import {
  Save,
  Send,
  Image as ImageIcon,
  Plus,
  X,
  Loader2,
  ArrowLeft,
  Sparkles,
  Globe,
  Tag as TagIcon,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

const articleSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  summary: z
    .string()
    .min(20, "Executive summary must be at least 20 characters"),
  body: z
    .string()
    .min(100, "Article body must be substantial (100+ characters)"),
  category: z.string().min(1, "Please select a financial category"),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

type ArticleFormValues = z.infer<typeof articleSchema>;

export default function CreateInsightPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [tags, setTags] = useState<string[]>(["Macro", "Economics"]);
  const [currentTag, setCurrentTag] = useState("");
  const router = useRouter();

  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: "",
      summary: "",
      body: "",
      category: "Economics",
      seoTitle: "",
      seoDescription: "",
    },
  });

  const handleAddTag = () => {
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag]);
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  async function onSubmit(values: ArticleFormValues) {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);

    toast({
      title: "Insight Submitted",
      description:
        "Your expert analysis is being processed by the Content Engine.",
    });
    router.push("/creator/dashboard");
  }

  const handleSaveDraft = () => {
    toast({
      title: "Draft Synchronized",
      description: "Progress saved to your local Creator Studio.",
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/creator/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <Text variant="h1" className="text-3xl font-bold">
              New Intelligence Insight
            </Text>
            <Text variant="bodySmall" className="text-muted-foreground">
              Drafting for the Imperialpedia Intelligence Index.
            </Text>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleSaveDraft}>
            <Save className="mr-2 h-4 w-4" /> Save Draft
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSaving}
            className="shadow-lg shadow-primary/20"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Publish Insight
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <Form {...form}>
            <form className="space-y-6">
              <Card className="glass-card border-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" /> Core
                    Intelligence
                  </CardTitle>
                  <CardDescription>
                    Masterfully craft your financial analysis with professional
                    terminology.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Insight Headline</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., The Asymmetric Impact of Decentralized Fiscal Nodes"
                            {...field}
                            className="h-12 text-lg font-bold bg-background/50"
                          />
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
                          <Textarea
                            placeholder="High-impact, SEO-friendly summary for the index..."
                            {...field}
                            className="min-h-[100px] resize-none bg-background/50"
                          />
                        </FormControl>
                        <FormDescription>
                          Appears in search results and intelligence preview
                          cards.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Analysis</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Begin your deep-dive research here..."
                            {...field}
                            className="min-h-[600px] font-body text-lg leading-relaxed bg-background/50 border-white/5"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* pSEO Metadata Engine */}
              <Card className="glass-card border-none bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Globe className="h-5 w-5" /> pSEO Metadata Engine
                  </CardTitle>
                  <CardDescription>
                    Optimize this node for the programmatic search index.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="seoTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">
                            SEO Title Tag
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Custom browser title..."
                              {...field}
                              className="bg-background"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="seoDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">
                            Meta Snippet
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="SERP description snippet..."
                              {...field}
                              className="bg-background"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TagIcon className="h-5 w-5 text-secondary" /> Classification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Knowledge Hub</label>
                <Select defaultValue="Economics">
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select taxonomy..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Economics">Economics</SelectItem>
                    <SelectItem value="Investing">Investing</SelectItem>
                    <SelectItem value="Markets">Markets</SelectItem>
                    <SelectItem value="Personal Finance">
                      Personal Finance
                    </SelectItem>
                    <SelectItem value="Crypto">Crypto & Web3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Intelligence Tags</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search matrix..."
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), handleAddTag())
                    }
                    className="bg-background/50"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddTag}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="pl-2 pr-1 py-1 gap-1 bg-secondary/10 text-secondary border-secondary/20"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-destructive transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" /> Visual
                Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-2xl p-8 text-center space-y-4 hover:border-primary/50 transition-all cursor-pointer bg-primary/5 group">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <ImageIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <Text variant="bodySmall" weight="bold">
                    Upload Analysis Assets
                  </Text>
                  <Text variant="caption" className="text-muted-foreground">
                    High-fidelity charts or infographics
                  </Text>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="p-6 rounded-3xl bg-secondary/10 border border-secondary/20 space-y-4">
            <Text
              variant="bodySmall"
              weight="bold"
              className="text-secondary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Editorial SLA
            </Text>
            <ul className="text-xs space-y-3 text-muted-foreground list-disc pl-4">
              <li>Verified experts receive 4-hour review priority.</li>
              <li>Data-driven claims require linked primary sources.</li>
              <li>Calculators can be requested for insertion here.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
