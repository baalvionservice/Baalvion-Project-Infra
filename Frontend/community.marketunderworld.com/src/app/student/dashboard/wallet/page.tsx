"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  STUDENT_PROFILE, 
  CRYPTO_ASSETS, 
  RECENT_TRANSACTIONS, 
  HISTORICAL_PRICE_DATA 
} from "@/lib/mock-student-data"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Send, 
  Download, 
  Copy, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Filter, 
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Shield,
  X,
  CreditCard,
  QrCode
} from "lucide-react"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

const SPENDING_CHART_DATA = [
  { name: 'Jan', classes: 120, market: 80, tips: 20 },
  { name: 'Feb', classes: 140, market: 120, tips: 15 },
  { name: 'Mar', classes: 160, market: 200, tips: 35 },
];

const SPENDING_DONUT_DATA = [
  { name: 'Classes', value: 306, color: '#8b5cf6' },
  { name: 'Marketplace', value: 258, color: '#06b6d4' },
  { name: 'Tips', value: 54, color: '#f59e0b' },
  { name: 'Materials', value: 61, color: '#10b981' },
];

export default function WalletPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<keyof typeof HISTORICAL_PRICE_DATA>('ETH');
  const [timeRange, setTimeRange] = useState('7D');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const copyAddress = () => {
    navigator.clipboard.writeText("0x4f2a8b3c...7d9e2f1a");
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard.",
    });
  };

  if (!mounted) return null;

  return (
    <div className="flex-1 min-h-screen">
      {/* Top Banner */}
      <div className="relative h-64 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 nexus-gradient-bg opacity-20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/[0.05] via-transparent to-transparent" />
        
        {/* Animated Coins */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[
            { icon: '🔷', top: '20%', left: '15%', delay: 0 },
            { icon: '🟡', top: '60%', left: '80%', delay: 1 },
            { icon: '💚', top: '30%', left: '70%', delay: 2 },
          ].map((coin, i) => (
            <motion.div
              key={i}
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, 360],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ duration: 8 + i, repeat: Infinity, ease: "easeInOut" }}
              className="absolute text-4xl"
              style={{ top: coin.top, left: coin.left }}
            >
              {coin.icon}
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 text-center space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold tracking-tight nexus-gradient-text"
          >
            My NEXUS Wallet
          </motion.h1>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-md">
            <span className="font-mono text-sm text-gray-400">0x4f2a...8b3c</span>
            <button onClick={copyAddress} className="text-blue-400 hover:text-blue-300 transition-colors">
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Last updated: Just now
          </div>
        </div>
      </div>

      <div className="p-8 pb-32 max-w-7xl mx-auto space-y-12 -mt-12 relative z-20">
        
        {/* Hero Balance Card */}
        <NexusCard className="p-10 border-white/10 bg-[#111118]/60 backdrop-blur-3xl shadow-3xl overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[100px] rounded-full group-hover:bg-blue-600/10 transition-colors" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
            <div className="lg:col-span-7 space-y-8">
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Total Portfolio Balance</div>
                <div className="flex items-baseline gap-4">
                  <span className="text-6xl font-bold text-white tracking-tighter">{STUDENT_PROFILE.walletBalance.eth} ETH</span>
                  <span className="text-2xl font-bold text-gray-500">≈ ${STUDENT_PROFILE.walletBalance.usd}</span>
                </div>
                <div className="mt-4 inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-lg text-sm font-bold">
                  <TrendingUp className="w-4 h-4" /> +$124.50 (+4.87%)
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-white/5">
                {[
                  { label: '24h', val: '+4.87%', pos: true },
                  { label: '7d', val: '+12.3%', pos: true },
                  { label: '30d', val: '-2.1%', pos: false },
                  { label: 'All Time', val: '+67.4%', pos: true },
                ].map((stat, i) => (
                  <div key={i}>
                    <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">{stat.label}</div>
                    <div className={`text-sm font-bold ${stat.pos ? 'text-emerald-500' : 'text-red-500'}`}>{stat.val}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              {[
                { label: 'Deposit', sub: 'Add funds', icon: Plus, color: 'emerald', onClick: () => setIsDepositModalOpen(true) },
                { label: 'Withdraw', sub: 'Cash out', icon: ArrowUpRight, color: 'red', onClick: () => setIsWithdrawModalOpen(true) },
                { label: 'Send', sub: 'To anyone', icon: Send, color: 'blue', onClick: () => setIsSendModalOpen(true) },
                { label: 'Receive', sub: 'Get paid', icon: Download, color: 'cyan', onClick: () => setIsReceiveModalOpen(true) },
              ].map((btn, i) => (
                <button
                  key={i}
                  onClick={btn.onClick}
                  className={`p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-${btn.color}-500/30 hover:bg-${btn.color}-500/5 transition-all text-left group`}
                >
                  <div className={`w-12 h-12 rounded-2xl bg-${btn.color}-500/10 flex items-center justify-center text-${btn.color}-400 mb-4 group-hover:scale-110 transition-transform`}>
                    <btn.icon className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-lg mb-1">{btn.label}</div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{btn.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </NexusCard>

        {/* Assets & Portfolio Split */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          <div className="xl:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">My Crypto Holdings</h2>
              <div className="flex p-1 bg-white/5 rounded-xl">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  List
                </button>
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Grid
                </button>
              </div>
            </div>

            {viewMode === 'list' ? (
              <NexusCard className="p-0 overflow-hidden border-white/5 bg-white/[0.02]">
                <table className="w-full text-left">
                  <thead className="bg-white/[0.01] border-b border-white/5">
                    <tr>
                      <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Asset</th>
                      <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Balance</th>
                      <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Price</th>
                      <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">24h</th>
                      <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Value</th>
                      <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {CRYPTO_ASSETS.map((asset) => (
                      <tr key={asset.id} className="hover:bg-white/[0.01] transition-colors group">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-lg" style={{ backgroundColor: `${asset.color}20`, color: asset.color, border: `1px solid ${asset.color}40` }}>
                              {asset.symbol.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold">{asset.name}</div>
                              <div className="text-[10px] text-gray-500 font-bold uppercase">{asset.symbol}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-6 text-right font-bold">{asset.balance} {asset.symbol}</td>
                        <td className="p-6 text-right text-gray-400 font-medium">${Number(asset.price).toLocaleString()}</td>
                        <td className={`p-6 text-right font-bold ${asset.change24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {asset.change24h > 0 && '+'}{asset.change24h}%
                        </td>
                        <td className="p-6 text-right font-bold">${Number(asset.value).toLocaleString()}</td>
                        <td className="p-6 text-right">
                          <div className="flex justify-end gap-2">
                            <NexusButton variant="ghost" size="sm" className="h-8 px-3 text-[10px] border border-white/5">Send</NexusButton>
                            <NexusButton variant="ghost" size="sm" className="h-8 px-3 text-[10px] border border-white/5">Receive</NexusButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </NexusCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {CRYPTO_ASSETS.map((asset) => (
                  <NexusCard key={asset.id} className="p-8 border-white/5 bg-white/[0.02] hover:border-blue-500/20 transition-all">
                    <div className="flex justify-between items-start mb-8">
                      <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl shadow-2xl" style={{ backgroundColor: `${asset.color}20`, color: asset.color, border: `1px solid ${asset.color}40` }}>
                        {asset.symbol.charAt(0)}
                      </div>
                      <div className={`px-3 py-1 rounded-lg text-xs font-bold ${asset.change24h >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {asset.change24h > 0 && '+'}{asset.change24h}%
                      </div>
                    </div>
                    <div className="space-y-1 mb-8">
                      <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">{asset.name}</div>
                      <div className="text-3xl font-bold">{asset.balance} {asset.symbol}</div>
                      <div className="text-sm text-gray-500 font-bold">${Number(asset.value).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-3">
                      <NexusButton className="flex-1 h-10 text-[10px] nexus-gradient-bg">Send</NexusButton>
                      <NexusButton variant="outline" className="flex-1 h-10 text-[10px] border-white/10">Receive</NexusButton>
                    </div>
                  </NexusCard>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-8">
            <h2 className="text-2xl font-bold">Portfolio Logic</h2>
            <NexusCard className="p-8 border-white/5 bg-white/[0.02]">
              <div className="h-[250px] w-full relative mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={CRYPTO_ASSETS}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {CRYPTO_ASSETS.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111118', border: '1px solid #ffffff10', borderRadius: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-[10px] font-bold text-gray-500 uppercase">Total</div>
                  <div className="text-xl font-bold">$3,026.47</div>
                </div>
              </div>
              <div className="space-y-4">
                {CRYPTO_ASSETS.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: asset.color }} />
                      <span className="font-bold text-gray-400">{asset.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">{((Number(asset.value) / 3026.47) * 100).toFixed(1)}%</div>
                      <div className="text-[9px] text-gray-500">${asset.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </NexusCard>

            <NexusCard className="p-8 border-white/5 bg-emerald-500/5 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Security Score</div>
                  <div className="text-2xl font-bold">85/100</div>
                </div>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: '85%' }} />
              </div>
              <div className="space-y-3">
                {[
                  { text: 'Wallet PIN enabled', done: true },
                  { text: '2FA Protocol', done: false },
                  { text: 'Backup phrase saved', done: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-[10px] font-bold">
                    {item.done ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <AlertTriangle className="w-3 h-3 text-amber-500" />}
                    <span className={item.done ? 'text-gray-400' : 'text-amber-500'}>{item.text}</span>
                  </div>
                ))}
              </div>
              <NexusButton variant="outline" className="w-full h-10 text-[10px] border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10">Improve Security</NexusButton>
            </NexusCard>
          </div>
        </div>

        {/* Live Price Chart Section */}
        <section className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Live Price Analytics</h2>
              <div className="flex gap-2">
                {['ETH', 'BTC', 'USDT', 'BNB', 'SOL'].map((coin) => (
                  <button
                    key={coin}
                    onClick={() => setSelectedCoin(coin as any)}
                    className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${selectedCoin === coin ? 'nexus-gradient-bg text-white shadow-lg' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                  >
                    {coin}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-1.5 p-1 bg-white/5 rounded-xl">
              {['1H', '24H', '7D', '30D', '1Y', 'ALL'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeRange(t)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${timeRange === t ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <NexusCard className="p-10 border-white/5 bg-white/[0.02]">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mb-12">
              <div className="lg:col-span-3 h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={HISTORICAL_PRICE_DATA[selectedCoin]}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={['auto', 'auto']} stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111118', border: '1px solid #ffffff10', borderRadius: '12px' }}
                      formatter={(v: any) => [`$${Number(v).toFixed(2)}`, 'Price']}
                    />
                    <Area type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-6">
                {[
                  { label: 'Current Price', val: `$${Number(CRYPTO_ASSETS.find(a => assetSymbolMatch(a.symbol, selectedCoin))?.price).toLocaleString()}` },
                  { label: 'Market Cap', val: '$18.4B' },
                  { label: '24h High', val: '$3,224.60' },
                  { label: '24h Low', val: '$2,998.10' },
                  { label: 'Volume (24h)', val: '$1.2B' },
                ].map((stat, i) => (
                  <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{stat.label}</div>
                    <div className="text-xl font-bold">{stat.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </NexusCard>
        </section>

        {/* Transaction History */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Transaction History</h2>
            <NexusButton variant="outline" size="sm" className="border-white/10 text-gray-500 font-bold h-10 px-6">
              <Filter className="w-4 h-4 mr-2" /> Filter
            </NexusButton>
          </div>

          <NexusCard className="p-0 overflow-hidden border-white/5 bg-white/[0.02]">
            <div className="divide-y divide-white/5">
              {RECENT_TRANSACTIONS.map((tx) => (
                <div key={tx.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/[0.01] transition-colors group">
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      tx.type === 'payment' ? 'bg-purple-500/10 text-purple-400' : 
                      tx.type === 'received' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {tx.type === 'payment' ? <Wallet className="w-6 h-6" /> : 
                       tx.type === 'received' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="font-bold text-lg group-hover:text-blue-400 transition-colors">{tx.description}</div>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <span>{new Date(tx.timestamp).toLocaleString()}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-700" />
                        <span>TX: {tx.hash}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <div className={`text-xl font-bold ${tx.amount.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tx.amount} {tx.currency}
                      </div>
                      <div className="text-xs text-gray-500 font-bold">${tx.usdValue}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <NexusBadge variant="success" className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400">Confirmed</NexusBadge>
                      <button className="text-gray-600 hover:text-white transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Showing 5 of 142 transactions</div>
              <div className="flex gap-2">
                <NexusButton variant="outline" size="sm" className="h-10 px-6 border-white/10 text-gray-500" disabled>Previous</NexusButton>
                <NexusButton variant="outline" size="sm" className="h-10 px-6 border-white/10 text-gray-500 hover:text-white">Next Page</NexusButton>
              </div>
            </div>
          </NexusCard>
        </section>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <section className="space-y-8">
            <h2 className="text-2xl font-bold">Monthly Spending logic</h2>
            <NexusCard className="p-8 border-white/5 bg-white/[0.02]">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={SPENDING_CHART_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#111118', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                    <Bar dataKey="classes" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="market" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="tips" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </NexusCard>
          </section>

          <section className="space-y-8">
            <h2 className="text-2xl font-bold">Category Distribution</h2>
            <NexusCard className="p-8 border-white/5 bg-white/[0.02] flex items-center justify-center">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={SPENDING_DONUT_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {SPENDING_DONUT_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#111118', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </NexusCard>
          </section>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isSendModalOpen && (
          <ModalContainer title="Send Crypto" onClose={() => setIsSendModalOpen(false)}>
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Select Asset</label>
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">E</div>
                    <div>
                      <div className="font-bold">Ethereum</div>
                      <div className="text-[10px] text-gray-500 font-bold">Balance: 0.842 ETH</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Recipient Address</label>
                <div className="relative">
                  <input className="w-full bg-black/40 border border-white/10 h-14 rounded-2xl px-6 font-mono text-sm focus:border-blue-500/50 outline-none" placeholder="0x..." />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                    <button className="text-[10px] font-bold text-blue-400 uppercase bg-blue-500/10 px-3 py-1 rounded-lg">Paste</button>
                    <button className="text-[10px] font-bold text-gray-500 uppercase bg-white/5 px-3 py-1 rounded-lg"><QrCode className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-center">
                <div className="text-5xl font-bold text-white tracking-tighter">0.00 <span className="text-2xl text-gray-500">ETH</span></div>
                <div className="text-gray-500 font-bold uppercase text-[10px]">≈ $0.00 USD</div>
                <div className="flex gap-2 justify-center">
                  {['25%', '50%', 'MAX'].map(p => (
                    <button key={p} className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-gray-400 hover:text-white transition-all">{p}</button>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-white/5 rounded-2xl space-y-3">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-gray-500">Network Fee</span>
                  <span className="text-white">0.0002 ETH ($0.58)</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-gray-500">Total Deducted</span>
                  <span className="text-white">0.0002 ETH</span>
                </div>
              </div>

              <NexusButton onClick={() => {
                toast({ title: "Transaction Broadcasted", description: "Waiting for network confirmation..." });
                setIsSendModalOpen(false);
              }} className="w-full h-14 nexus-gradient-bg text-lg font-bold">Continue</NexusButton>
            </div>
          </ModalContainer>
        )}

        {isReceiveModalOpen && (
          <ModalContainer title="Receive Crypto" onClose={() => setIsReceiveModalOpen(false)}>
            <div className="text-center space-y-10">
              <div className="flex gap-2 p-1 bg-white/5 rounded-xl justify-center">
                {['ETH', 'BTC', 'USDT'].map(c => (
                  <button key={c} className={`px-6 py-2 rounded-lg text-xs font-bold ${c === 'ETH' ? 'bg-white/10 text-white' : 'text-gray-500'}`}>{c}</button>
                ))}
              </div>
              <div className="p-8 bg-white rounded-[2.5rem] inline-block shadow-2xl relative overflow-hidden group">
                <div className="w-48 h-48 bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 font-bold uppercase tracking-widest border-4 border-dashed border-gray-200">
                  MOCK_QR_CODE
                </div>
                <div className="absolute inset-0 bg-blue-600/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <QrCode className="w-12 h-12 text-blue-600" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Your Ethereum Address</div>
                <div className="font-mono text-sm bg-black/40 p-4 rounded-2xl border border-white/5 break-all">0x4f2a8b3c...7d9e2f1a</div>
                <NexusButton onClick={copyAddress} className="w-full nexus-gradient-bg h-14 font-bold">Copy Address</NexusButton>
              </div>
              <div className="text-xs font-bold text-amber-500 bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20">
                ⚠️ Only send ETH on Ethereum network.
              </div>
            </div>
          </ModalContainer>
        )}

        {isDepositModalOpen && (
          <ModalContainer title="Deposit Funds" onClose={() => setIsDepositModalOpen(false)}>
            <div className="space-y-10">
              <div className="grid grid-cols-2 gap-4">
                <button className="p-6 rounded-3xl bg-white/5 border border-blue-500/30 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mx-auto"><QrCode className="w-6 h-6" /></div>
                  <div className="font-bold text-sm">Crypto Wallet</div>
                </button>
                <button className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 text-center space-y-3 opacity-50 cursor-not-allowed grayscale">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 mx-auto"><CreditCard className="w-6 h-6" /></div>
                  <div className="font-bold text-sm">Bank / Card</div>
                  <div className="text-[8px] font-bold text-gray-600 uppercase">Coming Soon</div>
                </button>
              </div>
              
              <div className="p-8 bg-white/5 rounded-3xl border border-white/5 text-center space-y-6">
                <div className="text-xs font-bold text-gray-400">Scan to deposit ETH</div>
                <div className="w-40 h-40 bg-white rounded-2xl mx-auto flex items-center justify-center text-[10px] text-gray-300 font-bold uppercase">MOCK_QR</div>
                <div className="font-mono text-[10px] text-gray-500 break-all">0x4f2a8b3c...7d9e2f1a</div>
                <NexusButton size="sm" variant="outline" className="w-full border-white/10 text-[10px] uppercase">Copy Address</NexusButton>
              </div>
            </div>
          </ModalContainer>
        )}

        {isWithdrawModalOpen && (
          <ModalContainer title="Withdraw Crypto" onClose={() => setIsWithdrawModalOpen(false)}>
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Amount to Withdraw</label>
                <div className="relative">
                  <input className="w-full bg-black/40 border border-white/10 h-14 rounded-2xl px-6 font-bold text-lg focus:border-red-500/50 outline-none" placeholder="0.00" />
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-red-400 uppercase bg-red-500/10 px-3 py-1 rounded-lg">MAX</button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Destination Address</label>
                <input className="w-full bg-black/40 border border-white/10 h-14 rounded-2xl px-6 font-mono text-sm outline-none" placeholder="0x..." />
              </div>

              <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl space-y-4">
                <h4 className="font-bold text-sm text-red-400 flex items-center gap-2"><Shield className="w-4 h-4" /> Security Confirmation</h4>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="w-10 h-14 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center font-bold text-lg text-white">*</div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 text-center font-bold uppercase tracking-widest">Enter 6-digit Wallet PIN</p>
              </div>

              <NexusButton className="w-full h-14 bg-red-600 hover:bg-red-700 text-white border-none font-bold text-lg">Confirm Withdrawal</NexusButton>
            </div>
          </ModalContainer>
        )}
      </AnimatePresence>
    </div>
  )
}

function ModalContainer({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-[#111118] border border-white/10 rounded-[2.5rem] p-10 relative shadow-3xl"
      >
        <button onClick={onClose} className="absolute top-8 right-8 p-2 text-gray-500 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
        <h3 className="text-2xl font-bold mb-10">{title}</h3>
        {children}
      </motion.div>
    </motion.div>
  )
}

function assetSymbolMatch(assetSymbol: string, coinSymbol: string) {
  return assetSymbol === coinSymbol;
}
