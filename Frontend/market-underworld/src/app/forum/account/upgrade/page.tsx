
"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Check, X, CreditCard, ChevronDown, Copy, Wallet, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * @fileOverview Membership upgrade page with multi-step high-fidelity payment terminal.
 */

const TIERS = [
  {
    name: 'Anonymous',
    price: 'Free',
    validity: 'Constantly',
    nickname: 'Anonim_1390963413',
    banner: { text: 'Unknown', color: 'bg-[#fdf2e9] text-[#e67e22]' },
    benefits: [
      { text: 'Limitation on creating new topics.', isNegative: true },
      { text: 'Limitation of the ability to comment in topics.', isNegative: true },
      { text: 'Random user nickname and avatar.', isNegative: true }
    ],
    hasBuyButton: false
  },
  {
    name: 'Project participant',
    price: '$200.00',
    numericPrice: 200,
    validity: 'Forever',
    nickname: 'Anonim_1390963413',
    banner: { text: 'Project participant', color: 'bg-[#3498db] text-white' },
    benefits: [
      { text: 'Full access to the public part of the forum.' },
      { text: 'Possibility to choose a nickname.' },
      { text: 'Possibility to set an avatar.' },
      { text: 'Creation of topics in all sections.' },
      { text: 'Ability to leave comments on any topic.' },
      { text: 'Unlimited private messages.' },
      { text: 'Free participation in lectures.' }
    ],
    hasBuyButton: true
  },
  {
    name: 'Premium member',
    price: '$270.00',
    numericPrice: 270,
    validity: 'Forever',
    nickname: 'Anonim_1390963413',
    banner: { text: 'Premium member', color: 'bg-gradient-to-r from-[#d35400] to-[#e67e22] text-white border border-[#ba4a00]' },
    benefits: [
      { text: 'Benefits of project participant status.' },
      { text: 'Opening of all hides.' },
      { text: 'Edit your messages within 1 hour.' },
      { text: 'Increased trust from the administration and other users.' },
      { text: 'Unlimited time for "Premium member" membership.' },
      { text: 'A special banner under the nickname "Premium member".' }
    ],
    hasBuyButton: true
  },
  {
    name: 'Gold member(-30% for 24 hours)',
    price: '$300.00',
    numericPrice: 300,
    validity: 'Forever',
    nickname: 'Anonim_1390963413',
    banner: { text: 'Gold member(-30% for 24 hours)', color: 'bg-gradient-to-r from-[#f1c40f] to-[#f39c12] text-white border border-[#d4ac0d]' },
    benefits: [
      { text: 'Benefits of Premium member status.' },
      { text: 'Opening of all hides.' },
      { text: 'Edit your messages within 1 hour.' },
      { text: 'Increased trust from the administration and other users.' },
      { text: 'Unlimited validity period of "Gold Member".' },
      { text: 'Special banner under the nickname "Gold Member".' },
      { text: 'Ability to add a signature with a banner on your topic (400x50/300kb).' },
      { text: 'Possibility to request a non-standard title under a nickname.' }
    ],
    hasBuyButton: true
  },
  {
    name: 'Platinum Member',
    price: '$750.00',
    numericPrice: 750,
    validity: 'Forever',
    nickname: 'Anonim_1390963413',
    nickColor: 'text-[#f1c40f]',
    banner: { text: 'Platinum Member', color: 'bg-gradient-to-r from-[#5d69be] to-[#6c63ff] text-white border border-[#4854a1]' },
    benefits: [
      { text: 'Benefits of Gold member status.' },
      { text: 'A unique nickname color that will make you stand out from other participants.', isHighlight: true },
      { text: 'Access to the closed section.' },
      { text: 'Elimination of 90% of advertising on the forum.' },
      { text: 'Opening of all hides.' },
      { text: 'Ability to edit your messages for one hour.' },
      { text: 'Unlimited validity of the Platinum Member status.' },
      { text: 'A special banner under the nickname "Platinum Member" that will attract attention.' },
      { text: 'Create a signature with a banner on your topic (400x50/300kb).' },
      { text: 'Request for a non-standard title under a nickname.' }
    ],
    hasBuyButton: true
  },
  {
    name: 'ShadowMarket',
    price: '$1200.00',
    numericPrice: 1200,
    validity: 'Forever',
    nickname: 'Anonim_1390963413',
    nickColor: 'text-[#2ecc71]',
    banner: { text: 'ShadowMarket', color: 'bg-gradient-to-r from-[#c0ca33] to-[#9eb310] text-black border border-[#afb42b]' },
    benefits: [
      { text: 'Benefits of Platinum Member status.' },
      { text: 'A unique nickname color that stands out from the crowd.' },
      { text: 'Access to the closed section of the forum.' },
      { text: 'Training from ShadowMarket protocol.' },
      { text: 'Ability to view all hides.' },
      { text: 'Time to edit your messages is 1 hour.' },
      { text: 'Unlimited validity of the "ShadowMarket" status.' },
      { text: 'A special banner under the nickname "ShadowMarket".' },
      { text: 'Possibility to place a banner on your topic in the signature (400x50/300kb).' },
      { text: 'Possibility to request a non-standard title under a nickname.' }
    ],
    hasBuyButton: true
  },
  {
    name: 'Ruby Member',
    price: '$8000.00',
    numericPrice: 8000,
    validity: 'Forever',
    nickname: 'Anonim_1390963413',
    nickColor: 'text-[#FF3D57]',
    banner: { text: 'Ruby Member', color: 'bg-gradient-to-r from-[#e91e63] to-[#9c27b0] text-white border border-[#c2185b]' },
    benefits: [
      { text: 'Benefits of Platinum Member status.' },
      { text: 'A unique nickname color that will stand out from other participants.' },
      { text: 'Access to the closed section of the forum.' },
      { text: 'Removing 90% of advertising on the site.' },
      { text: 'Ability to customize your profile design.' },
      { text: 'Unlimited time to edit your trading topic and messages.' },
      { text: 'The value of an account increases by $250 each time it is sold.', isImportant: true }
    ],
    hasBuyButton: true
  }
]

