import { useState } from "react";
import { Heart, MessageCircle, Share2, Headphones, Video, Lock, Pin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProtocolLayout from "@/components/protocol/ProtocolLayout";
import { toast } from "sonner";

const mockPosts = [
  {
    id: 1,
    type: "text",
    content: "Just finished a deep dive into advanced market analysis techniques. The key insight? Patience and pattern recognition are your best friends. Stay tuned for the full breakdown in tomorrow's premium session.",
    author: "Master Trader",
    avatar: "MT",
    time: "2 hours ago",
    likes: 234,
    comments: 45,
    isPinned: true,
    isLiked: false
  },
  {
    id: 2,
    type: "audio",
    content: "New audio message available",
    duration: "5:32",
    author: "Master Trader",
    avatar: "MT",
    time: "5 hours ago",
    likes: 189,
    comments: 23,
    isPinned: false,
    isLiked: true
  },
  {
    id: 3,
    type: "video",
    content: "Weekly market recap and predictions for the coming week",
    duration: "12:45",
    author: "Master Trader",
    avatar: "MT",
    time: "1 day ago",
    likes: 567,
    comments: 89,
    isPinned: false,
    isLiked: false
  },
  {
    id: 4,
    type: "text",
    content: "Quick tip: Always have a clear exit strategy before entering any position. The markets reward preparation and punish impulsiveness. 📈",
    author: "Master Trader",
    avatar: "MT",
    time: "2 days ago",
    likes: 412,
    comments: 67,
    isPinned: false,
    isLiked: true
  },
  {
    id: 5,
    type: "locked",
    content: "Premium Strategy: The 3-Step System for Consistent Gains",
    author: "Master Trader",
    avatar: "MT",
    time: "3 days ago",
    likes: 0,
    comments: 0,
    isPinned: false,
    isLiked: false,
    price: "$49.99"
  },
];

const StudentFeed = () => {
  const [posts, setPosts] = useState(mockPosts);

  const handleLike = (postId: number) => {
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          isLiked: !p.isLiked,
          likes: p.isLiked ? p.likes - 1 : p.likes + 1
        };
      }
      return p;
    }));
  };

  const handleShare = () => {
    toast.success("Link copied to clipboard");
  };

  return (
    <ProtocolLayout
      role="student"
      breadcrumbs={[
        { label: "Student Dashboard", href: "/protocol/student" },
        { label: "Feed", href: "/protocol/student/feed" }
      ]}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-light tracking-wide text-white mb-2">Private Feed</h1>
          <p className="text-white/50">Exclusive content from your expert</p>
        </div>

        {/* Feed Posts */}
        <div className="space-y-4">
          {posts.map((post) => (
            <Card 
              key={post.id} 
              className={`bg-white/5 border-amber-500/10 ${post.isPinned ? 'ring-1 ring-amber-500/30' : ''} ${post.type === 'locked' ? 'opacity-90' : ''}`}
            >
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-medium">
                      {post.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{post.author}</p>
                        {post.isPinned && (
                          <Pin className="w-3 h-3 text-amber-400" />
                        )}
                      </div>
                      <p className="text-white/50 text-sm">{post.time}</p>
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <div className="mb-4">
                  {post.type === "text" && (
                    <p className="text-white/80 leading-relaxed">{post.content}</p>
                  )}
                  {post.type === "audio" && (
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center">
                        <Headphones className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white">{post.content}</p>
                        <p className="text-white/50 text-sm">Duration: {post.duration}</p>
                      </div>
                      <Button variant="outline" size="sm" className="border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10">
                        Play
                      </Button>
                    </div>
                  )}
                  {post.type === "video" && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg overflow-hidden">
                      <div className="aspect-video bg-black/30 flex items-center justify-center">
                        <div className="text-center">
                          <Video className="w-12 h-12 text-green-400 mx-auto mb-2" />
                          <p className="text-white/70">Video Content</p>
                        </div>
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-white">{post.content}</p>
                          <p className="text-white/50 text-sm">Duration: {post.duration}</p>
                        </div>
                        <Button variant="outline" size="sm" className="border-green-500/20 text-green-400 hover:bg-green-500/10">
                          Watch
                        </Button>
                      </div>
                    </div>
                  )}
                  {post.type === "locked" && (
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-6 text-center">
                      <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-amber-500" />
                      </div>
                      <p className="text-white font-medium mb-2">{post.content}</p>
                      <p className="text-white/50 text-sm mb-4">This content requires purchase</p>
                      <Button className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30">
                        Unlock for {post.price}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Post Actions */}
                {post.type !== "locked" && (
                  <div className="flex items-center gap-6 pt-4 border-t border-amber-500/10">
                    <button 
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-2 transition-colors ${post.isLiked ? 'text-red-400' : 'text-white/50 hover:text-red-400'}`}
                    >
                      <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                      <span>{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-2 text-white/50 hover:text-amber-400 transition-colors">
                      <MessageCircle className="w-5 h-5" />
                      <span>{post.comments}</span>
                    </button>
                    <button 
                      onClick={handleShare}
                      className="flex items-center gap-2 text-white/50 hover:text-amber-400 transition-colors"
                    >
                      <Share2 className="w-5 h-5" />
                      <span>Share</span>
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ProtocolLayout>
  );
};

export default StudentFeed;
