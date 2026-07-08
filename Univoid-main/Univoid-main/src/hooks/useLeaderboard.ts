import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getGlobalLeaderboard } from "@/services/leaderboardService";
import { PublicProfile } from "@/types/database";

// In-memory cache for leaderboard (10 minutes TTL)
const leaderboardCache: { data: PublicProfile[]; timestamp: number } = { data: [], timestamp: 0 };
const LEADERBOARD_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export function useLeaderboard(limit = 50) {
  const [leaderboard, setLeaderboard] = useState<PublicProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLeaderboard = useCallback(async (forceRefresh = false) => {
    // Check cache first (unless force refresh)
    if (!forceRefresh && Date.now() - leaderboardCache.timestamp < LEADERBOARD_CACHE_TTL && leaderboardCache.data.length > 0) {
      if (isMounted.current) {
        setLeaderboard(leaderboardCache.data);
        setIsLoading(false);
      }
      return;
    }

    try {
      // Add timeout for fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const data = await getGlobalLeaderboard(limit);
      clearTimeout(timeoutId);
      
      // Update cache
      leaderboardCache.data = data;
      leaderboardCache.timestamp = Date.now();

      if (isMounted.current) {
        setLeaderboard(data);
        setError(null);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err as Error);
        console.error("Error fetching leaderboard:", err);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [limit]);

  // Debounced fetch for real-time updates (with force refresh)
  const debouncedFetch = useCallback(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    fetchTimeoutRef.current = setTimeout(() => {
      fetchLeaderboard(true); // Force refresh on realtime update
    }, 300); // Reduced debounce for faster updates
  }, [fetchLeaderboard]);

  useEffect(() => {
    isMounted.current = true;

    // Safety timeout - show empty state after 10 seconds
    const safetyTimeout = setTimeout(() => {
      if (isMounted.current && isLoading) {
        setIsLoading(false);
      }
    }, 10000);

    fetchLeaderboard();

    // Cleanup existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Single channel for leaderboard updates (debounced)
    channelRef.current = supabase
      .channel("leaderboard-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, debouncedFetch)
      .subscribe();

    return () => {
      isMounted.current = false;
      clearTimeout(safetyTimeout);
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [limit, fetchLeaderboard, debouncedFetch]);

  return { leaderboard, isLoading, error, refetch: fetchLeaderboard };
}
