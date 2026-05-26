'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TestimonialCard } from './TestimonialCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Testimonial {
  name: string;
  role: string;
  company?: string;
  photoUrl?: string;
  content: string;
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
}

/**
 * High-fidelity Testimonial Carousel powered by Framer Motion.
 * Features automated temporal transitions and interactive navigation nodes.
 */
export default function TestimonialCarousel({ testimonials }: TestimonialCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 6000); // 6s cycle for institutional readability

    return () => clearInterval(interval);
  }, [testimonials.length, isAutoPlaying]);

  const next = () => {
    setIsAutoPlaying(false);
    setCurrent((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setIsAutoPlaying(false);
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto px-4 md:px-12">
      <div className="relative overflow-hidden min-h-[320px] flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            <TestimonialCard {...testimonials[current]} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Nodes */}
      <div className="flex items-center justify-center gap-6 mt-8">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={prev}
          className="rounded-xl border-white/10 bg-card/30 hover:bg-primary hover:text-white transition-all shadow-xl"
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex gap-2">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIsAutoPlaying(false);
                setCurrent(idx);
              }}
              className={cn(
                "h-1.5 transition-all duration-500 rounded-full",
                current === idx ? "w-8 bg-primary" : "w-2 bg-white/10 hover:bg-white/20"
              )}
              aria-label={`Go to testimonial ${idx + 1}`}
            />
          ))}
        </div>

        <Button 
          variant="outline" 
          size="icon" 
          onClick={next}
          className="rounded-xl border-white/10 bg-card/30 hover:bg-primary hover:text-white transition-all shadow-xl"
          aria-label="Next testimonial"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
