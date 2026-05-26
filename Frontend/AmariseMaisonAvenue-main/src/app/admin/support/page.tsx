"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  MessageSquare,
  LifeBuoy,
  Undo,
  Smile,
  Clock,
  LogOut,
  ChevronRight,
  Search,
  RefreshCcw,
  Eye,
  Send,
  FileText,
  LayoutDashboard,
  PieChart,
  Users,
  Cpu,
  Ear,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

type SupportTab =
  | "dashboard"
  | "tickets"
  | "chats"
  | "clients"
  | "knowledge"
  | "analytics";

export default function SupportAdminPanel() {
  const [activeTab, setActiveTab] = useState<SupportTab>("dashboard");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const { supportTickets, supportStats, updateTicketStatus, addTicketMessage } =
    useAppStore();
  const { toast } = useToast();

  const selectedTicket = useMemo(
    () => supportTickets.find((t) => t.id === selectedTicketId),
    [supportTickets, selectedTicketId]
  );

  const handleSendReply = () => {
    if (!selectedTicketId || !replyText.trim()) return;
    addTicketMessage(selectedTicketId, replyText, "agent");
    setReplyText("");
    toast({
      title: "Concierge Response Sent",
      description: "Your artisanal guidance has been transmitted.",
    });
  };

  const handleAction = (msg: string) => {
    toast({ title: "Care Action", description: msg });
  };

  return (
    <div className="flex h-screen bg-ivory overflow-hidden font-body text-gray-900">
      <aside className="w-72 border-r border-border bg-white p-8 flex flex-col space-y-12 shadow-sm z-20">
        <div className="space-y-4">
          <div className="font-headline text-3xl font-bold tracking-tighter text-gray-900">
            AMARISÉ{" "}
            <span className="text-plum text-xs font-normal tracking-[0.4em] ml-2">
              CARE
            </span>
          </div>
          <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">
            Client Concierge Suite
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          <SupportNavItem
            icon={<LayoutDashboard />}
            label="Care Overview"
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
          />
          <SupportNavItem
            icon={<LifeBuoy />}
            label="Ticket Terminal"
            active={activeTab === "tickets"}
            onClick={() => setActiveTab("tickets")}
          />
          <SupportNavItem
            icon={<MessageSquare />}
            label="Live dialogues"
            active={activeTab === "chats"}
            onClick={() => setActiveTab("chats")}
          />
          <SupportNavItem
            icon={<Users />}
            label="Client resonance"
            active={activeTab === "clients"}
            onClick={() => setActiveTab("clients")}
          />
          <SupportNavItem
            icon={<FileText />}
            label="Maison intelligence"
            active={activeTab === "knowledge"}
            onClick={() => setActiveTab("knowledge")}
          />
          <SupportNavItem
            icon={<PieChart />}
            label="Care Analytics"
            active={activeTab === "analytics"}
            onClick={() => setActiveTab("analytics")}
          />
        </nav>

        <div className="pt-8 border-t border-border space-y-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-plum group"
            asChild
          >
            <Link href="/admin">
              <RefreshCcw className="w-4 h-4 mr-3" /> Master Control
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-plum group"
            asChild
          >
            <Link href="/us">
              <LogOut className="w-4 h-4 mr-3" /> Exit Hub
            </Link>
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-ivory relative">
        <header className="flex justify-between items-center bg-white/80 luxury-blur p-8 border-b border-border sticky top-0 z-30">
          <div>
            <h1 className="text-3xl font-headline font-bold italic text-gray-900 uppercase tracking-widest">
              {activeTab}
            </h1>
            <p className="text-gray-400 text-[10px] tracking-widest uppercase font-bold mt-1">
              Global Support Oversight • Artisanal Resolution Terminal
            </p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4 bg-plum/5 px-4 py-2 border border-plum/10 rounded-sm">
              <Clock className="w-4 h-4 text-plum" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Avg. velocity
                </span>
                <span className="text-[9px] text-gray-400">
                  {supportStats.avgResponseTime}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 bg-plum rounded-sm flex items-center justify-center font-headline text-xl font-bold italic text-white shadow-md">
              AC
            </div>
          </div>
        </header>

        <div className="p-12 space-y-12 animate-fade-in pb-32">
          {activeTab === "dashboard" && (
            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard
                  icon={<LifeBuoy />}
                  label="Pending inquiries"
                  value={supportStats.openTickets.toString()}
                  trend="Action Priority"
                  positive={false}
                />
                <StatCard
                  icon={<CheckCircle2 />}
                  label="Resolved today"
                  value={supportStats.resolvedToday.toString()}
                  trend="+12% Vol"
                  positive={true}
                />
                <StatCard
                  icon={<Smile />}
                  label="Client CSAT"
                  value={`${supportStats.csatScore}/5.0`}
                  trend="Maison Goal: 4.9"
                  positive={true}
                />
                <StatCard
                  icon={<MessageSquare />}
                  label="Active dialogues"
                  value={supportStats.activeChats.toString()}
                  trend="Real-time"
                  positive={true}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <Card className="lg:col-span-2 bg-white border-border shadow-luxury">
                  <CardHeader className="border-b border-border">
                    <CardTitle className="font-headline text-2xl">
                      Urgent VIP care requests
                    </CardTitle>
                    <CardDescription className="text-[10px] uppercase tracking-widest">
                      High-priority dialogues from Diamond & Gold tiers
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-ivory/50">
                        <TableRow>
                          <TableHead className="text-[9px] uppercase font-bold pl-8">
                            Connoisseur
                          </TableHead>
                          <TableHead className="text-[9px] uppercase font-bold">
                            Inquiry
                          </TableHead>
                          <TableHead className="text-[9px] uppercase font-bold">
                            Category
                          </TableHead>
                          <TableHead className="text-[9px] uppercase font-bold text-center">
                            Status
                          </TableHead>
                          <TableHead className="text-[9px] uppercase font-bold text-right pr-8">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {supportTickets
                          .filter(
                            (t) =>
                              t.priority === "urgent" ||
                              t.customerTier === "Diamond"
                          )
                          .map((t) => (
                            <TableRow
                              key={t.id}
                              className="hover:bg-ivory/30 transition-colors"
                            >
                              <TableCell className="pl-8">
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold leading-tight">
                                    {t.customerName}
                                  </span>
                                  <span className="text-[8px] text-plum uppercase tracking-widest font-bold">
                                    {t.customerTier} Member
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs font-light italic truncate max-w-[200px]">
                                {t.subject}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="text-[8px] uppercase tracking-widest"
                                >
                                  {t.category}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  className={cn(
                                    "text-[8px] uppercase tracking-widest",
                                    t.status === "open"
                                      ? "bg-red-50 text-red-600"
                                      : "bg-gold/10 text-gold"
                                  )}
                                >
                                  {t.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right pr-8">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-gray-400 hover:text-plum"
                                  onClick={() => {
                                    setSelectedTicketId(t.id);
                                    setActiveTab("tickets");
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card className="bg-white border-border shadow-luxury">
                  <CardHeader className="border-b border-border">
                    <CardTitle className="font-headline text-2xl">
                      Resolution velocity
                    </CardTitle>
                    <CardDescription className="text-[10px] uppercase tracking-widest">
                      Maison service benchmarks
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-8 space-y-8">
                    <PerformanceRow
                      label="First interaction"
                      val={92}
                      goal="15m"
                    />
                    <PerformanceRow
                      label="Artisanal resolution"
                      val={85}
                      goal="4h"
                    />
                    <PerformanceRow
                      label="VIP priority care"
                      val={98}
                      goal="5m"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "tickets" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
              <Card className="lg:col-span-1 bg-white border-border shadow-luxury h-[70vh] flex flex-col">
                <CardHeader className="border-b border-border">
                  <div className="flex justify-between items-center">
                    <CardTitle className="font-headline text-xl">
                      Care Registry
                    </CardTitle>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {supportTickets.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      className={cn(
                        "w-full text-left p-6 border-b border-border hover:bg-ivory transition-colors",
                        selectedTicketId === t.id &&
                          "bg-plum/5 border-l-4 border-l-plum shadow-inner"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                          ID: {t.id}
                        </span>
                        <Badge
                          className={cn(
                            "text-[7px] uppercase tracking-tighter",
                            t.priority === "urgent"
                              ? "bg-red-500 text-white border-none"
                              : "bg-gray-100 text-gray-500"
                          )}
                        >
                          {t.priority}
                        </Badge>
                      </div>
                      <h4 className="text-xs font-bold truncate mb-1 uppercase tracking-tight">
                        {t.subject}
                      </h4>
                      <p className="text-[10px] text-gray-500 italic line-clamp-1">
                        {t.lastMessage}
                      </p>
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-[8px] font-bold uppercase text-plum">
                          {t.customerTier} Member
                        </span>
                        <span className="text-[8px] text-gray-400">
                          {new Date(t.updatedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="lg:col-span-2 bg-white border-border shadow-luxury h-[70vh] flex flex-col overflow-hidden">
                {selectedTicket ? (
                  <>
                    <CardHeader className="border-b border-border flex flex-row justify-between items-center bg-ivory/30">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-plum/10 rounded-full flex items-center justify-center font-headline text-lg font-bold text-plum border border-plum/20">
                          {selectedTicket.customerName.charAt(0)}
                        </div>
                        <div>
                          <CardTitle className="text-lg font-headline font-bold uppercase tracking-tight">
                            {selectedTicket.customerName}
                          </CardTitle>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant="outline"
                              className="text-[7px] uppercase"
                            >
                              {selectedTicket.customerTier} Tier
                            </Badge>
                            <span className="text-[8px] text-gray-400 uppercase tracking-widest font-bold">
                              Maison Hub: Global
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 border-border text-[9px] font-bold uppercase tracking-widest"
                          onClick={() =>
                            updateTicketStatus(selectedTicket.id, "resolved")
                          }
                        >
                          Resolve inquiry
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 border-border text-[9px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50"
                          onClick={() =>
                            handleAction("Ticket escalated to supervision.")
                          }
                        >
                          Escalate care
                        </Button>
                      </div>
                    </CardHeader>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-ivory/10 custom-scrollbar">
                      {selectedTicket.messages.map((m) => (
                        <div
                          key={m.id}
                          className={cn(
                            "flex",
                            m.sender === "agent"
                              ? "justify-end"
                              : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[70%] p-6 rounded-sm shadow-sm border",
                              m.sender === "agent"
                                ? "bg-plum text-white border-plum"
                                : "bg-white border-border"
                            )}
                          >
                            <p className="text-xs font-light italic leading-relaxed">
                              {m.text}
                            </p>
                            <p
                              className={cn(
                                "text-[8px] mt-2 font-bold uppercase tracking-widest",
                                m.sender === "agent"
                                  ? "text-white/60"
                                  : "text-gray-400"
                              )}
                            >
                              {m.sender === "agent"
                                ? "Maison Concierge"
                                : "Connoisseur"}{" "}
                              •{" "}
                              {new Date(m.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-8 border-t border-border bg-white">
                      <div className="relative group">
                        <Textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Draft your artisanal response..."
                          className="min-h-[100px] rounded-none border-border focus:ring-plum text-xs italic font-light bg-ivory/20"
                        />
                        <div className="absolute bottom-4 right-4 flex space-x-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-gray-400 hover:text-plum"
                          >
                            <Smile className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-gray-400 hover:text-plum"
                          >
                            <Undo className="w-4 h-4" />
                          </Button>
                          <Button
                            className="bg-plum text-white hover:bg-gold h-10 px-6 rounded-none text-[9px] font-bold uppercase tracking-widest uppercase ml-4 shadow-md"
                            onClick={handleSendReply}
                          >
                            Transmit Reply <Send className="w-3 h-3 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-6 text-center p-12">
                    <div className="p-8 bg-ivory border border-border rounded-full animate-pulse">
                      <Ear className="w-12 h-12 text-gold/30 mx-auto" />
                    </div>
                    <p className="text-2xl text-muted-foreground font-light italic font-headline">
                      Select a care inquiry from the terminal to begin dialogue.
                    </p>
                  </div>
                )}
              </Card>
            </div>
          )}

          {["chats", "clients", "knowledge", "analytics"].includes(
            activeTab
          ) && (
            <div className="py-40 text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-12 bg-ivory border border-border rounded-full animate-pulse">
                  <RefreshCcw className="w-12 h-12 text-gold/30 mx-auto" />
                </div>
              </div>
              <p className="text-2xl text-muted-foreground font-light italic font-headline">
                The {activeTab} workspace is currently synchronizing with the
                Maison Care Registry.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SupportNavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center space-x-4 px-6 py-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-all group rounded-sm border",
        active
          ? "bg-plum text-white border-plum shadow-md"
          : "text-gray-400 hover:bg-ivory hover:text-plum border-transparent"
      )}
    >
      <span
        className={cn(
          "transition-transform group-hover:scale-110",
          active ? "text-white" : "text-gold"
        )}
      >
        {React.cloneElement(icon as React.ReactElement<any>, {
          className: "w-5 h-5",
        })}
      </span>
      <span>{label}</span>
      {active && <ChevronRight className="w-4 h-4 ml-auto" />}
    </button>
  );
}

function StatCard({
  icon,
  label,
  value,
  trend,
  positive,
}: {
  icon: any;
  label: string;
  value: string;
  trend: string;
  positive: boolean;
}) {
  return (
    <Card className="bg-white border-border shadow-luxury hover:border-gold transition-colors group">
      <CardContent className="p-8 space-y-6">
        <div className="flex justify-between items-start">
          <div className="p-4 bg-ivory rounded-full group-hover:bg-gold/10 transition-colors text-plum">
            {icon}
          </div>
          <div
            className={cn(
              "flex items-center text-[10px] font-bold tracking-widest uppercase",
              positive ? "text-gold" : "text-gray-400"
            )}
          >
            {trend}
          </div>
        </div>
        <div>
          <div className="text-gray-400 text-[10px] uppercase tracking-[0.4em] font-bold">
            {label}
          </div>
          <div className="text-4xl font-headline font-bold italic mt-2 text-gray-900">
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PerformanceRow({
  label,
  val,
  goal,
}: {
  label: string;
  val: number;
  goal: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
        <span className="text-gray-500">{label}</span>
        <div className="flex items-center space-x-2">
          <span className="text-plum">{val}%</span>
          <span className="text-[8px] text-gray-300">Target: {goal}</span>
        </div>
      </div>
      <Progress value={val} className="h-1 bg-ivory" />
    </div>
  );
}
