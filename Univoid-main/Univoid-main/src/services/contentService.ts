import { supabase } from '@/integrations/supabase/client';
import { Material, News, Book } from '@/types/database';
import { toast } from 'sonner';

// Delete material (with file cleanup)
export async function deleteMaterial(materialId: string, userId: string): Promise<boolean> {
  // First verify ownership
  const { data: material, error: fetchError } = await supabase
    .from('materials')
    .select('created_by, file_url')
    .eq('id', materialId)
    .single();

  if (fetchError || !material) {
    toast.error('Material not found');
    return false;
  }

  if (material.created_by !== userId) {
    toast.error('You can only delete your own content');
    return false;
  }

  // Extract file path from URL and delete from storage
  try {
    const url = new URL(material.file_url);
    const pathMatch = url.pathname.match(/\/materials\/(.+)/);
    if (pathMatch) {
      await supabase.storage.from('materials').remove([pathMatch[1]]);
    }
  } catch {
    // Continue even if storage deletion fails
  }

  // Delete the record
  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('id', materialId)
    .eq('created_by', userId);

  if (error) {
    toast.error('Failed to delete material');
    return false;
  }

  toast.success('Material deleted');
  return true;
}

// Delete news (with images cleanup)
export async function deleteNews(newsId: string, userId: string): Promise<boolean> {
  const { data: news, error: fetchError } = await supabase
    .from('news')
    .select('created_by, image_urls')
    .eq('id', newsId)
    .single();

  if (fetchError || !news) {
    toast.error('News not found');
    return false;
  }

  if (news.created_by !== userId) {
    toast.error('You can only delete your own content');
    return false;
  }

  // Delete images
  if (news.image_urls && news.image_urls.length > 0) {
    for (const imageUrl of news.image_urls) {
      try {
        const url = new URL(imageUrl);
        const pathMatch = url.pathname.match(/\/news-images\/(.+)/);
        if (pathMatch) {
          await supabase.storage.from('news-images').remove([pathMatch[1]]);
        }
      } catch {
        // Continue
      }
    }
  }

  const { error } = await supabase
    .from('news')
    .delete()
    .eq('id', newsId)
    .eq('created_by', userId);

  if (error) {
    toast.error('Failed to delete news');
    return false;
  }

  toast.success('News deleted');
  return true;
}

// Delete book (with images cleanup)
export async function deleteBook(bookId: string, userId: string): Promise<boolean> {
  const { data: book, error: fetchError } = await supabase
    .from('books')
    .select('created_by, image_urls')
    .eq('id', bookId)
    .single();

  if (fetchError || !book) {
    toast.error('Book not found');
    return false;
  }

  if (book.created_by !== userId) {
    toast.error('You can only delete your own content');
    return false;
  }

  // Delete images
  if (book.image_urls && book.image_urls.length > 0) {
    for (const imageUrl of book.image_urls) {
      try {
        const url = new URL(imageUrl);
        const pathMatch = url.pathname.match(/\/book-images\/(.+)/);
        if (pathMatch) {
          await supabase.storage.from('book-images').remove([pathMatch[1]]);
        }
      } catch {
        // Continue
      }
    }
  }

  const { error } = await supabase
    .from('books')
    .delete()
    .eq('id', bookId)
    .eq('created_by', userId);

  if (error) {
    toast.error('Failed to delete book');
    return false;
  }

  toast.success('Book deleted');
  return true;
}

// Get user's content for management
export async function getUserMaterials(userId: string): Promise<Material[]> {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Material[];
}

export async function getUserNews(userId: string): Promise<News[]> {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as News[];
}

export async function getUserBooks(userId: string): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Book[];
}
