import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { getVolunteerEvents, ROLE_LABELS, type VolunteerInviteRole } from "@/services/volunteerInviteService";
import { supabase } from "@/integrations/supabase/client";
import { VolunteerAttendanceCard } from "./VolunteerAttendanceCard";
import { QrCode, Users, Calendar, MapPin, CheckCircle, Loader2, UserCheck } from "lucide-react";
import { format, isAfter, isBefore } from "date-fns";
import { Link } from "react-router-dom";

interface VolunteerEventCardProps {
  eventId: string;
  inviteId: string;
  role: VolunteerInviteRole;
  event: {
    id: string;
    title: string;
    start_date: string;
    end_date: string | null;
    status: string;
  };
}

function VolunteerEventCard({ eventId, inviteId, role, event }: VolunteerEventCardProps) {
  const isEventActive = event.status === 'published' && 
    (event.end_date ? isAfter(new Date(event.end_date), new Date()) : isAfter(new Date(event.start_date), new Date()));
  const isEventCompleted = event.status === 'completed' || 
    (event.end_date && isBefore(new Date(event.end_date), new Date()));

  const canDoCheckin = role === 'all' || role === 'qr_checkin' || role === 'entry';

  return (
    <Card className={`transition-all ${isEventActive ? '' : 'opacity-70'}`}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={isEventActive ? "default" : "secondary"}>
                  {isEventActive ? "Active" : isEventCompleted ? "Completed" : "Upcoming"}
                </Badge>
                <Badge variant="outline">{ROLE_LABELS[role]}</Badge>
              </div>
              
              <Link to={`/events/${eventId}`}>
                <h3 className="font-semibold hover:text-primary transition-colors">
                  {event.title}
                </h3>
              </Link>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(event.start_date), "MMM d, yyyy 'at' h:mm a")}
              </div>
            </div>

            <div className="flex gap-2">
              {canDoCheckin && isEventActive && (
                <Link to={`/events/${eventId}/check-in`}>
                  <Button size="sm" className="gap-1.5">
                    <QrCode className="h-4 w-4" />
                    Scan QR
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Attendance Tracker */}
          {isEventActive && (
            <VolunteerAttendanceCard eventId={eventId} inviteId={inviteId} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function VolunteerDashboard() {
  const { user } = useAuth();

  const { data: volunteerEvents, isLoading } = useQuery({
    queryKey: ["volunteer-events", user?.id],
    queryFn: () => getVolunteerEvents(user!.id),
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!volunteerEvents || volunteerEvents.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No volunteer assignments</p>
          <p className="text-xs text-muted-foreground mt-1">
            Accept volunteer invitations to see your events here
          </p>
        </CardContent>
      </Card>
    );
  }

  const activeEvents = volunteerEvents.filter(ve => 
    ve.event.status === 'published' && 
    (ve.event.end_date ? isAfter(new Date(ve.event.end_date), new Date()) : true)
  );
  
  const pastEvents = volunteerEvents.filter(ve => 
    ve.event.status === 'completed' || 
    (ve.event.end_date && isBefore(new Date(ve.event.end_date), new Date()))
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          My Volunteer Events
        </CardTitle>
        <CardDescription>
          Events you're volunteering for. You can scan QR codes and manage check-ins.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active">
          <TabsList className="mb-4">
            <TabsTrigger value="active">
              Active ({activeEvents.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastEvents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeEvents.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">
                No active volunteer events
              </p>
            ) : (
              <div className="space-y-3">
                {activeEvents.map(ve => (
                  <VolunteerEventCard 
                    key={ve.event_id} 
                    eventId={ve.event_id}
                    inviteId={ve.id}
                    role={ve.role} 
                    event={ve.event} 
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {pastEvents.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">
                No past volunteer events
              </p>
            ) : (
              <div className="space-y-3">
                {pastEvents.map(ve => (
                  <VolunteerEventCard 
                    key={ve.event_id} 
                    eventId={ve.event_id}
                    inviteId={ve.id}
                    role={ve.role} 
                    event={ve.event} 
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
