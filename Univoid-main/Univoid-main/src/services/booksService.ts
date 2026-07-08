import { supabase } from '@/integrations/supabase/client';
import { Book } from '@/types/database';
import { categorizeBook } from '@/lib/bookCategorizer';

// Helper to generate URL-safe slugs
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Books expire after 15 days
const BOOK_EXPIRY_DAYS = 15;

function isBookExpired(createdAt: string): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > BOOK_EXPIRY_DAYS;
}

export async function getBooks(status: 'approved' | 'all' = 'approved'): Promise<Book[]> {
  // Use secure RPC function that masks contact info for non-owners
  const { data, error } = await supabase.rpc('get_books_safe', {
    p_status: status === 'approved' ? 'approved' : null,
    p_limit: 100,
    p_offset: 0
  });

  if (error) throw error;

  // Filter out expired books and fetch contributor names
  const books = (data as Book[]).filter(book => !isBookExpired(book.created_at));
  
  for (const book of books) {
    const { data: nameData } = await supabase.rpc('get_contributor_name', {
      user_id: book.created_by,
    });
    book.contributor_name = nameData || 'Anonymous';
  }

  return books;
}

export async function getBookById(id: string): Promise<Book | null> {
  // Use secure RPC function that masks contact info for non-owners
  const { data, error } = await supabase.rpc('get_book_by_id_safe', {
    p_book_id: id
  });

  if (error || !data || data.length === 0) return null;

  const book = data[0] as Book;
  const { data: nameData } = await supabase.rpc('get_contributor_name', {
    user_id: book.created_by,
  });
  book.contributor_name = nameData || 'Anonymous';

  return book;
}

// Explicit column selection for books - includes seller info (RLS controls visibility)
const BOOK_COLUMNS = 'id, title, description, author, price, condition, category, listing_type, image_urls, seller_mobile, seller_email, seller_address, book_status, status, is_sold, views_count, slug, created_at, created_by, updated_at';

// Fetch book by slug for SEO-friendly URLs
export async function getBookBySlug(slug: string): Promise<Book | null> {
  const { data, error } = await supabase
    .from('books')
    .select(BOOK_COLUMNS)
    .eq('slug', slug)
    .eq('status', 'approved')
    .single();

  if (error || !data) return null;

  const book = data as Book;
  const { data: nameData } = await supabase.rpc('get_contributor_name', {
    user_id: book.created_by,
  });
  book.contributor_name = nameData || 'Anonymous';

  return book;
}

// Fetch book by ID or slug (tries slug first, then ID)
export async function getBookByIdOrSlug(identifier: string): Promise<Book | null> {
  // If it looks like a UUID, try ID first
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
  
  if (isUUID) {
    return getBookById(identifier);
  }
  
  // Otherwise try slug first, then fall back to ID
  const bookBySlug = await getBookBySlug(identifier);
  if (bookBySlug) return bookBySlug;
  
  return getBookById(identifier);
}

// Get seller contact info (only for authenticated users)
export async function getSellerContact(bookId: string): Promise<{
  mobile: string;
  email: string;
  address: string;
} | null> {
  const { data, error } = await supabase.rpc('get_seller_contact', {
    p_book_id: bookId
  });

  if (error || !data || data.length === 0) return null;

  return {
    mobile: data[0].mobile,
    email: data[0].email,
    address: data[0].address,
  };
}

type BookListingType = 'sell' | 'rent' | 'donate' | 'exchange';

interface CreateBookData {
  title: string;
  description?: string;
  author?: string;
  price?: number;
  condition?: string;
  category?: string;
  listing_type: BookListingType;
  seller_email: string;
  seller_mobile: string;
  seller_address: string;
  created_by: string;
  images?: File[];
}

export async function createBook(
  data: CreateBookData
): Promise<{ id: string | null; error: Error | null }> {
  const imageUrls: string[] = [];

  // Upload up to 3 images
  if (data.images && data.images.length > 0) {
    const imagesToUpload = data.images.slice(0, 3);
    for (const image of imagesToUpload) {
      const fileExt = image.name.split('.').pop();
      const filePath = `${data.created_by}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('book-images')
        .upload(filePath, image);

      if (!uploadError) {
        // Store path only - proxy will generate URLs on-demand (hides Supabase infrastructure)
        const storedPath = `book-images:${filePath}`;
        imageUrls.push(storedPath);
      }
    }
  }

  // Use AI-provided category if available, otherwise fall back to rule-based
  const finalCategory = data.category || categorizeBook(data.title, data.description);

  // Price logic: Donate = no price, Exchange = no price
  const finalPrice = (data.listing_type === 'donate' || data.listing_type === 'exchange') 
    ? null 
    : data.price || null;

  // Instant publish
  const { data: insertData, error } = await supabase
    .from('books')
    .insert({
      title: data.title,
      description: data.description || null,
      author: data.author || null,
      price: finalPrice,
      condition: data.condition || null,
      category: finalCategory,
      listing_type: data.listing_type,
      image_urls: imageUrls,
      seller_mobile: data.seller_mobile,
      seller_address: data.seller_address,
      seller_email: data.seller_email,
      created_by: data.created_by,
      status: 'approved',
    })
    .select('id')
    .single();

  if (error) {
    return { id: null, error: error as Error };
  }

  // Award XP for book listing (+25 XP)
  try {
    await supabase.rpc('award_xp', {
      _user_id: data.created_by,
      _amount: 25,
      _reason: 'book_listing',
      _content_type: 'book',
      _content_id: insertData.id,
    });
  } catch (xpError) {
    console.error('Failed to award XP:', xpError);
  }

  return { id: insertData.id, error: null };
}

export type BookStatus = 'available' | 'sold' | 'rented';

export async function updateBookStatus(bookId: string, status: BookStatus): Promise<{ error: Error | null }> {
  const isSold = status === 'sold';
  
  const { error } = await supabase
    .from('books')
    .update({ 
      book_status: status,
      is_sold: isSold 
    } as any)
    .eq('id', bookId);

  return { error: error as Error | null };
}

// Keep for backwards compatibility
export async function markBookAsSold(bookId: string): Promise<{ error: Error | null }> {
  return updateBookStatus(bookId, 'sold');
}

export async function getMyBooks(userId: string): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select(BOOK_COLUMNS)
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Book[];
}

// Validate if user can list a book (requires WhatsApp number)
export function canListBook(mobileNumber: string | null | undefined): { canList: boolean; message?: string } {
  if (!mobileNumber || mobileNumber.trim().length < 10) {
    return {
      canList: false,
      message: "Please add your WhatsApp number in your profile to list books."
    };
  }
  return { canList: true };
}
