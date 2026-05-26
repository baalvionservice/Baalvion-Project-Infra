
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LifeBuoy,
  Search,
  Filter,
  MoreVertical,
  Clock,
  CheckCircle2,
  AlertCircle,
  UserCircle,
  Send,
  Loader2,
  ChevronRight,
  MessageSquare,
  ShieldCheck,
  Zap,
  Mail,
  Smartphone,
  ChevronLeft,
  X,
  UserPlus,
  ChevronDown
} from 'lucide-react';
import { collection, query, orderBy, doc, updateDoc, addDoc, where, limit } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { SupportTicket, TicketMessage, SupportStatus, SupportPriority } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui';

export default function AdminSupportCenter() {
  const db = useFirestore();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Global Tickets
  const ticketsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'support_tickets'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: tickets, loading: ticketsLoading } = useCollection<SupportTicket>(ticketsQuery);

  // 2. Fetch Messages for Selected Ticket
  const messagesQuery = useMemo(() => {
    if (!selectedTicketId || !db) return null;
    return query(
      collection(db, 'support_tickets', selectedTicketId, 'messages'),
      orderBy('createdAt', 'asc')
    );
  }, [db, selectedTicketId]);

  const { data: messages, loading: messagesLoading } = useCollection<TicketMessage>(messagesQuery);

  const selectedTicket = useMemo(() =>
    tickets.find(t => t.id === selectedTicketId),
    [tickets, selectedTicketId]
  );

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesSearch = t.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchQuery, statusFilter]);

  const handleUpdateStatus = async (ticketId: string, newStatus: SupportStatus) => {
    const ticketRef = doc(db!, 'support_tickets', ticketId);
    updateDoc(ticketRef, { status: newStatus, updatedAt: new Date().toISOString() })
      .then(() => toast({ title: `Ticket marked as ${newStatus.toLowerCase()}` }))
      .catch(async (err) => {
        errorEmitter.emitPermissionError(new FirestorePermissionError({
          path: `/support_tickets/${ticketId}`,
          operation: 'update',
          requestResourceData: { status: newStatus }
        }));
      });
  };

  const handleAssign = async (ticketId: string, adminName: string) => {
    const ticketRef = doc(db!, 'support_tickets', ticketId);
    updateDoc(ticketRef, { assignedTo: adminName, status: 'IN_PROGRESS', updatedAt: new Date().toISOString() })
      .then(() => toast({ title: `Ticket assigned to ${adminName}` }))
      .catch(() => { });
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicketId || !currentUser) return;

    const text = replyText;
    setReplyText('');
    setIsSending(true);

    const messageData = {
      senderId: currentUser.id,
      senderName: currentUser.displayName || 'Admin',
      text: text,
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db!, 'support_tickets', selectedTicketId, 'messages'), messageData);
      await updateDoc(doc(db!, 'support_tickets', selectedTicketId), {
        status: 'IN_PROGRESS',
        updatedAt: new Date().toISOString()
      });
    } catch (err: any) {
      errorEmitter.emitPermissionError(new FirestorePermissionError({
        path: `/support_tickets/${selectedTicketId}/messages`,
        operation: 'create',
        requestResourceData: messageData
      }));
    } finally {
      setIsSending(false);
    }
  };

  const getStatusConfig = (status: SupportStatus) => {
    switch (status) {
      case 'OPEN': return { label: 'New', color: 'bg-red-100 text-red-600', icon: AlertCircle };
      case 'IN_PROGRESS': return { label: 'Active', color: 'bg-blue-100 text-blue-600', icon: Clock };
      case 'RESOLVED': return { label: 'Resolved', color: 'bg-emerald-100 text-emerald-600', icon: CheckCircle2 };
      default: return { label: status, color: 'bg-slate-100 text-slate-500', icon: LifeBuoy };
    }
  };

  const getPriorityColor = (p: SupportPriority) => {
    switch (p) {
      case 'URGENT': return 'text-red-600 font-black underline decoration-red-200 underline-offset-4';
      case 'HIGH': return 'text-orange-600 font-bold';
      case 'MEDIUM': return 'text-blue-600 font-bold';
      default: return 'text-slate-400 font-medium';
    }
  };

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <LifeBuoy className="h-8 w-8 text-primary" />
            Support Center
          </h1>
          <p className="text-slate-500 font-medium">Arbitrate technical issues, billing queries, and platform disputes.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase h-11 px-4 rounded-xl flex items-center gap-2">
            <Clock className="h-4 w-4" /> {tickets.filter(t => t.status === 'OPEN').length} Unassigned Tickets
          </Badge>
        </div>
      </div>

      <div className="flex-1 flex gap-8 min-h-0">
        {/* LEFT: Ticket Ledger */}
        <Card className="w-full lg:w-[450px] border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white flex flex-col shrink-0">
          <CardHeader className="bg-slate-50/50 border-b p-6">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search user or subject..."
                  className="pl-10 h-11 rounded-xl bg-white border-none shadow-inner"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 rounded-xl bg-white border-none font-bold text-xs">
                  <SelectValue placeholder="All Tickets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lifecycles</SelectItem>
                  <SelectItem value="OPEN">Open (New)</SelectItem>
                  <SelectItem value="IN_PROGRESS">Active Work</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="divide-y divide-slate-50">
              {ticketsLoading ? (
                <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary/30" /></div>
              ) : filteredTickets.map((ticket) => {
                const status = getStatusConfig(ticket.status);
                const isSelected = selectedTicketId === ticket.id;
                return (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={cn(
                      "w-full p-6 text-left transition-all hover:bg-slate-50 group",
                      isSelected ? "bg-primary/5 border-l-4 border-primary" : ""
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Badge className={cn("px-2 py-0.5 rounded-full text-[8px] font-black uppercase border-none", status.color)}>
                        {status.label}
                      </Badge>
                      <span className="text-[10px] font-bold text-slate-400">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-black text-slate-900 leading-tight group-hover:text-primary transition-colors truncate">
                      {ticket.subject}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-1 truncate">
                      From: {ticket.userName} ({ticket.category})
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <span className={cn("text-[9px] font-black uppercase tracking-widest", getPriorityColor(ticket.priority))}>
                        {ticket.priority} PRIORITY
                      </span>
                      {ticket.assignedTo && (
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="text-[8px] bg-slate-900 text-white">{ticket.assignedTo[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-[9px] font-bold text-slate-400">{ticket.assignedTo}</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </Card>

        {/* RIGHT: Ticket Details & Workspace */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {selectedTicket ? (
              <motion.div
                key={selectedTicket.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col gap-6"
              >
                {/* Workspace Header */}
                <Card className="border-none shadow-sm rounded-3xl bg-white shrink-0">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-slate-50 border flex items-center justify-center">
                          <MessageSquare className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-slate-900 leading-tight">{selectedTicket.subject}</h2>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge variant="outline" className="text-[10px] font-bold border-slate-200">ID: {selectedTicket.id.substring(0, 8)}</Badge>
                            <span className="text-xs text-slate-400 font-medium">Category: <strong>{selectedTicket.category}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Select
                          value={selectedTicket.assignedTo || 'unassigned'}
                          onValueChange={(v) => handleAssign(selectedTicket.id, v)}
                        >
                          <SelectTrigger className="w-40 h-10 rounded-xl bg-slate-50 border-none font-bold text-xs">
                            <UserPlus className="h-3.5 w-3.5 mr-2" />
                            <SelectValue placeholder="Assign To" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            <SelectItem value="Admin Sarah">Admin Sarah</SelectItem>
                            <SelectItem value="Admin Alex">Admin Alex</SelectItem>
                            <SelectItem value="Root Admin">Root Admin</SelectItem>
                          </SelectContent>
                        </Select>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="rounded-xl font-bold h-10 border-slate-200">
                              Status: {selectedTicket.status} <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl">
                            <DropdownMenuItem onClick={() => handleUpdateStatus(selectedTicket.id, 'IN_PROGRESS')} className="rounded-lg font-bold">Mark Active</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(selectedTicket.id, 'RESOLVED')} className="rounded-lg font-bold text-emerald-600">Mark Resolved</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(selectedTicket.id, 'CLOSED')} className="rounded-lg font-bold text-slate-400">Close Ticket</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Chat Workspace */}
                <div className="flex-1 flex gap-6 min-h-0">
                  <Card className="flex-1 border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden flex flex-col">
                    <ScrollArea className="flex-1 p-8 bg-slate-50/20">
                      <div className="space-y-8">
                        {/* Initial Message */}
                        <div className="flex gap-4">
                          <Avatar className="h-10 w-10 border">
                            <AvatarFallback className="bg-primary text-white font-black text-xs">{selectedTicket.userName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-slate-900">{selectedTicket.userName}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Original Request</span>
                            </div>
                            <div className="p-6 rounded-2xl rounded-tl-none bg-white border border-slate-100 shadow-sm text-sm text-slate-700 leading-relaxed font-medium">
                              {selectedTicket.message}
                            </div>
                          </div>
                        </div>

                        {messages.map((msg) => {
                          const isMe = msg.senderId === currentUser?.id;
                          return (
                            <div key={msg.id} className={cn("flex gap-4", isMe ? "flex-row-reverse" : "")}>
                              <Avatar className="h-10 w-10 border shrink-0">
                                <AvatarFallback className={cn("font-black text-xs", isMe ? "bg-slate-900 text-white" : "bg-primary text-white")}>
                                  {msg.senderName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className={cn("flex-1 space-y-2", isMe ? "text-right" : "")}>
                                <div className="flex items-center gap-2 justify-inherit">
                                  <span className="font-black text-sm text-slate-900">{msg.senderName}</span>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div className={cn(
                                  "p-5 rounded-2xl shadow-sm text-sm font-medium leading-relaxed max-w-[80%]",
                                  isMe ? "ml-auto bg-slate-900 text-white rounded-tr-none" : "bg-white border border-slate-100 rounded-tl-none text-slate-700"
                                )}>
                                  {msg.text}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={chatScrollRef} />
                      </div>
                    </ScrollArea>

                    {/* Input Bar */}
                    <footer className="p-6 border-t bg-white shrink-0">
                      <form onSubmit={handleSendReply} className="flex gap-3">
                        <Input
                          placeholder="Type your official response..."
                          className="flex-1 h-14 rounded-2xl bg-slate-50 border-none px-6 focus-visible:ring-primary text-md"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                        />
                        <Button
                          disabled={!replyText.trim() || isSending}
                          className="h-14 w-14 rounded-2xl shadow-xl shadow-primary/20 shrink-0"
                        >
                          {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        </Button>
                      </form>
                    </footer>
                  </Card>

                  {/* Sidebar Context */}
                  <div className="w-72 flex flex-col gap-6 hidden xl:flex">
                    <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                      <CardHeader className="bg-slate-50/50 border-b p-6">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">User Context</CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
                              <UserCircle className="h-6 w-6 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate">{selectedTicket.userName}</p>
                              <p className="text-[10px] font-bold text-slate-400 truncate">{selectedTicket.userEmail}</p>
                            </div>
                          </div>
                          <Separator className="opacity-50" />
                          <div className="space-y-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Health</p>
                            <div className="flex justify-between items-center text-xs font-bold">
                              <span className="text-slate-500">Tier</span>
                              <Badge className="bg-emerald-50 text-emerald-600 border-none text-[10px]">VERIFIED PRO</Badge>
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold">
                              <span className="text-slate-500">History</span>
                              <span className="text-slate-900">12 Resolved</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="p-6 rounded-3xl bg-slate-900 text-white relative overflow-hidden group">
                      <Zap className="absolute -right-4 -top-4 h-24 w-24 text-white/5 group-hover:scale-110 transition-transform" />
                      <div className="relative space-y-3">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-primary" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Admin Protocol</span>
                        </div>
                        <p className="text-xs font-medium leading-relaxed text-slate-400">
                          All communications are logged for compliance. Provide clear, empathetic solutions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-slate-50/30 rounded-[3rem] border border-dashed border-slate-200">
                <div className="h-24 w-24 rounded-[2.5rem] bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center mb-8">
                  <LifeBuoy className="h-12 w-12 text-primary/20" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Workspace Dashboard</h3>
                <p className="text-slate-500 max-w-sm font-medium leading-relaxed">
                  Select a ticket from the sidebar to begin troubleshooting and communication.
                </p>
                <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg w-full">
                  <div className="p-4 rounded-2xl bg-white border border-slate-100 flex items-start gap-3 text-left">
                    <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase">Prioritize urgent and high-impact billing queries first.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-100 flex items-start gap-3 text-left">
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase">Aim for resolution within 24 hours of ticket opening.</p>
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
