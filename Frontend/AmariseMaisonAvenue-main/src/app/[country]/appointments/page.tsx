"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BrandImage } from "@/components/ui/BrandImage";
import { COUNTRIES } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin,
  Sparkles,
  ShieldCheck,
  Globe,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useParams } from "next/navigation";
import {
  appointmentsApi,
  type AppointmentBookPayload,
} from "@/lib/api-client";
import type { StoreAppointment, StoreAppointmentType } from "@/lib/types";

const APPOINTMENT_TYPES: { value: StoreAppointmentType; label: string }[] = [
  { value: "showroom", label: "Private Showroom Viewing" },
  { value: "virtual", label: "Virtual Try-on" },
  { value: "in_home", label: "In-Home Presentation" },
  { value: "phone", label: "Telephone Consultation" },
];

export default function AppointmentBookingPage() {
  const { country } = useParams();
  const countryCode = (country as string) || "us";
  const currentCountry = COUNTRIES[countryCode] || COUNTRIES.us;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState<StoreAppointmentType>("showroom");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState<StoreAppointment | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Please tell us your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return setError("Please provide a valid email address.");
    }
    if (!date || !time) return setError("Please choose a preferred date and time.");

    // Combine local date + time into an ISO datetime for the backend.
    const preferred = new Date(`${date}T${time}`);
    if (Number.isNaN(preferred.getTime())) {
      return setError("That date and time could not be understood.");
    }

    setIsSubmitting(true);
    const payload: AppointmentBookPayload = {
      customerName: name.trim(),
      customerEmail: email.trim(),
      type,
      preferredAt: preferred.toISOString(),
    };
    if (phone.trim()) payload.customerPhone = phone.trim();
    if (notes.trim()) payload.notes = notes.trim();

    const res = await appointmentsApi.book(payload);
    setIsSubmitting(false);

    if (res.ok) {
      setBooked(res.data);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setError(res.error.message || "We could not request your appointment. Please try again.");
    }
  };

  return (
    <div className="animate-fade-in bg-ivory pb-32">
      <section className="relative h-[40vh] w-full flex items-center justify-center overflow-hidden border-b border-border">
        <BrandImage
          src="https://picsum.photos/seed/amarise-viewing/2560/1440"
          alt="Maison Private Salon"
          className="absolute inset-0"
          imgClassName="opacity-60 grayscale-[50%]"
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
        {booked ? (
          <AppointmentSuccess
            appointment={booked}
            countryCode={countryCode}
            onBookAnother={() => {
              setBooked(null);
              setDate("");
              setTime("");
              setNotes("");
            }}
          />
        ) : (
          <div className="bg-white p-12 shadow-luxury border border-border grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-headline font-bold italic">
                  The Atelier Protocol
                </h2>
                <p className="text-sm text-muted-foreground font-light leading-relaxed italic">
                  &ldquo;An intimate exploration of the Maison&rsquo;s archive, guided by our
                  senior curators in a private environment.&rdquo;
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
                  Full Name
                </Label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="rounded-none bg-ivory/50 border-border h-12"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest font-bold">
                    Email
                  </Label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="rounded-none bg-ivory/50 border-border h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest font-bold">
                    Phone (optional)
                  </Label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555 000 0000"
                    className="rounded-none bg-ivory/50 border-border h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold">
                  Experience Type
                </Label>
                <Select
                  value={type}
                  onValueChange={(v) => setType(v as StoreAppointmentType)}
                >
                  <SelectTrigger className="rounded-none bg-ivory/50 border-border h-12">
                    <SelectValue placeholder="Select Experience" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-border shadow-luxury">
                    {APPOINTMENT_TYPES.map((t) => (
                      <SelectItem
                        key={t.value}
                        value={t.value}
                        className="text-[10px] uppercase font-bold"
                      >
                        {t.label}
                      </SelectItem>
                    ))}
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
                  Notes (optional)
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Pieces of interest, accessibility needs…"
                  rows={3}
                  className="rounded-none bg-ivory/50 border-border"
                />
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

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-3 border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-600"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-16 bg-plum text-white hover:bg-gold hover:text-gray-900 rounded-none text-[10px] tracking-[0.4em] font-bold transition-all shadow-xl shadow-plum/10"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> REQUESTING…
                  </>
                ) : (
                  "REQUEST APPOINTMENT"
                )}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function AppointmentSuccess({
  appointment,
  countryCode,
  onBookAnother,
}: {
  appointment: StoreAppointment;
  countryCode: string;
  onBookAnother: () => void;
}) {
  const typeLabel =
    APPOINTMENT_TYPES.find((t) => t.value === appointment.type)?.label ||
    String(appointment.type).replace(/_/g, " ");
  const when = appointment.preferredAt
    ? new Date(appointment.preferredAt).toLocaleString()
    : null;

  return (
    <div className="bg-white p-12 shadow-luxury border border-border text-center space-y-8">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
      </div>
      <div className="space-y-3">
        <h2 className="text-3xl font-headline font-bold italic">
          Appointment Requested
        </h2>
        <p className="text-sm text-muted-foreground font-light italic max-w-md mx-auto leading-relaxed">
          A Maison curator will contact you shortly to confirm your experience.
        </p>
      </div>

      <div className="max-w-sm mx-auto space-y-3 text-left border border-border divide-y divide-border">
        <DetailRow label="Experience" value={typeLabel} />
        {when && <DetailRow label="Preferred" value={when} />}
        <DetailRow label="Name" value={appointment.customerName} />
        {appointment.status && (
          <DetailRow
            label="Status"
            value={String(appointment.status).replace(/_/g, " ")}
          />
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button
          type="button"
          onClick={onBookAnother}
          variant="outline"
          className="rounded-none border-gray-900 h-12 px-10 text-[10px] font-bold tracking-[0.2em] uppercase"
        >
          Book Another
        </Button>
        <Link href={`/${countryCode}`}>
          <Button className="rounded-none bg-black text-white hover:bg-plum h-12 px-10 text-[10px] font-bold tracking-[0.2em] uppercase">
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
        {label}
      </span>
      <span className="text-sm font-medium text-gray-900 capitalize">{value}</span>
    </div>
  );
}

function BenefitItem({
  icon,
  label,
  desc,
}: {
  icon: React.ReactNode;
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
