import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, any>;
  old: Record<string, any>;
}

/**
 * Global real-time notifications hook
 * Listens to all relevant table changes and shows toast notifications
 */
export function useGlobalRealtimeNotifications() {
  const { user, profile } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const isRelevantToUser = useCallback((
    tableName: string,
    payload: RealtimePayload
  ): boolean => {
    if (!profile) return true; // Show all if no profile

    const record = payload.new || payload.old;

    // For scholarships, check state match
    if (tableName === 'scholarships') {
      const states = record.eligible_states as string[] | null;
      const isAllIndia = record.is_all_india as boolean | null;
      
      if (isAllIndia) return true;
      if (states && profile.state && states.includes(profile.state)) return true;
      if (!states || states.length === 0) return true;
      return false;
    }

    // For events - show all published events
    if (tableName === 'events') {
      return record.status === 'published';
    }

    // For materials - show all approved
    if (tableName === 'materials') {
      return record.status === 'approved';
    }

    return true;
  }, [profile]);

  const showNotificationToast = useCallback((
    tableName: string,
    eventType: string,
    record: Record<string, any>
  ) => {
    const title = record.title || 'Update';
    
    let icon = '📢';
    let message = '';
    
    switch (tableName) {
      case 'scholarships':
        icon = '🎓';
        if (eventType === 'INSERT') {
          message = `New scholarship: ${title}`;
        } else if (eventType === 'UPDATE') {
          if (record.status === 'approved') {
            message = `Scholarship available: ${title}`;
          }
        }
        break;
      case 'materials':
        icon = '📄';
        if (eventType === 'INSERT' && record.status === 'approved') {
          message = `New material: ${title}`;
        } else if (eventType === 'UPDATE' && record.status === 'approved') {
          message = `Material approved: ${title}`;
        }
        break;
      case 'events':
        icon = '🎉';
        if (record.status === 'published') {
          message = `New event: ${title}`;
        }
        break;
      case 'news':
        icon = '📰';
        if (record.status === 'approved') {
          message = `News: ${title}`;
        }
        break;
    }

    if (message) {
      toast.success(`${icon} ${message}`, {
        duration: 5000,
        action: {
          label: 'View',
          onClick: () => {
            const routes: Record<string, string> = {
              materials: '/materials',
              events: `/events/${record.id}`,
            };
            window.location.href = routes[tableName] || '/';
          },
        },
      });
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    // Create a single channel for multiple table subscriptions
    const channel = supabase
      .channel('global-realtime-notifications')
      // Scholarships
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scholarships',
          filter: 'status=eq.approved',
        },
        (payload) => {
          const p = payload as unknown as RealtimePayload;
          if (isRelevantToUser('scholarships', p)) {
            showNotificationToast('scholarships', p.eventType, p.new);
          }
        }
      )
      // Materials
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'materials',
          filter: 'status=eq.approved',
        },
        (payload) => {
          const p = payload as unknown as RealtimePayload;
          if (isRelevantToUser('materials', p)) {
            showNotificationToast('materials', p.eventType, p.new);
          }
        }
      )
      // Events
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: 'status=eq.published',
        },
        (payload) => {
          const p = payload as unknown as RealtimePayload;
          if (isRelevantToUser('events', p)) {
            showNotificationToast('events', p.eventType, p.new);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, isRelevantToUser, showNotificationToast]);
}
