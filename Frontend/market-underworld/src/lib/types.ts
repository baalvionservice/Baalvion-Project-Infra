import type { LucideIcon } from 'lucide-react';

export type UserRole = 'SUPER_ADMIN' | 'TEACHER' | 'SELLER' | 'STUDENT' | 'CREATOR' | 'INVESTOR';

export interface Region {
  id: string;
  name: string;
  icon: string;
  description: string;
  teachers?: number;
  sessions?: number;
  color?: string;
  countries?: string[];
}

export interface MarketplaceModule {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  status: 'enabled' | 'disabled' | 'installed';
  categories: string[];
  color: string;
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  region: string;
  regionId: string;
  country: string;
  countryCode: string;
  price_crypto: string;
  price_usd: string;
  currency: string;
  rating: number;
  reviewCount?: number;
  students_count?: number;
  avatar_url: string;
  bio?: string;
  longBio?: string;
  memberSince?: string;
  classesGiven?: number;
  hoursTaught?: number;
  totalEarned?: string;
  is_live: boolean;
  tags?: string[];
  skills?: { name: string; level: number }[];
  education?: { year: string; degree: string; institution: string }[];
  status?: 'active' | 'suspended' | 'pending';
}

export interface CreatorProfile {
  id: string;
  name: string;
  platforms: string[];
  followers: number;
  bio: string;
  avatar: string;
  rating: number;
  verified: boolean;
  totalEarningsGenerated: number;
  regionId: string;
  country: string;
}

export interface InvestmentListing {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  platform: 'YouTube' | 'Instagram' | 'TikTok' | 'Podcast' | 'LiveStreaming';
  category: 'RevenueShare' | 'ChannelInvestment' | 'Partnership' | 'BrandPromotion' | 'Services';
  investmentRequired: number;
  expectedRevenue: number;
  investorShare: number;
  platformFee: number;
  description: string;
  isLive: boolean;
  streamSchedule?: string;
  creatorPlatformLink: string;
  status: 'active' | 'funded' | 'closed';
  createdAt: string;
  images: string[];
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  crypto_price: string;
  category: string;
  module?: string;
  region: string;
  regionId: string;
  country: string;
  rating: number;
  purchases: number;
  seller: string;
  sellerVerified: boolean;
  stock?: number;
  discount?: string;
  originalPrice?: string;
  status?: 'approved' | 'pending' | 'removed';
  location?: string;
  quantity?: string;
  brand?: string;
  condition?: string;
  metadata?: Record<string, any>;
  type?: 'service' | 'asset' | 'investment';
  images?: string[];
  creator_name?: string;
  youtube_channel_link?: string;
  investment_amount?: number;
  expected_revenue?: number;
  platform_fee?: number;
  investor_share?: number;
  is_live?: boolean;
  stream_link?: string;
  stream_start_time?: string;
  revenue_generated?: number;
}

export interface MarketplaceCategory {
  id: string;
  name: string;
  description: string;
  icon: string | LucideIcon;
  itemCount: number;
  path?: string;
  color?: string;
  slug?: string;
  status?: string;
  countryId?: string;
  moduleId?: string;
  type?: 'Physical' | 'Digital' | 'Service';
}

export interface CountryMarketplace {
  country: string;
  countryCode: string;
  status: 'OPERATIONAL' | 'OFFLINE' | 'MAINTENANCE';
  modules: string[];
  payoutKey: string;
}

export interface UserIdentity {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  regionId: string;
  city: string;
  language: string;
  timezone: string;
  detectedAt: string;
}

export interface SimulationStats {
  totalUsers: number;
  onlineUsers: number;
  activeTeachers: number;
  activeSellers: number;
  totalListings: number;
  activeSessions: number;
  dailyOrders: number;
  totalVolumeEth: string;
  totalRevenueUsdt: string;
  avgOrderValue: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  region: string;
  regionId: string;
  country: string;
  avatar: string;
  joinedDate: string;
  status: 'active' | 'suspended';
}

export interface MarketplaceOrder {
  id: string;
  buyer_id?: string;
  seller_id?: string;
  listing_id?: string;
  item: string;
  category: string;
  store: string;
  date: string;
  amount: string;
  status: 'Preparing' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  region: string;
  category: string;
  userType: string;
  timestamp: string;
  price?: string;
  cryptoPrice?: string;
  currency?: string;
  deliveryType?: 'Physical' | 'Digital' | 'Service';
  location?: { country: string; city?: string };
  seller?: { id: string; name: string; rating: number; reputation: number; isVerified: boolean };
}

export interface Thread {
  id: string;
  title: string;
  authorRole: string;
  replies: number;
  views: number;
  timestamp: string;
  country: string;
  regionId: string;
}

export interface PremiumPlan {
  id: string;
  name: string;
  price: string;
  features: string[];
  recommended?: boolean;
}

export interface StudentProfile {
  id: string;
  name: string;
  avatar: string;
  region: string;
  regionId: string;
  country: string;
  countryCode: string;
  walletBalance: {
    eth: string;
    usd: string;
    btc: string;
    usdt: string;
  };
  stats: {
    classesCompleted: number;
    hoursLearned: number;
    streak: number;
  };
}

export interface ClassSession {
  id: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  teacherAvatar: string;
  startTime: string;
  duration: number;
  type: 'private' | 'group';
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  paidAmount: string;
}

export interface Transaction {
  id: string;
  type: 'payment' | 'received';
  description: string;
  amount: string;
  currency: string;
  usdValue: string;
  timestamp: string;
  status: 'confirmed' | 'pending' | 'failed';
  hash: string;
}

export interface ForumThread {
  id: string;
  title: string;
  preview: string;
  author: {
    name: string;
    avatar: string;
    role: string;
    region: string;
    country: string;
  };
  category: string;
  regionId: string;
  views: number;
  replies: number;
  likes: number;
  timestamp: string;
  isPinned?: boolean;
  isHot?: boolean;
  isVip?: boolean;
  isSolved?: boolean;
  tags: string[];
}

export interface ForumReply {
  id: string;
  threadId: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    role: string;
    region: string;
    country: string;
    postsCount: number;
    memberSince: string;
  };
  likes: number;
  timestamp: string;
  isBestAnswer?: boolean;
}
