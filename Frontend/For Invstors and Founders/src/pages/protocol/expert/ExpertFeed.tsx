/**
 * Expert Feed Page - WhatsApp-style content feed
 * TODO: Implement real-time post updates via WebSocket
 * TODO: Add file upload for audio/video content
 * TODO: Connect to analytics API for engagement data
 */
import { useState, useEffect } from "react";
import { Plus, Pin, BarChart3, MessageSquare, Headphones, Video, Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ProtocolLayout from "@/components/protocol/ProtocolLayout";
import { protocolApi } from "@/lib/protocol-api";
import { toast } from "sonner";

const ExpertFeed = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const loadPosts = () => protocolApi.feed.list().then(setPosts);
  useEffect(() => { loadPosts(); }, []);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [newPostContent, setNewPostContent] = useState("");
  const [postType, setPostType] = useState<"text" | "audio" | "video">("text");

  const handleCreatePost = async () => {
    const { error } = await protocolApi.feed.create({
      type: postType,
      content: newPostContent || (postType === "audio" ? "New audio message" : "New video content"),
      duration: postType !== "text" ? "0:00" : undefined,
      author_name: "Expert",
      avatar: "EX",
    });
    if (error) { toast.error(error.message || "Could not create post"); return; }
    await loadPosts();
    setNewPostContent("");
    setShowCreateModal(false);
    toast.success("Post created successfully");
  };

  const handlePinPost = async (postId: string, isPinned: boolean) => {
    await protocolApi.feed.setPinned(postId, !isPinned);
    await loadPosts();
    toast.success("Post pin status updated");
  };

  const getPostIcon = (type: string) => {
    switch (type) {
      case "audio": return <Headphones className="w-5 h-5 text-indigo-400" />;
      case "video": return <Video className="w-5 h-5 text-green-400" />;
      default: return <MessageSquare className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <ProtocolLayout
      role="expert"
      breadcrumbs={[
        { label: "Expert Dashboard", href: "/protocol/expert" },
        { label: "Private Feed", href: "/protocol/expert/feed" }
      ]}
    >
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-light tracking-wide text-white mb-2">Private Feed</h1>
            <p className="text-white/50">Share content with your community</p>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Post
          </Button>
        </div>

        {/* Feed Posts */}
        <div className="space-y-4">
          {posts.map((post) => (
            <Card 
              key={post.id} 
              className={`bg-white/5 border-amber-500/10 hover:border-amber-500/20 transition-all ${post.isPinned ? 'ring-1 ring-amber-500/30' : ''}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-medium">
                      EX
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{post.author}</p>
                        {post.isPinned && (
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">Pinned</span>
                        )}
                      </div>
                      <p className="text-white/50 text-sm">{post.time}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-white/50 hover:text-white hover:bg-white/10">
                        <MoreHorizontal className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#1a1a2e] border-amber-500/20">
                      <DropdownMenuItem 
                        onClick={() => handlePinPost(post.id, post.isPinned)}
                        className="text-white hover:bg-amber-500/10"
                      >
                        <Pin className="w-4 h-4 mr-2" />
                        {post.isPinned ? "Unpin" : "Pin"} Post
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedPost(post);
                          setShowAnalyticsModal(true);
                        }}
                        className="text-white hover:bg-amber-500/10"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Analytics
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                          <p className="text-white/70">{post.thumbnail}</p>
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
                </div>

                {/* Post Actions */}
                <div className="flex items-center gap-6 pt-4 border-t border-amber-500/10">
                  <button className="flex items-center gap-2 text-white/50 hover:text-red-400 transition-colors">
                    <Heart className="w-5 h-5" />
                    <span>{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-2 text-white/50 hover:text-amber-400 transition-colors">
                    <MessageCircle className="w-5 h-5" />
                    <span>{post.comments}</span>
                  </button>
                  <button className="flex items-center gap-2 text-white/50 hover:text-amber-400 transition-colors">
                    <Share2 className="w-5 h-5" />
                    <span>Share</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Create Post Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-[#0a0a0f] border-amber-500/20 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              {[
                { type: "text" as const, icon: MessageSquare, label: "Text" },
                { type: "audio" as const, icon: Headphones, label: "Audio" },
                { type: "video" as const, icon: Video, label: "Video" },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => setPostType(item.type)}
                  className={`flex-1 p-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                    postType === item.type 
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-400" 
                      : "bg-white/5 border-amber-500/10 text-white/50 hover:border-amber-500/30"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
            </div>
            {postType === "text" ? (
              <Textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What's on your mind?"
                className="bg-white/5 border-amber-500/20 text-white min-h-32"
              />
            ) : (
              <div className="border-2 border-dashed border-amber-500/20 rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  {postType === "audio" ? (
                    <Headphones className="w-8 h-8 text-amber-500" />
                  ) : (
                    <Video className="w-8 h-8 text-amber-500" />
                  )}
                </div>
                <p className="text-white/50 mb-2">Upload {postType} file</p>
                <Button variant="outline" className="border-amber-500/20 text-amber-400 hover:bg-amber-500/10">
                  Choose File
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)} className="border-amber-500/20 text-white hover:bg-white/5">
              Cancel
            </Button>
            <Button onClick={handleCreatePost} className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30">
              Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Analytics Modal */}
      <Dialog open={showAnalyticsModal} onOpenChange={setShowAnalyticsModal}>
        <DialogContent className="bg-[#0a0a0f] border-amber-500/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-500" />
              Post Analytics
            </DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/50 text-sm">Total Likes</p>
                  <p className="text-2xl font-semibold text-white">{selectedPost.likes}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/50 text-sm">Comments</p>
                  <p className="text-2xl font-semibold text-white">{selectedPost.comments}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/50 text-sm">Reach</p>
                  <p className="text-2xl font-semibold text-white">1,284</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/50 text-sm">Engagement Rate</p>
                  <p className="text-2xl font-semibold text-amber-400">18.2%</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAnalyticsModal(false)} className="border-amber-500/20 text-white hover:bg-white/5">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtocolLayout>
  );
};

export default ExpertFeed;
