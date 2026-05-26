"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Mail,
  MessageSquare,
  Send,
  Plus,
  ChevronRight,
  RefreshCcw,
  Edit3,
  Smartphone,
  LayoutDashboard,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMessaging } from "@/hooks/use-messaging";
import { cn } from "@/lib/utils";

export default function MessagingAdminHub() {
  const { templates, updateTemplate } = useMessaging();
  const [selectedId, setSelectedId] = useState(templates[0]?.id);

  const currentTemplate = templates.find((t) => t.id === selectedId);

  return (
    <div className="flex h-screen bg-ivory overflow-hidden font-body text-gray-900">
      <aside className="w-72 border-r border-border bg-white p-8 flex flex-col space-y-12 shadow-sm z-20">
        <div className="space-y-4">
          <div className="font-headline text-3xl font-bold tracking-tighter text-gray-900">
            AMARISÉ{" "}
            <span className="text-plum text-xs font-normal tracking-[0.4em] ml-2">
              SYNC
            </span>
          </div>
          <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">
            Messaging Terminal
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          <MessageNavItem
            icon={<LayoutDashboard />}
            label="Outreach Hub"
            active={true}
          />
          <MessageNavItem
            icon={<Smartphone />}
            label="WhatsApp Flows"
            active={false}
          />
          <MessageNavItem
            icon={<Mail />}
            label="Email Narratives"
            active={false}
          />
        </nav>

        <div className="pt-8 border-t border-border space-y-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-plum group"
            asChild
          >
            <Link href="/admin">
              <RefreshCcw className="w-4 h-4 mr-3" /> Master Control
            </Link>
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-ivory relative">
        <header className="flex justify-between items-center bg-white/80 luxury-blur p-8 border-b border-border sticky top-0 z-30">
          <div>
            <h1 className="text-3xl font-headline font-bold italic text-gray-900 uppercase tracking-widest">
              Outreach Matrix
            </h1>
            <p className="text-gray-400 text-[10px] tracking-widest uppercase font-bold mt-1">
              Curatorial Dialogue Templates
            </p>
          </div>
          <Button className="bg-plum text-white hover:bg-gold h-10 px-6 rounded-none text-[9px] font-bold uppercase tracking-widest">
            <Plus className="w-3 h-3 mr-2" /> NEW TEMPLATE
          </Button>
        </header>

        <div className="p-12 space-y-12 animate-fade-in pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            <Card className="lg:col-span-1 bg-white border-border shadow-luxury h-[70vh] overflow-y-auto custom-scrollbar">
              <CardHeader className="border-b border-border">
                <CardTitle className="font-headline text-xl">
                  Script Repository
                </CardTitle>
              </CardHeader>
              <div className="p-2 space-y-1">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className={cn(
                      "w-full text-left px-6 py-4 transition-all rounded-sm border",
                      selectedId === t.id
                        ? "bg-plum text-white border-plum shadow-md"
                        : "text-gray-400 hover:bg-ivory hover:text-plum border-transparent"
                    )}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest">
                      {t.name}
                    </p>
                    <p className="text-[8px] uppercase tracking-tighter opacity-60 mt-1">
                      Stage: {t.stage}
                    </p>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="lg:col-span-2 bg-white border-border shadow-luxury">
              {currentTemplate ? (
                <>
                  <CardHeader className="border-b border-border bg-ivory/30">
                    <CardTitle className="font-headline text-2xl uppercase tracking-tight">
                      {currentTemplate.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-10 space-y-8">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-bold">
                        Template Body
                      </Label>
                      <Textarea
                        value={currentTemplate.template}
                        onChange={(e) =>
                          updateTemplate({
                            ...currentTemplate,
                            template: e.target.value,
                          })
                        }
                        className="rounded-none border-border bg-ivory/20 min-h-[300px] italic font-light leading-relaxed"
                      />
                    </div>
                    <div className="pt-8 border-t border-border flex justify-end">
                      <Button className="bg-plum text-white hover:bg-black h-12 px-12 rounded-none text-[10px] font-bold uppercase tracking-widest">
                        SYNC TEMPLATE
                      </Button>
                    </div>
                  </CardContent>
                </>
              ) : (
                <div className="p-40 text-center text-gray-400 italic">
                  Select a script to manage messaging logic.
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function MessageNavItem({
  icon,
  label,
  active,
}: {
  icon: any;
  label: string;
  active: boolean;
}) {
  return (
    <button
      className={cn(
        "w-full flex items-center space-x-4 px-6 py-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-all group rounded-sm border",
        active
          ? "bg-plum text-white border-plum shadow-md"
          : "text-gray-400 hover:bg-ivory hover:text-plum border-transparent"
      )}
    >
      <span
        className={cn(
          "transition-transform group-hover:scale-110",
          active ? "text-white" : "text-gold"
        )}
      >
        {React.cloneElement(icon as React.ReactElement<any>, {
          className: "w-5 h-5",
        })}
      </span>
      <span>{label}</span>
      {active && <ChevronRight className="w-4 h-4 ml-auto" />}
    </button>
  );
}
