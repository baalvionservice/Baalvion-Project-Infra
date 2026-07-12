/**
 * @fileOverview Deterministic Activity Simulation Engine.
 * Calculates massive platform metrics based on real-time clock cycles.
 */

import { SimulationStats } from './types';
import { REGIONS } from '@/data/mockData';

export function getSimulatedStats(): SimulationStats {
  const now = new Date();
  const timestamp = now.getTime();
  
  // Base constants
  const BASE_USERS = 50000;
  const BASE_LISTINGS = 10000;
  const BASE_TEACHERS = 500;
  const BASE_SELLERS = 5000;
  const BASE_SESSIONS = 100;
  
  // Time-based fluctuations (ticking every 5 seconds)
  const secondsSinceEpoch = Math.floor(timestamp / 5000);
  const drift = (secondsSinceEpoch % 100);
  
  const onlineUsers = 2000 + (drift * 15) + (now.getHours() * 50);
  const totalVolume = 847.32 + (secondsSinceEpoch * 0.005);
  const totalRevenue = 284720 + (secondsSinceEpoch * 12);
  
  return {
    totalUsers: BASE_USERS + Math.floor(secondsSinceEpoch / 10),
    onlineUsers: onlineUsers,
    activeTeachers: BASE_TEACHERS,
    activeSellers: BASE_SELLERS,
    totalListings: BASE_LISTINGS,
    activeSessions: BASE_SESSIONS + (drift % 10),
    dailyOrders: 1200 + (drift * 8),
    totalVolumeEth: totalVolume.toFixed(2),
    totalRevenueUsdt: totalRevenue.toLocaleString(),
    avgOrderValue: "142.50"
  };
}

export function generateLiveEvent() {
  const regions = ['India', 'Brazil', 'Germany', 'Japan', 'USA', 'Nigeria', 'UAE', 'Vietnam'];
  const actions = [
    'purchased Sourcing Guide',
    'joined Masterclass',
    'listed 500 units of Raw Material',
    'started a live workshop',
    'verified a new payout node',
    'authorized a trade escrow'
  ];
  
  const randomRegion = regions[Math.floor(Math.random() * regions.length)];
  const randomAction = actions[Math.floor(Math.random() * actions.length)];
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    type: 'live',
    text: `User from ${randomRegion} ${randomAction}`,
    time: 'just now'
  };
}

export function getRegionalLoad() {
  // Returns a percentage load for each region based on time
  const now = new Date().getHours();
  return {
    sas: 40 + (now === 10 ? 40 : 10), // Peaks at 10 AM
    eca: 30 + (now === 14 ? 50 : 5),
    nam: 20 + (now === 20 ? 60 : 0),
    eap: 50 + (now === 4 ? 40 : 10),
    mena: 25,
    lac: 15,
    ssa: 10
  };
}
