
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Mail, Calendar, Send, Sparkles, MessageSquare, ListTodo, CheckCircle2, Activity } from "lucide-react";

export default function EngagementAdmin() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Strategic Engagement Hub</h2>
          <p className="text-sm text-gray-500">Manage newsletters, subscriber updates, and response protocols.</p>
        </div>
      </div>

      <Tabs defaultValue="newsletter" className="w-full">
        <TabsList className="bg-gray-100 p-1 rounded-xl mb-8">
          <TabsTrigger value="newsletter" className="rounded-lg font-bold text-xs uppercase tracking-widest px-8">Newsletters</TabsTrigger>
          <TabsTrigger value="templates" className="rounded-lg font-bold text-xs uppercase tracking-widest px-8">Response Templates</TabsTrigger>
          <TabsTrigger value="campaigns" className="rounded-lg font-bold text-xs uppercase tracking-widest px-8">Active Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="newsletter" className="grid lg:grid-cols-12 gap-8">
          <Card className="lg:col-span-7 bg-white border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-50">
              <CardTitle className="text-lg font-bold">Draft Strategic Brief</CardTitle>
              <CardDescription>Create a new newsletter update for the BOS ecosystem.</CardDescription>
            </CardHeader>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Newsletter Subject</label>
                <Input placeholder="e.g. Q1 Infrastructure Milestone Report" className="bg-gray-50 h-12" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Technical Brief Content</label>
                <Textarea placeholder="Construct institutional briefing..." className="bg-gray-50 min-h-[300px] py-4 resize-none" />
              </div>
              <div className="flex gap-4 pt-4">
                <Button className="btn-primary h-12 flex-1 rounded-xl font-bold shadow-lg shadow-orange-100">
                  <Send className="w-4 h-4 mr-2" /> Schedule Deployment
                </Button>
                <Button variant="outline" className="h-12 px-8 rounded-xl font-bold border-gray-200">
                  <Sparkles className="w-4 h-4 mr-2" /> AI Refine
                </Button>
              </div>
            </div>
          </Card>

          <div className="lg:col-span-5 space-y-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#FF9900]" /> Scheduled Queue
                </CardTitle>
              </CardHeader>
              <div className="divide-y divide-gray-50">
                {[
                  { title: 'Weekly Node Health Report', date: 'Oct 24, 09:00 AM', type: 'Technical' },
                  { title: 'New Partner Onboarding Guide', date: 'Oct 26, 14:00 PM', type: 'Strategic' },
                ].map((item, i) => (
                  <div key={i} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{item.title}</p>
                      <p className="text-[10px] text-gray-400 font-medium mt-1">{item.date}</p>
                    </div>
                    <Badge className="bg-gray-100 text-gray-500 text-[9px] font-bold uppercase">{item.type}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-[#151B24] border-none text-white shadow-xl">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#FF9900]" /> Delivery Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Subscribers</p>
                    <p className="text-3xl font-bold mt-1">12,482</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">AVG Open Rate</p>
                    <p className="text-3xl font-bold mt-1 text-emerald-400">68%</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Growth This Week</span>
                  <span className="text-[10px] font-bold text-emerald-400">+482 Nodes</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Partnership Inquiry', desc: 'Standard response for institutional link requests.', icon: MessageSquare },
              { name: 'Node Technical Support', desc: 'Standard operating procedure for node sync errors.', icon: ListTodo },
              { name: 'Legal/ESG Compliance', desc: 'Pre-approved mapping for jurisdiction queries.', icon: CheckCircle2 },
            ].map((t, i) => (
              <Card key={i} className="bg-white border-gray-200 hover:border-[#FF9900] transition-all cursor-pointer group">
                <CardHeader>
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary/5 group-hover:text-primary transition-all">
                    <t.icon className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-gray-900 text-lg mt-4">{t.name}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">{t.desc}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 flex justify-end">
                  <Button variant="ghost" size="sm" className="text-[10px] font-bold text-primary group-hover:underline">Edit Protocol</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
