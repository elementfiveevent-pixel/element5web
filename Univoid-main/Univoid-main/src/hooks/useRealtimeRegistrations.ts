import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UseRealtimeRegistrationsOptions {
  userId: string | undefined;
  enabled?: boolean;
}

export function useRealtimeRegistrations({ userId, enabled = true }: UseRealtimeRegistrationsOptions) {
  const queryClient = useQueryClient();

  const invalidateQueries = useCallback(() => {
    if (!userId) return;
    
    // Invalidate ticket and registration queries
    queryClient.invalidateQueries({ queryKey: ["my-tickets", userId] });
    queryClient.invalidateQueries({ queryKey: ["my-pending-registrations", userId] });
  }, [queryClient, userId]);

  useEffect(() => {
    if (!enabled || !userId) return;

    console.log("[RealtimeRegistrations] Setting up subscription for user:", userId);

    const channel = supabase
      .channel(`user-registrations-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "event_registrations",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("[RealtimeRegistrations] Registration change:", payload.eventType, payload);
          invalidateQueries();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "event_tickets",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("[RealtimeRegistrations] Ticket change:", payload.eventType, payload);
          invalidateQueries();
        }
      )
      .subscribe((status) => {
        console.log("[RealtimeRegistrations] Subscription status:", status);
      });

    return () => {
      console.log("[RealtimeRegistrations] Cleaning up subscription");
      supabase.removeChannel(channel);
    };
  }, [userId, enabled, invalidateQueries]);

  return { invalidateQueries };
}
