"use client"

import { useState } from "react"
import { STUDENT_PROFILE } from "@/lib/mock-student-data"
import { NexusCard } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User, 
  Shield, 
  Bell, 
  Globe, 
  Wallet, 
  Lock, 
  Mail, 
  CheckCircle2,
  Camera,
  Trash2
} from "lucide-react"
import { motion } from "framer-motion"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="p-8 pb-32 max-w-5xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-gray-500 font-medium">Manage your personal preferences and security protocols.</p>
      </header>

      <Tabs defaultValue="profile" className="space-y-12">
        <TabsList className="bg-white/5 p-1 rounded-2xl border border-white/5">
          <TabsTrigger value="profile" className="rounded-xl px-8 py-3 text-sm font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all flex items-center gap-2">
            <User className="w-4 h-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl px-8 py-3 text-sm font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all flex items-center gap-2">
            <Shield className="w-4 h-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="wallet" className="rounded-xl px-8 py-3 text-sm font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all flex items-center gap-2">
            <Wallet className="w-4 h-4" /> Wallet
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-xl px-8 py-3 text-sm font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all flex items-center gap-2">
            <Bell className="w-4 h-4" /> Alerts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <NexusCard className="p-10 bg-white/[0.02] border-white/5 space-y-10">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold">Public Profile</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Full Name</label>
                      <Input defaultValue={STUDENT_PROFILE.name} className="bg-black/20 border-white/10 h-12 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
                      <Input defaultValue="aryan.mehta@example.com" className="bg-black/20 border-white/10 h-12 font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Personal Bio</label>
                    <Textarea 
                      placeholder="Tell teachers about your learning goals..." 
                      className="bg-black/20 border-white/10 min-h-[120px] font-medium leading-relaxed" 
                      defaultValue="Dedicated learner from Mumbai, focused on mastering advanced mathematics and computer science."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Timezone</label>
                      <Input defaultValue="UTC +5:30 (IST)" className="bg-black/20 border-white/10 h-12 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Preferred Language</label>
                      <Input defaultValue="English (UK)" className="bg-black/20 border-white/10 h-12 font-bold" />
                    </div>
                  </div>
                </div>
                
                <div className="pt-8 border-t border-white/5 flex gap-4">
                  <NexusButton className="nexus-gradient-bg px-10 h-14 font-bold">Save Profile Changes</NexusButton>
                  <NexusButton variant="outline" className="border-white/5 h-14 px-10">Discard</NexusButton>
                </div>
              </NexusCard>
            </div>

            <div className="space-y-8">
              <NexusCard className="p-8 bg-white/[0.02] border-white/5 text-center">
                <div className="relative inline-block mb-6">
                  <img src={STUDENT_PROFILE.avatar} className="w-32 h-32 rounded-3xl object-cover border-4 border-white/5 shadow-2xl" alt="avatar" />
                  <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-xl hover:bg-blue-700 transition-all">
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                <h4 className="font-bold mb-2">Change Avatar</h4>
                <p className="text-xs text-gray-500 font-medium leading-relaxed mb-6">JPG, PNG or WEBP. <br />Max size 2MB.</p>
                <NexusButton variant="outline" className="w-full border-white/10 h-10 text-xs font-bold text-red-500 hover:bg-red-500/10">
                  <Trash2 className="w-4 h-4 mr-2" /> Remove Image
                </NexusButton>
              </NexusCard>

              <NexusCard className="p-8 bg-blue-600/5 border-blue-500/10 flex items-center gap-4">
                 <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <CheckCircle2 className="w-6 h-6" />
                 </div>
                 <div>
                    <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Region Verified</div>
                    <div className="font-bold text-sm">South Asia Node</div>
                 </div>
              </NexusCard>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-0">
           <NexusCard className="p-10 bg-white/[0.02] border-white/5 space-y-12">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
               <div className="space-y-8">
                 <h3 className="text-xl font-bold flex items-center gap-2"><Lock className="w-5 h-5" /> Access Control</h3>
                 <div className="space-y-6">
                   <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                     <div>
                       <div className="font-bold text-sm mb-1">Two-Factor Auth</div>
                       <div className="text-xs text-gray-500">Secure your account with 2FA protocols.</div>
                     </div>
                     <Switch />
                   </div>
                   <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                     <div>
                       <div className="font-bold text-sm mb-1">Biometric Login</div>
                       <div className="text-xs text-gray-500">FaceID or Fingerprint encryption.</div>
                     </div>
                     <Switch defaultChecked />
                   </div>
                   <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                     <div>
                       <div className="font-bold text-sm mb-1">Transaction PIN</div>
                       <div className="text-xs text-gray-500">Require PIN for crypto withdrawals.</div>
                     </div>
                     <Switch defaultChecked />
                   </div>
                 </div>
               </div>

               <div className="space-y-8">
                  <h3 className="text-xl font-bold flex items-center gap-2"><Globe className="w-5 h-5" /> Active Sessions</h3>
                  <div className="space-y-4">
                    {[
                      { device: 'MacBook Pro — Mumbai, IN', time: 'Active now', status: 'current' },
                      { device: 'iPhone 15 Pro — Mumbai, IN', time: '2 hours ago', status: 'idle' },
                    ].map((session, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">
                              <Globe className="w-5 h-5" />
                           </div>
                           <div>
                              <div className="font-bold text-sm">{session.device}</div>
                              <div className="text-[10px] text-gray-500 uppercase font-bold">{session.time}</div>
                           </div>
                        </div>
                        {session.status !== 'current' && (
                          <button className="text-[10px] font-bold text-red-500 uppercase hover:underline">Revoke</button>
                        )}
                      </div>
                    ))}
                    <button className="w-full py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest border border-dashed border-white/10 rounded-2xl hover:bg-white/5 transition-all">
                      Sign Out All Other Devices
                    </button>
                  </div>
               </div>
             </div>
           </NexusCard>
        </TabsContent>

        <TabsContent value="wallet" className="mt-0">
          <NexusCard className="p-10 bg-white/[0.02] border-white/5">
             <div className="max-w-2xl mx-auto space-y-12">
               <div className="text-center space-y-4">
                 <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center text-blue-500 mx-auto">
                    <Wallet className="w-10 h-10" />
                 </div>
                 <h3 className="text-2xl font-bold">Wallet Configuration</h3>
                 <p className="text-gray-500 font-medium">Connect external wallets and manage withdrawal addresses.</p>
               </div>

               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Primary Withdrawal Address (ETH)</label>
                    <div className="relative">
                      <Input defaultValue="0x71C7656EC7ab88b098defB751B7401B5f6d8976F" className="bg-black/20 border-white/10 h-14 font-mono text-sm pl-12" />
                      <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold">BTC</div>
                       <div>
                         <div className="font-bold">Bitcoin Network</div>
                         <div className="text-xs text-gray-500">Taproot enabled</div>
                       </div>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold">USDT</div>
                       <div>
                         <div className="font-bold">Stablecoin Preference</div>
                         <div className="text-xs text-gray-500">Auto-convert to USDT for savings</div>
                       </div>
                    </div>
                    <Switch />
                  </div>
               </div>

               <NexusButton className="w-full nexus-gradient-bg h-14 text-lg font-bold">Update Wallet Protocols</NexusButton>
             </div>
          </NexusCard>
        </TabsContent>

        <TabsContent value="notifications" className="mt-0">
           <NexusCard className="p-10 bg-white/[0.02] border-white/5 max-w-2xl mx-auto">
             <h3 className="text-xl font-bold mb-10 flex items-center gap-2"><Bell className="w-5 h-5" /> Alert Preferences</h3>
             <div className="space-y-8">
               {[
                 { label: 'Class Reminders', desc: 'Alerts 30 minutes before your scheduled class starts.', checked: true },
                 { label: 'Payment Confirmations', desc: 'Notifications for crypto deposits and class payouts.', checked: true },
                 { label: 'New Messages', desc: 'Direct alerts when a teacher sends you a message.', checked: true },
                 { label: 'Marketplace Updates', desc: 'Order tracking and shipping notifications.', checked: false },
                 { label: 'Regional Intel', desc: 'New teachers and events in South Asia node.', checked: true },
                 { label: 'Platform Announcements', desc: 'System updates and maintenance news.', checked: false },
               ].map((pref, i) => (
                 <div key={i} className="flex items-center justify-between">
                   <div className="flex-1 pr-12">
                     <div className="font-bold text-sm mb-1">{pref.label}</div>
                     <div className="text-xs text-gray-500 font-medium">{pref.desc}</div>
                   </div>
                   <Switch defaultChecked={pref.checked} />
                 </div>
               ))}
             </div>
             <div className="pt-12 border-t border-white/5 mt-12">
                <NexusButton className="w-full nexus-gradient-bg h-14 font-bold">Update Alert Logic</NexusButton>
             </div>
           </NexusCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
