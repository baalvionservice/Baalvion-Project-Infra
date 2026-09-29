"use client";

import React, { useState } from "react";
import AdminShell from "@/components/admin/console/AdminShell";
import { adminApi } from "@/lib/api/admin";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Megaphone } from "lucide-react";

export default function BroadcastPage() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<"all" | "lawyers" | "clients">("all");
  const [type, setType] = useState("announcement");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!title.trim() || !message.trim()) {
      toast({ title: "Title and message are required", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await adminApi.broadcast({ title: title.trim(), message: message.trim(), audience, type });
      toast({ title: "Broadcast sent", description: `Delivered to ${res?.sent ?? 0} recipient(s) (${audience}).` });
      setTitle(""); setMessage("");
    } catch (e: any) {
      toast({ title: "Broadcast failed", description: e?.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminShell title="Broadcast">
      <Card className="p-6 max-w-2xl space-y-5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Megaphone className="w-5 h-5" />
          <p className="text-sm">Send a notification to every user in an audience. Recipients see it in their notification center.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Scheduled maintenance" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="message">Message</Label>
          <Textarea id="message" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What do you want to tell them?" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Audience</Label>
            <Select value={audience} onValueChange={(v) => setAudience(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everyone</SelectItem>
                <SelectItem value="lawyers">Lawyers only</SelectItem>
                <SelectItem value="clients">Clients only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="announcement">Announcement</SelectItem>
                <SelectItem value="verification_update">Verification update</SelectItem>
                <SelectItem value="new_message">Message</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={send} disabled={sending}>{sending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Megaphone className="w-4 h-4 mr-1" />}Send broadcast</Button>
        </div>
      </Card>
    </AdminShell>
  );
}
