import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  checkIn, 
  checkOut, 
  getCurrentAttendance,
  getMyAttendanceHistory 
} from "@/services/volunteerAttendanceService";
import { Clock, LogIn, LogOut, Loader2, Timer } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface VolunteerAttendanceCardProps {
  eventId: string;
  inviteId?: string;
}

export function VolunteerAttendanceCard({ eventId, inviteId }: VolunteerAttendanceCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currentAttendance, isLoading: loadingCurrent } = useQuery({
    queryKey: ["volunteer-attendance-current", eventId, user?.id],
    queryFn: () => getCurrentAttendance(eventId),
    enabled: !!user,
    refetchInterval: 60000, // Refresh every minute to update duration
  });

  const { data: attendanceHistory } = useQuery({
    queryKey: ["volunteer-attendance-history", eventId, user?.id],
    queryFn: () => getMyAttendanceHistory(eventId),
    enabled: !!user,
  });

  const checkInMutation = useMutation({
    mutationFn: () => checkIn(eventId, inviteId),
    onSuccess: () => {
      toast({ title: "Checked in!", description: "Your shift has started." });
      queryClient.invalidateQueries({ queryKey: ["volunteer-attendance-current", eventId] });
      queryClient.invalidateQueries({ queryKey: ["volunteer-attendance-history", eventId] });
    },
    onError: (error: Error) => {
      toast({ title: "Check-in failed", description: error.message, variant: "destructive" });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: () => checkOut(currentAttendance!.id),
    onSuccess: (data) => {
      const hours = data.total_hours?.toFixed(2) || "0";
      toast({ 
        title: "Checked out!", 
        description: `Shift completed. Total: ${hours} hours.` 
      });
      queryClient.invalidateQueries({ queryKey: ["volunteer-attendance-current", eventId] });
      queryClient.invalidateQueries({ queryKey: ["volunteer-attendance-history", eventId] });
    },
    onError: (error: Error) => {
      toast({ title: "Check-out failed", description: error.message, variant: "destructive" });
    },
  });

  const totalHoursToday = attendanceHistory
    ?.filter(a => a.check_out_at)
    .reduce((sum, a) => sum + (a.total_hours || 0), 0) || 0;

  if (loadingCurrent) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">Shift Tracker</span>
          </div>
          {currentAttendance && (
            <Badge variant="default" className="gap-1">
              <Timer className="h-3 w-3" />
              {formatDistanceToNow(new Date(currentAttendance.check_in_at))}
            </Badge>
          )}
        </div>

        {currentAttendance ? (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Checked in at {format(new Date(currentAttendance.check_in_at), "h:mm a")}
            </div>
            <Button 
              onClick={() => checkOutMutation.mutate()} 
              disabled={checkOutMutation.isPending}
              variant="destructive"
              className="w-full gap-2"
            >
              {checkOutMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              Check Out
            </Button>
          </div>
        ) : (
          <Button 
            onClick={() => checkInMutation.mutate()} 
            disabled={checkInMutation.isPending}
            className="w-full gap-2"
          >
            {checkInMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            Check In
          </Button>
        )}

        {totalHoursToday > 0 && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Total volunteered: <span className="font-medium">{totalHoursToday.toFixed(2)} hours</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
