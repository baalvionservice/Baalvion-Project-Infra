import { StudentProfile, ClassSession, Transaction, MarketplaceOrder } from "./types";

export const STUDENT_PROFILE: StudentProfile = {
  id: 'st-1',
  name: 'Aryan Mehta',
  avatar: 'https://picsum.photos/seed/aryan/200/200',
  region: 'South Asia',
  regionId: 'sas',
  country: 'India',
  countryCode: 'IN',
  walletBalance: {
    eth: '0.842',
    usd: '2680.45',
    btc: '0.003',
    usdt: '45.00'
  },
  stats: {
    classesCompleted: 24,
    hoursLearned: 36.5,
    streak: 12
  }
};

export const CRYPTO_ASSETS = [
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', balance: '0.842', price: '3180.42', change24h: 4.2, value: '2677.95', color: '#627EEA' },
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', balance: '0.003', price: '62450.00', change24h: 1.8, value: '187.35', color: '#F7931A' },
  { id: 'usdt', name: 'Tether', symbol: 'USDT', balance: '45.00', price: '1.00', change24h: 0.0, value: '45.00', color: '#26A17B' },
  { id: 'bnb', name: 'BNB', symbol: 'BNB', balance: '0.12', price: '412.30', change24h: -1.2, value: '49.48', color: '#F3BA2F' },
  { id: 'sol', name: 'Solana', symbol: 'SOL', balance: '0.45', price: '148.20', change24h: 6.7, value: '66.69', color: '#14F195' },
];

export const HISTORICAL_PRICE_DATA = {
  ETH: Array.from({ length: 168 }).map((_, i) => ({
    time: i,
    price: 2800 + Math.random() * 400 + (i * 2)
  })),
  BTC: Array.from({ length: 168 }).map((_, i) => ({
    time: i,
    price: 58000 + Math.random() * 5000 + (i * 20)
  })),
  USDT: Array.from({ length: 168 }).map((_, i) => ({
    time: i,
    price: 1.00
  })),
  BNB: Array.from({ length: 168 }).map((_, i) => ({
    time: i,
    price: 380 + Math.random() * 40 - (i * 0.1)
  })),
  SOL: Array.from({ length: 168 }).map((_, i) => ({
    time: i,
    price: 120 + Math.random() * 30 + (i * 0.5)
  })),
};

export const UPCOMING_CLASSES: ClassSession[] = [
  {
    id: 'cls-1',
    subject: 'Advanced Calculus',
    teacherId: 'yuki-tanaka',
    teacherName: 'Yuki Tanaka',
    teacherAvatar: 'https://picsum.photos/seed/yuki/100/100',
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 2.5 + 1000 * 60 * 34).toISOString(),
    duration: 60,
    type: 'private',
    status: 'confirmed',
    paidAmount: '0.02 ETH'
  },
  {
    id: 'cls-2',
    subject: 'Organic Chemistry',
    teacherId: 'priya-sharma',
    teacherName: 'Priya Sharma',
    teacherAvatar: 'https://picsum.photos/seed/priya/100/100',
    startTime: new Date(Date.now() + 86400000 * 2).toISOString(),
    duration: 60,
    type: 'private',
    status: 'confirmed',
    paidAmount: '0.02 ETH'
  },
  {
    id: 'cls-3',
    subject: 'Data Science Intro',
    teacherId: 'emily-chen',
    teacherName: 'Emily Chen',
    teacherAvatar: 'https://picsum.photos/seed/emily/100/100',
    startTime: new Date(Date.now() + 86400000 * 4).toISOString(),
    duration: 60,
    type: 'private',
    status: 'pending',
    paidAmount: '0.025 ETH'
  }
];

export const RECENT_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    type: 'payment',
    description: 'Class payment — Priya Sharma',
    amount: '-0.02',
    currency: 'ETH',
    usdValue: '58.00',
    timestamp: '2026-03-10T14:30:00Z',
    status: 'confirmed',
    hash: '0x4f2a...8b3c'
  },
  {
    id: 'tx-2',
    type: 'received',
    description: 'Deposit from external wallet',
    amount: '+0.1',
    currency: 'ETH',
    usdValue: '291.20',
    timestamp: '2026-03-09T11:00:00Z',
    status: 'confirmed',
    hash: '0x7e1b...2c4d'
  },
  {
    id: 'tx-3',
    type: 'payment',
    description: 'Study Material Purchase',
    amount: '-45.00',
    currency: 'USDT',
    usdValue: '45.00',
    timestamp: '2026-03-08T15:00:00Z',
    status: 'confirmed',
    hash: '0x9a3d...1e5f'
  },
  {
    id: 'tx-4',
    type: 'payment',
    description: 'Class payment — Rahul Patel',
    amount: '-0.012',
    currency: 'ETH',
    usdValue: '34.80',
    timestamp: '2026-03-08T16:00:00Z',
    status: 'confirmed',
    hash: '0x2b4c...9d1e'
  },
  {
    id: 'tx-5',
    type: 'payment',
    description: 'VIP Tip — Priya Sharma',
    amount: '-0.005',
    currency: 'ETH',
    usdValue: '14.50',
    timestamp: '2026-03-07T17:30:00Z',
    status: 'confirmed',
    hash: '0x5e6f...0a1b'
  }
];

export const MARKETPLACE_ORDERS: MarketplaceOrder[] = [
  {
    id: 'ord-1',
    category: 'Clothing',
    item: 'Premium Hoodie — Black XL',
    store: 'NEXUS Fashion',
    date: 'Mar 8, 2026',
    amount: '45 USDT',
    status: 'Out for Delivery'
  },
  {
    id: 'ord-2',
    category: 'Food',
    item: 'Burger Combo + Fries',
    store: 'BurgerNation',
    date: 'Mar 10, 2026',
    amount: '8 USDT',
    status: 'Preparing'
  }
];

export const SUBJECT_PROGRESS = [
  { name: 'Advanced Calculus', progress: 82, topics: '24/30', teacher: 'Yuki Tanaka' },
  { name: 'Chemistry', progress: 54, topics: '13/24', teacher: 'Priya Sharma' },
  { name: 'Physics', progress: 22, topics: '4/18', teacher: 'Rahul Patel' },
  { name: 'Data Science', progress: 10, topics: '2/20', teacher: 'Emily Chen' },
];
