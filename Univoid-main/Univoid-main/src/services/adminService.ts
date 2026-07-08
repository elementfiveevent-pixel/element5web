import { supabase } from '@/integrations/supabase/client';
import { ContentStatus, XP_VALUES } from '@/types/database';

type ContentType = 'materials' | 'news' | 'books';

// ============ PENDING CONTENT (for approval workflow) ============

// Explicit column definitions for each content type - includes all required fields
const CONTENT_COLUMNS: Record<ContentType, string> = {
  materials: 'id, title, description, file_type, file_size, subject, branch, course, college, language, downloads_count, views_count, likes_count, shares_count, status, created_at, created_by, thumbnail_url, file_url, updated_at, file_hash, preview_file_url, preview_page_limit, preview_ready, admin_previewed',
  news: 'id, title, content, image_urls, external_link, category, status, created_at, created_by, updated_at',
  books: 'id, title, description, author, price, condition, category, listing_type, image_urls, seller_mobile, seller_email, seller_address, book_status, status, is_sold, views_count, slug, created_at, created_by, updated_at',
};

// Generic content item type for admin operations - matches ContentItem in Admin.tsx
export interface ContentItemBase {
  id: string;
  title: string;
  created_by: string;
  created_at: string;
  status: string;
  contributor_name?: string;
  [key: string]: unknown;
}

export async function getPendingContent(type: ContentType): Promise<ContentItemBase[]> {
  const { data, error } = await supabase
    .from(type)
    .select(CONTENT_COLUMNS[type])
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`Error fetching pending ${type}:`, error);
    return [];
  }

  const items = (data as unknown as ContentItemBase[]) || [];
  for (const item of items) {
    try {
      const { data: nameData } = await supabase.rpc('get_contributor_name', {
        user_id: item.created_by,
      });
      item.contributor_name = (nameData as string) || 'Anonymous';
    } catch {
      item.contributor_name = 'Anonymous';
    }
  }

  return items;
}

export async function updateContentStatus(
  type: ContentType,
  contentId: string,
  status: ContentStatus,
  createdBy: string,
  contentTitle?: string
): Promise<{ error: Error | null }> {
  // First check current status to prevent duplicate operations
  const { data: currentItem, error: fetchError } = await supabase
    .from(type)
    .select('status')
    .eq('id', contentId)
    .single();

  if (fetchError) {
    return { error: fetchError as Error };
  }

  // If already in the target status, skip the update
  if (currentItem?.status === status) {
    console.log(`Content ${contentId} is already ${status}, skipping update`);
    return { error: null };
  }

  // Perform the status update
  const { error, data } = await supabase
    .from(type)
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', contentId)
    .select()
    .single();

  if (error) {
    console.error('Update error:', error);
    return { error: error as Error };
  }

  if (!data) {
    return { error: new Error('Update failed - no data returned') };
  }

  // Award XP only on first approval (award_xp function now handles duplicate prevention)
  if (status === 'approved') {
    const xpAmount = getXPAmount(type);
    if (xpAmount > 0) {
      await supabase.rpc('award_xp', {
        _user_id: createdBy,
        _amount: xpAmount,
        _reason: `${type.slice(0, -1)} approved`,
        _content_type: type,
        _content_id: contentId,
      });
    }
  }

  // Send status email notification to user
  if (contentTitle && (status === 'approved' || status === 'rejected')) {
    try {
      await supabase.functions.invoke('send-material-status-email', {
        body: {
          userId: createdBy,
          materialTitle: contentTitle,
          status,
          contentType: type,
        },
      });
    } catch (emailError) {
      console.error('Failed to send status email:', emailError);
      // Don't fail the whole operation if email fails
    }
  }

  return { error: null };
}

export async function awardBookSoldXP(userId: string, bookId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.rpc('award_xp', {
    _user_id: userId,
    _amount: XP_VALUES.book_listed,
    _reason: 'Book sold',
    _content_type: 'books',
    _content_id: bookId,
  });

  return { error: error as Error | null };
}

function getXPAmount(type: ContentType): number {
  switch (type) {
    case 'materials':
      return XP_VALUES.material_approved;
    case 'news':
      return XP_VALUES.news_approved;
    case 'books':
      return XP_VALUES.book_listed;
    default:
      return 0;
  }
}

export async function getAllPendingCounts(): Promise<{
  materials: number;
  news: number;
  books: number;
}> {
  const [materials, news, books] = await Promise.all([
    supabase.from('materials').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('news').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('books').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  return {
    materials: materials.count || 0,
    news: news.count || 0,
    books: books.count || 0,
  };
}

// ============ ADMIN GOD MODE - ALL CONTENT ACCESS ============

export async function getAllContent(type: ContentType): Promise<ContentItemBase[]> {
  const { data, error } = await supabase
    .from(type)
    .select(CONTENT_COLUMNS[type])
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`Error fetching ${type}:`, error);
    return [];
  }

  const items = (data as unknown as ContentItemBase[]) || [];
  
  // Batch fetch contributor names for efficiency
  const userIds = [...new Set(items.map(item => item.created_by))];
  if (userIds.length > 0) {
    try {
      const { data: namesData } = await supabase.rpc('get_contributor_names', {
        user_ids: userIds,
      });
      
      const nameMap = new Map((namesData || []).map((n: { user_id: string; full_name: string }) => [n.user_id, n.full_name]));
      for (const item of items) {
        item.contributor_name = nameMap.get(item.created_by) || 'Anonymous';
      }
    } catch {
      // Fallback: fetch individually if batch fails
      for (const item of items) {
        try {
          const { data: nameData } = await supabase.rpc('get_contributor_name', {
            user_id: item.created_by,
          });
          item.contributor_name = (nameData as string) || 'Anonymous';
        } catch {
          item.contributor_name = 'Anonymous';
        }
      }
    }
  }

  return items;
}

