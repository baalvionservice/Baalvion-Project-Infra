/**
 * @fileOverview Admin Mock Data Aggregator.
 * Collects data from various mock storage keys for platform-wide oversight.
 */

import { mockUsers } from "./mockUsers";

export const getAllUsersMock = () => {
  if (typeof window === 'undefined') return mockUsers;
  
  // Combine static mock users with any dynamically registered ones
  const dynamicUser = localStorage.getItem("law_elite_user");
  const users = [...mockUsers];
  
  if (dynamicUser) {
    const parsed = JSON.parse(dynamicUser);
    if (!users.find(u => u.id === parsed.id)) {
      users.push(parsed);
    }
  }
  
  return users;
};

export const getAllLawyersMock = () => {
  if (typeof window === 'undefined') return [];
  
  // In a real mock registry, we'd have a list of lawyer IDs. 
  // Here we aggregate from the known mock lawyer list + any updated profiles.
  const lawyers = [
    { id: "2", name: "Harvey Specter", specialization: "Corporate Law", rating: 5.0 }
  ];
  
  return lawyers;
};

export const getAllBookingsMock = () => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem("law_elite_bookings");
  return data ? JSON.parse(data) : [];
};
