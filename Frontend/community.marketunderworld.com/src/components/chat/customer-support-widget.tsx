"use client"

import React, { useState } from 'react';
import { Phone, PhoneOff, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function CustomerSupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [callState, setCallState] = useState<'idle' | 'calling' | 'connected'>('idle');

  const handleCall = () => {
    setCallState('calling');
    setTimeout(() => {
      setCallState('connected');
    }, 3000);
  };

  const handleHangup = () => {
    setCallState('idle');
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Call Customer Support"
        className="fixed bottom-6 right-44 z-[9998] w-14 h-14 bg-green-600 hover:bg-green-500 rounded-full flex items-center justify-center text-white shadow-[0_0_15px_rgba(22,163,74,0.6)] transition-transform hover:scale-110"
      >
        <Phone className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-80 sm:w-96 p-6 z-[9999] bg-[#0B0C0F] border border-green-600/50 rounded-2xl shadow-[0_0_30px_rgba(22,163,74,0.2)] flex flex-col items-center gap-6"
          >
            <div className="w-24 h-24 bg-green-900/50 rounded-full flex items-center justify-center border-4 border-green-500/30">
              <User className="w-12 h-12 text-green-400" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-white">Live Support</h3>
              <p className="text-sm text-gray-400">
                {callState === 'idle' && "Speak directly with our human operators."}
                {callState === 'calling' && "Connecting to next available operator..."}
                {callState === 'connected' && "Connected. 00:01"}
              </p>
            </div>

            <div className="flex items-center gap-4 mt-4">
              {callState === 'idle' ? (
                <button
                  onClick={handleCall}
                  className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-500 transition-colors shadow-lg shadow-green-900/50"
                >
                  <Phone className="w-6 h-6 text-white" />
                </button>
              ) : (
                <button
                  onClick={handleHangup}
                  className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors shadow-lg shadow-red-900/50"
                >
                  <PhoneOff className="w-6 h-6 text-white" />
                </button>
              )}
              {callState === 'idle' && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
            
            {callState === 'calling' && (
              <div className="absolute top-4 right-4 text-green-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
