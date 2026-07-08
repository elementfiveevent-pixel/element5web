import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { getUserVolunteerInvites } from "@/services/volunteerInviteService";
import { VolunteerInviteNotification } from "./VolunteerInviteNotification";
import { UserCheck, Loader2 } from "lucide-react";

export function UserVolunteerInvites() {
  const { user } = useAuth();

  const { data: invites, isLoading } = useQuery({
    queryKey: ["user-volunteer-invites", user?.id],
    queryFn: () => getUserVolunteerInvites(user!.id),
    enabled: !!user,
  });

  const pendingInvites = invites?.filter(i => i.status === 'pending') || [];
  const respondedInvites = invites?.filter(i => i.status !== 'pending') || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!invites || invites.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No volunteer invitations</p>
          <p className="text-xs text-muted-foreground mt-1">
            You'll see invitations here when organizers invite you to help with their events
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {pendingInvites.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Pending Invitations ({pendingInvites.length})
          </h3>
          <div className="space-y-3">
            {pendingInvites.map(invite => (
              <VolunteerInviteNotification key={invite.id} invite={invite} />
            ))}
          </div>
        </div>
      )}

      {respondedInvites.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium text-muted-foreground">Previous Invitations</h3>
          <div className="space-y-3">
            {respondedInvites.map(invite => (
              <VolunteerInviteNotification key={invite.id} invite={invite} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
