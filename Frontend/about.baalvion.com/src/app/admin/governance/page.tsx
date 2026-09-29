
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck, Lock, FileText, UserPlus, Clock, History, AlertTriangle, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GovernanceAdmin() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Governance & Strategic Compliance</h2>
          <p className="text-sm text-gray-500">Manage legal protocols, user permissions, and systemic audit logs.</p>
        </div>
        <Badge className="bg-[#FF9900]/10 text-[#FF9900] border-[#FF9900]/20 py-1.5 px-6 rounded-full font-bold uppercase tracking-widest text-[10px]">
          <ShieldCheck className="w-3 h-3 mr-2" /> Compliance ACTIVE
        </Badge>
      </div>

      <Tabs defaultValue="audit" className="w-full">
        <TabsList className="bg-gray-100 p-1 rounded-xl mb-8">
          <TabsTrigger value="audit" className="rounded-lg font-bold text-xs uppercase tracking-widest px-8">System Audit Log</TabsTrigger>
          <TabsTrigger value="roles" className="rounded-lg font-bold text-xs uppercase tracking-widest px-8">Roles & RBAC</TabsTrigger>
          <TabsTrigger value="legal" className="rounded-lg font-bold text-xs uppercase tracking-widest px-8">Legal Archives</TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-6">
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex items-center gap-4">
              <History className="w-5 h-5 text-gray-400" />
              <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Real-Time Event Stream</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Live Logging</span>
              <Switch defaultChecked />
            </div>
          </div>

          <Card className="bg-white border-gray-200 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-8">Event Timestamp</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Authority Node</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Strategic Action</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Module</TableHead>
                  <TableHead className="text-right pr-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { time: '2024-10-24 14:22:05', user: 'Admin-01', action: 'Update Legal Page', module: 'Governance', impact: 'Medium' },
                  { time: '2024-10-24 13:10:12', user: 'System-Core', action: 'SBI API Sync Complete', module: 'Banking', impact: 'Low' },
                  { time: '2024-10-24 12:45:50', user: 'Admin-02', action: 'Dismantle Ecosystem Node', module: 'Ecosystem', impact: 'High' },
                  { time: '2024-10-24 11:30:00', user: 'Auth-Bot', action: 'Failed Login Attempt', module: 'Security', impact: 'High' },
                ].map((log, i) => (
                  <TableRow key={i} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="pl-8 font-mono text-[10px] text-gray-400">{log.time}</TableCell>
                    <TableCell className="font-bold text-gray-900 text-xs">{log.user}</TableCell>
                    <TableCell className="text-xs font-medium text-gray-600">{log.action}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-500 text-[9px] font-bold uppercase">{log.module}</Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      {log.impact === 'High' && <AlertTriangle className="w-3.5 h-3.5 text-red-500 inline-block mr-2" />}
                      <Button variant="ghost" size="sm" className="text-[10px] font-bold text-primary uppercase">Inspect</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="grid md:grid-cols-3 gap-8">
          {[
            { name: 'Super Administrator', users: 2, permissions: 'ALL_ACCESS', color: 'bg-[#FF9900]' },
            { name: 'Operational Editor', users: 5, permissions: 'CONTENT_WRITE', color: 'bg-emerald-500' },
            { name: 'Security Auditor', users: 1, permissions: 'LOG_READ_ONLY', color: 'bg-blue-500' },
          ].map((role, i) => (
            <Card key={i} className="bg-white border-gray-200 group">
              <CardHeader>
                <div className={cn("w-12 h-1.5 rounded-full mb-4", role.color)} />
                <CardTitle className="text-lg font-bold text-gray-900">{role.name}</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">{role.permissions}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Assigned Users</span>
                  <span className="font-bold text-gray-900">{role.users}</span>
                </div>
                <Button variant="outline" className="w-full h-10 rounded-lg font-bold border-gray-200 group-hover:border-primary/20 transition-all">
                  <UserPlus className="w-4 h-4 mr-2" /> Modify Access
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="legal" className="space-y-6">
          <Card className="bg-white border-gray-200 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-8">Document Designation</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Version</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Deployment Status</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Modified</TableHead>
                  <TableHead className="text-right pr-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { name: 'Conditions of Use (Terms)', version: 'v2.4.1', status: 'Live', date: '2024-09-12' },
                  { name: 'BOS Privacy Policy', version: 'v3.0.0', status: 'Draft', date: '2024-10-20' },
                  { name: 'ESG Compliance Standards', version: 'v1.2.0', status: 'Live', date: '2024-08-01' },
                ].map((doc, i) => (
                  <TableRow key={i} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="pl-8 font-bold text-gray-900 text-sm flex items-center gap-3">
                      <FileText className="w-4 h-4 text-gray-400" /> {doc.name}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-gray-500">{doc.version}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-[9px] uppercase tracking-tighter py-0 font-bold",
                        doc.status === 'Live' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-gray-100 text-gray-400 border-gray-200"
                      )}>{doc.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-400 font-medium">{doc.date}</TableCell>
                    <TableCell className="text-right pr-8 space-x-2">
                      <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg"><History className="w-4 h-4 text-gray-400" /></Button>
                      <Button variant="ghost" size="sm" className="text-[10px] font-bold text-primary uppercase">Edit Draft</Button>
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
