
import { Region, Teacher, Product, UserProfile, MarketplaceCategory, CountryMarketplace, CreatorProfile, InvestmentListing, MarketplaceModule } from '@/lib/types';

export const MOCK_USERS: UserProfile[] = [
  { id: 'u1', name: 'Priya Sharma', email: 'priya.sharma@example.com', role: 'TEACHER', region: 'South Asia', regionId: 'sas', country: 'India', avatar: 'https://picsum.photos/seed/priya/200/200', joinedDate: 'Jan 2024', status: 'active' },
  { id: 'u2', name: 'Aryan Mehta', email: 'aryan.mehta@example.com', role: 'STUDENT', region: 'South Asia', regionId: 'sas', country: 'India', avatar: 'https://picsum.photos/seed/aryan/200/200', joinedDate: 'Feb 2024', status: 'active' },
  { id: 'u3', name: 'Emily Chen', email: 'emily.chen@example.com', role: 'STUDENT', region: 'East Asia & Pacific', regionId: 'eap', country: 'Singapore', avatar: 'https://picsum.photos/seed/emily/200/200', joinedDate: 'Mar 2024', status: 'active' },
  { id: 'u4', name: 'GadgetHub_Dubai', email: 'contact@gadgethubdubai.example.com', role: 'SELLER', region: 'Middle East & North Africa', regionId: 'mena', country: 'UAE', avatar: 'https://picsum.photos/seed/gadgethub/200/200', joinedDate: 'Nov 2023', status: 'active' },
  { id: 'u5', name: 'Gaming Master Alpha', email: 'alpha@example.com', role: 'CREATOR', region: 'South Asia', regionId: 'sas', country: 'India', avatar: 'https://picsum.photos/seed/creator1/200/200', joinedDate: 'Dec 2023', status: 'active' },
  { id: 'u6', name: 'System Administrator', email: 'admin@marketunderworld.example.com', role: 'SUPER_ADMIN', region: 'North America', regionId: 'nam', country: 'United States', avatar: 'https://picsum.photos/seed/admin/200/200', joinedDate: 'Jun 2023', status: 'active' },
];

export const REGIONS: Region[] = [
  { 
    id: 'sas', 
    name: 'South Asia', 
    icon: '🌿', 
    description: 'Elite hub for competitive exam prep and organic chemistry protocols.',
    teachers: 1240, 
    sessions: 42, 
    color: '#39FF14',
    countries: ['India', 'Pakistan', 'Bangladesh', 'Nepal', 'Sri Lanka']
  },
  { 
    id: 'eap', 
    name: 'East Asia & Pacific', 
    icon: '🌏', 
    description: 'Digital innovation hub focusing on hardware arbitrage and manufacturing loops.',
    teachers: 1820, 
    sessions: 64, 
    color: '#3B82F6',
    countries: ['Japan', 'China', 'South Korea', 'Australia', 'Vietnam']
  },
  { 
    id: 'eca', 
    name: 'Europe & Central Asia', 
    icon: '🌍', 
    description: 'Center for regulatory intelligence and distribution logistics discussions.',
    teachers: 2104, 
    sessions: 81, 
    color: '#A855F7',
    countries: ['Germany', 'France', 'Poland', 'Turkey', 'United Kingdom']
  },
  { 
    id: 'nam', 
    name: 'North America', 
    icon: '🗽', 
    description: 'The core development cluster for software intelligence and venture flow.',
    teachers: 1558, 
    sessions: 38, 
    color: '#00E676',
    countries: ['United States', 'Canada']
  },
  { 
    id: 'mena', 
    name: 'Middle East & North Africa', 
    icon: '🇲🇦', 
    description: 'Strategic node for global energy insights and wealth management channels.',
    teachers: 832, 
    sessions: 19, 
    color: '#F59E0B',
    countries: ['Saudi Arabia', 'UAE', 'Egypt', 'Qatar', 'Morocco']
  },
  { 
    id: 'lac', 
    name: 'Latin America & Caribbean', 
    icon: '🌎', 
    description: 'Emerging tech node specializing in payment rails and localized markets.',
    teachers: 450, 
    sessions: 12, 
    color: '#FF6584',
    countries: ['Brazil', 'Mexico', 'Argentina', 'Colombia', 'Chile']
  },
  { 
    id: 'ssa', 
    name: 'Sub-Saharan Africa', 
    icon: '🌍', 
    description: 'Frontier market intelligence specializing in mobile finance and infrastructure.',
    teachers: 320, 
    sessions: 8, 
    color: '#A855F7',
    countries: ['Nigeria', 'Kenya', 'South Africa', 'Ghana', 'Ethiopia']
  },
];

