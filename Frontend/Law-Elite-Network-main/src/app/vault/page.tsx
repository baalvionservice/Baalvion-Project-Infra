"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getAllUserDocuments, deleteDocument } from "@/services/documents/documentService";
import { useAuthStore } from "@/store/authStore";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { 
  ShieldCheck, 
  FileText, 
  Loader2, 
  Search, 
  Eye, 
  Trash2, 
  Sparkles,
  ArrowUpDown
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import DocumentAIInsights from "@/components/case/DocumentAIInsights";

export default function DocumentVaultPage() {
  return (
    <ProtectedRoute>
      <DashboardShell>
        <VaultContent />
      </DashboardShell>
    </ProtectedRoute>
  );
}

function VaultContent() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getAllUserDocuments(user.id);
      setDocuments(data);
    } catch (err) {
      console.error("Vault sync error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleDelete = async (docId: string, fileUrl: string) => {
    if (!confirm("Confirm permanent redaction of this document? This action is irreversible.")) return;
    try {
      await deleteDocument(docId, fileUrl);
      toast({ title: "Record Redacted", description: "The document has been removed from the secure vault." });
      loadData();
    } catch (err) {
      toast({ variant: "destructive", title: "Protocol Error", description: "Unable to redact document." });
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-8 pt-8 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" />
              Secure Data Node
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 leading-tight">Document Vault</h1>
          <p className="text-slate-500 text-sm font-medium italic">Audit and manage centralized professional records across all dossier active matters.</p>
        </div>
      </header>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search record identifier..." 
              className="pl-10 h-11 border-slate-200 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="border-slate-200 text-xs font-bold uppercase tracking-widest h-11 px-6">
            <ArrowUpDown className="w-4 h-4 mr-2" /> Filter Registry
          </Button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 opacity-20" />
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="py-32 text-center space-y-4">
              <FileText className="w-16 h-16 text-slate-100 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">Vault Empty</h3>
                <p className="text-sm text-slate-500 italic max-w-xs mx-auto">No professional records matching your discovery criteria were located in the secure node.</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Record Identifier</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Matter Link</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Uplink Date</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Intelligence</TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.map((doc) => (
                  <TableRow key={doc.id} className="hover:bg-slate-50 group transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                          <FileText className="w-4.5 h-4.5" />
                        </div>
                        <span className="text-sm font-bold text-slate-900">{doc.fileName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Case: {doc.caseId.slice(-6)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-slate-500">
                        {doc.createdAt?.seconds 
                          ? new Date(doc.createdAt.seconds * 1000).toLocaleDateString()
                          : new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button 
                        onClick={() => { setSelectedDoc(doc); setIsInsightsOpen(true); }}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-bold uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all group/ai"
                      >
                        <Sparkles className="w-3 h-3 group-hover/ai:animate-pulse" /> AI Audit
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" asChild>
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"><Eye className="w-4 h-4" /></a>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDelete(doc.id, doc.fileUrl)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {selectedDoc && (
        <DocumentAIInsights 
          document={selectedDoc} 
          isOpen={isInsightsOpen} 
          onClose={() => setIsInsightsOpen(false)} 
        />
      )}
    </div>
  );
}
