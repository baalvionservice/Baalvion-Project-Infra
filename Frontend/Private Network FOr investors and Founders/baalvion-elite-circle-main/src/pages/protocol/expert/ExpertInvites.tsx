import { useState } from "react";
import { Link2, Copy, Clock, Users, DollarSign, Plus, Trash2, ExternalLink, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProtocolLayout from "@/components/protocol/ProtocolLayout";
import { toast } from "sonner";

const mockInvites = [
  { 
    id: 1, 
    code: "ELITE2024", 
    link: "protocol.io/join/ELITE2024", 
    expiry: "7 days", 
    maxUsers: 50, 
    usedBy: 23, 
    price: "Free",
    status: "active"
  },
  { 
    id: 2, 
    code: "PREMIUM99", 
    link: "protocol.io/join/PREMIUM99", 
    expiry: "30 days", 
    maxUsers: 100, 
    usedBy: 67, 
    price: "$99",
    status: "active"
  },
  { 
    id: 3, 
    code: "VIP500", 
    link: "protocol.io/join/VIP500", 
    expiry: "Unlimited", 
    maxUsers: 10, 
    usedBy: 8, 
    price: "$500",
    status: "active"
  },
  { 
    id: 4, 
    code: "FLASH24H", 
    link: "protocol.io/join/FLASH24H", 
    expiry: "Expired", 
    maxUsers: 25, 
    usedBy: 25, 
    price: "$49",
    status: "expired"
  },
];

const ExpertInvites = () => {
  const [invites, setInvites] = useState(mockInvites);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [newInvite, setNewInvite] = useState({
    expiry: "",
    maxUsers: "",
    price: ""
  });

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleGenerate = () => {
    const code = generateCode();
    const newInviteData = {
      id: invites.length + 1,
      code,
      link: `protocol.io/join/${code}`,
      expiry: newInvite.expiry || "7 days",
      maxUsers: parseInt(newInvite.maxUsers) || 50,
      usedBy: 0,
      price: newInvite.price ? `$${newInvite.price}` : "Free",
      status: "active"
    };
    setInvites([newInviteData, ...invites]);
    setShowGenerateModal(false);
    setNewInvite({ expiry: "", maxUsers: "", price: "" });
    toast.success("Invite link generated successfully");
  };

  const handleCopy = (invite: typeof mockInvites[0]) => {
    navigator.clipboard.writeText(`https://${invite.link}`);
    setCopiedId(invite.id);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: number) => {
    setInvites(invites.filter(i => i.id !== id));
    toast.success("Invite link deleted");
  };

  return (
    <ProtocolLayout
      role="expert"
      breadcrumbs={[
        { label: "Expert Dashboard", href: "/protocol/expert" },
        { label: "Invite Links", href: "/protocol/expert/invites" }
      ]}
    >
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-light tracking-wide text-white mb-2">Invite Links</h1>
            <p className="text-white/50">Generate and manage exclusive invite links</p>
          </div>
          <Button 
            onClick={() => setShowGenerateModal(true)}
            className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
          >
            <Plus className="w-4 h-4 mr-2" />
            Generate Invite Link
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/5 border-amber-500/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Link2 className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-white/50 text-sm">Total Links</p>
                  <p className="text-xl font-semibold text-white">{invites.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-amber-500/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-white/50 text-sm">Total Signups</p>
                  <p className="text-xl font-semibold text-white">{invites.reduce((acc, i) => acc + i.usedBy, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-amber-500/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-white/50 text-sm">Active Links</p>
                  <p className="text-xl font-semibold text-white">{invites.filter(i => i.status === "active").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-amber-500/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-white/50 text-sm">Revenue</p>
                  <p className="text-xl font-semibold text-amber-400">$8,450</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invite Links */}
        <div className="space-y-4">
          {invites.map((invite) => (
            <Card 
              key={invite.id} 
              className={`bg-white/5 border-amber-500/10 ${invite.status === 'expired' ? 'opacity-60' : ''}`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${invite.status === 'active' ? 'bg-amber-500/10' : 'bg-gray-500/10'}`}>
                      <Link2 className={`w-6 h-6 ${invite.status === 'active' ? 'text-amber-500' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-mono text-white">{invite.code}</span>
                        {invite.status === 'expired' && (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">Expired</span>
                        )}
                      </div>
                      <p className="text-white/50 text-sm">{invite.link}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-white/50 text-xs">Expiry</p>
                      <p className="text-white font-medium">{invite.expiry}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white/50 text-xs">Users</p>
                      <p className="text-white font-medium">{invite.usedBy}/{invite.maxUsers}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white/50 text-xs">Price</p>
                      <p className={`font-medium ${invite.price === 'Free' ? 'text-green-400' : 'text-amber-400'}`}>
                        {invite.price}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(invite)}
                        className="border-amber-500/20 text-amber-400 hover:bg-amber-500/10"
                      >
                        {copiedId === invite.id ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-amber-500/20 text-white hover:bg-white/10"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(invite.id)}
                        className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-4">
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${(invite.usedBy / invite.maxUsers) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Generate Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="bg-[#0a0a0f] border-amber-500/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-amber-500" />
              Generate Invite Link
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-white/70">Expiry Duration</Label>
              <Select value={newInvite.expiry} onValueChange={(v) => setNewInvite({...newInvite, expiry: v})}>
                <SelectTrigger className="bg-white/5 border-amber-500/20 text-white mt-1">
                  <SelectValue placeholder="Select expiry" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-amber-500/20">
                  <SelectItem value="24 hours">24 hours</SelectItem>
                  <SelectItem value="7 days">7 days</SelectItem>
                  <SelectItem value="30 days">30 days</SelectItem>
                  <SelectItem value="Unlimited">Unlimited</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/70">Maximum Users</Label>
              <Input
                type="number"
                value={newInvite.maxUsers}
                onChange={(e) => setNewInvite({...newInvite, maxUsers: e.target.value})}
                placeholder="e.g., 50"
                className="bg-white/5 border-amber-500/20 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-white/70">Price ($ - leave empty for free)</Label>
              <Input
                type="number"
                value={newInvite.price}
                onChange={(e) => setNewInvite({...newInvite, price: e.target.value})}
                placeholder="0.00"
                className="bg-white/5 border-amber-500/20 text-white mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateModal(false)} className="border-amber-500/20 text-white hover:bg-white/5">
              Cancel
            </Button>
            <Button onClick={handleGenerate} className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30">
              Generate Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtocolLayout>
  );
};

export default ExpertInvites;
