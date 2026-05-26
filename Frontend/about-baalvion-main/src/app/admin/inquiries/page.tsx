
"use client"

import { useEffect, useState } from "react";
import { Inquiry } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, CheckCircle, Clock, Trash2, User, Send, ListTodo, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/inquiry').then(res => res.json()).then(data => {
      setInquiries(data);
      setLoading(false);
    });
  }, []);

  const getAdminHeaders = () => {
    const token = localStorage.getItem('admin_token');
    return {
      'Content-Type': 'application/json',
      'x-admin-key': token || ''
    };
  };

  const updateStatus = async (id: string, status: Inquiry['status']) => {
    try {
      const res = await fetch('/api/inquiry', {
        method: 'PATCH',
        headers: getAdminHeaders(),
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error('Unauthorized');
      setInquiries(inquiries.map(i => i.id === id ? { ...i, status } : i));
      toast({ title: "Nexus Updated", description: `Inquiry protocol set to ${status}.` });
    } catch (err) {
      toast({ title: "Error", description: "Authorization protocol failure.", variant: "destructive" });
    }
  };

  const deleteInquiry = async (id: string) => {
    if (!confirm('Dismantle this inquiry record? Permanent action.')) return;
    try {
      const res = await fetch(`/api/inquiry?id=${id}`, { 
        method: 'DELETE',
        headers: getAdminHeaders()
      });
      if (!res.ok) throw new Error('Unauthorized');
      setInquiries(inquiries.filter(i => i.id !== id));
      toast({ title: "Link Purged", description: "Record removed from strategic buffer." });
    } catch (err) {
      toast({ title: "Error", description: "Purge protocol denied.", variant: "destructive" });
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Loader2 className="animate-spin text-primary w-10 h-10" />
      <p className="text-gray-500 text-sm font-medium">Syncing Intelligence...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Strategic Intelligence Management</h2>
          <p className="text-sm text-gray-500">Review and orchestrate response protocols for inbound link inquiries.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {inquiries.length === 0 ? (
          <Card className="bg-white text-center p-32 border-dashed border-gray-200 shadow-sm">
            <Mail className="w-16 h-16 text-gray-200 mx-auto mb-6" />
            <h3 className="text-gray-900 font-bold">Clean Protocol</h3>
            <p className="text-xs text-gray-400 mt-2 max-w-xs mx-auto">No inquiries found in the strategic buffer. All connection links are currently nominal.</p>
          </Card>
        ) : inquiries.slice().reverse().map(inquiry => (
          <Card key={inquiry.id} className={cn(
            "bg-white overflow-hidden border-gray-200 transition-all shadow-sm",
            inquiry.status === 'New' ? "border-primary/20 shadow-lg shadow-primary/5" : "opacity-80"
          )}>
            <div className="flex flex-col md:flex-row">
              <div className="p-8 flex-1 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                      <User className="text-primary w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{inquiry.name}</h3>
                      <p className="text-xs text-primary font-mono">{inquiry.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={inquiry.status === 'New' ? 'default' : 'secondary'} className={cn(
                      "px-3 py-1 text-[9px] uppercase tracking-widest font-bold",
                      inquiry.status === 'New' ? "bg-primary text-white" : 
                      inquiry.status === 'In Progress' ? "bg-amber-500 text-white" :
                      inquiry.status === 'Resolved' ? "bg-emerald-500 text-white" :
                      "bg-gray-100 text-gray-500"
                    )}>
                      {inquiry.status}
                    </Badge>
                    <div className="flex items-center gap-2 text-[9px] text-gray-400 uppercase tracking-widest font-bold">
                      <Clock className="w-3 h-3" />
                      {new Date(inquiry.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 relative">
                  <p className="text-sm text-gray-700 leading-relaxed font-light italic">
                    "{inquiry.message}"
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 p-6 flex md:flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-gray-100 min-w-[220px]">
                {inquiry.status === 'New' && (
                  <Button size="sm" onClick={() => updateStatus(inquiry.id, 'In Progress')} className="w-full h-10 font-bold rounded-lg border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100">
                    <ListTodo className="w-4 h-4 mr-2" /> Start Protocol
                  </Button>
                )}
                {inquiry.status === 'In Progress' && (
                  <Button size="sm" onClick={() => updateStatus(inquiry.id, 'Resolved')} className="w-full h-10 font-bold rounded-lg border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Resolve Link
                  </Button>
                )}
                {inquiry.status !== 'Archived' && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(inquiry.id, 'Archived')} className="w-full h-10 border-gray-200 hover:bg-white font-bold rounded-lg text-gray-700">
                    Archive Link
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => deleteInquiry(inquiry.id)} className="w-full h-10 text-red-500 hover:bg-red-50 font-bold rounded-lg">
                  <Trash2 className="w-4 h-4 mr-2" /> Purge
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
