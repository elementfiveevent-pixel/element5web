import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  findUserByEmail, 
  checkExistingInvite, 
  createVolunteerInvite, 
  sendVolunteerInviteNotification,
  ROLE_LABELS,
  type VolunteerInviteRole 
} from "@/services/volunteerInviteService";
import { UserPlus, Loader2, AlertCircle, CheckCircle } from "lucide-react";

interface AddVolunteerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle: string;
}

export function AddVolunteerModal({ open, onOpenChange, eventId, eventTitle }: AddVolunteerModalProps) {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<VolunteerInviteRole>("all");
  const [error, setError] = useState<string | null>(null);
  const [foundUser, setFoundUser] = useState<{ id: string; full_name: string; email: string } | null>(null);

  const searchUserMutation = useMutation({
    mutationFn: async (searchEmail: string) => {
      setError(null);
      setFoundUser(null);
      
      const user = await findUserByEmail(searchEmail);
      if (!user) {
        throw new Error("User not registered on UniVoid");
      }
      
      // Check if already invited
      const alreadyInvited = await checkExistingInvite(eventId, user.id);
      if (alreadyInvited) {
        throw new Error("User has already been invited to this event");
      }
      
      return user;
    },
    onSuccess: (userData) => {
      setFoundUser(userData);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!foundUser || !user) throw new Error("Invalid state");
      
      // Create the invite
      await createVolunteerInvite(eventId, foundUser.id, user.id, role);
      
      // Send in-app notification
      await sendVolunteerInviteNotification(
        foundUser.id,
        eventId,
        eventTitle,
        profile?.full_name || "Event Organizer",
        role
      );
    },
    onSuccess: () => {
      toast({
        title: "Volunteer Invited!",
        description: `${foundUser?.full_name} has been invited as a volunteer.`,
      });
      queryClient.invalidateQueries({ queryKey: ["volunteer-invites", eventId] });
      resetAndClose();
    },
    onError: (err: Error) => {
      toast({
        title: "Failed to invite",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const resetAndClose = () => {
    setEmail("");
    setRole("all");
    setError(null);
    setFoundUser(null);
    onOpenChange(false);
  };

  const handleEmailBlur = () => {
    if (email.trim() && email.includes("@")) {
      searchUserMutation.mutate(email.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Volunteer
          </DialogTitle>
          <DialogDescription>
            Invite a registered UniVoid user to volunteer for your event.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="volunteer@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
                setFoundUser(null);
              }}
              onBlur={handleEmailBlur}
              disabled={inviteMutation.isPending}
            />
            
            {searchUserMutation.isPending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </div>
            )}
            
            {error && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}
            
            {foundUser && (
              <Alert className="py-2 border-green-500/50 bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-sm">
                  Found: <span className="font-medium">{foundUser.full_name}</span>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label>Volunteer Role *</Label>
            <Select value={role} onValueChange={(v) => setRole(v as VolunteerInviteRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {role === 'all' && "Full access to all volunteer functions"}
              {role === 'entry' && "Manage event entry and registration desk"}
              {role === 'qr_checkin' && "Scan QR codes and mark attendance"}
              {role === 'help_desk' && "Assist attendees with queries"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={resetAndClose}
              disabled={inviteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={() => inviteMutation.mutate()}
              disabled={!foundUser || inviteMutation.isPending}
            >
              {inviteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Inviting...
                </>
              ) : (
                "Send Invite"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
