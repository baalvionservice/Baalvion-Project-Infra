"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

type Status = "idle" | "submitting" | "success" | "error";

const INPUT_CLASS =
    "rounded-none focus-visible:ring-offset-0 bg-white focus:border-primary text-black transition-colors";

export default function ContactForm() {
    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [company, setCompany] = useState("");
    const [inquiryType, setInquiryType] = useState("");
    const [message, setMessage] = useState("");
    const [website, setWebsite] = useState(""); // honeypot — must stay empty

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const name = `${firstName} ${lastName}`.trim();
        if (name.length < 2 || !email.includes("@") || message.trim().length < 10) {
            setError("Please provide your name, a valid email, and a message of at least 10 characters.");
            setStatus("error");
            return;
        }

        setStatus("submitting");
        try {
            const res = await fetch("/api/ir/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, company, inquiryType, message, website }),
            });
            const json = await res.json().catch(() => null);
            if (res.ok && json?.success) {
                setStatus("success");
            } else {
                setError(json?.error || "Could not send your message. Please try again.");
                setStatus("error");
            }
        } catch {
            setError("Network error. Please email invrel@baalvion.com directly.");
            setStatus("error");
        }
    };

    if (status === "success") {
        return (
            <div className="border border-green-200 bg-green-50 p-10 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
                <h3 className="mt-4 text-2xl font-bold tracking-tight text-black">Message sent</h3>
                <p className="mt-2 text-gray-600">
                    Thank you for reaching out. Our Investor Relations team typically responds within 24–48 hours.
                </p>
            </div>
        );
    }

    return (
        <form className="space-y-8" onSubmit={onSubmit}>
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">First Name *</Label>
                    <Input className={INPUT_CLASS} placeholder="e.g. Elena" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Last Name *</Label>
                    <Input className={INPUT_CLASS} placeholder="e.g. Petrov" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email *</Label>
                    <Input type="email" className={INPUT_CLASS} placeholder="name@firm.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Company / Institution</Label>
                    <Input className={INPUT_CLASS} placeholder="e.g. North Atlantic Capital" value={company} onChange={(e) => setCompany(e.target.value)} />
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Inquiry Type *</Label>
                <Select value={inquiryType} onValueChange={setInquiryType}>
                    <SelectTrigger className="rounded-none focus-within:ring-offset-0 bg-white text-black transition-colors">
                        <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="investor">Investor Inquiry</SelectItem>
                        <SelectItem value="partnership">Strategic Partnership Request</SelectItem>
                        <SelectItem value="diligence">Due Diligence / Data Room Access</SelectItem>
                        <SelectItem value="financial">Financial Reporting</SelectItem>
                        <SelectItem value="governance">Governance &amp; Voting</SelectItem>
                        <SelectItem value="media">Media &amp; Press Request</SelectItem>
                        <SelectItem value="career">Career Opportunities</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Message / Request Detail *</Label>
                <Textarea
                    className={`${INPUT_CLASS} min-h-[150px]`}
                    placeholder="Please specify the nature of your request..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                />
            </div>

            {/* Honeypot: hidden from humans; bots fill it and the server silently drops the submission. */}
            <div aria-hidden="true" className="absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden">
                <label>
                    Website
                    <input
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                    />
                </label>
            </div>

            {status === "error" && error && (
                <div className="flex items-center gap-2 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="p-6 bg-gray-50 border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-xs text-gray-500 max-w-sm">
                    By submitting, you consent to Baalvion Investor Relations contacting you about your inquiry.
                </p>
                <Button type="submit" disabled={status === "submitting"} className="rounded-none px-12 h-14 font-bold uppercase tracking-widest disabled:opacity-60">
                    {status === "submitting" ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</>
                    ) : (
                        <>Submit Request &gt;</>
                    )}
                </Button>
            </div>
        </form>
    );
}
