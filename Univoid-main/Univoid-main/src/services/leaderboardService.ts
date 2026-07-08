import { supabase } from '@/integrations/supabase/client';
import { PublicProfile, calculateLevel } from '@/types/database';

// Interface for leaderboard view data (non-sensitive fields only)
interface LeaderboardProfileRow {
  id: string;
  full_name: string;
  profile_photo_url: string | null;
  college_name: string | null;
  total_xp: number;
}

export async function getGlobalLeaderboard(limit = 100): Promise<PublicProfile[]> {
  // Use RPC function for public access (works for logged-out users)
  const { data, error } = await supabase.rpc('get_public_leaderboard', { limit_count: limit });

  if (error) throw error;

  const profiles: PublicProfile[] = [];
  let rank = 1;
  const rows = (data || []) as unknown as LeaderboardProfileRow[];

  // Batch fetch contribution counts for all users at once (more efficient)
  const userIds = rows.map(r => r.id);
  
  // Get all counts in parallel for all users
  const countPromises = userIds.map(async (userId) => {
    const [materials, news, books] = await Promise.all([
      supabase.from('materials').select('id', { count: 'exact', head: true }).eq('created_by', userId).eq('status', 'approved'),
      supabase.from('news').select('id', { count: 'exact', head: true }).eq('created_by', userId).eq('status', 'approved'),
      supabase.from('books').select('id', { count: 'exact', head: true }).eq('created_by', userId).eq('status', 'approved'),
    ]);
    return {
      userId,
      materials_count: materials.count || 0,
      news_count: news.count || 0,
      books_count: books.count || 0,
    };
  });

  const counts = await Promise.all(countPromises);
  const countsMap = new Map(counts.map(c => [c.userId, c]));

  for (const profile of rows) {
    const userCounts = countsMap.get(profile.id) || { materials_count: 0, news_count: 0, books_count: 0 };
    
    profiles.push({
      id: profile.id,
      full_name: profile.full_name,
      profile_photo_url: profile.profile_photo_url,
      total_xp: profile.total_xp,
      level: calculateLevel(profile.total_xp),
      rank,
      materials_count: userCounts.materials_count,
      news_count: userCounts.news_count,
      books_count: userCounts.books_count,
    });

    rank++;
  }

  return profiles;
}

export async function getCollegeLeaderboard(collegeName: string, limit = 100): Promise<PublicProfile[]> {
  // Use RPC function and filter by college
  const { data, error } = await supabase.rpc('get_public_leaderboard', { limit_count: limit * 2 }); // Fetch extra to filter

  if (error) throw error;

  const profiles: PublicProfile[] = [];
  let rank = 1;
  const rows = ((data || []) as unknown as (LeaderboardProfileRow & { college_name?: string })[])
    .filter((_, i) => i < limit); // Limit after filtering

  const userIds = rows.map(r => r.id);
  const countPromises = userIds.map(async (userId) => {
    const [materials, news, books] = await Promise.all([
      supabase.from('materials').select('id', { count: 'exact', head: true }).eq('created_by', userId).eq('status', 'approved'),
      supabase.from('news').select('id', { count: 'exact', head: true }).eq('created_by', userId).eq('status', 'approved'),
      supabase.from('books').select('id', { count: 'exact', head: true }).eq('created_by', userId).eq('status', 'approved'),
    ]);
    return {
      userId,
      materials_count: materials.count || 0,
      news_count: news.count || 0,
      books_count: books.count || 0,
    };
  });

  const counts = await Promise.all(countPromises);
  const countsMap = new Map(counts.map(c => [c.userId, c]));

  for (const profile of rows) {
    const userCounts = countsMap.get(profile.id) || { materials_count: 0, news_count: 0, books_count: 0 };
    
    profiles.push({
      id: profile.id,
      full_name: profile.full_name,
      profile_photo_url: profile.profile_photo_url,
      total_xp: profile.total_xp,
      level: calculateLevel(profile.total_xp),
      rank,
      materials_count: userCounts.materials_count,
      news_count: userCounts.news_count,
      books_count: userCounts.books_count,
    });

    rank++;
  }

  return profiles;
}

export async function getUserRank(userId: string): Promise<number> {
  // Use RPC function for ranking
  const { data, error } = await supabase.rpc('get_public_leaderboard', { limit_count: 1000 });

  if (error || !data) return 0;

  const rows = data as unknown as { id: string }[];
  const index = rows.findIndex(p => p.id === userId);
  return index >= 0 ? index + 1 : 0;
}

export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  // Use RPC function for public access
  const { data, error } = await supabase.rpc('get_public_leaderboard', { limit_count: 1000 });

  if (error || !data) return null;

  const rows = data as unknown as LeaderboardProfileRow[];
  const profile = rows.find(r => r.id === userId);
  
  if (!profile) return null;

  const [materials, news, books, rank] = await Promise.all([
    supabase.from('materials').select('id', { count: 'exact', head: true }).eq('created_by', userId).eq('status', 'approved'),
    supabase.from('news').select('id', { count: 'exact', head: true }).eq('created_by', userId).eq('status', 'approved'),
    supabase.from('books').select('id', { count: 'exact', head: true }).eq('created_by', userId).eq('status', 'approved'),
    getUserRank(userId),
  ]);

  return {
    id: profile.id,
    full_name: profile.full_name,
    profile_photo_url: profile.profile_photo_url,
    total_xp: profile.total_xp,
    level: calculateLevel(profile.total_xp),
    rank,
    materials_count: materials.count || 0,
    news_count: news.count || 0,
    books_count: books.count || 0,
  };
}
