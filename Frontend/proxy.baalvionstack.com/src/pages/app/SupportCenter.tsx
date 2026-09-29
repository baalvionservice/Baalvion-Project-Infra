import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HeadphonesIcon, Plus, MessageSquare, Clock, CheckCircle, AlertCircle, Send } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { toast } from "sonner";
import { useSupportTickets, useCreateSupportTicket } from "@/hooks/usePlatform";

export default function SupportCenter() {
  const [tab, setTab] = useState("tickets");
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [newSubject, setNewSubject] = useState("");
  const [newCategory, setNewCategory] = useState("Technical");
  const [newDescription, setNewDescription] = useState("");

  const { data: ticketsRaw = [] } = useSupportTickets({ pageSize: 100 });
  const createTicket = useCreateSupportTicket();

  const tickets = ticketsRaw.map(t => ({
    id: t.id,
    subject: t.subject ?? "(no subject)",
    category: "Technical",
    priority: t.priority === "high" ? "High" : t.priority === "low" ? "Low" : "Medium",
    status: t.status ?? "open",
    created: new Date(t.createdAt).toLocaleDateString(),
    updated: new Date(t.updatedAt).toLocaleDateString(),
  }));

  const openCount = tickets.filter(t => t.status === "open" || t.status === "pending").length;
  const resolvedCount = tickets.filter(t => t.status === "resolved").length;

  const statusColor = (s: string) => s === "open" ? "destructive" : s === "in_progress" ? "warning" : "success";

  if (selectedTicket) {
    const ticket = tickets.find(t => t.id === selectedTicket);
    if (!ticket) return null;;
    return (
      <div className="space-y-6">
        <SEOHead title={`Ticket ${ticket.id}`} description="Support ticket detail." />
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>← Back</Button>
          <h1 className="text-xl font-bold">{ticket.id}: {ticket.subject}</h1>
          <Badge variant={statusColor(ticket.status)}>{ticket.status.replace("_", " ")}</Badge>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="p-4 rounded-lg bg-secondary/30 border border-border/50 mr-4">
              <div className="flex justify-between mb-2">
                <span className="font-medium text-sm">You</span>
                <span className="text-xs text-muted-foreground">{ticket?.created}</span>
              </div>
              <p className="text-sm text-muted-foreground">{ticket?.subject}</p>
            </div>
            <div className="flex gap-2 pt-4 border-t border-border">
              <Input placeholder="Type a reply..." className="bg-secondary/50" />
              <Button><Send className="w-4 h-4 mr-1" />Send</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SEOHead title="Support Center" description="Get help and manage support tickets." />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><HeadphonesIcon className="w-6 h-6 text-primary" />Support Center</h1>
          <p className="text-muted-foreground">Get help from our team.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-5 flex items-center gap-4"><AlertCircle className="w-8 h-8 text-destructive" /><div><p className="text-2xl font-bold">{openCount}</p><p className="text-sm text-muted-foreground">Open Tickets</p></div></CardContent></Card>
        <Card><CardContent className="p-5 flex items-center gap-4"><CheckCircle className="w-8 h-8 text-accent" /><div><p className="text-2xl font-bold">{resolvedCount}</p><p className="text-sm text-muted-foreground">Resolved</p></div></CardContent></Card>
        <Card><CardContent className="p-5 flex items-center gap-4"><Clock className="w-8 h-8 text-warning" /><div><p className="text-2xl font-bold">2.4h</p><p className="text-sm text-muted-foreground">Avg Response</p></div></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList><TabsTrigger value="tickets">Tickets</TabsTrigger><TabsTrigger value="new">New Ticket</TabsTrigger></TabsList>

        <TabsContent value="tickets">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead><TableHead>Subject</TableHead><TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map(t => (
                    <TableRow key={t.id} className="cursor-pointer hover:bg-secondary/30" onClick={() => setSelectedTicket(t.id)}>
                      <TableCell className="font-mono text-sm">{t.id}</TableCell>
                      <TableCell className="font-medium">{t.subject}</TableCell>
                      <TableCell><Badge variant="outline">{t.category}</Badge></TableCell>
                      <TableCell><Badge variant={t.priority === "High" ? "destructive" : t.priority === "Medium" ? "warning" : "secondary"}>{t.priority}</Badge></TableCell>
                      <TableCell><Badge variant={statusColor(t.status)}>{t.status.replace("_", " ")}</Badge></TableCell>
                      <TableCell className="text-muted-foreground text-sm">{t.updated}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Plus className="w-5 h-5 text-primary" />New Support Ticket</CardTitle></CardHeader>
            <CardContent className="space-y-4 max-w-2xl">
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input placeholder="Brief description of the issue" value={newSubject} onChange={e => setNewSubject(e.target.value)} className="bg-secondary/50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Billing">Billing</SelectItem>
                    <SelectItem value="Account">Account</SelectItem>
                    <SelectItem value="Feature Request">Feature Request</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea placeholder="Describe your issue in detail..." value={newDescription} onChange={e => setNewDescription(e.target.value)} className="bg-secondary/50 min-h-[120px]" />
              </div>
              <Button onClick={() => { if (!newSubject.trim()) return; createTicket.mutate({ subject: newSubject, message: newDescription, priority: "medium" }, { onSuccess: () => { setTab("tickets"); setNewSubject(""); setNewDescription(""); } }); }} disabled={createTicket.isPending}>
                <Send className="w-4 h-4 mr-2" />Submit Ticket
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
