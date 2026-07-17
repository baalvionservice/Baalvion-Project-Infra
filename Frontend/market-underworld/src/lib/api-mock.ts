
import { Region, Listing, PremiumPlan } from './types';

export const REGIONS: Region[] = [
  { id: 'eap', name: 'East Asia & Pacific', icon: '🌏', description: 'Digital innovation hub focusing on hardware arbitrage and manufacturing loops.' },
  { id: 'eca', name: 'Europe & Central Asia', icon: '🌍', description: 'Center for regulatory intelligence and distribution logistics discussions.' },
  { id: 'lac', name: 'Latin America & Caribbean', icon: '🌎', description: 'Emerging tech node specializing in payment rails and localized markets.' },
  { id: 'mena', name: 'Middle East & North Africa', icon: '🕌', description: 'Strategic node for global energy insights and wealth management channels.' },
  { id: 'na', name: 'North America', icon: '🗽', description: 'The core development cluster for software intelligence and venture flow.' },
  { id: 'sa', name: 'South Asia', icon: '🌿', description: 'Talent-dense region driving project collaborations and data engineering.' },
  { id: 'ssa', name: 'Sub-Saharan Africa', icon: '🌍', description: 'Frontier market intelligence specializing in mobile finance and infrastructure.' },
];

export const MARKETPLACE_LISTINGS: Listing[] = [
  {
    id: '1',
    title: 'Global Tech Arbitrage Node',
    description: 'High-speed data node for cross-region market intelligence.',
    region: 'East Asia & Pacific',
    category: 'Trade',
    userType: 'Professional',
    price: '2.4 ETH',
    timestamp: '2 hours ago'
  },
  {
    id: '2',
    title: 'Distributed Compute Pipeline',
    description: 'Secure collaboration project for large-scale data modeling.',
    region: 'North America',
    category: 'Collaboration',
    userType: 'Developer',
    timestamp: '5 hours ago'
  },
  {
    id: '3',
    title: 'Regulatory Compliance Audit',
    description: 'Consultation service for MENA region market entry.',
    region: 'Middle East & North Africa',
    category: 'Service',
    userType: 'Researcher',
    price: '500 USDT',
    timestamp: '1 day ago'
  },
  {
    id: '4',
    title: 'Advanced Cryptographic Library',
    description: 'Proprietary toolkit for secure intelligence exchange.',
    region: 'Europe & Central Asia',
    category: 'Product',
    userType: 'Developer',
    price: '1.2 ETH',
    timestamp: '2 days ago'
  }
];

export const PREMIUM_PLANS: PremiumPlan[] = [
  {
    id: 'basic',
    name: 'Associate',
    price: 'Free',
    features: ['Standard forum access', 'Public marketplace listings', 'Community support']
  },
  {
    id: 'pro',
    name: 'Professional',
    price: '$49/mo',
    features: ['Advanced market insights', 'Priority listing visibility', 'Encrypted messaging', 'Expert knowledge rooms'],
    recommended: true
  },
  {
    id: 'elite',
    name: 'Elite Node',
    price: '$199/mo',
    features: ['Real-time trade signals', 'Private consulting sessions', 'Zero-fee transactions', 'Global network voting power']
  }
];

export const EXPERIENCE_LEVELS = [
  { id: 'beg', name: 'Beginner', val: 1 },
  { id: 'int', name: 'Intermediate', val: 2 },
  { id: 'adv', name: 'Advanced', val: 3 },
  { id: 'exp', name: 'Expert', val: 4 },
];