export const MARKETPLACE_MODULES: MarketplaceModule[] = [
  { id: 'mod_creator', name: 'Creator Equity', slug: 'creators', icon: '💎', description: 'Invest in digital talent nodes.', status: 'enabled', categories: ['cat_creator'], color: 'from-blue-400 to-indigo-600' },
  { id: 'mod_electronics', name: 'Electronics', slug: 'electronics', icon: '💻', description: 'Hardware and gadget trade nodes.', status: 'enabled', categories: ['cat_electronics'], color: 'from-purple-500 to-violet-600' },
  { id: 'mod_commodities', name: 'Commodities', slug: 'commodities', icon: '🏗️', description: 'Raw materials and agriculture.', status: 'enabled', categories: ['cat_commodities'], color: 'from-orange-500 to-amber-600' },
  { id: 'mod_travel', name: 'Travel Node', slug: 'travel', icon: '✈️', description: 'Flights and luxury hotel protocols.', status: 'enabled', categories: ['cat_hotels', 'cat_flights'], color: 'from-cyan-500 to-blue-600' },
  { id: 'mod_realestate', name: 'Real Estate', slug: 'realestate', icon: '🏢', description: 'Commercial and residential properties.', status: 'enabled', categories: ['cat_realestate'], color: 'from-emerald-500 to-teal-600' },
  { id: 'mod_vehicles', name: 'Vehicles', slug: 'vehicles', icon: '🏎️', description: 'Automotive logistics and sales.', status: 'installed', categories: ['cat_vehicles'], color: 'from-amber-500 to-orange-600' },
  { id: 'mod_freelance', name: 'Freelance', slug: 'freelance', icon: '⚡', description: 'Professional services and intel.', status: 'installed', categories: ['cat_freelance'], color: 'from-indigo-500 to-purple-600' },
];

export const ALL_CATEGORIES: MarketplaceCategory[] = [
  { id: 'cat_creator', name: 'Creator Equity', slug: 'creators', description: 'Invest in creators and share their revenue yield.', icon: '💎', status: 'active', countryId: 'india', itemCount: 412, path: 'creators', color: 'from-blue-400 to-indigo-600', moduleId: 'mod_creator' },
  { id: 'cat_electronics', name: 'Electronics', slug: 'electronics', description: 'Advanced hardware and localized gadget nodes.', icon: '💻', status: 'active', countryId: 'india', itemCount: 1240, path: 'electronics', color: 'from-purple-500 to-violet-600', moduleId: 'mod_electronics' },
  { id: 'cat_commodities', name: 'Commodities', slug: 'commodities', description: 'Raw materials and bulk agriculture settlement.', icon: '🏗️', status: 'active', countryId: 'india', itemCount: 320, path: 'commodities', color: 'from-orange-500 to-amber-600', moduleId: 'mod_commodities' },
  { id: 'cat_hotels', name: 'Luxury Hotels', slug: 'hotels', description: 'Verified 5-star node bookings.', icon: '🏨', status: 'active', countryId: 'india', itemCount: 560, path: 'hotels', color: 'from-pink-500 to-rose-600', moduleId: 'mod_travel' },
  { id: 'cat_flights', name: 'Aviation Node', slug: 'flights', description: 'Global flight protocols and class upgrades.', icon: '✈️', status: 'active', countryId: 'india', itemCount: 842, path: 'flights', color: 'from-blue-500 to-cyan-600', moduleId: 'mod_travel' },
  { id: 'cat_digital', name: 'Digital Assets', slug: 'digital-assets', description: 'Trading YouTube channels and domains.', icon: '🎬', status: 'active', countryId: 'india', itemCount: 210, path: 'digital-assets', color: 'from-cyan-500 to-blue-600', moduleId: 'mod_creator' },
  { id: 'cat_realestate', name: 'Real Estate', slug: 'realestate', description: 'Commercial property nodes.', icon: '🏢', status: 'active', countryId: 'india', itemCount: 120, path: 'realestate', color: 'from-emerald-500 to-teal-600', moduleId: 'mod_realestate' },
];

