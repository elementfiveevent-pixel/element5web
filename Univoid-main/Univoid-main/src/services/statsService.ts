import { supabase } from '@/integrations/supabase/client';

export interface PlatformStats {
  totalUsers: number;
  totalMaterials: number;
}

// Module-level cache to avoid duplicate Supabase calls
// (HeroBrutalist and AnimatedStats both call this)
let _cachedPromise: Promise<PlatformStats> | null = null;
let _cachedResult: PlatformStats | null = null;

// Lightweight count queries for home page (using RPC for accurate user count)
export async function getPlatformStats(): Promise<PlatformStats> {
  // Return cached result instantly if we already have it
  if (_cachedResult) return _cachedResult;

  // Deduplicate in-flight requests
  if (!_cachedPromise) {
    _cachedPromise = (async () => {
      const [usersResult, materialsResult] = await Promise.all([
        supabase.rpc('get_registered_users_count'),
        supabase.from('materials').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      ]);

      const result: PlatformStats = {
        totalUsers: usersResult.data ?? 0,
        totalMaterials: materialsResult.count ?? 0,
      };

      _cachedResult = result;
      return result;
    })();
  }

  return _cachedPromise;
}
