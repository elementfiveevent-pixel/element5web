import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  materialsCount: number;
  newsCount: number;
  booksCount: number;
  globalRank: number | null;
}

const defaultStats: DashboardStats = {
  materialsCount: 0,
  newsCount: 0,
  booksCount: 0,
  globalRank: null,
};

export function useDashboardStats(userId: string | undefined) {
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchStats = useCallback(async () => {
    if (!userId) return;
    
    try {
      // Fetch all counts in parallel with timeout
      const fetchPromise = Promise.all([
        supabase
          .from('materials')
          .select('id', { count: 'exact', head: true })
          .eq('created_by', userId),
        supabase
          .from('news')
          .select('id', { count: 'exact', head: true })
          .eq('created_by', userId),
        supabase
          .from('books')
          .select('id', { count: 'exact', head: true })
          .eq('created_by', userId),
      ]);

      // 5 second timeout for stats fetch
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Stats fetch timeout')), 5000)
      );

      const [materialsRes, newsRes, booksRes] = await Promise.race([
        fetchPromise,
        timeoutPromise,
      ]) as Awaited<typeof fetchPromise>;

      if (!isMounted.current) return;

      // Fetch rank separately (non-blocking)
      let globalRank: number | null = null;
      try {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('total_xp')
          .eq('id', userId)
          .maybeSingle();
        
        if (userProfile && isMounted.current) {
          const { count } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .gt('total_xp', userProfile.total_xp);
          globalRank = (count ?? 0) + 1;
        }
      } catch {
        // Rank fetch failed silently
      }

      if (!isMounted.current) return;

      setStats({
        materialsCount: materialsRes.count ?? 0,
        newsCount: newsRes.count ?? 0,
        booksCount: booksRes.count ?? 0,
        globalRank,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Keep existing stats on error
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    isMounted.current = true;

    if (!userId) {
      setIsLoading(false);
      return;
    }

    // Initial fetch
    fetchStats();

    // Cleanup existing channel before creating new one
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Single channel for all user content updates
    channelRef.current = supabase
      .channel(`dashboard-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materials', filter: `created_by=eq.${userId}` }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news', filter: `created_by=eq.${userId}` }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'books', filter: `created_by=eq.${userId}` }, fetchStats)
      .subscribe();

    return () => {
      isMounted.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, fetchStats]);

  return { stats, isLoading };
}
