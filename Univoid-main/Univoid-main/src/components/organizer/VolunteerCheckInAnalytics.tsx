import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { TicketCheck, Loader2, Users, Trophy, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface VolunteerCheckInAnalyticsProps {
  eventId: string;
}

interface VolunteerCheckInStats {
  volunteer_id: string;
  volunteer_name: string;
  volunteer_photo: string | null;
  check_in_count: number;
  last_check_in: string | null;
}

export function VolunteerCheckInAnalytics({ eventId }: VolunteerCheckInAnalyticsProps) {
  // Fetch volunteer check-in stats from audit log
  const { data: stats, isLoading } = useQuery({
    queryKey: ["volunteer-checkin-stats", eventId],
    queryFn: async () => {
      // First get all accepted volunteers for this event
      const { data: volunteers, error: volError } = await supabase
        .from("event_volunteer_invites")
        .select("user_id")
        .eq("event_id", eventId)
        .eq("status", "accepted")
        .in("role", ["all", "qr_checkin", "entry"]);

      if (volError) throw volError;

      const volunteerIds = volunteers?.map(v => v.user_id) || [];
      
      // Get organizer ID too
      const { data: event } = await supabase
        .from("events")
        .select("organizer_id")
        .eq("id", eventId)
        .single();

      const allCheckerIds = event?.organizer_id 
        ? [...volunteerIds, event.organizer_id] 
        : volunteerIds;

      if (allCheckerIds.length === 0) return [];

      // Get check-in counts from audit log (organizer_id in audit log = person who did check-in)
      const { data: auditData, error: auditError } = await supabase
        .from("check_in_audit_log")
        .select("organizer_id, created_at")
        .eq("event_id", eventId)
        .eq("action", "success")
        .in("organizer_id", allCheckerIds);

      if (auditError) throw auditError;

      // Count check-ins per person
      const checkInCounts = new Map<string, { count: number; lastCheckIn: string | null }>();
      
      auditData?.forEach(entry => {
        const current = checkInCounts.get(entry.organizer_id) || { count: 0, lastCheckIn: null };
        checkInCounts.set(entry.organizer_id, {
          count: current.count + 1,
          lastCheckIn: entry.created_at,
        });
      });

      // Also check event_tickets.used_by for check-ins
      const { data: ticketData } = await supabase
        .from("event_tickets")
        .select("used_by, used_at")
        .eq("event_id", eventId)
        .eq("is_used", true)
        .not("used_by", "is", null);

      ticketData?.forEach(ticket => {
        if (ticket.used_by && allCheckerIds.includes(ticket.used_by)) {
          const current = checkInCounts.get(ticket.used_by) || { count: 0, lastCheckIn: null };
          // Only add if not already counted in audit
          if (!auditData?.some(a => a.organizer_id === ticket.used_by && 
              new Date(a.created_at).getTime() === new Date(ticket.used_at!).getTime())) {
            checkInCounts.set(ticket.used_by, {
              count: current.count + 1,
              lastCheckIn: ticket.used_at || current.lastCheckIn,
            });
          }
        }
      });

      // Fetch profiles for all checkers
      const checkerIds = Array.from(checkInCounts.keys());
      if (checkerIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, profile_photo_url")
        .in("id", checkerIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Build stats array
      const result: VolunteerCheckInStats[] = [];
      
      checkInCounts.forEach((value, volunteerId) => {
        const profile = profileMap.get(volunteerId);
        result.push({
          volunteer_id: volunteerId,
          volunteer_name: profile?.full_name || "Unknown",
          volunteer_photo: profile?.profile_photo_url || null,
          check_in_count: value.count,
          last_check_in: value.lastCheckIn,
        });
      });

      // Sort by check-in count descending
      return result.sort((a, b) => b.check_in_count - a.check_in_count);
    },
    refetchInterval: 10000, // Refresh every 10 seconds for real-time feel
  });

  // Get total check-ins for this event
  const { data: totalStats } = useQuery({
    queryKey: ["event-total-checkins", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_tickets")
        .select("is_used")
        .eq("event_id", eventId);

      if (error) throw error;

      const total = data?.length || 0;
      const checkedIn = data?.filter(t => t.is_used).length || 0;

      return { total, checkedIn };
    },
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalCheckIns = stats?.reduce((sum, s) => sum + s.check_in_count, 0) || 0;
  const maxCheckIns = Math.max(...(stats?.map(s => s.check_in_count) || [0]), 1);

  return (
    <div className="space-y-4">
      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <TicketCheck className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <div className="text-2xl font-bold text-green-600">{totalStats?.checkedIn || 0}</div>
            <div className="text-xs text-muted-foreground">Total Checked In</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <div className="text-2xl font-bold text-blue-600">{totalStats?.total || 0}</div>
            <div className="text-xs text-muted-foreground">Total Tickets</div>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">
              {totalStats?.total ? Math.round((totalStats.checkedIn / totalStats.total) * 100) : 0}%
            </div>
            <div className="text-xs text-muted-foreground">Check-in Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Volunteer Leaderboard */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Volunteer Check-in Leaderboard
          </CardTitle>
          <CardDescription>
            Attendees checked in by each team member
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!stats || stats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No check-ins recorded yet
            </div>
          ) : (
            <div className="space-y-3">
              {stats.map((volunteer, index) => (
                <div 
                  key={volunteer.volunteer_id} 
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    index === 0 ? "bg-yellow-500/5 border-yellow-500/20" : ""
                  }`}
                >
                  {/* Rank */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? "bg-yellow-500 text-white" :
                    index === 1 ? "bg-gray-400 text-white" :
                    index === 2 ? "bg-amber-600 text-white" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {index + 1}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={volunteer.volunteer_photo || undefined} />
                    <AvatarFallback className="text-xs">
                      {volunteer.volunteer_name.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{volunteer.volunteer_name}</p>
                    {volunteer.last_check_in && (
                      <p className="text-xs text-muted-foreground">
                        Last: {format(new Date(volunteer.last_check_in), "h:mm a")}
                      </p>
                    )}
                    <Progress 
                      value={(volunteer.check_in_count / maxCheckIns) * 100} 
                      className="h-1.5 mt-1"
                    />
                  </div>

                  {/* Count */}
                  <Badge 
                    variant={index === 0 ? "default" : "secondary"} 
                    className="text-sm font-bold"
                  >
                    {volunteer.check_in_count}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
