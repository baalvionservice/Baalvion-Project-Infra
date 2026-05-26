/**
 * @fileOverview User Identity Service Main Entry
 * Orchestrates the identity flow across the network.
 */

import * as mockService from './user.mock';
import * as firebaseService from './user.firebase';

// Toggle between Mock and Firebase implementations
const USE_MOCK = true;

/**
 * Retrieves the professional profile for a specific member.
 */
export const getUserProfile = async (userId: string) => {
  if (USE_MOCK) {
    return await mockService.mockGetUserProfile(userId);
  }
  return await firebaseService.firebaseGetUserProfile(userId);
};

/**
 * Synchronizes updates to a member's professional dossier.
 */
export const updateUserProfile = async (userId: string, data: any) => {
  if (USE_MOCK) {
    return await mockService.mockUpdateUserProfile(userId, data);
  }
  return await firebaseService.firebaseUpdateUserProfile(userId, data);
};
