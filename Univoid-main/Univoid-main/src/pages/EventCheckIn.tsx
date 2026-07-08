import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AuthModal from "@/components/auth/AuthModal";
import QRScanner from "@/components/events/QRScanner";
import { 
  secureCheckIn, 
  fetchCheckInStats, 
  fetchRecentCheckIns,
  lookupTicketById,
  type SecureCheckInResult 
} from "@/services/ticketService";
import { isAcceptedVolunteer, ROLE_LABELS, type VolunteerInviteRole } from "@/services/volunteerInviteService";
import { 
  ScanLine, ArrowLeft, CheckCircle, XCircle, 
  Users, TicketCheck, Clock, AlertTriangle, User,
  Shield, Search, Fingerprint, UserCheck
} from "lucide-react";
import { format } from "date-fns";
import type { Event } from "@/services/eventsService";

const EventCheckIn = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [qrInput, setQrInput] = useState("");
  const [manualTicketId, setManualTicketId] = useState("");
  const [lastCheckIn, setLastCheckIn] = useState<SecureCheckInResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Fetch event details
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId!)
        .single();
      if (error) throw error;
      return data as Event;
    },
    enabled: !!eventId && !!user,
  });

  // Check if user is the organizer
  const isOrganizer = user?.id === event?.organizer_id;

  // Check if user is an accepted volunteer for this event
  const { data: volunteerStatus } = useQuery({
    queryKey: ["volunteer-status", eventId, user?.id],
    queryFn: () => isAcceptedVolunteer(eventId!, user!.id),
    enabled: !!eventId && !!user && !isOrganizer,
  });

  const isVolunteer = volunteerStatus?.isVolunteer || false;
  const volunteerRole = volunteerStatus?.role;
  const canAccessCheckIn = isOrganizer || (isVolunteer && (volunteerRole === 'all' || volunteerRole === 'qr_checkin' || volunteerRole === 'entry'));

  // Fetch check-in stats (available to organizer and volunteers)
  const { data: checkInStats, refetch: refetchStats } = useQuery({
    queryKey: ["event-checkin-stats", eventId],
    queryFn: () => fetchCheckInStats(eventId!),
    enabled: !!eventId && !!user && canAccessCheckIn,
    refetchInterval: 5000,
  });

  // Fetch recent check-ins (available to organizer and volunteers)
  const { data: recentCheckIns } = useQuery({
    queryKey: ["recent-checkins", eventId],
    queryFn: () => fetchRecentCheckIns(eventId!, 10),
    enabled: !!eventId && !!user && canAccessCheckIn,
    refetchInterval: 5000,
  });

  // Secure check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async ({ qrCode, method }: { qrCode: string; method: 'qr' | 'manual' }) => {
      if (!user?.id || !eventId) throw new Error("Missing required data");
      
      console.log("=== SECURE CHECK-IN ATTEMPT ===");
      console.log("Method:", method);
      console.log("Event ID:", eventId);
      
      return secureCheckIn(qrCode, eventId, user.id, method);
    },
    onSuccess: (result) => {
      setLastCheckIn(result);
      setIsScanning(false);
      
      if (result.success) {
        toast({ 
          title: `✅ ${result.attendee_name} checked in!`,
          description: "Entry verified successfully"
        });
      } else if (result.error === 'ALREADY_USED') {
        toast({ 
          title: "⚠️ Already Checked In", 
          description: `${result.attendee_name} was already verified`,
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "❌ Check-in Failed", 
          description: result.message || "Invalid ticket",
          variant: "destructive" 
        });
      }
      
      setQrInput("");
      setManualTicketId("");
      refetchStats();
      queryClient.invalidateQueries({ queryKey: ["recent-checkins", eventId] });
      
      // Clear result after 5 seconds
      setTimeout(() => setLastCheckIn(null), 5000);
    },
    onError: (error: Error) => {
      setLastCheckIn(null);
      setIsScanning(false);
      toast({ 
        title: "❌ Check-in Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Manual ticket lookup
  const lookupMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      if (!eventId) throw new Error("No event");
      return lookupTicketById(ticketId, eventId);
    },
    onSuccess: (ticket) => {
      if (!ticket) {
        toast({ title: "Ticket not found", variant: "destructive" });
        return;
      }
      
      if (ticket.is_used) {
        toast({ 
          title: "Already Used", 
          description: `${ticket.attendee?.full_name || 'Attendee'} already checked in`,
          variant: "destructive"
        });
      } else {
        // Perform check-in with the QR code
        checkInMutation.mutate({ qrCode: ticket.qr_code, method: 'manual' });
      }
    },
    onError: () => {
      toast({ title: "Lookup failed", variant: "destructive" });
    }
  });

  const handleQRScan = async (qrCode: string) => {
    // Prevent double scans - scanner handles debouncing, but double-check here
    if (isScanning || checkInMutation.isPending) {
      console.log("Scan blocked - already processing");
      return;
    }
    setIsScanning(true);
    checkInMutation.mutate({ qrCode, method: 'qr' });
  };

  if (!user) {
    return (
      <main className="flex-1 container mx-auto px-4 py-20 text-center">
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        <h1 className="text-2xl font-bold mb-4">Login Required</h1>
        <Button onClick={() => setShowAuthModal(true)}>Login</Button>
      </main>
    );
  }

  if (eventLoading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading event...</div>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="flex-1 container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
        <Link to="/organizer/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </main>
    );
  }

  if (!canAccessCheckIn) {
    return (
      <main className="flex-1 container mx-auto px-4 py-20 text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-6">Only the event organizer or volunteers can access check-in</p>
        <Link to="/events">
          <Button>View Events</Button>
        </Link>
      </main>
    );
  }

  return (
    <>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <main className="flex-1 container mx-auto px-4 py-6 pb-24 md:pb-8 max-w-2xl">
        {/* Back button */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 -ml-2"
          onClick={() => navigate(isOrganizer ? "/organizer/dashboard" : "/dashboard")}
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        {/* Event Info */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  {event.title}
                </CardTitle>
                <CardDescription>
                  {format(new Date(event.start_date), "EEEE, MMM d 'at' h:mm a")}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {isVolunteer && volunteerRole && (
                  <Badge variant="outline" className="gap-1">
                    <UserCheck className="w-3 h-3" />
                    {ROLE_LABELS[volunteerRole]}
                  </Badge>
                )}
                <Badge variant={event.status === "published" ? "default" : "secondary"}>
                  {event.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 rounded-lg bg-green-500/10">
                <TicketCheck className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-green-600">{checkInStats?.checkedIn || 0}</p>
                <p className="text-xs text-muted-foreground">Checked In</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-blue-500/10">
                <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-blue-600">{checkInStats?.total || 0}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-orange-500/10">
                <Clock className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-orange-600">{checkInStats?.remaining || 0}</p>
                <p className="text-xs text-muted-foreground">Remaining</p>
              </div>
            </div>

            {/* Abuse warning */}
            {checkInStats?.abuseFlags && checkInStats.abuseFlags > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 text-destructive text-sm mb-4">
                <AlertTriangle className="w-4 h-4" />
                {checkInStats.abuseFlags} ticket(s) flagged for suspicious activity
              </div>
            )}

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Check-in Progress</span>
                <span className="font-medium">{checkInStats?.percentage || 0}%</span>
              </div>
              <Progress value={checkInStats?.percentage || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Last Check-in Result */}
        {lastCheckIn && (
          <Card className={`mb-6 border-2 ${lastCheckIn.success ? 'border-green-500 bg-green-500/5' : 'border-orange-500 bg-orange-500/5'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {lastCheckIn.success ? (
                  <CheckCircle className="w-12 h-12 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-12 h-12 text-orange-500 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-bold text-lg">{lastCheckIn.attendee_name || 'Unknown'}</p>
                  <p className={`text-sm ${lastCheckIn.success ? 'text-green-600' : 'text-orange-600'}`}>
                    {lastCheckIn.success 
                      ? 'Successfully verified & checked in!' 
                      : lastCheckIn.message || 'Check-in failed'}
                  </p>
                </div>
                <Fingerprint className="w-6 h-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scanner */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ScanLine className="w-5 h-5" />
              Secure Check-in
            </CardTitle>
            <CardDescription className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Anti-fraud protection enabled • One-time use only
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="camera">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="camera">QR Scanner</TabsTrigger>
                <TabsTrigger value="manual">Manual Verify</TabsTrigger>
              </TabsList>

              <TabsContent value="camera">
                <QRScanner
                  eventId={eventId!}
                  onScan={handleQRScan}
                />
                {checkInMutation.isPending && (
                  <div className="mt-4 text-center text-sm text-muted-foreground animate-pulse">
                    Verifying ticket...
                  </div>
                )}
              </TabsContent>

              <TabsContent value="manual" className="space-y-4">
                {/* QR Code text input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">QR Code Text</label>
                  <div className="flex gap-2">
                    <Input
                      value={qrInput}
                      onChange={(e) => setQrInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && qrInput && checkInMutation.mutate({ qrCode: qrInput, method: 'manual' })}
                      placeholder="Paste QR code content..."
                    />
                    <Button
                      onClick={() => checkInMutation.mutate({ qrCode: qrInput, method: 'manual' })}
                      disabled={!qrInput || checkInMutation.isPending}
                    >
                      Verify
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                {/* Ticket ID lookup */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ticket ID Lookup</label>
                  <div className="flex gap-2">
                    <Input
                      value={manualTicketId}
                      onChange={(e) => setManualTicketId(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && manualTicketId && lookupMutation.mutate(manualTicketId)}
                      placeholder="Enter ticket ID..."
                    />
                    <Button
                      variant="outline"
                      onClick={() => lookupMutation.mutate(manualTicketId)}
                      disabled={!manualTicketId || lookupMutation.isPending}
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use ticket ID from attendee's ticket page for manual verification
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Recent Check-ins */}
        {recentCheckIns && recentCheckIns.length > 0 && (
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Recent Check-ins
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {recentCheckIns.map((checkin) => (
                  <div key={checkin.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={checkin.profile?.profile_photo_url || ""} />
                      <AvatarFallback>
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {checkin.profile?.full_name || "Unknown"}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] py-0">
                          {checkin.verification_method || 'qr'}
                        </Badge>
                        {checkin.abuse_flag && (
                          <Badge variant="destructive" className="text-[10px] py-0">
                            flagged
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {checkin.used_at ? format(new Date(checkin.used_at), "h:mm a") : ""}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
};

export default EventCheckIn;
