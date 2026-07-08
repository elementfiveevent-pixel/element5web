import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Event, fetchEvents } from '@/services/eventsService';
import { CACHE_TTL } from './useOptimizedFetch';

// Global cache for events
const eventsCache = {
  data: [] as Event[],
  timestamp: 0,
};

interface UseRealtimeEventsResult {
  events: Event[];
  upcomingEvents: Event[];
  pastEvents: Event[];
  isLoading: boolean;
  addOptimistic: (event: Partial<Event>) => void;
  refetch: () => Promise<void>;
}

/**
 * Real-time events hook with optimistic updates
 * No refresh needed - events appear instantly after creation
 */
export function useRealtimeEvents(filters?: {
  category?: string;
  is_paid?: boolean;
  search?: string;
}): UseRealtimeEventsResult {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const hasFilters = filters && (filters.category || filters.is_paid !== undefined || filters.search);

  const fetchEventData = useCallback(async () => {
    // Use cache if no filters and cache is valid
    if (!hasFilters) {
      const cacheValid = Date.now() - eventsCache.timestamp < CACHE_TTL.LONG;
      if (cacheValid && eventsCache.data.length > 0) {
        if (isMounted.current) {
          setEvents(eventsCache.data);
          setIsLoading(false);
        }
        return;
      }
    }

    try {
      const data = await fetchEvents(filters);

      if (isMounted.current) {
        setEvents(data);
        // Update cache if no filters
        if (!hasFilters) {
          eventsCache.data = data;
          eventsCache.timestamp = Date.now();
        }
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [filters, hasFilters]);

  // Optimistic add for event creation
  const addOptimistic = useCallback((event: Partial<Event>) => {
    const optimisticEvent: Event = {
      id: `temp-${Date.now()}`,
      organizer_id: event.organizer_id || '',
      title: event.title || 'Creating event...',
      description: event.description || null,
      flyer_url: event.flyer_url || null,
      category: event.category || 'other',
      event_type: event.event_type || 'offline',
      is_location_decided: event.is_location_decided ?? true,
      venue_name: event.venue_name || null,
      venue_address: event.venue_address || null,
      maps_link: event.maps_link || null,
      start_date: event.start_date || new Date().toISOString(),
      end_date: event.end_date || null,
      is_paid: event.is_paid ?? false,
      price: event.price || 0,
      upi_qr_url: event.upi_qr_url || null,
      upi_vpa: event.upi_vpa || null,
      terms_conditions: event.terms_conditions || null,
      custom_fields: event.custom_fields || null,
      max_capacity: event.max_capacity || null,
      registrations_count: 0,
      status: 'draft',
      views_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...event,
    } as Event;

    setEvents(prev => [optimisticEvent, ...prev]);
  }, []);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    eventsCache.timestamp = 0;
    await fetchEventData();
  }, [fetchEventData]);

  // Compute upcoming and past events
  const now = new Date();
  const upcomingEvents = events.filter(e => new Date(e.start_date) >= now);
  const pastEvents = events.filter(e => new Date(e.start_date) < now);

  useEffect(() => {
    isMounted.current = true;
    fetchEventData();

    // Real-time subscription for events
    channelRef.current = supabase
      .channel('events-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'events' },
        (payload) => {
          const newEvent = payload.new as Event;
          // Only add published events
          if (newEvent.status === 'published') {
            setEvents(prev => {
              if (prev.some(e => e.id === newEvent.id)) return prev;
              return [newEvent, ...prev].sort((a, b) =>
                new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
              );
            });
            eventsCache.data = [...eventsCache.data, newEvent];
            eventsCache.timestamp = Date.now();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'events' },
        (payload) => {
          const updated = payload.new as Event;
          setEvents(prev => {
            // If status changed to published, add it
            if (updated.status === 'published' && !prev.some(e => e.id === updated.id)) {
              return [...prev, updated].sort((a, b) =>
                new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
              );
            }
            // If status changed from published, remove it
            if (updated.status !== 'published') {
              return prev.filter(e => e.id !== updated.id);
            }
            // Otherwise update
            return prev.map(e => e.id === updated.id ? { ...e, ...updated } : e);
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'events' },
        (payload) => {
          const deleted = payload.old as { id: string };
          setEvents(prev => prev.filter(e => e.id !== deleted.id));
        }
      )
      .subscribe();

    return () => {
      isMounted.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [fetchEventData]);

  return { events, upcomingEvents, pastEvents, isLoading, addOptimistic, refetch };
}

// Clear events cache globally
export function clearEventsCache() {
  eventsCache.data = [];
  eventsCache.timestamp = 0;
}
