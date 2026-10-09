"use client"

import { useState, useEffect } from "react";
import posthog from "posthog-js";
import { motion, AnimatePresence } from "framer-motion";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("mu_cookie_consent");
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("mu_cookie_consent", "granted");
    posthog.opt_in_capturing();
    setShow(false);
  };

  const handleDecline = () => {
    localStorage.setItem("mu_cookie_consent", "denied");
    posthog.opt_out_capturing();
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[10000] p-4 flex justify-center pointer-events-none"
        >
          <div className="bg-[#1A1D24] border border-gray-700 rounded-xl p-4 shadow-2xl max-w-4xl w-full flex flex-col sm:flex-row items-center justify-between gap-4 pointer-events-auto">
            <div className="text-sm text-gray-300 flex-1">
              <strong className="text-white block mb-1">We value your privacy</strong>
              We use PostHog analytics to understand how you use Market Underworld. We also offer AI Voice features that process your voice data via OpenAI when you use them. You can opt out of analytics tracking at any time.
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleDecline}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Decline Analytics
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-2 text-sm font-medium bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
              >
                Accept All
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
