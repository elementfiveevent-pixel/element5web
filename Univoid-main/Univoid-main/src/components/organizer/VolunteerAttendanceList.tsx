import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getEventAttendance } from "@/services/volunteerAttendanceService";
import { Clock, Loader2, Timer, CheckCircle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface VolunteerAttendanceListProps {
  eventId: string;
}

export function VolunteerAttendanceList({ eventId }: VolunteerAttendanceListProps) {
  const { data: attendance, isLoading } = useQuery({
    queryKey: ["event-volunteer-attendance", eventId],
    queryFn: () => getEventAttendance(eventId),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeShifts = attendance?.filter(a => !a.check_out_at) || [];
  const completedShifts = attendance?.filter(a => a.check_out_at) || [];

  const totalHours = completedShifts.reduce((sum, a) => sum + (a.total_hours || 0), 0);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{activeShifts.length}</div>
            <div className="text-xs text-muted-foreground">Active Now</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{completedShifts.length}</div>
            <div className="text-xs text-muted-foreground">Shifts Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">Total Hours</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Shifts */}
      {activeShifts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Timer className="h-4 w-4 text-green-600" />
              Currently Active ({activeShifts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeShifts.map(shift => (
              <div key={shift.id} className="flex items-center justify-between p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={shift.profile?.profile_photo_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {shift.profile?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase() || "V"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{shift.profile?.full_name || "Volunteer"}</p>
                    <p className="text-xs text-muted-foreground">
                      Since {format(new Date(shift.check_in_at), "h:mm a")}
                    </p>
                  </div>
                </div>
                <Badge variant="default" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(shift.check_in_at))}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Completed Shifts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Completed Shifts ({completedShifts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completedShifts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No completed shifts yet
            </p>
          ) : (
            <div className="space-y-2">
              {completedShifts.map(shift => (
                <div key={shift.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={shift.profile?.profile_photo_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {shift.profile?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase() || "V"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{shift.profile?.full_name || "Volunteer"}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(shift.check_in_at), "h:mm a")} - {format(new Date(shift.check_out_at!), "h:mm a")}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {shift.total_hours?.toFixed(2)}h
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
