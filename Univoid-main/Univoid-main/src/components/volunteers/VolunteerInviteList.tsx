import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { AddVolunteerModal } from "./AddVolunteerModal";
import { 
  getEventVolunteerInvites, 
  deleteVolunteerInvite,
  ROLE_LABELS,
  STATUS_LABELS,
  type VolunteerInvite 
} from "@/services/volunteerInviteService";
import { UserPlus, Trash2, Clock, CheckCircle, XCircle, Users } from "lucide-react";
import { format } from "date-fns";

interface VolunteerInviteListProps {
  eventId: string;
  eventTitle: string;
  isOrganizer: boolean;
}

const statusIcons = {
  pending: <Clock className="h-3 w-3" />,
  accepted: <CheckCircle className="h-3 w-3" />,
  rejected: <XCircle className="h-3 w-3" />,
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  accepted: "default",
  rejected: "destructive",
};

export function VolunteerInviteList({ eventId, eventTitle, isOrganizer }: VolunteerInviteListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: invites, isLoading } = useQuery({
    queryKey: ["volunteer-invites", eventId],
    queryFn: () => getEventVolunteerInvites(eventId),
    enabled: isOrganizer,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVolunteerInvite,
    onSuccess: () => {
      toast({ title: "Invite removed" });
      queryClient.invalidateQueries({ queryKey: ["volunteer-invites", eventId] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const acceptedCount = invites?.filter(i => i.status === 'accepted').length || 0;
  const pendingCount = invites?.filter(i => i.status === 'pending').length || 0;

  if (!isOrganizer) return null;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Volunteer Invites
            </CardTitle>
            <CardDescription>
              {acceptedCount} accepted, {pendingCount} pending
            </CardDescription>
          </div>
          <Button size="sm" className="gap-2" onClick={() => setModalOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Add Volunteer
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : !invites || invites.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground text-sm">No volunteers invited yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Click "Add Volunteer" to invite registered users
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Volunteer</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invited</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={invite.user_profile?.profile_photo_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {invite.user_profile?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{invite.user_profile?.full_name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{invite.user_profile?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {ROLE_LABELS[invite.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[invite.status]} className="gap-1">
                        {statusIcons[invite.status]}
                        {STATUS_LABELS[invite.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(invite.created_at), "MMM d, h:mm a")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          if (confirm("Remove this volunteer invite?")) {
                            deleteMutation.mutate(invite.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <AddVolunteerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        eventId={eventId}
        eventTitle={eventTitle}
      />
    </Card>
  );
}
