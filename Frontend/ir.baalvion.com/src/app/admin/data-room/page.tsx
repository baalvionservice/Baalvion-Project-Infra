"use client";

import { useState, useMemo } from "react";
import { UserRole } from "@/core/content/schemas";
import { INSTITUTIONAL_DOCUMENTS } from "@/lib/dataroom/data";
import { DataRoomCategory, ActivityLogEntry, DocumentItem } from "@/lib/dataroom/types";
import { canAccess, createLogEntry, sortDocuments, filterDocuments } from "@/lib/dataroom/utils";
import { DocumentCard } from "@/components/dataroom/DocumentCard";
import { ActivityLogPanel } from "@/components/dataroom/ActivityLogPanel";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Search, 
  ShieldCheck, 
  Filter, 
  ChevronRight, 
  Menu,
  Shield,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { authService } from "@/core/services/auth.service";
import { Badge } from "@/components/ui/badge";

const CATEGORIES: DataRoomCategory[] = ['All', 'Financial', 'Governance', 'Capital', 'Legal'];

export default function DataRoomPage() {
  const [activeRole, setActiveRole] = useState<UserRole>('public');
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<DataRoomCategory>('All');
  const [accessFilter, setAccessFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);

  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    authService.setRole(role);
  };

  const handleAction = (doc: DocumentItem, action: 'View' | 'Download') => {
    const entry = createLogEntry(activeRole, action, doc.title);
    setLogs(prev => [entry, ...prev].slice(0, 20));
  };

  const filteredDocs = useMemo(() => {
    const result = filterDocuments(INSTITUTIONAL_DOCUMENTS, search, category, accessFilter);
    return sortDocuments(result, sortBy);
  }, [search, category, accessFilter, sortBy]);

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-64px)] overflow-hidden bg-background">
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 p-4 md:p-8">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col lg:flex-row justify-between gap-6 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Institutional Vault</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tighter">Secure Data Room</h1>
                <p className="text-sm text-muted-foreground mt-1">Audit-grade documentation for Baalvion shareholders and board members.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
                <div className="flex flex-col gap-1.5 flex-1 lg:min-w-[180px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">Simulate Identity</span>
                  <Select value={activeRole} onValueChange={(val) => handleRoleChange(val as UserRole)}>
                    <SelectTrigger className="h-10 bg-card border-border/50">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public Viewer</SelectItem>
                      <SelectItem value="phase1">Accredited Investor (P1)</SelectItem>
                      <SelectItem value="BoardMember">Board Member</SelectItem>
                      <SelectItem value="compliance">Compliance Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="lg:hidden">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="h-10 w-10">
                        <Shield className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="p-0 w-80">
                      <SheetHeader className="sr-only">
                        <SheetTitle>Data Room Activity Log</SheetTitle>
                      </SheetHeader>
                      <ActivityLogPanel logs={logs} />
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search document registry..." 
                  className="pl-10 h-11 bg-card border-border/50"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={accessFilter} onValueChange={setAccessFilter}>
                  <SelectTrigger className="flex-1 md:w-[160px] h-11 bg-card border-border/50">
                    <Filter className="h-3 w-3 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Access Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clearance</SelectItem>
                    <SelectItem value="Public">Public</SelectItem>
                    <SelectItem value="Accredited">Accredited</SelectItem>
                    <SelectItem value="Board Only">Board Only</SelectItem>
                    <SelectItem value="Internal">Internal</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="flex-1 md:w-[160px] h-11 bg-card border-border/50">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Latest Upload</SelectItem>
                    <SelectItem value="alphabetical">Alphabetical</SelectItem>
                    <SelectItem value="size">File Size</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <Tabs value={category} onValueChange={(v) => setCategory(v as DataRoomCategory)} className="w-full sm:flex-1">
                <TabsList className="bg-card border border-border/50 h-11 p-1 w-full sm:w-auto overflow-x-auto justify-start">
                  {CATEGORIES.map((cat) => (
                    <TabsTrigger 
                      key={cat} 
                      value={cat} 
                      className="flex-1 sm:flex-none px-6 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      {cat}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <Badge variant="outline" className="h-11 px-4 bg-card border-border/50 text-[10px] font-bold uppercase tracking-widest hidden sm:flex">
                {filteredDocs.length} Documents Matched
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocs.map((doc) => (
                <DocumentCard 
                  key={doc.id} 
                  doc={doc} 
                  hasAccess={canAccess(activeRole, doc)}
                  onAction={(action) => handleAction(doc, action)}
                />
              ))}
            </div>

            {filteredDocs.length === 0 && (
              <div className="py-20 text-center border-2 border-dashed border-border/50 rounded-xl">
                <p className="text-muted-foreground text-sm font-medium">No documents matching current filters.</p>
                <Button variant="link" className="mt-2" onClick={() => { setSearch(""); setCategory("All"); setAccessFilter("all"); }}>
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      <aside className="hidden lg:block w-80 shrink-0 border-l border-border/50">
        <ActivityLogPanel logs={logs} />
      </aside>
    </div>
  );
}