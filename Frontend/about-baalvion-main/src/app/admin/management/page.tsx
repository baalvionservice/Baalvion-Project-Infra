
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, UserCheck, Briefcase, Activity, Search, Plus, Mail, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ManagementAdmin() {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Enterprise Management</h2>
          <p className="text-sm text-gray-500">Manage institutional partners and internal team nodes.</p>
        </div>
        <div className="flex gap-3">
          <Button className="btn-primary h-11 px-6 rounded-xl font-bold">
            <Plus className="w-4 h-4 mr-2" /> Add Resource
          </Button>
        </div>
      </div>

      <Tabs defaultValue="partners" className="w-full">
        <TabsList className="bg-gray-100 p-1 rounded-xl mb-8">
          <TabsTrigger value="partners" className="rounded-lg font-bold text-xs uppercase tracking-widest px-8">Partner Registry</TabsTrigger>
          <TabsTrigger value="employees" className="rounded-lg font-bold text-xs uppercase tracking-widest px-8">Employee Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="partners" className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search partner registry..." 
              className="pl-12 h-12 bg-white border-gray-200 shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Card className="bg-white border-gray-200 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-8">Institution</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role Protocol</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Node Status</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Sync</TableHead>
                  <TableHead className="text-right pr-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { name: 'SBI Corporate', role: 'Financial Clearing', status: 'Active', sync: '2 mins ago' },
                  { name: 'PayU Enterprise', role: 'Payment Gateway', status: 'Active', sync: '1 hour ago' },
                  { name: 'HSBC Global', role: 'Settlement Node', status: 'Pending', sync: 'N/A' },
                  { name: 'Oracle Cloud', role: 'Infrastructure', status: 'Active', sync: '12 mins ago' },
                ].map((p, i) => (
                  <TableRow key={i} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="pl-8 font-bold text-gray-900 text-sm">{p.name}</TableCell>
                    <TableCell className="text-xs text-gray-500 font-medium">{p.role}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-[9px] uppercase tracking-tighter py-0 font-bold",
                        p.status === 'Active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                      )}>{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-400 font-mono">{p.sync}</TableCell>
                    <TableCell className="text-right pr-8">
                      <Button variant="ghost" size="sm" className="text-[10px] font-bold text-primary uppercase">Audit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { label: 'Total Staff', value: '42', icon: Users },
              { label: 'Productivity', value: '94%', icon: Activity },
              { label: 'Assignments', value: '128', icon: Briefcase },
            ].map((stat, i) => (
              <Card key={i} className="bg-white border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</CardTitle>
                  <stat.icon className="w-4 h-4 text-[#FF9900]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-white border-gray-200 overflow-hidden shadow-sm">
            <CardHeader className="border-b border-gray-50">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-primary" /> Active Assignments
              </CardTitle>
            </CardHeader>
            <Table>
              <TableBody>
                {[
                  { name: 'Aravind K.', node: 'BOS-Node-IND', task: 'Clearing API v3.2 Migration', load: 85 },
                  { name: 'Sarah J.', node: 'BOS-Node-EMEA', task: 'ESG Compliance Audit Q1', load: 40 },
                  { name: 'Liam W.', node: 'Global-Infra', task: 'Database Sharding Protocol', load: 92 },
                ].map((e, i) => (
                  <TableRow key={i} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="pl-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-400">
                          {e.name.split(' ')[0][0]}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{e.name}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest">{e.node}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 font-medium">
                      {e.task}
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="inline-flex flex-col items-end gap-1.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Load: {e.load}%</span>
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={cn(
                            "h-full rounded-full transition-all",
                            e.load > 80 ? "bg-red-500" : "bg-[#FF9900]"
                          )} style={{ width: `${e.load}%` }} />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
