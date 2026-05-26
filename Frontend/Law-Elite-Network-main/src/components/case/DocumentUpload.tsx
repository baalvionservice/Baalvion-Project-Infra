"use client";

import React, { useState } from "react";
import { FileUp, CheckCircle2, Loader2, Paperclip } from "lucide-react";
import { Label } from "@/components/ui/label";

interface DocumentUploadProps {
  onUpload: (fileName: string) => void;
}

/**
 * @fileOverview DocumentUpload
 * High-fidelity file uplink simulation for legal briefs.
 */
export default function DocumentUpload({ onUpload }: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [lastUploaded, setLastUploaded] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    // Simulate secure transmission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsUploading(false);
    setLastUploaded(file.name);
    onUpload(file.name);
  };

  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        <Paperclip className="w-3 h-3 text-accent" /> Supporting Documentation
      </Label>
      
      <div className="relative group">
        <input
          type="file"
          id="case-doc-upload"
          onChange={handleUpload}
          className="hidden"
          disabled={isUploading}
        />
        <label
          htmlFor="case-doc-upload"
          className={`flex items-center justify-center w-full h-12 rounded-xl border border-dashed transition-all cursor-pointer ${
            isUploading 
              ? "bg-white/5 border-white/10" 
              : "bg-white/5 border-white/20 hover:border-accent/50 hover:bg-accent/5"
          }`}
        >
          {isUploading ? (
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-accent" />
              Securing Transmission...
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-accent">
              <FileUp className="w-4 h-4" />
              Sync Legal Document
            </div>
          )}
        </label>
      </div>

      {lastUploaded && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 animate-in fade-in slide-in-from-left-2">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span className="text-[9px] font-bold text-white uppercase truncate max-w-[200px]">
            {lastUploaded} Verified
          </span>
        </div>
      )}
    </div>
  );
}
