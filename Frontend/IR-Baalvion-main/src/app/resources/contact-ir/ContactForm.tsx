"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ContactForm() {
    return (
        <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">First Name *</Label>
                    <Input className="rounded-none  focus-visible:ring-offset-0 bg-white focus:border-primary text-black  transition-colors" placeholder="e.g. Elena" required />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Last Name *</Label>
                    <Input className="rounded-none  focus-visible:ring-offset-0 bg-white focus:border-primary text-black  transition-colors" placeholder="e.g. Petrov" required />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Institutional Email *</Label>
                    <Input type="email" className="rounded-none  focus-visible:ring-offset-0 bg-white focus:border-primary text-black  transition-colors" placeholder="name@firm.com" required />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Inquiry Type *</Label>
                    <Select>
                        <SelectTrigger className="rounded-none focus-within:ring-offset-0  bg-white  text-black  transition-colors">
                            <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="financial">Financial Reporting</SelectItem>
                            <SelectItem value="governance">Governance & Voting</SelectItem>
                            <SelectItem value="media">Media & Press</SelectItem>
                            <SelectItem value="career">Career Opportunities</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Message / Request Detail *</Label>
                <Textarea className="rounded-none  focus-visible:ring-offset-0 bg-white focus:border-primary text-black  transition-colors min-h-[150px]" placeholder="Please specify the nature of your request..." required />
            </div>

            <div className="p-6 bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-24 bg-gray-200 flex items-center justify-center font-mono font-bold tracking-[0.3em] italic text-gray-400">
                        847291
                    </div>
                    <Input className="w-32 rounded-none  focus-visible:ring-offset-0 bg-white focus:border-primary text-black  transition-colors" placeholder="Verify code" />
                </div>
                <Button type="submit" className="rounded-none px-12 h-14 font-bold uppercase tracking-widest">
                    Submit Request &gt;
                </Button>
            </div>
        </form>
    );
}
