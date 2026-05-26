"use client";

import React, { useState } from "react";
import Image from "next/image";
import { COUNTRIES } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Globe,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/lib/store";
import { useParams } from "next/navigation";

export default function AppointmentBookingPage() {
  const { country } = useParams();
  const countryCode = (country as string) || "us";
  const currentCountry = COUNTRIES[countryCode] || COUNTRIES.us;
  const { upsertAppointment } = useAppStore();
  const { toast } = useToast();

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState("Private Viewing");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertAppointment({
      id: `apt-${Date.now()}`,
      customerId: "guest",
      customerName: "Anonymous Connoisseur",
      type: type as any,
      date,
      time,
      city: currentCountry.office?.city || "New York",
      status: "pending",
      brandId: "amarise-luxe",
    });
    toast({
      title: "Appointment Requested",
      description:
        "A Maison curator will contact you shortly to finalize your experience.",
    });
  };

  return (
    <div className="animate-fade-in bg-ivory pb-32">
      <section className="relative h-[40vh] w-full flex items-center justify-center overflow-hidden border-b border-border">
        <Image
          src="https://picsum.photos/seed/amarise-viewing/2560/1440"
          alt="Maison Private Salon"
          fill
          className="object-cover opacity-60 grayscale-[50%]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ivory/20 to-ivory" />
        <div className="relative z-10 text-center space-y-4 px-6">
          <span className="text-primary text-[10px] font-bold tracking-[0.5em] uppercase">
            Private Salon Experience
          </span>
          <h1 className="text-6xl md:text-7xl font-headline font-bold italic text-gray-900 leading-tight">
            Book Your Visit
          </h1>
        </div>
      </section>

      <div className="container mx-auto px-6 mt-20 max-w-4xl">
        <div className="bg-white p-12 shadow-luxury border border-border grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-headline font-bold italic">
                The Atelier Protocol
              </h2>
              <p className="text-sm text-muted-foreground font-light leading-relaxed italic">
                "An intimate exploration of the Maison's archive, guided by our
                senior curators in a private environment."
              </p>
            </div>
            <div className="space-y-6">
              <BenefitItem
                icon={<ShieldCheck className="w-4 h-4 text-gold" />}
                label="Complimentary Viewing"
                desc="No acquisition obligation."
              />
              <BenefitItem
                icon={<Globe className="w-4 h-4 text-gold" />}
                label="Global Concierge"
                desc="Available in all 5 international hubs."
              />
              <BenefitItem
                icon={<Sparkles className="w-4 h-4 text-gold" />}
                label="Bespoke Presentation"
                desc="Curated selection based on your taste."
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest font-bold">
                Experience Type
              </Label>
              <Select onValueChange={setType} defaultValue="Private Viewing">
                <SelectTrigger className="rounded-none bg-ivory/50 border-border h-12">
                  <SelectValue placeholder="Select Experience" />
                </SelectTrigger>
                <SelectContent className="bg-white border-border shadow-luxury">
                  <SelectItem
                    value="Private Viewing"
                    className="text-[10px] uppercase font-bold"
                  >
                    Private Viewing
                  </SelectItem>
                  <SelectItem
                    value="Virtual Try-on"
                    className="text-[10px] uppercase font-bold"
                  >
                    Virtual Try-on
                  </SelectItem>
                  <SelectItem
                    value="Atelier Tour"
                    className="text-[10px] uppercase font-bold"
                  >
                    Atelier Tour
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold">
                  Preferred Date
                </Label>
                <Input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-none bg-ivory/50 border-border h-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold">
                  Preferred Time
                </Label>
                <Input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="rounded-none bg-ivory/50 border-border h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest font-bold">
                Atelier Location
              </Label>
              <div className="p-4 bg-ivory/50 border border-border flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-gold" />
                <span className="text-xs font-bold uppercase">
                  {currentCountry.office?.city} Flagship
                </span>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-16 bg-plum text-white hover:bg-gold hover:text-gray-900 rounded-none text-[10px] tracking-[0.4em] font-bold transition-all shadow-xl shadow-plum/10"
            >
              REQUEST APPOINTMENT
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function BenefitItem({
  icon,
  label,
  desc,
}: {
  icon: any;
  label: string;
  desc: string;
}) {
  return (
    <div className="flex items-start space-x-4">
      <div className="mt-1">{icon}</div>
      <div className="space-y-1">
        <h4 className="text-[10px] font-bold uppercase tracking-widest">
          {label}
        </h4>
        <p className="text-[11px] text-gray-400 italic">{desc}</p>
      </div>
    </div>
  );
}
