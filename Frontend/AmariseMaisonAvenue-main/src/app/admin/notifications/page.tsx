"use client";

import React from "react";
import Link from "next/link";
import {
  Bell,
  ChevronRight,
  RefreshCcw,
  LayoutDashboard,
  ShieldCheck,
  Globe,
  Settings,
  Mail,
  Zap,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NotificationFeed } from "@/components/admin/NotificationFeed";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function NotificationsAdminPage() {
  const { scopedNotifications, currentUser } = useAppStore();

  return (
    <div className="flex h-screen bg-ivory overflow-hidden font-body text-gray-900">
      <aside className="w-72 border-r border-border bg-white p-8 flex flex-col space-y-12 shadow-sm z-20">
        <div className="space-y-4">
          <div className="font-headline text-3xl font-bold tracking-tighter text-gray-900">
            AMARISÉ{" "}
            <span className="text-plum text-xs font-normal tracking-[0.4em] ml-2">
              CORE
            </span>
          </div>
          <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">
            Alerts Terminal
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          <AdminNavItem
            icon={<LayoutDashboard />}
            label="Dashboard"
            href="/admin"
          />
          <AdminNavItem
            icon={<Bell />}
            label="Institutional Alerts"
            href="/admin/notifications"
            active
          />
          <AdminNavItem icon={<Settings />} label="Preferences" href="#" />
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
              Communication Registry
            </h1>
            <p className="text-gray-400 text-[10px] tracking-widest uppercase font-bold mt-1">
              {currentUser?.country.toUpperCase()} Market • Curatorial Alerts
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              className="rounded-none border-border text-[9px] font-bold uppercase tracking-widest h-10 px-6"
            >
              <Trash2 className="w-3 h-3 mr-2" /> CLEAR ALL
            </Button>
          </div>
        </header>

        <div className="p-12 space-y-12 animate-fade-in pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8">
              <Card className="bg-white border-border shadow-luxury overflow-hidden">
                <CardHeader className="border-b border-border bg-ivory/10">
                  <div className="flex justify-between items-center">
                    <CardTitle className="font-headline text-2xl">
                      Maison Feed
                    </CardTitle>
                    <div className="flex items-center space-x-4">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        Showing {scopedNotifications.length} entries
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-10">
                  <NotificationFeed showTitle={false} maxItems={50} />
                </CardContent>
              </Card>
            </div>

            <aside className="lg:col-span-4 space-y-8">
              <Card className="bg-black text-white p-8 space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <ShieldCheck className="w-32 h-32" />
                </div>
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center space-x-3 text-secondary">
                    <Mail className="w-5 h-5" />
                    <h4 className="text-[10px] font-bold uppercase tracking-widest">
                      Email Scoping
                    </h4>
                  </div>
                  <p className="text-xs font-light italic leading-relaxed opacity-70">
                    "Institutional email alerts are dispatched for high-priority
                    Tier 1 leads and AI system volatility only."
                  </p>
                  <Button
                    variant="outline"
                    className="w-full rounded-none border-secondary text-secondary h-12 text-[9px] font-bold uppercase tracking-widest hover:bg-secondary hover:text-black"
                  >
                    CONFIGURE SMTP BRIDGE
                  </Button>
                </div>
              </Card>

              <Card className="bg-white border-border p-8 space-y-6 shadow-sm">
                <div className="flex items-center space-x-3 text-plum">
                  <Zap className="w-5 h-5" />
                  <h4 className="text-[10px] font-bold uppercase tracking-widest">
                    Automation Logs
                  </h4>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest border-b border-border pb-2">
                    <span className="text-gray-400">Push Latency</span>
                    <span className="text-plum">12ms</span>
                  </div>
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest border-b border-border pb-2">
                    <span className="text-gray-400">Delivery Success</span>
                    <span className="text-plum">100%</span>
                  </div>
                </div>
              </Card>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

function AdminNavItem({
  icon,
  label,
  active,
  href,
}: {
  icon: any;
  label: string;
  active?: boolean;
  href: string;
}) {
  return (
    <Link href={href}>
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
    </Link>
  );
}