// Admin-only: explicit column list for user management - includes year_semester
const ADMIN_USER_COLUMNS = 'id, email, full_name, college_name, course_stream, year_semester, mobile_number, profile_photo_url, total_xp, is_disabled, email_verified, phone_verified, created_at, updated_at';

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select(ADMIN_USER_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    return []; // Return empty array instead of throwing
  }
  return data || [];
}

export async function getContentCounts(): Promise<{
  materials: number;
  news: number;
  books: number;
  users: number;
}> {
  const [materials, news, books, users] = await Promise.all([
    supabase.from('materials').select('id', { count: 'exact', head: true }),
    supabase.from('news').select('id', { count: 'exact', head: true }),
    supabase.from('books').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
  ]);

  return {
    materials: materials.count || 0,
    news: news.count || 0,
    books: books.count || 0,
    users: users.count || 0,
  };
}

// ============ ADMIN DELETE FUNCTIONS ============

export async function adminDeleteMaterial(materialId: string): Promise<{ error: Error | null }> {
  const { data: material } = await supabase
    .from('materials')
    .select('file_url')
    .eq('id', materialId)
    .single();

  if (material?.file_url) {
    const urlParts = material.file_url.split('/');
    const filePath = urlParts.slice(-2).join('/');
    await supabase.storage.from('materials').remove([filePath]);
  }

  const { error } = await supabase.from('materials').delete().eq('id', materialId);
  return { error: error as Error | null };
}

export async function adminDeleteNews(newsId: string): Promise<{ error: Error | null }> {
  const { data: news } = await supabase
    .from('news')
    .select('image_urls')
    .eq('id', newsId)
    .single();

  if (news?.image_urls && news.image_urls.length > 0) {
    const filePaths = news.image_urls.map((url: string) => {
      const urlParts = url.split('/');
      return urlParts.slice(-2).join('/');
    });
    await supabase.storage.from('news-images').remove(filePaths);
  }

  const { error } = await supabase.from('news').delete().eq('id', newsId);
  return { error: error as Error | null };
}

export async function adminDeleteBook(bookId: string): Promise<{ error: Error | null }> {
  const { data: book } = await supabase
    .from('books')
    .select('image_urls')
    .eq('id', bookId)
    .single();

  if (book?.image_urls && book.image_urls.length > 0) {
    const filePaths = book.image_urls.map((url: string) => {
      const urlParts = url.split('/');
      return urlParts.slice(-2).join('/');
    });
    await supabase.storage.from('book-images').remove(filePaths);
  }

  const { error } = await supabase.from('books').delete().eq('id', bookId);
  return { error: error as Error | null };
}

export async function adminDeleteUser(userId: string): Promise<{ error: Error | null }> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('profile_photo_url')
    .eq('id', userId)
    .single();

  if (profile?.profile_photo_url) {
    const urlParts = profile.profile_photo_url.split('/');
    const filePath = urlParts.slice(-2).join('/');
    await supabase.storage.from('profile-photos').remove([filePath]);
  }

  await Promise.all([
    supabase.from('materials').delete().eq('created_by', userId),
    supabase.from('news').delete().eq('created_by', userId),
    supabase.from('books').delete().eq('created_by', userId),
    supabase.from('reports').delete().eq('reporter_id', userId),
    supabase.from('xp_transactions').delete().eq('user_id', userId),
    supabase.from('user_roles').delete().eq('user_id', userId),
  ]);

  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  return { error: error as Error | null };
}

// ============ USER ACCOUNT MANAGEMENT ============

export async function toggleUserDisabled(userId: string, disabled: boolean): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_disabled: disabled })
    .eq('id', userId);

  return { error: error as Error | null };
}

export async function sendPasswordResetEmail(email: string): Promise<{ error: Error | null }> {
  const redirectUrl = `${window.location.origin}/`;
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });

  return { error: error as Error | null };
}

// ============ CONTENT CONTRIBUTION COUNTS ============

export async function getUserContributions(userId: string): Promise<number> {
  const [materials, news, books] = await Promise.all([
    supabase.from('materials').select('id', { count: 'exact', head: true }).eq('created_by', userId).eq('status', 'approved'),
    supabase.from('news').select('id', { count: 'exact', head: true }).eq('created_by', userId).eq('status', 'approved'),
    supabase.from('books').select('id', { count: 'exact', head: true }).eq('created_by', userId).eq('status', 'approved'),
  ]);

  return (materials.count || 0) + (news.count || 0) + (books.count || 0);
}
