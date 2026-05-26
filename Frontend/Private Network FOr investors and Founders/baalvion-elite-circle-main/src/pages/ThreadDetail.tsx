import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { MentionInput } from "@/components/forum/MentionInput";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import MainLayout from "@/components/layout/MainLayout";
import { ArrowLeft, MessageSquare, ThumbsUp, Share2, Flag, User, Clock, Send, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useActivityTracking } from "@/hooks/useActivityTracking";

const replySchema = z.object({
  content: z.string().trim().min(10, "Reply must be at least 10 characters").max(5000, "Reply must be less than 5000 characters"),
});

type Post = {
  id: string;
  content: string;
  created_at: string;
  likes: number;
  author: {
    username: string;
    avatar_url: string | null;
  };
};

type Thread = {
  id: string;
  title: string;
  created_at: string;
  views: number;
  is_pinned: boolean;
  author: {
    username: string;
    avatar_url: string | null;
  };
  category: {
    name: string;
    icon: string | null;
  };
  tags?: Array<{ id: string; name: string; color: string }>;
};

const ThreadDetail = () => {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [thread, setThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { trackThreadView, trackPostCreation } = useActivityTracking();

  // Real-time subscription for post likes
  useEffect(() => {
    if (!threadId) return;

    const channel = supabase
      .channel('post-likes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_likes',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newLike = payload.new as any;
            // Update the post's like count
            setPosts(prev => prev.map(post => 
              post.id === newLike.post_id 
                ? { ...post, likes: post.likes + 1 }
                : post
            ));
            
            // Update user likes if it's the current user
            if (user && newLike.user_id === user.id) {
              setUserLikes(prev => new Set([...prev, newLike.post_id]));
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedLike = payload.old as any;
            // Update the post's like count
            setPosts(prev => prev.map(post => 
              post.id === deletedLike.post_id 
                ? { ...post, likes: Math.max(0, post.likes - 1) }
                : post
            ));
            
            // Update user likes if it's the current user
            if (user && deletedLike.user_id === user.id) {
              setUserLikes(prev => {
                const next = new Set(prev);
                next.delete(deletedLike.post_id);
                return next;
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, user]);

  useEffect(() => {
    if (threadId) {
      fetchThread();
      fetchPosts();
      incrementViews();
      
      if (user) {
        fetchUserLikes();
        fetchBookmarkStatus();
      }
    }
  }, [threadId, user]);

  // Track thread view
  useEffect(() => {
    if (thread && threadId) {
      trackThreadView(threadId, thread.title);
    }
  }, [thread, threadId, trackThreadView]);

  const incrementViews = async () => {
    try {
      await supabase.rpc("increment_thread_views" as any, { thread_id: threadId });
    } catch (error) {
      console.error("Failed to increment views:", error);
    }
  };

  const fetchThread = async () => {
    try {
      const { data, error } = await supabase
        .from("forum_threads")
        .select(`
          id,
          title,
          created_at,
          views,
          is_pinned,
          author:profiles!forum_threads_author_id_fkey(username, avatar_url),
          category:forum_categories!forum_threads_category_id_fkey(name, icon)
        `)
        .eq("id", threadId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error("Thread not found");
        navigate("/forums");
        return;
      }

      // Fetch tags for this thread
      const { data: threadTagsData } = await supabase
        .from("thread_tags" as any)
        .select(`
          tag_id,
          tags:tags(id, name, color)
        `)
        .eq("thread_id", threadId);

      const threadTags = (threadTagsData || [])
        .map((tt: any) => tt.tags)
        .filter(Boolean);

      setThread({ ...data, tags: threadTags } as Thread);
    } catch (error: any) {
      console.error("Failed to load thread:", error);
      toast.error("Failed to load thread");
    }
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("forum_posts")
        .select(`
          id,
          content,
          created_at,
          likes,
          author:profiles!forum_posts_author_id_fkey(username, avatar_url)
        `)
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setPosts(data as Post[] || []);
    } catch (error: any) {
      console.error("Failed to load posts:", error);
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to reply");
      navigate("/auth");
      return;
    }

    setSubmitting(true);

    try {
      const validationResult = replySchema.safeParse({ content: replyContent });
      if (!validationResult.success) {
        toast.error(validationResult.error.issues[0].message);
        return;
      }

      const { data, error } = await supabase
        .from("forum_posts")
        .insert({
          thread_id: threadId,
          author_id: user.id,
          content: validationResult.data.content,
        })
        .select()
        .single();

      if (error) throw error;

      // Track post creation
      if (data) {
        trackPostCreation(threadId!, data.id);
      }

      toast.success("Reply posted successfully!");
      setReplyContent("");
      fetchPosts();
    } catch (error: any) {
      console.error("Failed to post reply:", error);
      toast.error("Failed to post reply");
    } finally {
      setSubmitting(false);
    }
  };

  const fetchUserLikes = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("post_likes" as any)
        .select("post_id")
        .eq("user_id", user.id);

      if (error) throw error;
      setUserLikes(new Set((data as any)?.map((l: any) => l.post_id) || []));
    } catch (error: any) {
      console.error("Failed to fetch user likes:", error);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!user) {
      toast.error("You must be logged in to like posts");
      return;
    }

    try {
      const hasLiked = userLikes.has(postId);
      
      if (hasLiked) {
        // Unlike
        const { error } = await supabase
          .from("post_likes" as any)
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        if (error) throw error;

        setUserLikes(prev => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });

        setPosts(posts.map(p => 
          p.id === postId ? { ...p, likes: Math.max(0, p.likes - 1) } : p
        ));
      } else {
        // Like
        const { error } = await supabase
          .from("post_likes" as any)
          .insert({ post_id: postId, user_id: user.id });

        if (error) throw error;

        setUserLikes(prev => new Set([...prev, postId]));

        setPosts(posts.map(p => 
          p.id === postId ? { ...p, likes: p.likes + 1 } : p
        ));
      }
    } catch (error: any) {
      console.error("Failed to toggle like:", error);
      toast.error("Failed to update like");
    }
  };

  const fetchBookmarkStatus = async () => {
    if (!user || !threadId) return;

    try {
      const { data, error } = await supabase
        .from("thread_bookmarks" as any)
        .select("id")
        .eq("user_id", user.id)
        .eq("thread_id", threadId)
        .maybeSingle();

      if (error) throw error;
      setIsBookmarked(!!data);
    } catch (error) {
      console.error("Failed to fetch bookmark status:", error);
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      toast.error("You must be logged in to bookmark threads");
      return;
    }

    try {
      if (isBookmarked) {
        // Remove bookmark
        await supabase
          .from("thread_bookmarks" as any)
          .delete()
          .eq("user_id", user.id)
          .eq("thread_id", threadId);

        setIsBookmarked(false);
        toast.success("Bookmark removed");
      } else {
        // Add bookmark
        await supabase
          .from("thread_bookmarks" as any)
          .insert({
            user_id: user.id,
            thread_id: threadId,
          });

        setIsBookmarked(true);
        toast.success("Thread bookmarked");
      }
    } catch (error: any) {
      console.error("Failed to toggle bookmark:", error);
      toast.error("Failed to update bookmark");
    }
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    
    return Math.floor(seconds) + " seconds ago";
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!thread) return null;

  return (
    <MainLayout>
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/forums")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Forums
        </Button>

        {/* Thread Header */}
        <Card className="mb-6">
          <CardHeader className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  {thread.is_pinned && (
                    <Badge variant="default" className="bg-primary/20 text-primary">
                      Pinned
                    </Badge>
                  )}
                  <Badge variant="secondary">{thread.category.name}</Badge>
                  {thread.tags?.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      style={{
                        borderColor: tag.color,
                        color: tag.color,
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
                <h1 className="text-3xl font-bold">{thread.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {thread.author.username}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {getTimeAgo(thread.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    {posts.length} {posts.length === 1 ? "reply" : "replies"}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBookmark}
                  >
                    <Bookmark className={`w-4 h-4 mr-2 ${isBookmarked ? "fill-current" : ""}`} />
                    {isBookmarked ? "Bookmarked" : "Bookmark"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copied to clipboard");
                    }}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Posts */}
        <div className="space-y-4 mb-8">
          {posts.map((post, index) => (
            <Card key={post.id}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-semibold">{post.author.username}</span>
                        {index === 0 && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Original Poster
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {getTimeAgo(post.created_at)}
                      </span>
                    </div>
                    <p className="text-foreground whitespace-pre-wrap mb-4">{post.content}</p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={userLikes.has(post.id) ? "default" : "ghost"}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikePost(post.id);
                        }}
                      >
                        <ThumbsUp className={`w-4 h-4 mr-1 ${userLikes.has(post.id) ? 'fill-current' : ''}`} />
                        {post.likes}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Share2 className="w-4 h-4 mr-1" />
                        Share
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Flag className="w-4 h-4 mr-1" />
                        Report
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Reply Form */}
        {user ? (
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold">Post a Reply</h3>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitReply} className="space-y-4">
                <MentionInput
                  value={replyContent}
                  onChange={setReplyContent}
                  placeholder="Share your thoughts... (Type @ to mention users)"
                  rows={6}
                  className="resize-none"
                  required
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {replyContent.length} / 5000 characters
                  </span>
                  <Button type="submit" disabled={submitting} variant="premium">
                    {submitting ? (
                      "Posting..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Post Reply
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Sign in to reply</h3>
              <p className="text-muted-foreground mb-4">
                You must be logged in to post replies
              </p>
              <Button variant="premium" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default ThreadDetail;
