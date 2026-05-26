import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import MainLayout from "@/components/layout/MainLayout";
import { MessageSquare, Search, TrendingUp, Users, Lock, Plus, Eye, Clock, Flame, ArrowUpDown, Calendar as CalendarIcon, X } from "lucide-react";
import { toast } from "sonner";
import { useActivityTracking } from "@/hooks/useActivityTracking";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";

type Thread = {
  id: string;
  title: string;
  created_at: string;
  views: number;
  is_pinned: boolean;
  status: string;
  author: {
    username: string;
    avatar_url: string | null;
  };
  category: {
    name: string;
    icon: string | null;
  };
  post_count: number;
  tags?: Array<{ id: string; name: string; color: string }>;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
};

type Tag = {
  id: string;
  name: string;
  color: string;
};

const ForumThreads = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const categorySlug = searchParams.get("category");
  
  const [threads, setThreads] = useState<Thread[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(categorySlug || "all");
  const [trendingThreads, setTrendingThreads] = useState<Thread[]>([]);
  const [sortBy, setSortBy] = useState<string>("recent");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const { trackPageView } = useActivityTracking();

  useEffect(() => {
    fetchCategories();
    fetchTags();
    fetchThreads();
    fetchTrendingThreads();
    trackPageView("Forums");
  }, [selectedCategory, searchQuery, sortBy, dateFrom, dateTo, selectedTags, trackPageView]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("forum_categories")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error("Failed to load categories:", error);
    }
  };

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from("tags" as any)
        .select("id, name, color")
        .order("name", { ascending: true });

      if (error) throw error;
      setTags(data as unknown as Tag[] || []);
    } catch (error: any) {
      console.error("Failed to load tags:", error);
    }
  };

  const fetchThreads = async () => {
    try {
      let query = supabase
        .from("forum_threads")
        .select(`
          id,
          title,
          created_at,
          views,
          is_pinned,
          status,
          author:profiles!forum_threads_author_id_fkey(username, avatar_url),
          category:forum_categories!forum_threads_category_id_fkey(name, icon)
        `)
        .eq("status", "open");

      // Apply category filter
      if (selectedCategory !== "all") {
        const category = categories.find(c => c.slug === selectedCategory);
        if (category) {
          query = query.eq("category_id", category.id);
        }
      }

      // Apply search filter
      if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      // Apply date range filter
      if (dateFrom) {
        query = query.gte("created_at", dateFrom.toISOString());
      }
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endOfDay.toISOString());
      }

      // Apply sorting (always order pinned threads first)
      query = query.order("is_pinned", { ascending: false });
      
      // Apply secondary sorting based on user selection
      switch (sortBy) {
        case "viewed":
          query = query.order("views", { ascending: false });
          break;
        case "recent":
        default:
          query = query.order("created_at", { ascending: false });
          break;
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      // Get post counts for each thread
      const threadsWithCounts = await Promise.all(
        (data || []).map(async (thread) => {
          const { count: postCount } = await supabase
            .from("forum_posts")
            .select("*", { count: "exact", head: true })
            .eq("thread_id", thread.id);

          // Get like count by querying posts and their likes
          const { data: postsData } = await supabase
            .from("forum_posts")
            .select("likes")
            .eq("thread_id", thread.id);

          const totalLikes = postsData?.reduce((sum, post) => sum + (post.likes || 0), 0) || 0;

          // Get tags for this thread
          const { data: threadTagsData } = await supabase
            .from("thread_tags" as any)
            .select(`
              tag_id,
              tags:tags(id, name, color)
            `)
            .eq("thread_id", thread.id);

          const threadTags = (threadTagsData || [])
            .map((tt: any) => tt.tags)
            .filter(Boolean);

          return {
            ...thread,
            post_count: postCount || 0,
            like_count: totalLikes,
            tags: threadTags,
          };
        })
      );

      // Filter by selected tags
      let filteredThreads = threadsWithCounts;
      if (selectedTags.length > 0) {
        filteredThreads = threadsWithCounts.filter(thread =>
          thread.tags?.some(tag => selectedTags.includes(tag.id))
        );
      }

      // Apply client-side sorting for options that need aggregated data
      let sortedThreads = [...filteredThreads];
      
      if (sortBy === "liked") {
        sortedThreads.sort((a, b) => {
          // Keep pinned threads at top
          if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
          return (b as any).like_count - (a as any).like_count;
        });
      } else if (sortBy === "active") {
        sortedThreads.sort((a, b) => {
          // Keep pinned threads at top
          if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
          return b.post_count - a.post_count;
        });
      }

      setThreads(sortedThreads as Thread[]);
    } catch (error: any) {
      console.error("Failed to load threads:", error);
      toast.error("Failed to load threads");
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingThreads = async () => {
    try {
      // Get threads from last 7 days with high activity
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from("forum_threads")
        .select(`
          id,
          title,
          created_at,
          views,
          is_pinned,
          status,
          author:profiles!forum_threads_author_id_fkey(username, avatar_url),
          category:forum_categories!forum_threads_category_id_fkey(name, icon)
        `)
        .eq("status", "open")
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("views", { ascending: false })
        .limit(5);

      if (error) throw error;

      // Get post counts for trending threads
      const threadsWithCounts = await Promise.all(
        (data || []).map(async (thread) => {
          const { count } = await supabase
            .from("forum_posts")
            .select("*", { count: "exact", head: true })
            .eq("thread_id", thread.id);

          return {
            ...thread,
            post_count: count || 0,
          };
        })
      );

      setTrendingThreads(threadsWithCounts as Thread[]);
    } catch (error: any) {
      console.error("Failed to load trending threads:", error);
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

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Elite Forums</h1>
            <p className="text-muted-foreground text-lg">
              Exclusive discussions for verified members
            </p>
          </div>
          {user && (
            <Button
              variant="premium"
              size="lg"
              onClick={() => navigate("/forums/new")}
            >
              <Plus className="w-5 h-5 mr-2" />
              New Thread
            </Button>
          )}
        </div>

        {/* Trending Section */}
        {trendingThreads.length > 0 && (
          <Card className="mb-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-primary" />
                Trending This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {trendingThreads.map((thread, index) => (
                  <div
                    key={thread.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background transition-colors cursor-pointer"
                    onClick={() => navigate(`/forums/thread/${thread.id}`)}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{thread.title}</div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {thread.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {thread.post_count}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search threads..."
              className="pl-12 h-12 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px]">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="viewed">Most Viewed</SelectItem>
                <SelectItem value="liked">Most Liked</SelectItem>
                <SelectItem value="active">Most Active</SelectItem>
              </SelectContent>
            </Select>

            {/* Date From */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Date To */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "MMM d, yyyy") : "To date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Clear Filters */}
            {(dateFrom || dateTo || sortBy !== "recent" || selectedTags.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateFrom(undefined);
                  setDateTo(undefined);
                  setSortBy("recent");
                  setSelectedTags([]);
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Tag Filter */}
          {tags.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Filter by tags:</Label>
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
                    onClick={() => {
                      setSelectedTags(prev =>
                        prev.includes(tag.id)
                          ? prev.filter(id => id !== tag.id)
                          : [...prev, tag.id]
                      );
                    }}
                  >
                    {tag.name}
                    {selectedTags.includes(tag.id) && (
                      <X className="w-3 h-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 gap-2 h-auto p-1">
            <TabsTrigger value="all" className="text-sm py-3">
              All Forums
            </TabsTrigger>
            {categories.slice(0, 4).map((category) => (
              <TabsTrigger key={category.id} value={category.slug} className="text-sm py-3">
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : threads.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No threads found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? "Try a different search query" : "Be the first to start a discussion"}
                  </p>
                  {user && (
                    <Button variant="premium" onClick={() => navigate("/forums/new")}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Thread
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {threads.map((thread) => (
                  <Card
                    key={thread.id}
                    className="hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => navigate(`/forums/thread/${thread.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <MessageSquare className="w-6 h-6 text-primary" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {thread.is_pinned && (
                                  <Badge variant="default" className="bg-primary/20 text-primary">
                                    Pinned
                                  </Badge>
                                )}
                                <Badge variant="secondary">
                                  {thread.category.name}
                                </Badge>
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
                              <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                                {thread.title}
                              </h3>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {thread.author.username}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              {thread.post_count} {thread.post_count === 1 ? "reply" : "replies"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {thread.views} views
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {getTimeAgo(thread.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default ForumThreads;
