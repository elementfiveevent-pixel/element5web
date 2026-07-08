import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, CheckCircle, XCircle, Trash2, UserPlus, ClipboardList, Mail, Clock, TicketCheck } from "lucide-react";
import { format } from "date-fns";
import { AddVolunteerModal } from "@/components/volunteers/AddVolunteerModal";
import { VolunteerAttendanceList } from "./VolunteerAttendanceList";
import { VolunteerCheckInAnalytics } from "./VolunteerCheckInAnalytics";

interface VolunteerManagerProps {
  eventId: string;
  eventTitle: string;
  organizerId: string;
}

interface VolunteerRole {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  slots_available: number;
  slots_filled: number;
  responsibilities: string[] | null;
  perks: string | null;
  created_at: string;
}

interface VolunteerAssignment {
  id: string;
  role_id: string;
  user_id: string;
  status: string;
  notes: string | null;
  assigned_at: string | null;
  created_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
    profile_photo_url: string | null;
    mobile_number: string | null;
  };
}

export function VolunteerManager({ eventId, eventTitle, organizerId }: VolunteerManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  
  // Form state
  const [roleTitle, setRoleTitle] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [slotsAvailable, setSlotsAvailable] = useState(1);
  const [responsibilities, setResponsibilities] = useState("");
  const [perks, setPerks] = useState("");

  // Fetch volunteer roles
  const { data: roles, isLoading } = useQuery({
    queryKey: ["volunteer-roles", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("volunteer_roles")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as VolunteerRole[];
    },
  });

  // Fetch assignments for selected role
  const { data: assignments } = useQuery({
    queryKey: ["volunteer-assignments", selectedRole],
    queryFn: async () => {
      if (!selectedRole) return [];
      
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("volunteer_assignments")
        .select("*")
        .eq("role_id", selectedRole)
        .order("created_at", { ascending: false });

      if (assignmentError) throw assignmentError;
      if (!assignmentData || assignmentData.length === 0) return [];

      // Fetch profiles
      const userIds = assignmentData.map(a => a.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email, profile_photo_url, mobile_number")
        .in("id", userIds);

      if (profileError) throw profileError;

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      return assignmentData.map(a => ({
        ...a,
        profile: profileMap.get(a.user_id) || null,
      })) as VolunteerAssignment[];
    },
    enabled: !!selectedRole,
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("volunteer_roles")
        .insert({
          event_id: eventId,
          title: roleTitle,
          description: roleDescription || null,
          slots_available: slotsAvailable,
          responsibilities: responsibilities ? responsibilities.split("\n").filter(r => r.trim()) : null,
          perks: perks || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Volunteer role created!" });
      queryClient.invalidateQueries({ queryKey: ["volunteer-roles", eventId] });
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update assignment status mutation
  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ id, status, userId: targetUserId }: { id: string; status: string; userId: string }) => {
      const updates: Record<string, unknown> = { status };
      if (status === "approved") {
        updates.assigned_at = new Date().toISOString();
        updates.assigned_by = organizerId;
      }
      
      const { error } = await supabase
        .from("volunteer_assignments")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      // Send notification email in background
      try {
        await supabase.functions.invoke("send-volunteer-notification", {
          body: {
            type: status === "approved" ? "approved" : "rejected",
            roleId: selectedRole,
            userId: targetUserId,
          },
        });
      } catch (emailError) {
        console.error("Failed to send volunteer notification:", emailError);
      }
    },
    onSuccess: (_, { status }) => {
      toast({ title: status === "approved" ? "Volunteer approved!" : "Application rejected" });
      queryClient.invalidateQueries({ queryKey: ["volunteer-assignments", selectedRole] });
      queryClient.invalidateQueries({ queryKey: ["volunteer-roles", eventId] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from("volunteer_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Role deleted" });
      queryClient.invalidateQueries({ queryKey: ["volunteer-roles", eventId] });
      setSelectedRole(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setRoleTitle("");
    setRoleDescription("");
    setSlotsAvailable(1);
    setResponsibilities("");
    setPerks("");
  };

  const pendingCount = assignments?.filter(a => a.status === "pending").length || 0;
  const approvedCount = assignments?.filter(a => a.status === "approved").length || 0;
  const selectedRoleData = roles?.find(r => r.id === selectedRole);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Volunteer Roles</h3>
          <p className="text-sm text-muted-foreground">Create and manage volunteer positions</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setInviteModalOpen(true)}>
            <Mail className="w-4 h-4" /> Invite Volunteer
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Add Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Volunteer Role</DialogTitle>
                <DialogDescription>Define a new volunteer position for your event</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Role Title *</Label>
                  <Input 
                    placeholder="e.g., Registration Desk" 
                    value={roleTitle} 
                    onChange={(e) => setRoleTitle(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    placeholder="What this role involves..." 
                    value={roleDescription} 
                    onChange={(e) => setRoleDescription(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slots Available</Label>
                  <Input 
                    type="number" 
                    min={1} 
                    value={slotsAvailable} 
                    onChange={(e) => setSlotsAvailable(parseInt(e.target.value) || 1)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Responsibilities (one per line)</Label>
                  <Textarea 
                    placeholder="Check-in attendees&#10;Distribute badges&#10;Guide guests" 
                    value={responsibilities} 
                    onChange={(e) => setResponsibilities(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Perks</Label>
                  <Input 
                    placeholder="e.g., Free lunch, event t-shirt" 
                    value={perks} 
                    onChange={(e) => setPerks(e.target.value)} 
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => createRoleMutation.mutate()} 
                  disabled={!roleTitle || createRoleMutation.isPending}
                >
                  {createRoleMutation.isPending ? "Creating..." : "Create Role"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Invite Volunteer Modal */}
      <AddVolunteerModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        eventId={eventId}
        eventTitle={eventTitle}
      />

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : !roles || roles.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Volunteer Roles Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create volunteer positions for your event</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Roles List */}
          <div className="space-y-2">
            {roles.map(role => (
              <Card 
                key={role.id}
                className={`cursor-pointer transition-all ${selectedRole === role.id ? "ring-2 ring-primary" : "hover:shadow-md"}`}
                onClick={() => setSelectedRole(role.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{role.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {role.slots_filled}/{role.slots_available} filled
                      </p>
                    </div>
                    <Badge variant={role.slots_filled >= role.slots_available ? "secondary" : "default"}>
                      {role.slots_filled >= role.slots_available ? "Full" : "Open"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Role Details & Assignments */}
          <div className="lg:col-span-2">
            {selectedRole && selectedRoleData ? (
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{selectedRoleData.title}</CardTitle>
                      <CardDescription>{selectedRoleData.description}</CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        if (confirm("Delete this role?")) {
                          deleteRoleMutation.mutate(selectedRole);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {selectedRoleData.slots_filled}/{selectedRoleData.slots_available} slots
                    </span>
                    {selectedRoleData.perks && (
                      <Badge variant="outline">🎁 {selectedRoleData.perks}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="pending">
                    <TabsList className="mb-4">
                      <TabsTrigger value="pending">
                        Pending {pendingCount > 0 && <Badge variant="destructive" className="ml-1">{pendingCount}</Badge>}
                      </TabsTrigger>
                      <TabsTrigger value="approved">Approved ({approvedCount})</TabsTrigger>
                    </TabsList>

                    {["pending", "approved"].map(status => (
                      <TabsContent key={status} value={status}>
                        {assignments?.filter(a => a.status === status).length === 0 ? (
                          <p className="text-center py-8 text-muted-foreground text-sm">
                            No {status} applications
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {assignments?.filter(a => a.status === status).map(assignment => (
                              <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                    <AvatarImage src={assignment.profile?.profile_photo_url || undefined} />
                                    <AvatarFallback className="text-xs">
                                      {assignment.profile?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-sm">{assignment.profile?.full_name || "Unknown"}</p>
                                    <p className="text-xs text-muted-foreground">{assignment.profile?.email}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Applied {format(new Date(assignment.created_at), "MMM d, h:mm a")}
                                    </p>
                                  </div>
                                </div>
                                {status === "pending" ? (
                                  <div className="flex gap-2">
                                    <Button 
                                      size="sm" 
                                      onClick={() => updateAssignmentMutation.mutate({ id: assignment.id, status: "approved", userId: assignment.user_id })}
                                      disabled={selectedRoleData.slots_filled >= selectedRoleData.slots_available}
                                    >
                                      <CheckCircle className="w-3 h-3 mr-1" /> Approve
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="destructive"
                                      onClick={() => updateAssignmentMutation.mutate({ id: assignment.id, status: "rejected", userId: assignment.user_id })}
                                    >
                                      <XCircle className="w-3 h-3 mr-1" /> Reject
                                    </Button>
                                  </div>
                                ) : (
                                  <Badge className="gap-1">
                                    <CheckCircle className="w-3 h-3" /> Assigned
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a role to manage applications</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Volunteer Check-in Analytics */}
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TicketCheck className="w-4 h-4" />
            Check-in Performance
          </CardTitle>
          <CardDescription>
            See how many attendees each volunteer has checked in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VolunteerCheckInAnalytics eventId={eventId} />
        </CardContent>
      </Card>

      {/* Attendance Tracking Section */}
      {roles && roles.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Volunteer Attendance
            </CardTitle>
            <CardDescription>
              Track volunteer check-ins and hours worked
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VolunteerAttendanceList eventId={eventId} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
