import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LiveStats {
  totalUsers: number;
  totalMaterials: number;
  isLoading: boolean;
}

// In-memory cache for stats (15 minutes TTL)
const statsCache = { data: { users: 0, materials: 0 }, timestamp: 0 };
const STATS_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export function useLiveStats(): LiveStats {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalMaterials, setTotalMaterials] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    isMounted.current = true;

    const fetchStats = async () => {
      // Check cache first
      if (Date.now() - statsCache.timestamp < STATS_CACHE_TTL && statsCache.data.users > 0) {
        if (isMounted.current) {
          setTotalUsers(statsCache.data.users);
          setTotalMaterials(statsCache.data.materials);
          setIsLoading(false);
        }
        return;
      }

      try {
        // Use RPC function to count users (bypasses RLS for accurate count)
        const [usersResult, materialsResult] = await Promise.all([
          supabase.rpc('get_registered_users_count'),
          supabase.from('materials').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        ]);

        const users = usersResult.data || 0;
        const materials = materialsResult.count || 0;

        // Update cache
        statsCache.data = { users, materials };
        statsCache.timestamp = Date.now();

        if (isMounted.current) {
          setTotalUsers(users);
          setTotalMaterials(materials);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    // Initial fetch
    fetchStats();

    // Real-time updates (debounced)
    let debounceTimer: NodeJS.Timeout;
    const debouncedFetch = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(fetchStats, 300);
    };

    channelRef.current = supabase
      .channel('live-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, debouncedFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, debouncedFetch)
      .subscribe();

    // Safety timeout - never block
    const safetyTimeout = setTimeout(() => {
      if (isMounted.current && isLoading) {
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      isMounted.current = false;
      clearTimeout(safetyTimeout);
      clearTimeout(debounceTimer);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return { totalUsers, totalMaterials, isLoading };
}
