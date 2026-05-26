"use client";

// Prevent prerendering for this page since it uses client-side hooks
export const dynamic = "force-dynamic";

import React, { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  ArrowLeft,
  Sparkles,
  Tag as TagIcon,
  Plus,
  X,
  Loader2,
  Eye,
  CheckCircle2,
  FileText,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const articleSchema = z.object({
  title: z
    .string()
    .min(5, "A professional headline requires at least 5 characters."),
  snippet: z
    .string()
    .min(20, "Provide a substantial executive summary (20+ chars)."),
  content: z
    .string()
    .min(100, "Intelligence insights must be thorough (100+ chars)."),
  category: z.string().min(1, "Please select a knowledge hub."),
});

type ArticleFormValues = z.infer<typeof articleSchema>;

/**
 * Creator Content Editor.
 * A high-fidelity interface for drafting and publishing financial intelligence.
 */
function CreatorEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const articleId = searchParams.get("id");

  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [tags, setTags] = useState<string[]>(["Macro", "Economics"]);
  const [currentTag, setCurrentTag] = useState("");

  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: "",
      snippet: "",
      content: "",
      category: "Economics",
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

  const handleSaveDraft = async () => {
    setIsSaving(true);
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 800));
    setIsSaving(false);
    toast({
      title: "Draft Synchronized",
      description: "Your progress has been secured in the Intelligence Index.",
    });
  };

  const onPublish = async (values: ArticleFormValues) => {
    setIsPublishing(true);
    // Simulate publishing cycle
    await new Promise((r) => setTimeout(r, 1500));
    setIsPublishing(false);

    toast({
      title: "Intelligence Published",
      description:
        "Your analysis is now live and indexed for platform-wide reach.",
    });
    router.push("/creator/dashboard");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/creator/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <FileText className="h-4 w-4" />
              <Text
                variant="label"
                className="text-[10px] font-bold tracking-widest uppercase"
              >
                Intelligence Studio
              </Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold">
              {articleId ? "Refine Insight" : "Draft New Intelligence"}
            </Text>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSaving || isPublishing}
            className="h-11 px-6 rounded-xl border-white/10 bg-card/30"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Draft
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={isPublishing}
                className="h-11 px-8 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold"
              >
                {isPublishing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Publish Insight
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-card border-primary/20">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl font-bold">
                  Commit to the Intelligence Index?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  This will finalize your research and make it available to the
                  global network. Ensure all claims are verified against primary
                  sources.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-3">
                <AlertDialogCancel className="rounded-xl">
                  Review Further
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-primary hover:bg-primary/90 rounded-xl font-bold"
                  onClick={form.handleSubmit(onPublish)}
                >
                  Confirm Publication
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Writing Canvas */}
        <div className="lg:col-span-8 space-y-6">
          <Form {...form}>
            <form className="space-y-6">
              <Card className="glass-card border-none shadow-2xl">
                <CardHeader className="bg-card/30 border-b border-white/5 pb-6">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <Sparkles className="h-4 w-4" />
                    <Text
                      variant="caption"
                      className="font-bold uppercase tracking-wider"
                    >
                      Expert Analysis
                    </Text>
                  </div>
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Headline: e.g. The Asymmetric Impact of Decentralized Fiscal Nodes"
                            {...field}
                            className="h-14 text-2xl font-bold bg-transparent border-none focus-visible:ring-0 placeholder:text-muted-foreground/30 px-0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <FormField
                    control={form.control}
                    name="snippet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                          Executive Summary
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Craft a high-impact summary for the intelligence preview card..."
                            {...field}
                            className="min-h-[100px] bg-white/5 border-white/5 rounded-xl resize-none italic text-lg leading-relaxed"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                          Deep-Dive Analysis
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Begin your expert research here. Utilize professional terminology and clear headings..."
                            {...field}
                            className="min-h-[600px] bg-transparent border-none focus-visible:ring-0 text-xl font-body leading-relaxed px-0"
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

        {/* Intelligence Meta & Tools */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass-card border-none">
            <CardHeader className="bg-card/30 border-b border-white/5">
              <CardTitle className="text-sm flex items-center gap-2">
                <TagIcon className="h-4 w-4 text-secondary" /> Knowledge Matrix
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Knowledge Hub</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background/50 border-white/10 h-11 rounded-xl">
                          <SelectValue placeholder="Select taxonomy..." />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <FormLabel>Topic Nodes (Tags)</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search matrix..."
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), handleAddTag())
                    }
                    className="bg-background/50 border-white/10 h-11 rounded-xl"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 rounded-xl"
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
                      className="pl-3 pr-1.5 py-1.5 gap-1.5 bg-secondary/10 text-secondary border-none rounded-lg text-[10px] font-bold"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-white transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-none bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" /> Publishing Readiness
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />{" "}
                  Professional Headline
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />{" "}
                  Executive Summary Ready
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="h-4 w-4 rounded-full border-2 border-primary/30 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  </div>
                  Minimum Word Count (Incomplete)
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <Text
                  variant="caption"
                  className="italic text-muted-foreground leading-relaxed"
                >
                  "Expert insights with at least 3 Topic Nodes and an Executive
                  Summary receive 2.4x more organic reach."
                </Text>
              </div>
            </CardContent>
          </Card>

          <div className="p-6 rounded-[2rem] border border-secondary/20 bg-secondary/5 space-y-4">
            <Text
              variant="bodySmall"
              weight="bold"
              className="text-secondary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Strategic Priority
            </Text>
            <Text
              variant="caption"
              className="text-muted-foreground leading-relaxed"
            >
              We are currently prioritizing intelligence on **Central Bank
              Liquidity Cycles**. Insights in the 'Economics' hub with related
              nodes are being featured in the primary Intelligence Feed.
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreatorEditorPage() {
  return (
    <Suspense fallback={<div>Loading editor...</div>}>
      <CreatorEditorContent />
    </Suspense>
  );
}
