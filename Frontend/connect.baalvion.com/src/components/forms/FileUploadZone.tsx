'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  CheckCircle2, 
  Loader2,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  maxSizeMB?: number;
  accept?: string;
  multiple?: boolean;
  className?: string;
}

export function FileUploadZone({ 
  onFilesSelected, 
  maxSizeMB = 100, 
  accept = "image/*,video/*,application/pdf", 
  multiple = true,
  className 
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<{ file: File; id: string; preview?: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const validFiles = Array.from(newFiles).filter(f => f.size <= maxSizeMB * 1024 * 1024);
    
    const fileObjects = validFiles.map(f => ({
      file: f,
      id: Math.random().toString(36).substring(7),
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined
    }));

    setFiles(prev => multiple ? [...prev, ...fileObjects] : [fileObjects[0]]);
    onFilesSelected(validFiles);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative min-h-[200px] rounded-[2rem] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-8 text-center group",
          isDragging ? "border-primary bg-primary/5" : "border-slate-200 bg-slate-50/50 hover:border-primary/50 hover:bg-white"
        )}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple={multiple} 
          accept={accept} 
          onChange={(e) => processFiles(e.target.files)} 
        />
        
        <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Upload className="h-8 w-8 text-slate-400 group-hover:text-primary transition-colors" />
        </div>
        
        <div className="space-y-1">
          <p className="text-lg font-bold text-slate-900">Drag & drop files here</p>
          <p className="text-sm text-slate-500 font-medium">or click to browse from device</p>
        </div>
        
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-6">
          Max size: {maxSizeMB}MB • {accept.replace(/\//g, ' ').toUpperCase()}
        </p>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {files.map((fileObj) => (
              <motion.div
                key={fileObj.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-4 group"
              >
                <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden border">
                  {fileObj.preview ? (
                    <img src={fileObj.preview} className="h-full w-full object-cover" />
                  ) : fileObj.file.type.startsWith('video/') ? (
                    <Video className="h-6 w-6 text-blue-500" />
                  ) : (
                    <FileText className="h-6 w-6 text-indigo-500" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{fileObj.file.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                  onClick={(e) => { e.stopPropagation(); removeFile(fileObj.id); }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