const WALLETS = [
  { id: 'btc', name: 'BTC', icon: '₿', color: 'text-orange-500' },
  { id: 'eth', name: 'ETH', icon: 'Ξ', color: 'text-blue-500' },
  { id: 'simt', name: 'SIMT', icon: 'T', color: 'text-emerald-500' },
  { id: 'ltc', name: 'LTC', icon: 'Ł', color: 'text-gray-400' },
  { id: 'trx', name: 'TRX', icon: 'TRX', color: 'text-red-500' },
  { id: 'usdt_trc20', name: 'USDT trc20', icon: '₮', color: 'text-emerald-600' },
  { id: 'bnb', name: 'BNB', icon: 'BNB', color: 'text-yellow-500' },
  { id: 'usdt_bep20', name: 'USDT bep20', icon: '₮', color: 'text-emerald-600' },
  { id: 'bch', name: 'BCH', icon: 'BCH', color: 'text-green-500' },
  { id: 'xmr', name: 'XMR', icon: 'XMR', color: 'text-orange-600' },
  { id: 'ton', name: 'TON', icon: 'TON', color: 'text-blue-400' },
  { id: 'usdt_ton', name: 'USDT TON', icon: '₮', color: 'text-emerald-600' },
  { id: 'pol', name: 'POL', icon: 'POL', color: 'text-purple-500' },
  { id: 'usdt_pol', name: 'USDT POL', icon: '₮', color: 'text-emerald-600' },
]

