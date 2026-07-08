import { useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RealtimeChannel } from "@supabase/supabase-js";

interface UseOrganizerRealtimeOptions {
  userId?: string;
  eventIds?: string[];
  selectedEventId?: string | null;
  enabled?: boolean;
}

/**
 * Comprehensive real-time subscription hook for organizer dashboard
 * Handles: registrations, tickets/check-ins, volunteer invites, volunteer attendance, payments
 */
export function useOrganizerRealtime({
  userId,
  eventIds = [],
  selectedEventId,
  enabled = true,
}: UseOrganizerRealtimeOptions) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const channelsRef = useRef<RealtimeChannel[]>([]);
  
  // Debounce toast notifications
  const lastToastRef = useRef<{ type: string; time: number }>({ type: "", time: 0 });
  
  const showToast = useCallback((type: string, title: string, description?: string) => {
    const now = Date.now();
    // Debounce same type of toast within 2 seconds
    if (lastToastRef.current.type === type && now - lastToastRef.current.time < 2000) {
      return;
    }
    lastToastRef.current = { type, time: now };
    toast({ title, description });
  }, [toast]);

  const invalidateQueries = useCallback((keys: string[][]) => {
    keys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: key });
    });
  }, [queryClient]);

  useEffect(() => {
    if (!enabled || !userId || eventIds.length === 0) {
      return;
    }

    const eventIdFilter = `event_id=in.(${eventIds.join(",")})`;
    const channels: RealtimeChannel[] = [];

    // 1. Registration changes (new registrations, status updates)
    const registrationChannel = supabase
      .channel("organizer-registrations-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "event_registrations",
          filter: eventIdFilter,
        },
        (payload) => {
          console.log("[Realtime] Registration update:", payload.eventType);
          
          invalidateQueries([
            ["event-registrations", selectedEventId],
            ["organizer-events", userId],
            ["registrations-export", selectedEventId],
          ]);
          
          if (payload.eventType === "INSERT") {
            showToast("new-registration", "🎉 New Registration!", "Someone just registered for your event");
          }
        }
      )
      .subscribe();
    channels.push(registrationChannel);

    // 2. Ticket/Check-in changes
    const ticketChannel = supabase
      .channel("organizer-tickets-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "event_tickets",
          filter: eventIdFilter,
        },
        (payload) => {
          console.log("[Realtime] Ticket update:", payload.eventType);
          
          invalidateQueries([
            ["event-checkin-stats", selectedEventId],
            ["recent-checkins", selectedEventId],
          ]);
          
          const newData = payload.new as { is_used?: boolean } | null;
          if (payload.eventType === "UPDATE" && newData?.is_used) {
            showToast("checkin", "✅ Attendee Checked In!");
          }
        }
      )
      .subscribe();
    channels.push(ticketChannel);

    // 3. Volunteer invite changes
    const volunteerInviteChannel = supabase
      .channel("organizer-volunteer-invites-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "event_volunteer_invites",
          filter: eventIdFilter,
        },
        (payload) => {
          console.log("[Realtime] Volunteer invite update:", payload.eventType);
          
          invalidateQueries([
            ["volunteer-invites", selectedEventId],
            ["volunteer-roles", selectedEventId],
          ]);
          
          const newData = payload.new as { status?: string } | null;
          if (payload.eventType === "UPDATE" && newData?.status === "accepted") {
            showToast("volunteer-accepted", "🙋 Volunteer Accepted!", "A volunteer just accepted your invite");
          }
        }
      )
      .subscribe();
    channels.push(volunteerInviteChannel);

    // 4. Volunteer attendance (check-in/out)
    const volunteerAttendanceChannel = supabase
      .channel("organizer-volunteer-attendance-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "volunteer_attendance",
          filter: eventIdFilter,
        },
        (payload) => {
          console.log("[Realtime] Volunteer attendance update:", payload.eventType);
          
          invalidateQueries([
            ["volunteer-attendance", selectedEventId],
            ["volunteer-analytics", selectedEventId],
          ]);
          
          if (payload.eventType === "INSERT") {
            showToast("volunteer-checkin", "👋 Volunteer Checked In!");
          }
        }
      )
      .subscribe();
    channels.push(volunteerAttendanceChannel);

    // 5. Volunteer role assignments
    const volunteerAssignmentChannel = supabase
      .channel("organizer-volunteer-assignments-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "volunteer_assignments",
        },
        (payload) => {
          console.log("[Realtime] Volunteer assignment update:", payload.eventType);
          
          // Invalidate all assignment-related queries
          invalidateQueries([
            ["volunteer-assignments"],
            ["volunteer-roles", selectedEventId],
          ]);
          
          if (payload.eventType === "INSERT") {
            showToast("volunteer-applied", "📋 New Volunteer Application!");
          }
        }
      )
      .subscribe();
    channels.push(volunteerAssignmentChannel);

    // 6. Events updates (capacity, status changes)
    const eventsChannel = supabase
      .channel("organizer-events-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "events",
          filter: `organizer_id=eq.${userId}`,
        },
        (payload) => {
          console.log("[Realtime] Event update:", payload);
          invalidateQueries([
            ["organizer-events", userId],
          ]);
        }
      )
      .subscribe();
    channels.push(eventsChannel);

    channelsRef.current = channels;

    // Cleanup
    return () => {
      console.log("[Realtime] Cleaning up organizer subscriptions");
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [enabled, userId, eventIds.join(","), selectedEventId, invalidateQueries, showToast]);

  // Return cleanup function for manual control if needed
  return {
    cleanup: () => {
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    },
  };
}
