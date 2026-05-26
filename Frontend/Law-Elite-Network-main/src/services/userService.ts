/**
 * @fileOverview Legacy UserService Bridge
 * Proxies calls to the new modular identity system.
 */

import { getUserProfile as getProfile, updateUserProfile as updateProfile } from './user/userService';

export const getUserProfile = getProfile;
export const updateUserProfile = updateProfile;

/**
 * Simulates avatar upload by converting files to Base64 strings.
 */
export const uploadAvatar = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
