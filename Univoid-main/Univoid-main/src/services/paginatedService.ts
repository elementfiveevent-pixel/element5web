import { supabase } from '@/integrations/supabase/client';
import { Material, News, Book } from '@/types/database';
import type { CursorPage, CursorPageParam } from '@/hooks/useCursorPagination';

const DEFAULT_PAGE_SIZE = 20;

interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  total: number;
}

// Generic batch contributor name fetch - much faster than individual RPC calls
async function fetchContributorNames(userIds: string[]): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(userIds)];
  const nameMap = new Map<string, string>();
  
  if (uniqueIds.length === 0) return nameMap;

  // Fetch all names in parallel batches
  const batchSize = 10;
  for (let i = 0; i < uniqueIds.length; i += batchSize) {
    const batch = uniqueIds.slice(i, i + batchSize);
    const promises = batch.map(async (id) => {
      try {
        const { data } = await supabase.rpc('get_contributor_name', { user_id: id });
        return { id, name: data || 'Anonymous' };
      } catch {
        return { id, name: 'Anonymous' };
      }
    });
    
    const results = await Promise.all(promises);
    results.forEach(({ id, name }) => nameMap.set(id, name));
  }

  return nameMap;
}

// Material filters interface
export interface MaterialFilters {
  search?: string;
  course?: string;
  branch?: string;
  subject?: string;
  language?: string;
  college?: string;
}

/**
 * Cursor-based pagination for materials
 * More efficient for large datasets - no offset scanning
 */
export async function getMaterialsWithCursor(
  params: CursorPageParam,
  filters?: MaterialFilters
): Promise<CursorPage<Material>> {
  const { cursor, limit } = params;

  let query = supabase
    .from('materials')
    .select('id, title, file_type, file_url, status, course, subject, branch, language, college, thumbnail_url, created_by, created_at, views_count, downloads_count, likes_count, shares_count, description', { count: 'exact' })
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(limit + 1); // Fetch one extra to check for more

  // Apply cursor
  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  // Apply filters
  if (filters?.course) {
    query = query.eq('course', filters.course);
  }
  if (filters?.branch) {
    query = query.eq('branch', filters.branch);
  }
  if (filters?.language) {
    query = query.eq('language', filters.language);
  }
  if (filters?.subject) {
    query = query.ilike('subject', `%${filters.subject}%`);
  }
  if (filters?.college) {
    query = query.ilike('college', `%${filters.college}%`);
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  const materials = (data || []) as Material[];
  const hasMore = materials.length > limit;
  const items = hasMore ? materials.slice(0, limit) : materials;
  
  // Get next cursor from last item
  const nextCursor = hasMore && items.length > 0 
    ? items[items.length - 1].created_at 
    : null;

  // Batch fetch contributor names
  const userIds = items.map(m => m.created_by);
  const nameMap = await fetchContributorNames(userIds);
  items.forEach(m => {
    m.contributor_name = nameMap.get(m.created_by) || 'Anonymous';
  });

  return {
    data: items,
    nextCursor,
    hasMore,
    totalCount: count ?? undefined,
  };
}

// Materials with filters - optimized to fetch only needed fields for listing
export async function getMaterialsPaginated(
  page = 0,
  pageSize = DEFAULT_PAGE_SIZE,
  filters?: MaterialFilters
): Promise<PaginatedResult<Material>> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  // Only select fields needed for the card display (performance optimization)
  // Include status and file_url for preview/download functionality
  let query = supabase
    .from('materials')
    .select('id, title, file_type, file_url, status, course, subject, branch, language, college, thumbnail_url, created_by, created_at, views_count, downloads_count, likes_count, shares_count, description', { count: 'exact' })
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.course) {
    query = query.eq('course', filters.course);
  }
  if (filters?.branch) {
    query = query.eq('branch', filters.branch);
  }
  if (filters?.language) {
    query = query.eq('language', filters.language);
  }
  if (filters?.subject) {
    query = query.ilike('subject', `%${filters.subject}%`);
  }
  if (filters?.college) {
    query = query.ilike('college', `%${filters.college}%`);
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) throw error;

  const materials = data as Material[];
  
  // Batch fetch contributor names
  const userIds = materials.map(m => m.created_by);
  const nameMap = await fetchContributorNames(userIds);
  materials.forEach(m => {
    m.contributor_name = nameMap.get(m.created_by) || 'Anonymous';
  });

  return {
    data: materials,
    hasMore: (count ?? 0) > from + materials.length,
    total: count ?? 0,
  };
}

// News
export async function getNewsPaginated(
  page = 0,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<PaginatedResult<News>> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('news')
    .select('*', { count: 'exact' })
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  const news = data as News[];
  
  const userIds = news.map(n => n.created_by);
  const nameMap = await fetchContributorNames(userIds);
  news.forEach(n => {
    n.contributor_name = nameMap.get(n.created_by) || 'Anonymous';
  });

  return {
    data: news,
    hasMore: (count ?? 0) > from + news.length,
    total: count ?? 0,
  };
}

// Books
const BOOK_EXPIRY_DAYS = 15;

function isBookExpired(createdAt: string): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > BOOK_EXPIRY_DAYS;
}

export async function getBooksPaginated(
  page = 0,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<PaginatedResult<Book>> {
  const offset = page * pageSize;

  // Use the secure RPC function that bypasses RLS for public access
  const { data, error } = await supabase.rpc('get_books_safe', {
    p_status: 'approved',
    p_limit: pageSize + 10, // Fetch extra to account for filtering
    p_offset: offset
  });

  if (error) throw error;

  // Filter expired books and limit
  const books = ((data || []) as Book[])
    .filter(book => !isBookExpired(book.created_at))
    .slice(0, pageSize);
  
  // Get total count separately
  const { count } = await supabase
    .from('books')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved')
    .eq('is_sold', false);

  const userIds = books.map(b => b.created_by);
  const nameMap = await fetchContributorNames(userIds);
  books.forEach(b => {
    b.contributor_name = nameMap.get(b.created_by) || 'Anonymous';
  });

  return {
    data: books,
    hasMore: (count ?? 0) > offset + pageSize,
    total: count ?? 0,
  };
}

// Leaderboard - optimized to only fetch top users
export async function getLeaderboardPaginated(
  limit = 20
): Promise<{ data: Array<{ id: string; full_name: string; total_xp: number; profile_photo_url: string | null; rank: number; level: number; materials_count: number }>; }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, total_xp, profile_photo_url')
    .order('total_xp', { ascending: false })
    .limit(limit);

  if (error) throw error;

  // Calculate stats in parallel for each user
  const enrichedData = await Promise.all(
    (data || []).map(async (profile, index) => {
      // Fetch material counts
      const materialsRes = await supabase
        .from('materials')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', profile.id)
        .eq('status', 'approved');

      return {
        ...profile,
        rank: index + 1,
        level: Math.floor(profile.total_xp / 250) + 1,
        materials_count: materialsRes.count ?? 0,
      };
    })
  );

  return { data: enrichedData };
}
