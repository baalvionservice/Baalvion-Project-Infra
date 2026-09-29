import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Search, 
  Filter, 
  MessageSquare,
  Clock,
  AlertTriangle,
  CheckCircle,
  MoreVertical,
  Eye,
  Reply,
  XCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAdminTickets } from "@/hooks/useAdmin";

interface Ticket { id: string; subject: string; user: string; status: string; priority: string; createdAt: string; lastUpdate: string; }

export default function AdminTickets() {
  const { data: ticketsPage } = useAdminTickets({ pageSize: 100 });

  const adminTickets: Ticket[] = (ticketsPage?.data ?? []).map((t) => ({
    id: t.id,
    subject: t.subject ?? "(no subject)",
    user: t.userEmail ?? t.id,
    status: t.status ?? "open",
    priority: t.priority ?? "medium",
    createdAt: new Date(t.createdAt).toLocaleDateString(),
    lastUpdate: new Date(t.updatedAt).toLocaleDateString(),
  }));

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState("");
  const { toast } = useToast();

  const filteredTickets = adminTickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent": return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case "high": return <AlertTriangle className="w-4 h-4 text-warning" />;
      default: return <MessageSquare className="w-4 h-4 text-primary" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open": return <Badge variant="warning">Open</Badge>;
      case "in_progress": return <Badge variant="info">In Progress</Badge>;
      case "resolved": return <Badge variant="success">Resolved</Badge>;
      default: return <Badge variant="muted">{status}</Badge>;
    }
  };

  const handleAction = (action: string, ticketId: string) => {
    toast({
      title: `Ticket ${action}`,
      description: `Ticket ${ticketId} has been ${action.toLowerCase()}`,
    });
    setSelectedTicket(null);
  };

  const handleReply = () => {
    if (!replyText.trim()) return;
    toast({
      title: "Reply Sent",
      description: `Response sent to ticket ${selectedTicket?.id}`,
    });
    setReplyText("");
    setSelectedTicket(null);
  };

  const openCount = adminTickets.filter(t => t.status === "open").length;
  const inProgressCount = adminTickets.filter(t => t.status === "in_progress").length;
  const urgentCount = adminTickets.filter(t => t.priority === "urgent").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <p className="text-muted-foreground">Manage customer support requests and issues.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="stats">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{openCount}</p>
                <p className="text-sm text-muted-foreground">Open</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="stats">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressCount}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="stats">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{urgentCount}</p>
                <p className="text-sm text-muted-foreground">Urgent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="stats">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{adminTickets.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card variant="default">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-border/50"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] bg-secondary/50 border-border/50">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px] bg-secondary/50 border-border/50">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card variant="default">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Ticket</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Update</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket) => (
                <TableRow key={ticket.id} className="border-border/50">
                  <TableCell>
                    <div>
                      <p className="font-medium">{ticket.id}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{ticket.subject}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{ticket.user}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(ticket.priority)}
                      <span className="capitalize">{ticket.priority}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{ticket.createdAt}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{ticket.lastUpdate}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedTicket(ticket)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View & Reply
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleAction("marked as in progress", ticket.id)}>
                          <Clock className="w-4 h-4 mr-2" />
                          Mark In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleAction("resolved", ticket.id)}
                          className="text-success"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Resolved
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleAction("closed", ticket.id)}
                          className="text-destructive"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Close Ticket
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTicket?.id}
              {selectedTicket && getStatusBadge(selectedTicket.status)}
            </DialogTitle>
            <DialogDescription>{selectedTicket?.subject}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">User</p>
                <p className="font-medium">{selectedTicket?.user}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Priority</p>
                <div className="flex items-center gap-2">
                  {selectedTicket && getPriorityIcon(selectedTicket.priority)}
                  <span className="capitalize font-medium">{selectedTicket?.priority}</span>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">{selectedTicket?.createdAt}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Update</p>
                <p className="font-medium">{selectedTicket?.lastUpdate}</p>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium mb-2">Reply to Customer</p>
              <Textarea
                placeholder="Type your response here..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[120px] bg-secondary/50 border-border/50"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTicket(null)}>
              Cancel
            </Button>
            <Button onClick={handleReply} disabled={!replyText.trim()}>
              <Reply className="w-4 h-4 mr-2" />
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
