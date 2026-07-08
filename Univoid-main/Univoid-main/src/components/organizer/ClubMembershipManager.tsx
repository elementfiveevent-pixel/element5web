import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Users, Shield, Search, Clock } from "lucide-react";
import { format } from "date-fns";
import type { Club, EventClub } from "@/services/clubService";

interface ClubMembershipManagerProps {
  eventId: string;
  organizerId: string;
}

interface MemberWithProfile {
  id: string;
  club_id: string;
  user_id: string;
  membership_id: string | null;
  verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
    profile_photo_url: string | null;
    mobile_number: string | null;
    college_name: string | null;
  };
}

interface RegistrationWithClub {
  registration_id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  profile_photo_url: string | null;
  payment_status: string;
  custom_data: {
    _club_id?: string;
    _membership_id?: string;
    _applied_price?: number;
  } | null;
  created_at: string;
}

export function ClubMembershipManager({ eventId, organizerId }: ClubMembershipManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);

  // Fetch event clubs
  const { data: eventClubs } = useQuery({
    queryKey: ["event-clubs", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_clubs")
        .select(`
          *,
          club:clubs(*)
        `)
        .eq("event_id", eventId);

      if (error) throw error;
      return (data || []) as (EventClub & { club: Club })[];
    },
  });

  // Fetch registrations with club claims
  const { data: clubRegistrations } = useQuery({
    queryKey: ["club-registrations", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_event_registrations_with_profiles", { p_event_id: eventId });

      if (error) throw error;

      // Filter to only show registrations that claimed club membership
      return ((data || []) as RegistrationWithClub[]).filter(
        (reg) => reg.custom_data?._club_id
      );
    },
  });

  // Fetch club members for selected club
  const { data: clubMembers } = useQuery({
    queryKey: ["club-members", selectedClubId],
    queryFn: async () => {
      if (!selectedClubId) return [];

      // First get club members
      const { data: members, error: membersError } = await supabase
        .from("club_members")
        .select("*")
        .eq("club_id", selectedClubId)
        .order("created_at", { ascending: false });

      if (membersError) throw membersError;
      if (!members || members.length === 0) return [];

      // Then fetch profiles separately
      const userIds = members.map(m => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, profile_photo_url, mobile_number, college_name")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Combine data
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      return members.map(m => ({
        ...m,
        profile: profileMap.get(m.user_id) || null,
      })) as MemberWithProfile[];
    },
    enabled: !!selectedClubId,
  });

  // Verify membership mutation
  const verifyMutation = useMutation({
    mutationFn: async ({ memberId, verified }: { memberId: string; verified: boolean }) => {
      const { error } = await supabase
        .from("club_members")
        .update({
          verified,
          verified_at: verified ? new Date().toISOString() : null,
          verified_by: verified ? organizerId : null,
        })
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: (_, { verified }) => {
      toast({
        title: verified ? "✅ Membership Verified" : "❌ Verification Removed",
      });
      queryClient.invalidateQueries({ queryKey: ["club-members", selectedClubId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredMembers = clubMembers?.filter(
    (member) =>
      member.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.membership_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = clubMembers?.filter((m) => !m.verified).length || 0;
  const verifiedCount = clubMembers?.filter((m) => m.verified).length || 0;

  if (!eventClubs || eventClubs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No Clubs Associated</h3>
          <p className="text-sm text-muted-foreground">
            This event doesn't have any club pricing configured.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Club Selector */}
      <div className="flex flex-wrap gap-2">
        {eventClubs.map((ec) => (
          <Button
            key={ec.id}
            variant={selectedClubId === ec.club_id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedClubId(ec.club_id)}
            className="gap-2"
          >
            <Shield className="w-4 h-4" />
            {ec.club?.name}
          </Button>
        ))}
      </div>

      {selectedClubId && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  {eventClubs.find((ec) => ec.club_id === selectedClubId)?.club?.name} Members
                </CardTitle>
                <CardDescription>
                  Verify club memberships for discounted registrations
                </CardDescription>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-orange-500" />
                  {pendingCount} Pending
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {verifiedCount} Verified
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or membership ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Tabs defaultValue="pending">
              <TabsList className="mb-4">
                <TabsTrigger value="pending">
                  Pending {pendingCount > 0 && <Badge variant="destructive" className="ml-1">{pendingCount}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="verified">Verified ({verifiedCount})</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>

              {["pending", "verified", "all"].map((tab) => (
                <TabsContent key={tab} value={tab}>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead>Membership ID</TableHead>
                          <TableHead>Claimed At</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMembers
                          ?.filter((m) =>
                            tab === "all" ? true : tab === "pending" ? !m.verified : m.verified
                          )
                          .map((member) => (
                            <TableRow key={member.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={member.profile?.profile_photo_url || undefined} />
                                    <AvatarFallback className="text-xs">
                                      {member.profile?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-sm">{member.profile?.full_name || "Unknown"}</p>
                                    <p className="text-xs text-muted-foreground">{member.profile?.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                  {member.membership_id || "Not provided"}
                                </code>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {format(new Date(member.created_at), "MMM d, h:mm a")}
                              </TableCell>
                              <TableCell>
                                {member.verified ? (
                                  <Badge variant="default" className="gap-1">
                                    <CheckCircle className="w-3 h-3" /> Verified
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="gap-1">
                                    <Clock className="w-3 h-3" /> Pending
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {!member.verified ? (
                                  <Button
                                    size="sm"
                                    onClick={() => verifyMutation.mutate({ memberId: member.id, verified: true })}
                                    disabled={verifyMutation.isPending}
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" /> Verify
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => verifyMutation.mutate({ memberId: member.id, verified: false })}
                                    disabled={verifyMutation.isPending}
                                  >
                                    <XCircle className="w-3 h-3 mr-1" /> Revoke
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        {(!filteredMembers || filteredMembers.filter((m) =>
                          tab === "all" ? true : tab === "pending" ? !m.verified : m.verified
                        ).length === 0) && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No {tab === "all" ? "" : tab} members found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Club Registrations Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Club Pricing Registrations</CardTitle>
          <CardDescription>
            Registrations that claimed club membership discounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clubRegistrations && clubRegistrations.length > 0 ? (
            <div className="space-y-3">
              {clubRegistrations.map((reg) => {
                const club = eventClubs.find((ec) => ec.club_id === reg.custom_data?._club_id);
                return (
                  <div
                    key={reg.registration_id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={reg.profile_photo_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {reg.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{reg.full_name}</p>
                        <p className="text-xs text-muted-foreground">{reg.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{club?.club?.name}</Badge>
                      <span className="text-sm font-medium">
                        ₹{reg.custom_data?._applied_price}
                      </span>
                      <Badge
                        variant={reg.payment_status === "approved" ? "default" : "secondary"}
                      >
                        {reg.payment_status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground text-sm">
              No club pricing registrations yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
