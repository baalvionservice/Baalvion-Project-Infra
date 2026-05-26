"use client";

import React, { useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { COUNTRIES } from "@/lib/mock-data";
import { users as RBAC_USERS } from "@/lib/permissions/mock-users";
import { Button } from "@/components/ui/button";
import {
  Globe,
  LayoutDashboard,
  Settings2,
  PlayCircle,
  Zap,
  X,
  UserCheck,
  Target,
  FileText,
  CreditCard,
  FlaskConical,
  Eye,
  Lock,
  Search,
  Activity,
  ShieldCheck,
  User,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * ShowcaseControls: The master platform switcher.
 * Optimized for seamless transitions between Admin, Client, and Storefront domains.
 */
export function ShowcaseControls() {
  const { country } = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const {
    isShowcaseMode,
    setShowcaseMode,
    currentUser,
    setCurrentUser,
    recordLog,
  } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);

  const currentCountry = (country as string) || "us";

  const handleCountrySwitch = (code: string) => {
    if (!pathname) return;
    const newPath = pathname.replace(`/${currentCountry}`, `/${code}`);
    router.push(newPath);
  };

  const handlePersonaSwitch = (userId: string) => {
    const user = RBAC_USERS.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);

      // Auto-route based on persona for better switching experience
      if (user.role === "super_admin" || user.role === "country_admin") {
        router.push("/admin");
      } else if (user.role === "client") {
        router.push(`/${currentCountry}/account`);
      }

      setIsOpen(false);
    }
  };

  if (!isShowcaseMode)
    return (
      <Button
        onClick={() => setShowcaseMode(true)}
        className="fixed bottom-6 right-6 z-[100] bg-white border-gold text-gold hover:bg-gold hover:text-white rounded-full shadow-luxury h-12 px-6"
      >
        <PlayCircle className="w-4 h-4 mr-2" /> Open Command Hub
      </Button>
    );

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end space-y-4">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button className="w-16 h-16 bg-gold text-gray-900 rounded-full shadow-luxury flex items-center justify-center transition-all hover:scale-110 active:scale-95 group relative hover:shadow-gold-glow border-none outline-none cursor-pointer">
            <Settings2
              className={cn(
                "w-7 h-7 transition-transform duration-500",
                isOpen && "rotate-180"
              )}
            />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-plum opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-plum border-2 border-white"></span>
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-[480px] p-0 bg-white border-border shadow-luxury overflow-hidden"
        >
          <div className="p-6 bg-gold/10 border-b border-border">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-sm font-headline font-bold text-gray-900 uppercase tracking-widest">
                Maison Command Hub
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="border-none bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-plum" />
              </button>
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
              Universal Platform Control • Level 3 SECURE
            </p>
          </div>

          <div className="p-6 space-y-10 max-h-[75vh] overflow-y-auto custom-scrollbar">
            {/* 1. Global Domain Router */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-plum">
                <ExternalLink className="w-3 h-3" />
                <span>Jump to Domain</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <DomainLink
                  icon={<LayoutDashboard />}
                  label="Admin Matrix"
                  href="/admin"
                  color="text-blue-500"
                  onClick={() => setIsOpen(false)}
                />
                <DomainLink
                  icon={<User />}
                  label="Client Portal"
                  href={`/${currentCountry}/account`}
                  color="text-plum"
                  onClick={() => setIsOpen(false)}
                />
                <DomainLink
                  icon={<ShoppingBag />}
                  label="Storefront"
                  href={`/${currentCountry}`}
                  color="text-gray-900"
                  onClick={() => setIsOpen(false)}
                />
              </div>
            </div>

            {/* 2. Admin Permissions Matrix */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-plum">
                <UserCheck className="w-3 h-3" />
                <span>Switch Identity (RBAC)</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {RBAC_USERS.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handlePersonaSwitch(user.id)}
                    className={cn(
                      "p-3 border text-[9px] font-bold uppercase tracking-widest text-left flex flex-col justify-between transition-all rounded-none outline-none cursor-pointer",
                      currentUser?.id === user.id
                        ? "bg-plum text-white border-plum shadow-md"
                        : "bg-ivory border-border text-gray-400 hover:bg-plum/5 hover:text-plum"
                    )}
                  >
                    <span className="truncate">{user.name}</span>
                    <span className="opacity-60 text-[7px] mt-1">
                      {(user.role || "").replace("_", " ").toUpperCase()}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Jurisdictional Switcher */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-plum">
                <Globe className="w-3 h-3" />
                <span>Switch Market Hub</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {Object.keys(COUNTRIES).map((code) => (
                  <button
                    key={code}
                    onClick={() => handleCountrySwitch(code)}
                    className={cn(
                      "h-10 border text-[10px] font-bold uppercase tracking-widest transition-all rounded-none outline-none cursor-pointer",
                      currentCountry === code
                        ? "bg-gold border-gold text-gray-900"
                        : "bg-ivory border-border text-gray-400 hover:bg-gold hover:text-gray-900"
                    )}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-ivory p-6 border-t border-border flex justify-between items-center">
            <button
              onClick={() => setShowcaseMode(false)}
              className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-destructive font-black transition-colors border-none bg-transparent outline-none cursor-pointer"
            >
              EXIT AUDIT MODE
            </button>
            <div className="flex items-center space-x-2 text-emerald-500">
              <ShieldCheck className="w-3 h-3" />
              <span className="text-[8px] text-gray-400 tracking-widest uppercase italic">
                Connection Secure
              </span>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function DomainLink({
  icon,
  label,
  href,
  color,
  onClick,
}: {
  icon: any;
  label: string;
  href: string;
  color: string;
  onClick: () => void;
}) {
  const router = useRouter();
  return (
    <button
      onClick={() => {
        onClick();
        router.push(href);
      }}
      className="flex flex-col items-center justify-center p-4 bg-white border border-border hover:border-black transition-all group shadow-sm aspect-square rounded-none outline-none cursor-pointer"
    >
      <span
        className={cn("transition-transform group-hover:scale-110 mb-2", color)}
      >
        {React.cloneElement(icon as React.ReactElement<any>, { size: 24 })}
      </span>
      <span className="text-[9px] font-bold uppercase tracking-tighter text-center">
        {label}
      </span>
    </button>
  );
}
