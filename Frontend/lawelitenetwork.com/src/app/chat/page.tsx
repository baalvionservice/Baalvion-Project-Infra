"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getUserChats } from "@/services/chatService";
import ChatList from "@/components/chat/ChatList";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { ShieldCheck, Loader2 } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

/**
 * @fileOverview ChatOverviewPage
 * Cleaned up loading state by removing text labels.
 */
export default function ChatPage() {
  return (
    <ProtectedRoute>
      <DashboardShell>
        <ChatContent />
      </DashboardShell>
    </ProtectedRoute>
  );
}

function ChatContent() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [chats, setChats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (user) {
        setIsLoading(true);
        try {
          const data = await getUserChats(user.id);
          setChats(data);
        } finally {
          setIsLoading(false);
        }
      }
    };
    load();
  }, [user]);

  return (
    <div className="container mx-auto px-8 pt-8 pb-12 animate-in fade-in duration-700">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" />
              Secure Uplink
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-4">
            Communications Hub
          </h1>
          <p className="text-slate-500 text-sm font-medium italic mt-2">Manage your end-to-end encrypted professional channels.</p>
        </header>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 opacity-20" />
          </div>
        ) : (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <ChatList
              chats={chats}
              userId={user?.id || ""}
              onSelect={(id: string) => router.push(`/chat/${id}`)}
            />
          </div>
        )}
      </div>
    </div>
  );
}