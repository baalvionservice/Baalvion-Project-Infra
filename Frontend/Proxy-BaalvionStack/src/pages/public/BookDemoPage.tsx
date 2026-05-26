import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Check, ArrowRight, Building2, Users, Globe, Zap } from "lucide-react";

const timeSlots = [
  "09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
];

const calendarDays = Array.from({ length: 28 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i + 1);
  return { date: d, available: Math.random() > 0.3 };
});

export default function BookDemoPage() {
  const [step, setStep] = useState<"form" | "calendar" | "success">("form");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", company: "", companySize: "", monthlyUsage: "", useCase: "", message: "" });

  const handleSubmit = () => {
    if (step === "form") { setStep("calendar"); return; }
    if (step === "calendar" && selectedDate && selectedTime) { setStep("success"); }
  };

  if (step === "success") {
    return (
      <div className="min-h-screen">
        <SEOHead title="Demo Booked" description="Your demo has been booked successfully." />
        <div className="container mx-auto px-4 py-32 max-w-lg text-center">
          <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Demo Booked!</h1>
          <p className="text-muted-foreground mb-2">
            We'll meet on <strong>{selectedDate?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</strong> at <strong>{selectedTime}</strong>.
          </p>
          <p className="text-muted-foreground mb-8">A calendar invite has been sent to <strong>{form.email || "your email"}</strong>.</p>
          <Card className="text-left">
            <CardContent className="p-6 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{form.name || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Company</span><span className="font-medium">{form.company || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Est. Usage</span><span className="font-medium">{form.monthlyUsage || "—"}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SEOHead title="Book a Demo" description="Schedule a personalized demo of Baalvion NetStack's enterprise proxy platform." canonical="https://baalvion.com/book-demo" />

      <div className="container mx-auto px-4 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Enterprise Sales</Badge>
            <h1 className="text-4xl font-bold mb-4">Book a Personalized Demo</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">See how Baalvion NetStack can power your proxy infrastructure at enterprise scale.</p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: Benefits */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="font-semibold text-lg">What you'll get:</h3>
              {[
                { icon: Globe, label: "Live platform walkthrough" },
                { icon: Zap, label: "Performance benchmarks for your use case" },
                { icon: Building2, label: "Custom architecture recommendations" },
                { icon: Users, label: "Team onboarding planning" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Right: Form or Calendar */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>{step === "form" ? "Tell Us About Your Needs" : "Pick a Date & Time"}</CardTitle>
                <CardDescription>{step === "form" ? "Step 1 of 2" : "Step 2 of 2"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {step === "form" ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <Input placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                      <Input placeholder="Work Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <Input placeholder="Company Name" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                    <div className="grid grid-cols-2 gap-4">
                      <Select value={form.companySize} onValueChange={(v) => setForm({ ...form, companySize: v })}>
                        <SelectTrigger><SelectValue placeholder="Company Size" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-10">1–10 employees</SelectItem>
                          <SelectItem value="11-50">11–50</SelectItem>
                          <SelectItem value="51-200">51–200</SelectItem>
                          <SelectItem value="201-1000">201–1,000</SelectItem>
                          <SelectItem value="1000+">1,000+</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={form.monthlyUsage} onValueChange={(v) => setForm({ ...form, monthlyUsage: v })}>
                        <SelectTrigger><SelectValue placeholder="Monthly Usage Est." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="<100GB">&lt;100 GB</SelectItem>
                          <SelectItem value="100-500GB">100–500 GB</SelectItem>
                          <SelectItem value="500GB-2TB">500 GB – 2 TB</SelectItem>
                          <SelectItem value="2TB+">2 TB+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Select value={form.useCase} onValueChange={(v) => setForm({ ...form, useCase: v })}>
                      <SelectTrigger><SelectValue placeholder="Primary Use Case" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scraping">Web Scraping & Data Collection</SelectItem>
                        <SelectItem value="seo">SEO Monitoring</SelectItem>
                        <SelectItem value="ads">Ad Verification</SelectItem>
                        <SelectItem value="market">Market Research</SelectItem>
                        <SelectItem value="security">Security Testing</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea placeholder="Anything else we should know? (optional)" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                    <Button variant="hero" className="w-full" onClick={handleSubmit}>
                      Continue to Schedule <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-7 gap-1">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                        <div key={d} className="text-center text-xs font-medium text-muted-foreground p-2">{d}</div>
                      ))}
                      {calendarDays.slice(0, 28).map((day, i) => (
                        <button
                          key={i}
                          disabled={!day.available}
                          onClick={() => setSelectedDate(day.date)}
                          className={`p-2 text-sm rounded-lg text-center transition-colors ${
                            selectedDate?.toDateString() === day.date.toDateString()
                              ? "bg-primary text-primary-foreground"
                              : day.available
                              ? "hover:bg-secondary/50"
                              : "text-muted-foreground/30 cursor-not-allowed"
                          }`}
                        >
                          {day.date.getDate()}
                        </button>
                      ))}
                    </div>
                    {selectedDate && (
                      <div>
                        <p className="text-sm font-medium mb-2">Available times for {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}:</p>
                        <div className="grid grid-cols-4 gap-2">
                          {timeSlots.map((t) => (
                            <button
                              key={t}
                              onClick={() => setSelectedTime(t)}
                              className={`p-2 text-xs rounded-lg border transition-colors ${
                                selectedTime === t ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setStep("form")} className="flex-1">Back</Button>
                      <Button variant="hero" onClick={handleSubmit} disabled={!selectedDate || !selectedTime} className="flex-1">
                        Confirm Booking <Check className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}