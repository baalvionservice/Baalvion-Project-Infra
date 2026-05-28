import { useState } from "react";
import { MessageSquare, FileText, Sparkles, Bot, DollarSign, Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ProtocolLayout from "@/components/protocol/ProtocolLayout";
import { toast } from "sonner";

const contentTypes = [
  {
    id: "message",
    title: "Paid Message",
    description: "Send exclusive paid messages to your students",
    icon: MessageSquare,
    color: "amber",
    items: 12,
    revenue: "$2,450"
  },
  {
    id: "document",
    title: "Paid Document",
    description: "Share premium documents and guides",
    icon: FileText,
    color: "blue",
    items: 8,
    revenue: "$4,200"
  },
  {
    id: "prompt",
    title: "Paid Prompt",
    description: "Sell custom prompts and templates",
    icon: Sparkles,
    color: "purple",
    items: 24,
    revenue: "$1,890"
  },
  {
    id: "ai",
    title: "AI Generated",
    description: "Create AI-powered content for your students",
    icon: Bot,
    color: "green",
    items: 15,
    revenue: "$3,100"
  },
];

const mockContent = [
  { id: 1, type: "message", title: "Weekly Insider Tips", price: 9.99, sales: 145, status: "active" },
  { id: 2, type: "document", title: "Complete Trading Guide", price: 49.99, sales: 89, status: "active" },
  { id: 3, type: "prompt", title: "Market Analysis Template", price: 14.99, sales: 234, status: "active" },
  { id: 4, type: "ai", title: "AI Trading Assistant", price: 29.99, sales: 67, status: "active" },
];

const ExpertContent = () => {
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedType, setSelectedType] = useState<typeof contentTypes[0] | null>(null);
  const [newContent, setNewContent] = useState({
    title: "",
    description: "",
    price: ""
  });

  const handleCreateContent = () => {
    toast.success(`${selectedType?.title} created successfully`);
    setShowCreateModal(false);
    setNewContent({ title: "", description: "", price: "" });
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      amber: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400" },
      blue: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" },
      purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400" },
      green: { bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400" },
    };
    return colors[color] || colors.amber;
  };

  return (
    <ProtocolLayout
      role="expert"
      breadcrumbs={[
        { label: "Expert Dashboard", href: "/protocol/expert" },
        { label: "Paid Content", href: "/protocol/expert/content" }
      ]}
    >
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-light tracking-wide text-white mb-2">Paid Content</h1>
          <p className="text-white/50">Create and manage your premium content offerings</p>
        </div>

        {/* Content Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {contentTypes.map((type) => {
            const colors = getColorClasses(type.color);
            return (
              <Card 
                key={type.id}
                className={`${colors.bg} ${colors.border} border hover:scale-105 transition-all duration-300 cursor-pointer group`}
                onClick={() => {
                  setSelectedType(type);
                  setShowPricingModal(true);
                }}
              >
                <CardContent className="p-6">
                  <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center mb-4`}>
                    <type.icon className={`w-6 h-6 ${colors.text}`} />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">{type.title}</h3>
                  <p className="text-white/50 text-sm mb-4">{type.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <span className="text-white/50 text-sm">{type.items} items</span>
                    <span className={`font-semibold ${colors.text}`}>{type.revenue}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Content Table */}
        <Card className="bg-white/5 border-amber-500/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">All Content</CardTitle>
            <Button 
              onClick={() => {
                setSelectedType(contentTypes[0]);
                setShowCreateModal(true);
              }}
              className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Content
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-amber-500/10">
                    <th className="text-left p-4 text-white/50 font-medium">Content</th>
                    <th className="text-left p-4 text-white/50 font-medium">Type</th>
                    <th className="text-left p-4 text-white/50 font-medium">Price</th>
                    <th className="text-left p-4 text-white/50 font-medium">Sales</th>
                    <th className="text-left p-4 text-white/50 font-medium">Status</th>
                    <th className="text-right p-4 text-white/50 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockContent.map((content) => {
                    const type = contentTypes.find(t => t.id === content.type);
                    const colors = type ? getColorClasses(type.color) : getColorClasses("amber");
                    return (
                      <tr key={content.id} className="border-b border-amber-500/5 hover:bg-white/5">
                        <td className="p-4">
                          <p className="text-white font-medium">{content.title}</p>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 ${colors.bg} ${colors.text} text-xs rounded`}>
                            {type?.title}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-amber-400 font-medium">${content.price}</span>
                        </td>
                        <td className="p-4 text-white/70">{content.sales} sales</td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                            Active
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" className="text-amber-400 hover:bg-amber-500/10">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-500/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Modal */}
      <Dialog open={showPricingModal} onOpenChange={setShowPricingModal}>
        <DialogContent className="bg-[#0a0a0f] border-amber-500/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedType && <selectedType.icon className={`w-5 h-5 ${getColorClasses(selectedType.color).text}`} />}
              {selectedType?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-white/70">{selectedType?.description}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white/50 text-sm">Total Items</p>
                <p className="text-2xl font-semibold text-white">{selectedType?.items}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white/50 text-sm">Revenue</p>
                <p className="text-2xl font-semibold text-amber-400">{selectedType?.revenue}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-amber-500/10">
              <h4 className="text-white font-medium mb-3">Pricing Tiers</h4>
              <div className="space-y-2">
                {["$9.99 - Basic", "$24.99 - Standard", "$49.99 - Premium"].map((tier) => (
                  <div key={tier} className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                    <span className="text-white/70">{tier}</span>
                    <DollarSign className="w-4 h-4 text-amber-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPricingModal(false)} className="border-amber-500/20 text-white hover:bg-white/5">
              Close
            </Button>
            <Button 
              onClick={() => {
                setShowPricingModal(false);
                setShowCreateModal(true);
              }}
              className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Content Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-[#0a0a0f] border-amber-500/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Create {selectedType?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-white/70">Title</Label>
              <Input
                value={newContent.title}
                onChange={(e) => setNewContent({...newContent, title: e.target.value})}
                placeholder="Enter content title"
                className="bg-white/5 border-amber-500/20 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-white/70">Description</Label>
              <Textarea
                value={newContent.description}
                onChange={(e) => setNewContent({...newContent, description: e.target.value})}
                placeholder="Describe your content"
                className="bg-white/5 border-amber-500/20 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-white/70">Price ($)</Label>
              <Input
                type="number"
                value={newContent.price}
                onChange={(e) => setNewContent({...newContent, price: e.target.value})}
                placeholder="0.00"
                className="bg-white/5 border-amber-500/20 text-white mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)} className="border-amber-500/20 text-white hover:bg-white/5">
              Cancel
            </Button>
            <Button onClick={handleCreateContent} className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30">
              Create Content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtocolLayout>
  );
};

export default ExpertContent;
