"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Project, Inquiry, Page, EcosystemItem } from "@/lib/db";
import { 
  Briefcase, 
  MessageSquare, 
  Layout, 
  Layers, 
  TrendingUp, 
  Clock, 
  Plus, 
  Settings, 
  ArrowRight, 
  Star,
  Activity,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [ecosystem, setEcosystem] = useState<EcosystemItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, iRes, pgRes, eRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/inquiry'),
          fetch('/api/pages'),
          fetch('/api/ecosystem')
        ]);
        
        setProjects(await pRes.json());
        setInquiries(await iRes.json());
        setPages(await pgRes.json());
        setEcosystem(await eRes.json());
      } catch (err) {
        console.error("Failed to sync dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const projectStats = {
    active: projects.filter(p => p.status === 'Active').length,
    development: projects.filter(p => p.status === 'In Development').length,
    planned: projects.filter(p => p.status === 'Planned').length,
    featured: projects.filter(p => p.isFeatured).length
  };

  const stats = [
    { name: 'Total Pages', value: pages.length, icon: Layout, color: 'text-blue-500', href: '/admin/pages' },
    { name: 'Active Projects', value: projects.length, icon: Briefcase, color: 'text-emerald-500', href: '/admin/projects' },
    { name: 'Ecosystem Layers', value: ecosystem.length, icon: Layers, color: 'text-[#FF9900]', href: '/admin/ecosystem' },
    { name: 'New Inquiries', value: inquiries.filter(i => i.status === 'New').length, icon: MessageSquare, color: 'text-amber-500', href: '/admin/inquiries' },
  ];

  const recentInquiries = inquiries.slice(-3).reverse();
  const featuredProjects = projects.filter(p => p.isFeatured).slice(0, 3);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Baalvion Operating System (BOS) Control Center</h2>
          <p className="text-sm text-gray-500">Strategic overview of the Baalvion infrastructure layer.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="sm" className="btn-primary h-10 px-4 rounded-sm font-bold">
            <Link href="/admin/projects"><Plus className="w-4 h-4 mr-2" /> Launch Initiative</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-10 px-4 rounded-sm font-bold border-gray-200 bg-white hover:bg-gray-50 text-gray-700">
            <Link href="/admin/pages"><Settings className="w-4 h-4 mr-2" /> Architecture</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-10 px-4 rounded-sm font-bold border-gray-200 bg-white hover:bg-gray-50 text-gray-700">
            <Link href="/admin/inquiries"><MessageSquare className="w-4 h-4 mr-2" /> View Intel</Link>
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Link key={i} href={stat.href}>
            <Card className="bg-white border-gray-200 hover:border-[#FF9900] transition-all cursor-pointer group shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.name}</CardTitle>
                <stat.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", stat.color)} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {loading ? "..." : stat.value}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Status Analytics */}
        <Card className="bg-white border-gray-200 lg:col-span-8 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-50 pb-6">
            <div>
              <CardTitle className="text-gray-900 text-lg">Infrastructure Pulse</CardTitle>
              <CardDescription className="text-xs">Deployment status across the initiative portfolio.</CardDescription>
            </div>
            <Activity className="w-5 h-5 text-[#FF9900] animate-pulse" />
          </CardHeader>
          <CardContent className="pt-8">
            <div className="grid md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active Nodes</p>
                    <p className="text-2xl font-bold text-gray-900">{projectStats.active}</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-1" />
                </div>
                <Progress value={projects.length ? (projectStats.active / projects.length) * 100 : 0} className="h-1.5 bg-gray-100" />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">In Development</p>
                    <p className="text-2xl font-bold text-gray-900">{projectStats.development}</p>
                  </div>
                  <Clock className="w-5 h-5 text-amber-500 mb-1" />
                </div>
                <Progress value={projects.length ? (projectStats.development / projects.length) * 100 : 0} className="h-1.5 bg-gray-100" />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Planned Roadmap</p>
                    <p className="text-2xl font-bold text-gray-900">{projectStats.planned}</p>
                  </div>
                  <AlertCircle className="w-5 h-5 text-gray-300 mb-1" />
                </div>
                <Progress value={projects.length ? (projectStats.planned / projects.length) * 100 : 0} className="h-1.5 bg-gray-100" />
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#FF9900] fill-[#FF9900]" /> Featured Initiatives
                </h3>
                <Link href="/admin/projects" className="text-[10px] font-bold text-[#FF9900] uppercase tracking-widest hover:underline transition-all">Manage All</Link>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {featuredProjects.map(p => (
                  <div key={p.id} className="p-4 rounded-md bg-gray-50 border border-gray-100 group hover:border-[#FF9900] transition-all">
                    <p className="text-sm font-bold text-gray-900 truncate group-hover:text-[#FF9900] transition-colors">{p.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter mt-1">{p.status}</p>
                  </div>
                ))}
                {featuredProjects.length === 0 && (
                  <div className="col-span-full py-6 text-center text-xs text-gray-400 italic bg-gray-50/50 rounded-md">
                    No strategic initiatives featured.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Intel */}
        <Card className="bg-white border-gray-200 lg:col-span-4 shadow-sm">
          <CardHeader className="border-b border-gray-50 pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900 text-lg">Inbound Intel</CardTitle>
              <MessageSquare className="w-5 h-5 text-amber-500" />
            </div>
            <CardDescription className="text-xs">Latest strategic connection requests.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {recentInquiries.length === 0 ? (
                <div className="py-24 text-center">
                  <MessageSquare className="w-10 h-10 mx-auto mb-4 text-gray-200" />
                  <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Buffer Empty</p>
                </div>
              ) : recentInquiries.map((inq) => (
                <div key={inq.id} className="space-y-2 group">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-bold text-gray-900 group-hover:text-[#FF9900] transition-colors">{inq.name}</p>
                    <span className="text-[9px] font-mono text-gray-400 uppercase">{new Date(inq.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed italic">"{inq.message}"</p>
                  <div className="pt-2 flex justify-end">
                    <Link href="/admin/inquiries" className="text-[9px] font-bold text-gray-400 hover:text-gray-900 uppercase tracking-tighter flex items-center gap-1 transition-colors">
                      View Protocol <ArrowRight className="w-2.5 h-2.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-md bg-orange-50 flex items-center justify-center text-[#FF9900]">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Baalvion Operating System (BOS) Performance</p>
                  <p className="text-xs text-emerald-600 font-bold uppercase">99.9% Operational</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
