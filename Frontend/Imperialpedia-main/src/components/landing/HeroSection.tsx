"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Container } from "@/design-system/layout/container";
import { Text } from "@/design-system/typography/text";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Globe,
  Activity,
  Zap,
} from "lucide-react";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useTranslation } from "react-i18next";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { logEvent } from "@/lib/utils/analytics";
import { WaitlistModal } from "./WaitlistModal";
import { WaitlistForm } from "./WaitlistForm";

export const HeroSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useTranslation("common");
  const heroImage = PlaceHolderImages.find((img) => img.id === "hero-bg");

  const handleCtaClick = (type: string) => {
    logEvent("CTA Click", "Engagement", `Hero ${type} Button`);
    setIsModalOpen(true);
  };

  return (
    <section
      role="banner"
      aria-label="Imperialpedia Hero"
      className=" pt-20 pb-32 lg:pt-32 lg:pb-48 overflow-hidden bg-gray-50 dark:bg-background"
    >
      <div
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-6xl pointer-events-none blur-[120px] opacity-20 z-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary rounded-full" />
      </div>

      <Container className="relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary"
          >
            <Sparkles className="h-4 w-4 animate-pulse" aria-hidden="true" />
            <Text
              variant="label"
              className="text-[10px] font-bold uppercase tracking-[0.2em]"
            >
              {t("hero.badge")}
            </Text>
          </motion.div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Text
                variant="display"
                as="h1"
                className="text-4xl sm:text-5xl lg:text-8xl font-bold tracking-tight leading-[1.1] text-balance"
              >
                {t("hero.title")}
              </Text>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <Text
                variant="body"
                className="text-muted-foreground text-lg sm:text-xl lg:text-2xl max-w-2xl mx-auto leading-relaxed text-balance"
              >
                {t("hero.subtitle")}
              </Text>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex flex-col items-center gap-8 pt-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
              <Button
                size="lg"
                onClick={() => handleCtaClick("Primary")}
                aria-label={t("hero.cta")}
                className="h-16 px-10 rounded-2xl font-bold text-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xl shadow-primary/30 transition-all scale-105 active:scale-95 group focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:ring-2"
              >
                {t("hero.cta")}{" "}
                <ArrowRight
                  className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleCtaClick("Secondary")}
                aria-label={t("hero.secondary_cta")}
                className="h-16 px-10 rounded-2xl font-bold text-lg border-white/10 bg-card/30 hover:bg-white/5 transition-all focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:ring-2"
              >
                {t("hero.secondary_cta")}
              </Button>
            </div>

            <div className="mt-4 p-2 bg-card/30 border border-white/5 rounded-2xl shadow-xl">
              <ThemeToggle />
            </div>

            <div className="w-full pt-4">
              <WaitlistForm />
            </div>
          </motion.div>
        </div>
      </Container>

      <WaitlistModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </section>
  );
};
