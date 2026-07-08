import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CapacityState {
  registrationsCount: number;
  maxCapacity: number | null;
  isFull: boolean;
  spotsRemaining: number | null;
}

/**
 * Hook for real-time seat availability updates
 * Uses Supabase Realtime to instantly reflect registration changes
 */
export function useRealtimeCapacity(eventId: string | undefined) {
  const [capacity, setCapacity] = useState<CapacityState>({
    registrationsCount: 0,
    maxCapacity: null,
    isFull: false,
    spotsRemaining: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Calculate derived values
  const updateCapacity = useCallback((count: number, max: number | null) => {
    setCapacity({
      registrationsCount: count,
      maxCapacity: max,
      isFull: max !== null && count >= max,
      spotsRemaining: max !== null ? Math.max(0, max - count) : null,
    });
  }, []);
  
  // Fetch initial capacity
  useEffect(() => {
    if (!eventId) return;
    
    const fetchCapacity = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('registrations_count, max_capacity')
        .eq('id', eventId)
        .single();
      
      if (!error && data) {
        updateCapacity(data.registrations_count, data.max_capacity);
      }
      setIsLoading(false);
    };
    
    fetchCapacity();
  }, [eventId, updateCapacity]);
  
  // Subscribe to real-time updates
  useEffect(() => {
    if (!eventId) return;
    
    const channel = supabase
      .channel(`event-capacity-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${eventId}`,
        },
        (payload) => {
          const newData = payload.new as { 
            registrations_count: number; 
            max_capacity: number | null 
          };
          updateCapacity(newData.registrations_count, newData.max_capacity);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, updateCapacity]);
  
  return {
    ...capacity,
    isLoading,
  };
}
