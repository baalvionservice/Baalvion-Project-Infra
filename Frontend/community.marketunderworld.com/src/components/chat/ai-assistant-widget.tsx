"use client"

import React, { useRef, useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { Bot, X, Send, Mic, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/auth-context';

export function AiAssistantWidget() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/assistant/chat',
  });
  const bottomRef = useRef<HTMLDivElement>(null);

  // WebRTC Voice State
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    return () => stopVoice();
  }, []);

  if (!isAuthenticated) return null;

  const startVoice = async () => {
    try {
      setIsVoiceActive(true);
      // Get ephemeral token
      const tokenResponse = await fetch("/api/assistant/session");
      const data = await tokenResponse.json();
      const EPHEMERAL_KEY = data.client_secret.value;

      // Create peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Play remote audio
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioElRef.current = audioEl;
      
      pc.ontrack = e => {
        if (e.streams[0]) {
          audioEl.srcObject = e.streams[0];
        }
      };

      // Add local microphone track
      let ms: MediaStream;
      try {
        ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        alert("Microphone access is required for voice chat.");
        stopVoice();
        return;
      }
      pc.addTrack(ms.getTracks()[0]);

      // Create data channel (required for realtime API)
      const dc = pc.createDataChannel("oai-events");
      
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
          stopVoice();
        }
      };

      // Create and set offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer to OpenAI and get answer
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp"
        },
      });

      const answerSdp = await sdpResponse.text();
      const answer = { type: "answer" as RTCSdpType, sdp: answerSdp };
      await pc.setRemoteDescription(answer);
    } catch (err) {
      console.error("Failed to start voice:", err);
      alert("Failed to connect to the voice assistant.");
      stopVoice();
    }
  };

  function stopVoice() {
    setIsVoiceActive(false);
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.srcObject = null;
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Assistant"
        className="fixed bottom-6 right-24 z-[9998] w-14 h-14 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center text-white shadow-[0_0_15px_rgba(37,99,235,0.6)] transition-transform hover:scale-110"
      >
        <Bot className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-80 sm:w-96 h-[500px] z-[9999] bg-[#0B0C0F] border border-blue-600/50 rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.2)] flex flex-col overflow-hidden"
          >
            <div className="bg-blue-950/80 p-4 border-b border-blue-600/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bot className="w-6 h-6 text-blue-500" />
                <div>
                  <h3 className="font-bold text-white text-sm">AI Assistant</h3>
                  <p className="text-[10px] text-blue-400 font-mono">Powered by OpenAI</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isVoiceActive ? (
                  <button onClick={stopVoice} aria-label="Stop Voice" className="text-red-400 hover:text-red-300">
                    <Square className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={startVoice} aria-label="Start Voice" className="text-gray-400 hover:text-white">
                    <Mic className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} aria-label="Close" className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/40">
              {messages.length === 0 && !isVoiceActive && (
                <div className="text-center text-gray-500 text-sm mt-10">
                  Ask me about products in Market Underworld!
                </div>
              )}
              {isVoiceActive && (
                <div className="text-center text-blue-400 text-sm mt-10 animate-pulse">
                  Listening... Speak now.
                </div>
              )}
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-[#1A1D24] text-gray-200 rounded-bl-none border border-gray-800'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-3 bg-[#1A1D24] border-t border-gray-800">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  disabled={isLoading || isVoiceActive}
                  placeholder={isVoiceActive ? "Voice mode active..." : "Ask about products..."}
                  className="flex-1 bg-black/50 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading || isVoiceActive}
                  className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
