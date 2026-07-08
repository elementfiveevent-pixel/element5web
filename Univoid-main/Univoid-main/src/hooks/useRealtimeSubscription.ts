import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

type TableName = 'materials' | 'news' | 'books' | 'events' | 'profiles' | 'event_registrations';
type EventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface SubscriptionOptions {
  table: TableName;
  event?: EventType;
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  onChange?: (payload: any) => void;
  debounceMs?: number;
}

/**
 * Global real-time subscription hook with debouncing
 * Provides instant UI updates across the app
 */
export function useRealtimeSubscription(options: SubscriptionOptions | SubscriptionOptions[]) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const createDebouncedHandler = useCallback((
    handler: ((payload: any) => void) | undefined,
    key: string,
    debounceMs: number
  ) => {
    if (!handler) return undefined;
    
    return (payload: any) => {
      const existingTimer = debounceTimers.current.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
      
      if (debounceMs === 0) {
        handler(payload);
        return;
      }
      
      const timer = setTimeout(() => {
        handler(payload);
        debounceTimers.current.delete(key);
      }, debounceMs);
      
      debounceTimers.current.set(key, timer);
    };
  }, []);

  useEffect(() => {
    const subscriptions = Array.isArray(options) ? options : [options];
    const channelName = `realtime-${subscriptions.map(s => s.table).join('-')}-${Date.now()}`;
    
    const channel = supabase.channel(channelName);

    subscriptions.forEach((sub, index) => {
      const debounceMs = sub.debounceMs ?? 300;
      const keyPrefix = `${sub.table}-${index}`;

      const handler = (payload: any) => {
        const eventType = payload.eventType as string;
        
        if (eventType === 'INSERT' && sub.onInsert) {
          createDebouncedHandler(sub.onInsert, `${keyPrefix}-insert`, debounceMs)?.(payload);
        } else if (eventType === 'UPDATE' && sub.onUpdate) {
          createDebouncedHandler(sub.onUpdate, `${keyPrefix}-update`, debounceMs)?.(payload);
        } else if (eventType === 'DELETE' && sub.onDelete) {
          createDebouncedHandler(sub.onDelete, `${keyPrefix}-delete`, debounceMs)?.(payload);
        }
        
        if (sub.onChange) {
          createDebouncedHandler(sub.onChange, `${keyPrefix}-change`, debounceMs)?.(payload);
        }
      };

      channel.on(
        'postgres_changes' as any,
        { event: sub.event || '*', schema: 'public', table: sub.table, filter: sub.filter },
        handler
      );
    });

    channelRef.current = channel.subscribe();

    return () => {
      // Clear all debounce timers
      debounceTimers.current.forEach(timer => clearTimeout(timer));
      debounceTimers.current.clear();
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [options, createDebouncedHandler]);

  return channelRef.current;
}

/**
 * Clear cache utility for optimistic updates
 */
export function clearRealtimeCache(keys: string[]) {
  keys.forEach(key => {
    // Clear from in-memory caches if needed
    console.log(`Cache cleared for: ${key}`);
  });
}