export const COUNTRY_MARKETPLACE_CONFIGS: Record<string, CountryMarketplace> = {
  'india': {
    country: 'India',
    countryCode: 'IN',
    status: 'OPERATIONAL',
    payoutKey: 'PROTO-SEC-IND-847',
    modules: ['mod_creator', 'mod_electronics', 'mod_commodities', 'mod_travel', 'mod_realestate']
  },
  'usa': {
    country: 'United States',
    countryCode: 'US',
    status: 'OPERATIONAL',
    payoutKey: 'PROTO-SEC-USA-112',
    modules: ['mod_creator', 'mod_electronics', 'mod_realestate']
  },
  'uae': {
    country: 'UAE',
    countryCode: 'AE',
    status: 'OPERATIONAL',
    payoutKey: 'PROTO-SEC-UAE-991',
    modules: ['mod_travel', 'mod_realestate']
  }
};

export const CREATORS: CreatorProfile[] = [
  {
    id: 'c1',
    name: 'Gaming Master Alpha',
    platforms: ['YouTube', 'LiveStreaming'],
    followers: 1200000,
    bio: 'Leading gaming creator specializing in high-stakes esports.',
    avatar: 'https://picsum.photos/seed/creator1/200/200',
    rating: 4.9,
    verified: true,
    totalEarningsGenerated: 450000,
    regionId: 'sas',
    country: 'India'
  }
];

export const CREATOR_INVESTMENTS: InvestmentListing[] = [
  {
    id: 'inv_1',
    creatorId: 'c1',
    creatorName: 'Gaming Master Alpha',
    title: 'Q2 Live Stream Super Chat Yield',
    platform: 'YouTube',
    category: 'RevenueShare',
    investmentRequired: 50000,
    expectedRevenue: 120000,
    investorShare: 70,
    platformFee: 30,
    description: 'Share in revenue generated from Super Chats.',
    isLive: true,
    streamSchedule: 'Mon, Wed, Fri 18:00 UTC',
    creatorPlatformLink: 'https://youtube.com/alpha_gaming',
    status: 'active',
    createdAt: new Date().toISOString(),
    images: ['https://picsum.photos/seed/inv1/800/400']
  }
];

export const MARKETPLACE_PRODUCTS: Product[] = [
  {
    id: 'p1',
    title: 'iPhone 16 Pro Max — Node UAE',
    description: 'Unlocked global version. Sealed.',
    price: 1200,
    crypto_price: '0.42',
    category: 'Electronics',
    module: 'Electronics',
    region: 'Middle East',
    regionId: 'mena',
    country: 'UAE',
    rating: 5.0,
    purchases: 42,
    seller: 'GadgetHub_Dubai',
    sellerVerified: true,
    status: 'approved'
  }
];

export const MARKET_TICKER = [
  { pair: 'BTC', price: '94,231', change: '1.8%', pos: true },
  { pair: 'ETH', price: '3,124', change: '4.2%', pos: true },
  { pair: 'SOL', price: '198', change: '2.1%', pos: false },
  { pair: 'USDT', price: '1.00', change: '0.0%', pos: true },
];

export const LIVE_ACTIVITY_MOCK = {
  events: [
    { id: 'ev1', type: 'purchase', text: 'New YouTube node order from Mumbai', time: '2m ago' },
    { id: 'ev2', type: 'category', text: 'Admin installed module: Real Estate', time: '5m ago' },
  ],
  activeSessions: [
    { id: 's1', teacherName: 'Priya Sharma', region: 'South Asia', regionId: 'sas', country: 'India', title: 'Advanced Organic Synthesis', viewers: 124, duration: '42:10', product: 'Lab Protocol v4', isLive: true, startTime: new Date().toISOString() },
  ]
};

export const STATS = {
  revenueData: [
    { name: 'Mon', value: 4200 },
    { name: 'Tue', value: 3800 },
    { name: 'Wed', value: 6500 },
    { name: 'Thu', value: 7800 },
    { name: 'Fri', value: 5800 },
    { name: 'Sat', value: 8400 },
    { name: 'Sun', value: 7200 },
  ]
};
