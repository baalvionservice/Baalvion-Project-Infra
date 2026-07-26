"use client";

import { useEffect, useRef, useState } from "react";
import { Headphones, Play, Pause, Square } from "lucide-react";

// Real, working "Listen" player using the browser's native Web Speech API —
// no TTS API key, no audio generation/storage pipeline, no per-article cost.
// Matches this codebase's existing keyless-first pattern (see Demo Mode):
// ship a real feature with zero new infrastructure now; swap in a hosted
// TTS provider (ElevenLabs/Google Cloud TTS) later behind this same
// component if a studio-quality voice becomes a priority — that's a
// deliberate infra + cost decision, not something to wire up silently here.
export function ListenBar({ text, estimatedMinutes }: { text: string; estimatedMinutes?: number }) {
  const [supported, setSupported] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!supported || !text.trim()) return null;

  const handlePlayPause = () => {
    const synth = window.speechSynthesis;
    if (playing && !paused) {
      synth.pause();
      setPaused(true);
      return;
    }
    if (playing && paused) {
      synth.resume();
      setPaused(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.onend = () => {
      setPlaying(false);
      setPaused(false);
    };
    utterance.onerror = () => {
      setPlaying(false);
      setPaused(false);
    };
    utteranceRef.current = utterance;
    synth.cancel();
    synth.speak(utterance);
    setPlaying(true);
    setPaused(false);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setPlaying(false);
    setPaused(false);
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 my-6">
      <Headphones className="h-4 w-4 text-gray-500 flex-shrink-0" />
      <span className="text-sm font-semibold text-gray-900">Listen</span>
      {estimatedMinutes && (
        <span className="text-xs font-semibold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
          {estimatedMinutes} min
        </span>
      )}
      <div className="flex-1" />
      <button
        type="button"
        onClick={handlePlayPause}
        aria-label={playing && !paused ? "Pause" : "Play"}
        className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-900 text-white hover:bg-[#CC0000] transition-colors"
      >
        {playing && !paused ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
      </button>
      {playing && (
        <button
          type="button"
          onClick={handleStop}
          aria-label="Stop"
          className="flex items-center justify-center h-8 w-8 rounded-full border border-gray-300 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors"
        >
          <Square className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
