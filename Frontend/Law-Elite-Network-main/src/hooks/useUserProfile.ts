'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUserProfile } from '@/services/user/userService';

/**
 * @fileOverview useUserProfile Hook
 * Synchronizes the UI with the member's professional identity ledger.
 */
export function useUserProfile(userId: string | undefined) {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getUserProfile(userId);
      setUserProfile(data);
    } catch (err: any) {
      console.error('Identity sync error:', err);
      setError(err.message || 'Failed to sync professional identity.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { 
    userProfile, 
    loading, 
    error, 
    refreshProfile: fetchProfile 
  };
}
