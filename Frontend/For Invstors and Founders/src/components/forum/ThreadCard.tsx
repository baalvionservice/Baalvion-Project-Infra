import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowUp, ArrowDown, MessageSquare, Eye, Bookmark,
  BookmarkCheck, Share2, MoreVertical, Pin
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ThreadCardProps {
  thread: {
    id: string;
    title: string;
    author: string;
    category: string;
    views: number;
    comments: number;
    upvotes: number;
    downvotes: number;
    isPinned?: boolean;
    hasPolls?: boolean;
    hasMedia?: boolean;
    createdAt: string;
    tags?: Array<{ id: string; name: string; color: string }>;
  };
  userVote?: 'upvote' | 'downvote' | null;
  isBookmarked?: boolean;
}

export default function ThreadCard({ thread, userVote, isBookmarked: initialBookmarked }: ThreadCardProps) {
  const [vote, setVote] = useState<'upvote' | 'downvote' | null>(userVote ?? null);
  const [upvotes, setUpvotes] = useState(thread.upvotes);
  const [downvotes, setDownvotes] = useState(thread.downvotes);
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked ?? false);
  const { toast } = useToast();

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to vote",
        variant: "destructive",
      });
      return;
    }

    // TODO: Implement voting after running database migration
    toast({
      title: "Feature coming soon",
      description: "Voting will be available after database setup",
    });
  };

  const handleBookmark = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to bookmark",
        variant: "destructive",
      });
      return;
    }

    // TODO: Implement bookmarks after running database migration
    toast({
      title: "Feature coming soon",
      description: "Bookmarks will be available after database setup",
    });
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/forums/thread/${thread.id}`;
    if (navigator.share) {
      await navigator.share({
        title: thread.title,
        url: url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Thread link copied to clipboard",
        duration: 2000,
      });
    }
  };

  return (
    <Card className="bg-gradient-to-br from-card to-card/80 border-border hover:shadow-[var(--shadow-elevated)] transition-all duration-300 group">
      <CardHeader>
        <div className="flex items-start gap-4">
          {/* Vote Buttons */}
          <div className="flex flex-col items-center gap-1 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 ${vote === 'upvote' ? 'text-primary' : ''}`}
              onClick={() => handleVote('upvote')}
            >
              <ArrowUp className="w-5 h-5" />
            </Button>
            <span className="text-lg font-bold text-primary">
              {upvotes - downvotes}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 ${vote === 'downvote' ? 'text-destructive' : ''}`}
              onClick={() => handleVote('downvote')}
            >
              <ArrowDown className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {thread.isPinned && (
                    <Pin className="w-4 h-4 text-primary" />
                  )}
                  <Badge variant="secondary">{thread.category}</Badge>
                  {thread.hasPolls && (
                    <Badge variant="outline" className="text-primary border-primary">
                      Poll
                    </Badge>
                  )}
                  {thread.hasMedia && (
                    <Badge variant="outline">Media</Badge>
                  )}
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
                <Link to={`/forums/thread/${thread.id}`}>
                  <CardTitle className="text-xl hover:text-primary transition-colors cursor-pointer group-hover:text-primary">
                    {thread.title}
                  </CardTitle>
                </Link>
                <CardDescription className="text-muted-foreground mt-2">
                  by {thread.author} • {new Date(thread.createdAt).toLocaleDateString()}
                </CardDescription>
              </div>

              {/* Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Thread actions">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleBookmark}>
                    {isBookmarked ? (
                      <>
                        <BookmarkCheck className="w-4 h-4 mr-2" />
                        Remove Bookmark
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4 mr-2" />
                        Bookmark
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{thread.views.toLocaleString()} views</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            <span>{thread.comments} comments</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
