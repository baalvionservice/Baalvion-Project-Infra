"use client"

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

export const ReadingProgressBar = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <motion.div
      className="fixed top-8 left-0 right-0 h-[2px] bg-gradient-to-r from-[#6C63FF] to-[#00D4FF] origin-left z-[160]"
      style={{ scaleX }}
    />
  );
};
