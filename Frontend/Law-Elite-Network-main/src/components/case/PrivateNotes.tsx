
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, Save, Loader2, Lock, Tag, Trash2 } from 'lucide-react';
import { mockAddNote, updateCase } from '@/services/cases/case.mock';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface PrivateNotesProps {
  caseId: string;
  notes: any[];
  onUpdate: () => void;
}

/**
 * @fileOverview PrivateNotes
 * Encrypted research environment strictly for practitioner strategy.
 */
export default function PrivateNotes({ caseId, notes, onUpdate }: PrivateNotesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [noteText, setNoteText] = useState("");
  const { toast } = useToast();

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      await mockAddNote(caseId, { 
        text: noteText, 
        isPrivate: true,
        tags: ['Strategy']
      });
      setNoteText("");
      setIsAdding(false);
      onUpdate();
      toast({ title: "Strategy Logged", description: "Internal note has been secured." });
    } catch (e) {
      toast({ variant: "destructive", title: "Persistence Failure" });
    }
  };

  const handleDelete = async (noteId: string) => {
    const updated = notes.filter(n => n.id !== noteId);
    await updateCase(caseId, { notes: updated });
    onUpdate();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-blue-600" /> Strategic Research Dossier
          </h3>
          <Button onClick={() => setIsAdding(true)} size="sm" className="bg-[#0B1F3A] text-white hover:bg-slate-800 rounded-xl h-9 px-4 text-[10px] font-bold uppercase tracking-widest">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Log Strategy
          </Button>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100 w-fit">
          <Lock className="w-3 h-3 text-amber-600" />
          <p className="text-[9px] font-bold text-amber-700 uppercase tracking-widest">Internal Environment • Not visible to client</p>
        </div>
      </header>

      {isAdding && (
        <Card className="border-blue-200 bg-white shadow-xl animate-in zoom-in-95 duration-300">
          <CardContent className="p-6 space-y-4">
            <textarea 
              autoFocus
              className="w-full min-h-[150px] bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:border-blue-400 italic font-medium leading-relaxed"
              placeholder="Outline research findings or internal case strategy..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsAdding(false)} className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Cancel</Button>
              <Button onClick={handleAddNote} className="bg-blue-600 text-white font-bold uppercase text-[9px] tracking-widest px-6 h-10 shadow-lg shadow-blue-200">
                <Save className="w-3.5 h-3.5 mr-2" /> Secure Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {notes.length === 0 ? (
          <div className="py-24 text-center space-y-4 px-8 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/30">
            <BookOpen className="w-12 h-12 text-slate-200 mx-auto" />
            <p className="text-sm italic text-slate-400">Initialize your private strategic research for this brief.</p>
          </div>
        ) : (
          notes.map((note) => (
            <Card key={note.id} className="bg-white border-slate-100 hover:border-blue-200 transition-all shadow-sm group">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1.5">
                      <Tag className="w-3 h-3" /> {note.tags[0]}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                      Logged {formatDistanceToNow(note.createdAt)} ago
                    </span>
                  </div>
                  <button onClick={() => handleDelete(note.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-600 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed font-medium italic whitespace-pre-wrap">
                  "{note.text}"
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
