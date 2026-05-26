import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import MainLayout from "@/components/layout/MainLayout";
import { ArrowLeft, Send, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const threadSchema = z.object({
  title: z.string().trim().min(10, "Title must be at least 10 characters").max(200, "Title must be less than 200 characters"),
  content: z.string().trim().min(50, "Content must be at least 50 characters").max(10000, "Content must be less than 10000 characters"),
  categoryId: z.string().uuid("Please select a category"),
});

type Category = {
  id: string;
  name: string;
  description: string | null;
};

type Tag = {
  id: string;
  name: string;
  color: string;
};

const CreateThread = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.error("You must be logged in to create threads");
      navigate("/auth");
      return;
    }
    fetchCategories();
    fetchTags();
  }, [user, navigate]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("forum_categories")
        .select("id, name, description")
        .order("order_index", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error("Failed to load categories:", error);
      toast.error("Failed to load categories");
    }
  };

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from("tags" as any)
        .select("id, name, color")
        .order("name", { ascending: true });

      if (error) throw error;
      setTags(data as unknown as Tag[]);
    } catch (error: any) {
      console.error("Failed to load tags:", error);
      toast.error("Failed to load tags");
    }
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to create threads");
      navigate("/auth");
      return;
    }

    setSubmitting(true);

    try {
      const validationResult = threadSchema.safeParse({
        title,
        content,
        categoryId,
      });

      if (!validationResult.success) {
        toast.error(validationResult.error.issues[0].message);
        return;
      }

      // Create thread
      const { data: threadData, error: threadError } = await supabase
        .from("forum_threads")
        .insert({
          title: validationResult.data.title,
          category_id: validationResult.data.categoryId,
          author_id: user.id,
        })
        .select()
        .single();

      if (threadError) throw threadError;

      // Create first post
      const { error: postError } = await supabase
        .from("forum_posts")
        .insert({
          thread_id: threadData.id,
          author_id: user.id,
          content: validationResult.data.content,
        });

      if (postError) throw postError;

      // Add tags to thread
      if (selectedTags.length > 0) {
        const { error: tagsError } = await supabase
          .from("thread_tags" as any)
          .insert(
            selectedTags.map(tagId => ({
              thread_id: threadData.id,
              tag_id: tagId,
            }))
          );

        if (tagsError) throw tagsError;
      }

      toast.success("Thread created successfully!");
      navigate(`/forums/thread/${threadData.id}`);
    } catch (error: any) {
      console.error("Failed to create thread:", error);
      
      if (error.code === "23503") {
        toast.error("Invalid category selected");
      } else {
        toast.error("Failed to create thread");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/forums")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Forums
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Create New Thread</CardTitle>
            <CardDescription>
              Start a new discussion in the community forums
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category Selection */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={categoryId} onValueChange={setCategoryId} required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                        {category.description && (
                          <span className="text-xs text-muted-foreground ml-2">
                            - {category.description}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Thread Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter a descriptive title for your thread"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  {title.length} / 200 characters
                </p>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  placeholder="Share your thoughts, questions, or insights..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={12}
                  className="resize-none"
                  maxLength={10000}
                />
                <p className="text-xs text-muted-foreground">
                  {content.length} / 10000 characters (minimum 50 required)
                </p>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags (optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: selectedTags.includes(tag.id) ? tag.color : 'transparent',
                        borderColor: tag.color,
                        color: selectedTags.includes(tag.id) ? '#fff' : tag.color,
                      }}
                      onClick={() => handleTagToggle(tag.id)}
                    >
                      {tag.name}
                      {selectedTags.includes(tag.id) && (
                        <X className="w-3 h-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Select tags to help categorize your thread
                </p>
              </div>

              {/* Guidelines */}
              <Card className="bg-secondary/50">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2 text-sm">Community Guidelines</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Be respectful and professional</li>
                    <li>• Stay on topic and add value to discussions</li>
                    <li>• No spam, self-promotion, or offensive content</li>
                    <li>• Provide sources when sharing facts or data</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/forums")}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} variant="premium">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Create Thread
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default CreateThread;
