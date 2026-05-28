import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useActivityTracking = () => {
  const { user } = useAuth();

  const trackActivity = useCallback(async (
    activityType: string,
    metadata?: Record<string, any>
  ) => {
    if (!user) return;

    try {
      await supabase
        .from("user_activities" as any)
        .insert({
          user_id: user.id,
          activity_type: activityType,
          metadata: metadata || {},
        });
    } catch (error) {
      console.error("Failed to track activity:", error);
    }
  }, [user]);

  // Track page views
  const trackPageView = useCallback((pageName: string) => {
    trackActivity("page_view", { page: pageName });
  }, [trackActivity]);

  // Track thread view
  const trackThreadView = useCallback((threadId: string, threadTitle: string) => {
    trackActivity("thread_view", { thread_id: threadId, title: threadTitle });
  }, [trackActivity]);

  // Track post creation
  const trackPostCreation = useCallback((threadId: string, postId: string) => {
    trackActivity("post_created", { thread_id: threadId, post_id: postId });
  }, [trackActivity]);

  // Track thread creation
  const trackThreadCreation = useCallback((threadId: string, threadTitle: string) => {
    trackActivity("thread_created", { thread_id: threadId, title: threadTitle });
  }, [trackActivity]);

  return {
    trackActivity,
    trackPageView,
    trackThreadView,
    trackPostCreation,
    trackThreadCreation,
  };
};
