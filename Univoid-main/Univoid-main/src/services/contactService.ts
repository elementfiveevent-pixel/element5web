import { supabase } from '@/integrations/supabase/client';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching contact messages:', error);
    return []; // Return empty array instead of throwing
  }
  return data || [];
}

export async function markMessageAsRead(messageId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('contact_messages')
    .update({ is_read: true })
    .eq('id', messageId);

  return { error: error as Error | null };
}

export async function deleteContactMessage(messageId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('contact_messages')
    .delete()
    .eq('id', messageId);

  return { error: error as Error | null };
}

export async function getUnreadCount(): Promise<number> {
  const { count, error } = await supabase
    .from('contact_messages')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false);

  if (error) return 0;
  return count || 0;
}
