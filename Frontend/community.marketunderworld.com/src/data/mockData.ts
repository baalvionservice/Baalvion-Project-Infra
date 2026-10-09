
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

export const COUNTRY_MARKETPLACE_CONFIGS: Record<string, CountryMarketplace> = {
  'india': {
    country: 'India',
    countryCode: 'IN',
    status: 'OPERATIONAL',
    payoutKey: 'NODE-IN-ACTIVE',
    modules: ['mod_creator', 'mod_electronics', 'mod_commodities', 'mod_travel', 'mod_realestate']
  },
  'usa': {
    country: 'United States',
    countryCode: 'US',
    status: 'OPERATIONAL',
    payoutKey: 'NODE-US-ACTIVE',
    modules: ['mod_creator', 'mod_electronics', 'mod_realestate']
  },
  'uae': {
    country: 'UAE',
    countryCode: 'AE',
    status: 'OPERATIONAL',
    payoutKey: 'NODE-AE-ACTIVE',
    modules: ['mod_travel', 'mod_realestate']
  }
};

export interface LiveSession {
  id: string;
  teacherName: string;
  region: string;
  regionId: string;
  country: string;
  title: string;
  viewers: number;
  duration: string;
  product: string;
  isLive: boolean;
  startTime: string;
}

export interface LiveEvent {
  id: string;
  type: string;
  text: string;
  time: string;
}

// No live-session or activity backend exists yet, so these are intentionally empty rather
// than carrying invented teachers and viewer counts.
export const LIVE_ACTIVITY_MOCK: { events: LiveEvent[]; activeSessions: LiveSession[] } = {
  events: [],
  activeSessions: [],
};

