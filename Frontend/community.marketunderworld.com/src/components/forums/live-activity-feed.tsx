"use client";

import { useEffect, useState } from "react";
import { communityChatClient, ChatMessage } from "@/lib/realtime/community-chat-client";

export function LiveActivityFeed() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Connect and join the "global" or general activity room
    // Here we assume "general" is a community slug for global activity, 
    // or you can iterate through the user's communities to join them all.
    const connectAndJoin = async () => {
      try {
        await communityChatClient.connect();
        // For demonstration, let's join a placeholder "general" room
        // or just rely on global events if your backend emits them
        await communityChatClient.joinRoom("general");
        setError(null);
      } catch (err: any) {
        console.error("Failed to connect to live activity feed", err);
        // Only show error if it's not a generic unauthenticated state (handled by UI)
        if (err.message !== "Not signed in") {
          setError("Live feed disconnected.");
        }
      }
    };
    connectAndJoin();

    // 2. Listen for connection state changes
    const unsubConnection = communityChatClient.onConnectionChange((isConnected) => {
      setConnected(isConnected);
    });

    // 3. Listen for new messages
    const unsubMessage = communityChatClient.onMessage((msg) => {
      setMessages((prev) => [msg, ...prev].slice(0, 50)); // keep last 50
    });

    return () => {
      unsubConnection();
      unsubMessage();
      communityChatClient.leaveRoom("general");
      communityChatClient.disconnect();
    };
  }, []);

  return (
    <div className="bg-[#111111] border border-[#222] rounded-lg p-4 sticky top-24">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-200 flex items-center gap-2">
          <span className="text-amber-500">⚡</span> Live Activity
        </h3>
        <div className="flex items-center gap-2">
          {error ? (
            <span className="text-xs text-red-500" title={error}>● Disconnected</span>
          ) : (
            <span className={`text-xs ${connected ? "text-green-500" : "text-yellow-500"}`}>
              {connected ? "● Live" : "● Connecting..."}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-sm text-gray-500 italic text-center py-4">
            No recent activity.
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="text-sm border-b border-[#222] pb-2 last:border-0 animate-fade-in">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-amber-500/80">{msg.username || "Anonymous"}</span>
                <span className="text-xs text-gray-500">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-gray-300 truncate" title={msg.content}>
                {msg.content}
              </p>
              <div className="text-xs text-gray-600 mt-1">
                in <span className="uppercase">{msg.slug}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
