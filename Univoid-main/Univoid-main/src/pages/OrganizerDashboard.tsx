import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganizerProfile } from "@/hooks/useOrganizerProfile";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizerRealtime } from "@/hooks/useOrganizerRealtime";
import AuthModal from "@/components/auth/AuthModal";
import QRScanner from "@/components/events/QRScanner";
import { GoogleSheetsSync } from "@/components/organizer/GoogleSheetsSync";
import { MobileExportSheet } from "@/components/organizer/MobileExportSheet";
import { ClubMembershipManager } from "@/components/organizer/ClubMembershipManager";
import { VolunteerManager } from "@/components/organizer/VolunteerManager";
import { EventAnalytics } from "@/components/organizer/EventAnalytics";
import { UpsellManager } from "@/components/organizer/UpsellManager";
import { OrganizerSidebar } from "@/components/organizer/OrganizerSidebar";
import { OrganizerBottomNav } from "@/components/organizer/OrganizerBottomNav";
import { OrganizerDashboardSkeleton, RegistrationListSkeleton } from "@/components/organizer/OrganizerSkeleton";
import { DeleteEventDialog } from "@/components/organizer/DeleteEventDialog";
import { PaymentReconciliation } from "@/components/organizer/PaymentReconciliation";
import { 
  Plus, Calendar, Users, CheckCircle, XCircle, Eye, 
  ScanLine, Pencil, TicketCheck, Clock, FileSpreadsheet, 
  UserPlus, BarChart3, Shield, ChevronLeft, Gift, Sparkles, Mail, IndianRupee, Send
} from "lucide-react";
import { EventEmailComposer } from "@/components/organizer/EventEmailComposer";
import { format } from "date-fns";
import type { Event } from "@/services/eventsService";
import { useIsMobile } from "@/hooks/use-mobile";
import { toDisplayUrl } from "@/lib/storageProxy";
import { fetchRegistrationAttendees } from "@/services/ticketCategoryService";

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [qrInput, setQrInput] = useState("");
  const [activeTab, setActiveTab] = useState("registrations");
  
  // Check for organizer profile
  const { hasProfile, profile, isLoading: profileLoading } = useOrganizerProfile();

  // Fetch organizer's events
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["organizer-events", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("organizer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Event[];
    },
    enabled: !!user,
  });

  // Memoize event IDs for realtime subscription
  const eventIds = useMemo(() => events?.map(e => e.id) || [], [events]);

  // Setup comprehensive real-time subscriptions
  useOrganizerRealtime({
    userId: user?.id,
    eventIds,
    selectedEventId: selectedEvent,
    enabled: !!user && eventIds.length > 0,
  });

  // Define type for registration with profile
  interface RegistrationWithProfile {
    registration_id: string;
    user_id: string;
    payment_status: string;
    payment_screenshot_url: string | null;
    created_at: string;
    reviewed_at: string | null;
    custom_data: Record<string, unknown> | null;
    full_name: string | null;
    email: string | null;
    profile_photo_url: string | null;
    mobile_number: string | null;
    college_name: string | null;
  }

  // Fetch registrations for selected event with attendee profiles
  const { data: registrations, isLoading: registrationsLoading } = useQuery({
    queryKey: ["event-registrations", selectedEvent],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_event_registrations_with_profiles", { p_event_id: selectedEvent! });
      if (error) throw error;
      return data as RegistrationWithProfile[];
    },
    enabled: !!selectedEvent,
  });

  // Fetch check-in stats
  const { data: checkInStats } = useQuery({
    queryKey: ["event-checkin-stats", selectedEvent],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_tickets")
        .select("is_used")
        .eq("event_id", selectedEvent!);
      if (error) throw error;
      const total = data?.length || 0;
      const checkedIn = data?.filter(t => t.is_used).length || 0;
      return { total, checkedIn };
    },
    enabled: !!selectedEvent,
  });

  // Calculate stats - use direct count from registrations query for selected event accuracy
  // For overview, we fetch actual counts from database to avoid stale registrations_count
  const { data: actualTotalRegistrations } = useQuery({
    queryKey: ["organizer-total-registrations", user?.id, eventIds],
    queryFn: async () => {
      if (!eventIds.length) return 0;
      
      // Fetch actual registration count from event_registrations table
      const { count, error } = await supabase
        .from("event_registrations")
        .select("id", { count: "exact", head: true })
        .in("event_id", eventIds);
      
      if (error) {
        console.error("Error fetching registration count:", error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!user && eventIds.length > 0,
    staleTime: 10000, // Refresh every 10 seconds
  });

  const totalEvents = events?.length || 0;
  // Use actual count from database query, fallback to sum of events for initial load
  const totalRegistrations = actualTotalRegistrations ?? (events?.reduce((sum, e) => sum + (e.registrations_count || 0), 0) || 0);
  const pendingCount = registrations?.filter((r: RegistrationWithProfile) => r.payment_status === "pending").length || 0;
  const approvedCount = registrations?.filter((r: RegistrationWithProfile) => r.payment_status === "approved").length || 0;

  // Approve/Reject mutation with optimistic UI
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, userId }: { id: string; status: "approved" | "rejected"; userId: string }) => {
      const { error } = await supabase
        .from("event_registrations")
        .update({ payment_status: status, reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;

      // For approvals: The database trigger (create_ticket_on_approval) automatically creates
      // the ticket, and another trigger (notify_ticket_created) sends the ticket email.
      // We only need to manually send an email for rejections.
      if (status === "rejected") {
        try {
          await supabase.functions.invoke("send-registration-status-email", {
            body: {
              registrationId: id,
              status,
              eventId: selectedEvent,
              userId,
            },
          });
        } catch (emailError) {
          console.error("Failed to send rejection email:", emailError);
        }
      }
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["event-registrations", selectedEvent] });
      const previousRegistrations = queryClient.getQueryData(["event-registrations", selectedEvent]);
      queryClient.setQueryData(["event-registrations", selectedEvent], (old: RegistrationWithProfile[] | undefined) => 
        old?.map(r => r.registration_id === id ? { ...r, payment_status: status } : r)
      );
      return { previousRegistrations };
    },
    onSuccess: (_, { status }) => {
      toast({ title: status === "approved" ? "✅ Approved & QR Sent!" : "❌ Registration Rejected" });
    },
    onError: (error: Error, _, context) => {
      if (context?.previousRegistrations) {
        queryClient.setQueryData(["event-registrations", selectedEvent], context.previousRegistrations);
      }
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["event-registrations", selectedEvent] });
      queryClient.invalidateQueries({ queryKey: ["event-checkin-stats", selectedEvent] });
    },
  });

  // Resend ticket email mutation
  const resendTicketMutation = useMutation({
    mutationFn: async ({ registrationId, userId }: { registrationId: string; userId: string }) => {
      const { data, error } = await supabase.functions.invoke("send-ticket-email", {
        body: {
          registrationId,
          eventId: selectedEvent,
          userId,
          resend: true,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to send email");
      return data;
    },
    onSuccess: (data) => {
      toast({ title: `✅ Ticket email resent! (${data.ticketCount || 1} QR codes)` });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to resend", description: error.message, variant: "destructive" });
    },
  });

  // QR Check-in mutation - explicit column selection
  const TICKET_COLUMNS = 'id, registration_id, event_id, user_id, qr_code, is_used, used_at, created_at';
  
  const checkInMutation = useMutation({
    mutationFn: async (qrCode: string) => {
      const { data: ticket, error: fetchError } = await supabase
        .from("event_tickets")
        .select(TICKET_COLUMNS)
        .eq("qr_code", qrCode)
        .eq("event_id", selectedEvent!)
        .single();

      if (fetchError || !ticket) throw new Error("Invalid ticket");
      if (ticket.is_used) throw new Error("Ticket already used");

      const { error } = await supabase
        .from("event_tickets")
        .update({ is_used: true, used_at: new Date().toISOString() })
        .eq("id", ticket.id);

      if (error) throw error;
      return ticket;
    },
    onSuccess: () => {
      toast({ title: "✅ Check-in Successful!" });
      setQrInput("");
      queryClient.invalidateQueries({ queryKey: ["event-checkin-stats", selectedEvent] });
    },
    onError: (error: Error) => {
      toast({ title: "❌ Check-in Failed", description: error.message, variant: "destructive" });
    },
  });

  const selectedEventData = events?.find(e => e.id === selectedEvent);

  if (!user) {
    return (
      <main className="flex-1 container mx-auto px-4 py-20 text-center">
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        <h1 className="text-2xl font-bold mb-4">Login Required</h1>
        <Button onClick={() => setShowAuthModal(true)}>Login</Button>
      </main>
    );
  }

  // Apply scroll lock on mount
  useEffect(() => {
    document.documentElement.classList.add('dashboard-scroll-lock');
    return () => {
      document.documentElement.classList.remove('dashboard-scroll-lock');
    };
  }, []);

  if (eventsLoading || profileLoading) {
    return (
      <div className="h-dvh flex overflow-hidden">
        <OrganizerSidebar 
          selectedEventId={selectedEvent} 
          eventTitle={selectedEventData?.title}
          events={events || []}
          onEventSelect={setSelectedEvent}
          onBackToOverview={() => setSelectedEvent(null)}
        />
        <div className="flex-1 overflow-y-auto">
          <OrganizerDashboardSkeleton />
        </div>
        <OrganizerBottomNav 
          selectedEventId={selectedEvent || undefined} 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    );
  }

  // Redirect to onboarding if no organizer profile
  if (!hasProfile) {
    return (
      <main className="flex-1 container mx-auto px-4 py-20">
        <Card className="max-w-lg mx-auto text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Complete Your Organizer Profile
            </CardTitle>
            <CardDescription>
              Set up your organizer profile to start creating and managing events.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Your organizer profile helps attendees know who's hosting the event and builds trust in your brand.
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate('/organizer/onboarding')}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Set Up Profile
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  // MODE A: Overview (no event selected)
  const renderOverviewMode = () => (
    <div className="container mx-auto px-4 py-6 pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Organizer Dashboard</h1>
          <p className="text-muted-foreground text-sm">Manage your events and registrations</p>
        </div>
        <Link to="/organizer/create-event">
          <Button className="gap-2"><Plus className="w-4 h-4" /> Create Event</Button>
        </Link>
      </div>

      {/* Stats Cards - Only in Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalEvents}</p>
                <p className="text-xs text-muted-foreground">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalRegistrations}</p>
                <p className="text-xs text-muted-foreground">Total Registrations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <TicketCheck className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {events?.filter(e => e.status === "published").length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {events?.filter(e => e.status === "draft").length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {events?.length === 0 ? (
        <Card className="text-center py-20">
          <CardContent>
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Events Yet</h3>
            <p className="text-muted-foreground mb-6">Create your first event to get started</p>
            <Link to="/organizer/create-event"><Button>Create Event</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Select an event to manage</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events?.map(event => (
              <Card 
                key={event.id} 
                className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all"
                onClick={() => setSelectedEvent(event.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h4 className="font-semibold line-clamp-2">{event.title}</h4>
                    <Badge variant={event.status === "published" ? "default" : "secondary"}>
                      {event.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {format(new Date(event.start_date), "EEEE, MMM d, yyyy")}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{event.registrations_count} registered</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // MODE B: Single Event Management
  const renderEventManagementMode = () => {
    if (!selectedEventData) return null;

    return (
      <div className="container mx-auto px-4 py-6 pb-24 lg:pb-8">
        {/* Action Bar - Single header, no duplication */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSelectedEvent(null)}
              className="lg:hidden"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-display text-xl md:text-2xl font-bold line-clamp-1">
                {selectedEventData.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {format(new Date(selectedEventData.start_date), "MMM d, yyyy")} • {registrations?.length || 0} registrations
              </p>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Link to={`/organizer/check-in/${selectedEventData.id}`}>
              <Button size="sm" className="gap-1.5">
                <ScanLine className="w-4 h-4" /> Check-in
              </Button>
            </Link>
            <Link to={`/organizer/edit-event/${selectedEventData.id}`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Pencil className="w-4 h-4" /> Edit
              </Button>
            </Link>
            <Link to={`/events/${selectedEventData.id}`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Eye className="w-4 h-4" /> View
              </Button>
            </Link>
            <DeleteEventDialog 
              eventId={selectedEventData.id}
              eventTitle={selectedEventData.title}
              registrationsCount={selectedEventData.registrations_count || 0}
            />
          </div>
        </div>

        {/* Tabs for event content */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 flex-wrap h-auto gap-1">
                <TabsTrigger value="registrations" className="gap-1.5">
                  <Users className="w-4 h-4" /> 
                  <span className="hidden sm:inline">Registrations</span>
                  <span className="sm:hidden">Reg</span>
                  {pendingCount > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">{pendingCount}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-1.5">
                  <BarChart3 className="w-4 h-4" /> 
                  <span className="hidden sm:inline">Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="volunteers" className="gap-1.5">
                  <UserPlus className="w-4 h-4" /> 
                  <span className="hidden sm:inline">Volunteers</span>
                </TabsTrigger>
                <TabsTrigger value="clubs" className="gap-1.5">
                  <Shield className="w-4 h-4" /> 
                  <span className="hidden sm:inline">Club Members</span>
                </TabsTrigger>
                <TabsTrigger value="upsells" className="gap-1.5">
                  <Gift className="w-4 h-4" /> 
                  <span className="hidden sm:inline">Upsells</span>
                </TabsTrigger>
                {selectedEventData?.is_paid && (
                  <TabsTrigger value="payments" className="gap-1.5">
                    <IndianRupee className="w-4 h-4" /> 
                    <span className="hidden sm:inline">Payments</span>
                  </TabsTrigger>
                )}
                <TabsTrigger value="sheets" className="gap-1.5">
                  <FileSpreadsheet className="w-4 h-4" /> 
                  <span className="hidden sm:inline">Export</span>
                </TabsTrigger>
                <TabsTrigger value="email" className="gap-1.5">
                  <Mail className="w-4 h-4" /> 
                  <span className="hidden sm:inline">Email</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="registrations">
                <Tabs defaultValue="pending">
                  <TabsList className="mb-4">
                    <TabsTrigger value="pending" className="gap-1">
                      Pending 
                      {pendingCount > 0 && <Badge variant="destructive" className="ml-1 h-5 px-1.5">{pendingCount}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="approved">Approved ({approvedCount})</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                  </TabsList>

                  {registrationsLoading ? (
                    <RegistrationListSkeleton />
                  ) : (
                    ["pending", "approved", "rejected"].map(status => (
                      <TabsContent key={status} value={status} className="space-y-3 mt-0">
                        {registrations?.filter(r => r.payment_status === status).length === 0 ? (
                          <p className="text-center py-8 text-muted-foreground text-sm">No {status} registrations</p>
                        ) : (
                          registrations?.filter(r => r.payment_status === status).map(reg => (
                            <Card key={reg.registration_id} className="border">
                              <CardContent className="p-3 sm:p-4 space-y-2">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                      <AvatarImage src={toDisplayUrl(reg.profile_photo_url, { forceImage: true }) || undefined} />
                                      <AvatarFallback className="text-xs">
                                        {reg.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium text-sm">{reg.full_name || 'Unknown User'}</p>
                                      <p className="text-xs text-muted-foreground">{reg.email || 'No email'}</p>
                                      {reg.mobile_number && (
                                        <p className="text-xs text-muted-foreground">{reg.mobile_number}</p>
                                      )}
                                      <p className="text-xs text-muted-foreground/70">{format(new Date(reg.created_at), "MMM d, h:mm a")}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 w-full sm:w-auto">
                                    {reg.payment_screenshot_url && (
                                      <a href={toDisplayUrl(reg.payment_screenshot_url, { forceImage: true }) || '#'} target="_blank" rel="noopener noreferrer">
                                        <Button variant="outline" size="sm" className="text-xs">Screenshot</Button>
                                      </a>
                                    )}
                                    {status === "pending" && (
                                      <>
                                        <Button 
                                          size="sm" 
                                          className="flex-1 sm:flex-none text-xs" 
                                          onClick={() => updateStatusMutation.mutate({ id: reg.registration_id, status: "approved", userId: reg.user_id })}
                                          disabled={updateStatusMutation.isPending}
                                        >
                                          <CheckCircle className="w-3 h-3 mr-1" /> Approve
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="destructive" 
                                          className="flex-1 sm:flex-none text-xs" 
                                          onClick={() => updateStatusMutation.mutate({ id: reg.registration_id, status: "rejected", userId: reg.user_id })}
                                          disabled={updateStatusMutation.isPending}
                                        >
                                          <XCircle className="w-3 h-3 mr-1" /> Reject
                                        </Button>
                                    </>
                                    )}
                                    {status === "approved" && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-xs gap-1"
                                        onClick={() => resendTicketMutation.mutate({ registrationId: reg.registration_id, userId: reg.user_id })}
                                        disabled={resendTicketMutation.isPending}
                                      >
                                        <Send className="w-3 h-3" /> Resend Ticket
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {/* Payment details */}
                                {reg.custom_data && (
                                  <div className="space-y-1.5">
                                    {/* Payment amounts */}
                                    {(reg.custom_data as Record<string, unknown>)?._total_amount && (
                                      <div className="flex flex-wrap gap-2 text-xs">
                                        <Badge variant="outline">
                                          Total: ₹{String((reg.custom_data as Record<string, unknown>)._total_amount)}
                                        </Badge>
                                        {(reg.custom_data as Record<string, unknown>)?._base_amount && (
                                          <Badge variant="secondary">
                                            Base: ₹{String((reg.custom_data as Record<string, unknown>)._base_amount)}
                                          </Badge>
                                        )}
                                        {Number((reg.custom_data as Record<string, unknown>)?._addons_amount) > 0 && (
                                          <Badge variant="secondary">
                                            Add-ons: ₹{String((reg.custom_data as Record<string, unknown>)._addons_amount)}
                                          </Badge>
                                        )}
                                        {Number((reg.custom_data as Record<string, unknown>)?._group_size) > 1 && (
                                          <Badge variant="secondary">
                                            Group: {String((reg.custom_data as Record<string, unknown>)._group_size)}
                                          </Badge>
                                        )}
                                      </div>
                                    )}

                                     {/* Ticket categories */}
                                    {Array.isArray((reg.custom_data as Record<string, unknown>)?._ticket_categories) && (
                                      <div className="text-xs text-muted-foreground">
                                        {((reg.custom_data as Record<string, unknown>)._ticket_categories as Array<{category_name: string; quantity: number; total: number; attendees?: Array<{name: string; email: string; mobile: string}>}>).map((tc, i) => (
                                          <div key={i} className="mb-1">
                                            <span className="mr-2">
                                              {tc.category_name} ×{tc.quantity} (₹{tc.total})
                                            </span>
                                            {/* Show attendee details from custom_data */}
                                            {tc.attendees && tc.attendees.length > 0 && (
                                              <details className="ml-2 mt-0.5">
                                                <summary className="cursor-pointer text-muted-foreground hover:text-foreground text-xs">
                                                  Attendees ({tc.attendees.length})
                                                </summary>
                                                <div className="mt-1 space-y-1 pl-2 border-l-2 border-muted">
                                                  {tc.attendees.map((att, j) => (
                                                    <div key={j} className="text-xs">
                                                      <span className="font-medium">{att.name}</span>
                                                      <span className="text-muted-foreground"> • {att.email}</span>
                                                      {att.mobile && <span className="text-muted-foreground"> • {att.mobile}</span>}
                                                    </div>
                                                  ))}
                                                </div>
                                              </details>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Custom form responses - filter out internal fields */}
                                    {Object.entries(reg.custom_data as Record<string, unknown>)
                                      .filter(([key]) => !key.startsWith('_'))
                                      .length > 0 && (
                                      <details className="text-xs">
                                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                          Custom Form Responses
                                        </summary>
                                        <div className="mt-1 p-2 bg-muted rounded-lg space-y-1">
                                          {Object.entries(reg.custom_data as Record<string, unknown>)
                                            .filter(([key]) => !key.startsWith('_'))
                                            .map(([key, value]) => (
                                              <div key={key} className="flex justify-between">
                                                <span className="font-medium">{key}:</span>
                                                <span className="text-muted-foreground">{String(value)}</span>
                                              </div>
                                            ))}
                                        </div>
                                      </details>
                                    )}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </TabsContent>
                    ))
                  )}
                </Tabs>
              </TabsContent>

              <TabsContent value="analytics">
                <EventAnalytics eventId={selectedEvent!} />
              </TabsContent>

              <TabsContent value="volunteers">
                <VolunteerManager 
                  eventId={selectedEvent!} 
                  eventTitle={selectedEventData.title}
                  organizerId={user.id} 
                />
              </TabsContent>

              <TabsContent value="upsells">
                <UpsellManager 
                  eventId={selectedEvent!} 
                  isPaidEvent={selectedEventData?.is_paid || false}
                />
              </TabsContent>
              <TabsContent value="clubs">
                <ClubMembershipManager 
                  eventId={selectedEvent!} 
                  organizerId={user.id} 
                />
              </TabsContent>

              {selectedEventData?.is_paid && (
                <TabsContent value="payments">
                  <PaymentReconciliation eventId={selectedEvent!} />
                </TabsContent>
              )}

              <TabsContent value="sheets">
                {isMobile ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Export registrations to CSV or sync with Google Sheets
                    </p>
                    <MobileExportSheet 
                      eventId={selectedEvent!} 
                      eventTitle={selectedEventData.title}
                      trigger={
                        <Button className="w-full gap-2">
                          <FileSpreadsheet className="w-4 h-4" />
                          Open Export Options
                        </Button>
                      }
                    />
                  </div>
                ) : (
                  <GoogleSheetsSync 
                    eventId={selectedEvent!} 
                    eventTitle={selectedEventData.title} 
                  />
                )}
              </TabsContent>

              <TabsContent value="email">
                <EventEmailComposer 
                  eventId={selectedEvent!}
                  eventTitle={selectedEventData.title}
                  registrationsCount={approvedCount}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="h-dvh flex bg-background overflow-hidden">
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      
      {/* Desktop Sidebar */}
      <OrganizerSidebar 
        selectedEventId={selectedEvent} 
        eventTitle={selectedEventData?.title}
        events={events || []}
        onEventSelect={setSelectedEvent}
        onBackToOverview={() => setSelectedEvent(null)}
      />

      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {selectedEvent && selectedEventData ? renderEventManagementMode() : renderOverviewMode()}
      </main>

      {/* Mobile Bottom Nav */}
      <OrganizerBottomNav 
        selectedEventId={selectedEvent || undefined} 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* QR Scanner Dialog */}
      <Dialog open={scannerOpen} onOpenChange={(open) => {
        setScannerOpen(open);
        if (!open) setQrInput("");
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanLine className="w-5 h-5" />
              Check-in Scanner
            </DialogTitle>
            <DialogDescription>
              Scan attendee QR codes to check them in
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="camera" className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="camera">Camera Scan</TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            </TabsList>
            
            <TabsContent value="camera" className="mt-4">
              {selectedEvent && (
                <QRScanner
                  eventId={selectedEvent}
                  onScan={async (qrCode) => {
                    await checkInMutation.mutateAsync(qrCode);
                  }}
                />
              )}
            </TabsContent>
            
            <TabsContent value="manual" className="mt-4">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    placeholder="Enter or paste QR code..."
                    className="flex-1 px-3 py-2 border rounded-lg bg-background text-sm"
                  />
                  <Button 
                    onClick={() => checkInMutation.mutate(qrInput)} 
                    disabled={!qrInput || checkInMutation.isPending}
                  >
                    {checkInMutation.isPending ? "..." : "Check In"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Paste the QR code text from the attendee's ticket
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {checkInStats && (
            <div className="flex items-center justify-center gap-4 pt-4 border-t mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{checkInStats.checkedIn}</p>
                <p className="text-xs text-muted-foreground">Checked In</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold">{checkInStats.total}</p>
                <p className="text-xs text-muted-foreground">Total Tickets</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizerDashboard;
