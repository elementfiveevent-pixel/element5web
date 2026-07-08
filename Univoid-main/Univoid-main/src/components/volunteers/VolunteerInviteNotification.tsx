import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  acceptVolunteerInvite, 
  rejectVolunteerInvite, 
  ROLE_LABELS,
  type VolunteerInvite 
} from "@/services/volunteerInviteService";
import { Calendar, User, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface VolunteerInviteNotificationProps {
  invite: VolunteerInvite;
}

export function VolunteerInviteNotification({ invite }: VolunteerInviteNotificationProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const acceptMutation = useMutation({
    mutationFn: () => acceptVolunteerInvite(invite.id),
    onSuccess: () => {
      toast({
        title: "Invite Accepted!",
        description: "You're now a volunteer for this event.",
      });
      // Invalidate both queries to refresh invites and volunteer events
      queryClient.invalidateQueries({ queryKey: ["user-volunteer-invites"] });
      queryClient.invalidateQueries({ queryKey: ["volunteer-events"] }); // This will match all volunteer-events queries
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to accept",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectVolunteerInvite(invite.id),
    onSuccess: () => {
      toast({ title: "Invite Declined" });
      queryClient.invalidateQueries({ queryKey: ["user-volunteer-invites"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to decline",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isPending = invite.status === 'pending';

  return (
    <Card className={`transition-all ${isPending ? 'border-primary/50 bg-primary/5' : ''}`}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={isPending ? "default" : invite.status === 'accepted' ? "secondary" : "destructive"} className="gap-1">
                {isPending && <Clock className="h-3 w-3" />}
                {invite.status === 'accepted' && <CheckCircle className="h-3 w-3" />}
                {invite.status === 'rejected' && <XCircle className="h-3 w-3" />}
                {isPending ? 'Pending Response' : invite.status === 'accepted' ? 'Accepted' : 'Declined'}
              </Badge>
              <Badge variant="outline">{ROLE_LABELS[invite.role]}</Badge>
            </div>
            
            <Link to={`/events/${invite.event_id}`} className="block">
              <h3 className="font-semibold hover:text-primary transition-colors">
                {invite.event?.title || "Event"}
              </h3>
            </Link>
            
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {invite.event?.start_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(invite.event.start_date), "MMM d, yyyy")}
                </span>
              )}
              {invite.inviter_profile?.full_name && (
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Invited by {invite.inviter_profile.full_name}
                </span>
              )}
            </div>
          </div>

          {isPending && (
            <div className="flex gap-2 sm:flex-col lg:flex-row">
              <Button
                size="sm"
                onClick={() => acceptMutation.mutate()}
                disabled={acceptMutation.isPending || rejectMutation.isPending}
                className="gap-1.5"
              >
                <CheckCircle className="h-4 w-4" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => rejectMutation.mutate()}
                disabled={acceptMutation.isPending || rejectMutation.isPending}
                className="gap-1.5"
              >
                <XCircle className="h-4 w-4" />
                Decline
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
