
"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getChatById, sendMessage } from "@/services/chatService";
import { useAuthStore } from "@/store/authStore";
import { ArrowLeft, Loader2, MessageSquare, ShieldCheck } from "lucide-react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

/**
 * @fileOverview SecureChatSessionPage
 * Updated to use Persistent Layout Architecture.
 */

const ChatWindow = dynamic(() => import("@/components/chat/ChatWindow"), {
  loading: () => (
    <div className="h-[600px] bg-white rounded-3xl border border-slate-200 flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600 opacity-20" />
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Initializing Secure Uplink...</p>
    </div>
  ),
  ssr: false
});

export default function ChatDetailPage() {
  return (
    <ProtectedRoute>
      <DashboardShell>
        <ChatDetailContent />
      </DashboardShell>
    </ProtectedRoute>
  );
}

function ChatDetailContent() {
  const { chatId } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [chat, setChat] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getChatById(chatId as string);
        setChat(data);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [chatId]);

  const handleSend = async (text: string) => {
    if (!user) return;

    const message = {
      id: `msg_${Date.now()}`,
      senderId: user.id,
      text,
      createdAt: Date.now(),
    };

    await sendMessage(chatId as string, message);

    // Optimistic update
    setChat((prev: any) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 opacity-20" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-8 pt-8 pb-12 animate-in fade-in duration-700">
      <div className="max-w-4xl mx-auto space-y-6">
        <button 
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 hover:text-blue-600 transition-colors group mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          Back to Communications Hub
        </button>

        {!chat ? (
          <div className="py-32 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
            <MessageSquare className="w-16 h-16 text-slate-100 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-2 text-slate-900">Channel Not Located</h2>
            <p className="text-slate-500 text-sm italic mb-8 max-w-xs mx-auto">The requested secure session could not be established or has expired.</p>
            <Link href="/chat">
              <button className="bg-[#0B1F3A] text-white px-8 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg">
                Return to Hub
              </button>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <ChatWindow
              chat={chat}
              onSend={handleSend}
              userId={user?.id || ""}
            />
          </div>
        )}
      </div>
    </div>
  );
}