export default function MembershipUpgradePage() {
  const [selectedTier, setSelectedTier] = useState<typeof TIERS[0] | null>(null);
  const [purchaseStep, setPurchaseStep] = useState(1); // 1: Method selection, 2: Payment details
  const [selectedWallet, setSelectedWallet] = useState('btc');

  const handleOpenPurchase = (tier: typeof TIERS[0]) => {
    setSelectedTier(tier);
    setPurchaseStep(1);
  };

  const handleClosePurchase = () => {
    setSelectedTier(null);
    setPurchaseStep(1);
  };

  const handleToStep2 = () => {
    setPurchaseStep(2);
  };

  return (
    <div className="min-h-screen bg-[#edf2f7] pb-20">
      {/* Top Secondary Navigation */}
      <div className="bg-[#2980b9] h-10 border-b border-white/10 sticky top-0 z-[100]">
        <div className="container mx-auto px-6 h-full flex items-center gap-8">
          <button className="text-[11px] font-bold text-white uppercase hover:opacity-80 transition-all">Your news feed</button>
          <button className="text-[11px] font-bold text-white uppercase hover:opacity-80 transition-all">Last activity</button>
          <button className="text-[11px] font-bold text-white uppercase hover:opacity-80 transition-all">Your profile</button>
          <button className="text-[11px] font-bold text-white uppercase hover:opacity-80 transition-all">Your account</button>
          <button className="text-[11px] font-bold text-white uppercase hover:opacity-80 transition-all ml-auto">Exit</button>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {TIERS.map((tier, idx) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col"
            >
              {/* Card Header */}
              <div className="flex justify-between items-center p-5 bg-gray-50/50 border-b border-gray-100 rounded-t-lg">
                <h3 className="text-base font-black text-[#1a2634] tracking-tight truncate mr-2" title={tier.name}>{tier.name}</h3>
                <span className="text-base font-black text-[#1a2634] whitespace-nowrap">{tier.price}</span>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 space-y-6">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-gray-400 uppercase tracking-widest">Validity period</span>
                  <span className="text-gray-600">{tier.validity}</span>
                </div>

                <div className="grid grid-cols-2 border-y border-gray-100 py-4 relative">
                  <div className="absolute top-0 left-1/4 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-[9px] font-bold text-gray-300 uppercase">Banner</div>
                  <div className="absolute top-0 left-3/4 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-[9px] font-bold text-gray-300 uppercase">Nickname color</div>
                  
                  <div className="flex items-center justify-center border-r border-gray-100 pr-2">
                    <div className={cn(
                      "px-3 py-1 rounded text-[10px] font-bold text-center leading-tight min-h-[24px] flex items-center justify-center",
                      tier.banner.color
                    )}>
                      {tier.banner.text}
                    </div>
                  </div>
                  <div className="flex items-center justify-center pl-2">
                    <span className={cn(
                      "text-[13px] font-bold truncate",
                      tier.nickColor || "text-[#1a2634]"
                    )}>
                      {tier.nickname}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 pt-2">
                  {tier.benefits.map((benefit: any, bIdx) => (
                    <li 
                      key={bIdx} 
                      className={cn(
                        "flex items-start gap-3 text-[11px] font-medium leading-relaxed",
                        benefit.isHighlight ? "text-[#f1c40f] font-bold" : 
                        benefit.isImportant ? "text-[#FF3D57] font-bold" : 
                        "text-gray-400"
                      )}
                    >
                      <span className="mt-1 shrink-0">–</span>
                      <span>{benefit.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Buy Button Footer */}
              <div className="p-5 mt-auto">
                {tier.hasBuyButton ? (
                  <button 
                    onClick={() => handleOpenPurchase(tier)}
                    className="w-full bg-[#1a2634] hover:bg-[#2c3e50] text-white h-12 rounded-lg flex items-center justify-center gap-2 transition-all group"
                  >
                    <ShoppingCart size={16} className="group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-widest">Buy</span>
                  </button>
                ) : (
                  <div className="h-12" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal Backdrop */}
      <AnimatePresence>
        {selectedTier && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-[2px]">
            {purchaseStep === 1 ? (
              <motion.div
                key="step1"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-[700px] bg-white rounded shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden"
              >
                {/* Step 1 Header */}
                <div className="bg-[#edf2f7] px-6 py-4 border-b border-gray-300 flex justify-between items-center">
                  <h2 className="text-xl font-medium text-[#1a2634]">
                    Account Type: {selectedTier.name} ({selectedTier.price})
                  </h2>
                  <button 
                    onClick={handleClosePurchase}
                    className="text-gray-400 hover:text-[#1a2634] transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="p-0">
                  <div className="grid grid-cols-[1fr_2fr] border-b border-gray-200">
                    <div className="px-6 py-8 text-right bg-white">
                      <span className="text-sm font-medium text-black">Select a payment method:</span>
                    </div>
                    <div className="px-6 py-8 bg-white border-l border-gray-200">
                      <div className="relative group">
                        <select className="w-full bg-[#f8fafc] border border-gray-300 rounded-sm h-10 px-4 text-sm font-medium text-black outline-none focus:border-blue-400 appearance-none transition-all">
                          <option>Central wallet</option>
                          <option>BTC (Manual)</option>
                          <option>ETH (Manual)</option>
                          <option>LTC (Manual)</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 flex justify-center bg-white">
                  <button 
                    onClick={handleToStep2}
                    className="bg-[#4a5568] hover:bg-[#2d3748] text-white px-10 py-2 rounded flex items-center gap-2 font-bold text-sm transition-all shadow-sm"
                  >
                    <CreditCard size={18} />
                    <span>Buy</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-[800px] bg-white rounded shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden"
              >
                {/* Step 2: Payment Details Header */}
                <div className="bg-[#edf2f7] px-6 py-4 border-b border-gray-300 flex justify-between items-center">
                  <h2 className="text-2xl font-medium text-[#1a2634]">Payment details</h2>
                  <button 
                    onClick={handleClosePurchase}
                    className="text-gray-400 hover:text-[#1a2634] transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="p-8 space-y-8">
                  {/* Form Grid */}
                  <div className="grid grid-cols-[200px_1fr] gap-y-6 items-center">
                    <div className="text-right pr-6">
                      <span className="text-sm font-medium text-black">Purchase item:</span>
                    </div>
                    <div className="relative">
                      <div className="w-full h-10 px-4 bg-white border border-[#3498db]/30 rounded flex items-center text-sm font-medium text-black">
                        Premium Upgrade: {selectedTier.name} ({selectedTier.nickname})
                      </div>
                    </div>

                    <div className="text-right pr-6">
                      <span className="text-sm font-medium text-black">Amount USD</span>
                    </div>
                    <div className="relative group">
                      <div className="w-full h-10 px-4 bg-[#f8fafc] border border-gray-200 rounded flex items-center text-sm font-bold text-black gap-3">
                        <Copy size={14} className="text-blue-400" />
                        <span>{selectedTier.numericPrice}</span>
                      </div>
                    </div>

                    <div className="text-right pr-6 self-start pt-2">
                      <span className="text-sm font-medium text-black">Choosing a wallet:</span>
                    </div>
                    <div className="space-y-4">
                      {/* Tabs */}
                      <div className="flex border border-gray-200 rounded overflow-hidden w-full h-10">
                        <button className="flex-1 bg-white hover:bg-gray-50 text-sm font-medium text-black border-r border-gray-200">All wallets</button>
                        <button className="flex-1 bg-white hover:bg-gray-50 text-sm font-medium text-black">Wallets with balance</button>
                      </div>

                      {/* Wallet Grid */}
                      <div className="grid grid-cols-2 gap-2">
                        {WALLETS.map(wallet => (
                          <div 
                            key={wallet.id}
                            onClick={() => setSelectedWallet(wallet.id)}
                            className={cn(
                              "p-3 rounded border flex items-center gap-3 cursor-pointer transition-all",
                              selectedWallet === wallet.id 
                                ? "bg-white border-[#3498db] shadow-[0_0_8px_rgba(52,152,219,0.2)]" 
                                : "bg-white border-gray-100 hover:border-gray-300"
                            )}
                          >
                            <div className={cn(
                              "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                              selectedWallet === wallet.id ? "border-[#3498db] bg-white" : "border-gray-300 bg-white"
                            )}>
                              {selectedWallet === wallet.id && <div className="w-2 h-2 rounded-full bg-[#3498db]" />}
                            </div>
                            <div className={cn("text-xs font-bold w-6", wallet.color)}>{wallet.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] font-bold text-black uppercase">{wallet.name}</div>
                              <div className="text-[10px] text-gray-400">Balance 0.00000000</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-gray-400">Select the currency for payment</p>
                    </div>
                  </div>
                </div>

                {/* Final Buy Button */}
                <div className="p-4 flex justify-center bg-white border-t border-gray-100">
                  <button 
                    onClick={() => {
                      alert(`Transaction initialized for ${selectedTier.name} using ${selectedWallet.toUpperCase()}. Waiting for network confirmation...`);
                      handleClosePurchase();
                    }}
                    className="bg-[#4a5568] hover:bg-[#2d3748] text-white px-12 py-2 rounded flex items-center gap-2 font-bold text-sm transition-all shadow-sm"
                  >
                    <Wallet size={18} />
                    <span>Buy</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
