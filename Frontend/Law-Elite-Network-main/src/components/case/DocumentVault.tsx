"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Loader2, 
  Download, 
  Trash2, 
  Eye, 
  File, 
  ImageIcon,
  ShieldCheck,
  Plus,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  uploadDocument, 
  getDocumentsByCase, 
  deleteDocument 
} from '@/services/documents/documentService';
import DocumentAIInsights from './DocumentAIInsights';

interface DocumentVaultProps {
  caseId: string;
  userId: string;
}

/**
 * @fileOverview DocumentVault
 * High-fidelity secure storage module for individual legal dossiers.
 */
export default function DocumentVault({ caseId, userId }: DocumentVaultProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const { toast } = useToast();

  const loadDocs = async () => {
    setLoading(true);
    try {
      const data = await getDocumentsByCase(caseId);
      setDocuments(data);
    } catch (error) {
      console.error("Docs load failure", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, [caseId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Protocol Validation
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'image/jpeg', 
      'image/png'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid Protocol",
        description: "Only PDF, DOC, DOCX, JPG, and PNG formats are authorized for vault storage."
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      toast({
        variant: "destructive",
        title: "File Magnitude Alert",
        description: "Dossier records must not exceed 10MB in size."
      });
      return;
    }

    setUploading(true);
    try {
      await uploadDocument(file, caseId, userId);
      toast({
        title: "Document Secured",
        description: "The legal record has been successfully committed to the secure vault. AI analysis initiated."
      });
      loadDocs();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Uplink Error",
        description: "Unable to synchronize document with the network vault."
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string, fileUrl: string) => {
    if (!confirm("Confirm permanent redaction of this document? This action is irreversible.")) return;

    try {
      await deleteDocument(docId, fileUrl);
      toast({
        title: "Record Redacted",
        description: "The document has been removed from the secure vault."
      });
      loadDocs();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Redaction Protocol Failure",
        description: "Unable to remove the document from the secure ledger."
      });
    }
  };

  const handleOpenInsights = (doc: any) => {
    setSelectedDoc(doc);
    setIsInsightsOpen(true);
  };

  const getFileIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('pdf')) return <FileText className="w-5 h-5 text-red-400" />;
    if (t.includes('image') || t === 'jpg' || t === 'png' || t === 'jpeg') return <ImageIcon className="w-5 h-5 text-blue-400" />;
    return <File className="w-5 h-5 text-accent" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="glass-panel border-white/5 shadow-2xl overflow-hidden animate-in zoom-in duration-500">
      <CardHeader className="bg-white/5 border-b border-white/5 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-accent flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Secure Vault
          </CardTitle>
        </div>
        <div className="relative">
          <input 
            type="file" 
            id="vault-upload" 
            className="hidden" 
            onChange={handleUpload}
            disabled={uploading}
          />
          <Button 
            asChild 
            variant="outline" 
            disabled={uploading}
            className="h-9 rounded-xl border-white/10 hover:bg-white/5 text-[10px] font-bold uppercase tracking-widest cursor-pointer"
          >
            <label htmlFor="vault-upload" className="cursor-pointer">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Plus className="w-3.5 h-3.5 mr-2" />}
              Uplink Record
            </label>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-accent opacity-50" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Synchronizing Vault Ledger...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="py-20 text-center space-y-4 px-8">
            <div className="w-16 h-16 rounded-2xl bg-white/5 mx-auto flex items-center justify-center text-muted-foreground/20">
              <FileText className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white uppercase tracking-tight">Vault Empty</h4>
              <p className="text-xs text-muted-foreground italic">No legal records have been committed to this dossier yet.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    {getFileIcon(doc.fileType)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white truncate group-hover:text-accent transition-colors">{doc.fileName}</p>
                      <button 
                        onClick={() => handleOpenInsights(doc)}
                        className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent text-[8px] font-bold uppercase tracking-tighter hover:bg-accent/20"
                      >
                        <Sparkles className="w-2.5 h-2.5" /> Analyze
                      </button>
                    </div>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest flex items-center gap-2 mt-0.5">
                      {formatSize(doc.fileSize)} • {doc.createdAt ? new Date(doc.createdAt.seconds ? doc.createdAt.seconds * 1000 : doc.createdAt).toLocaleDateString() : 'Syncing...'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-accent/10 hover:text-accent" asChild title="View Record">
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Eye className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-red-500/10 hover:text-red-400" onClick={() => handleDelete(doc.id, doc.fileUrl)} title="Redact Document">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {selectedDoc && (
        <DocumentAIInsights 
          document={selectedDoc} 
          isOpen={isInsightsOpen} 
          onClose={() => setIsInsightsOpen(false)} 
        />
      )}
    </Card>
  );
}
