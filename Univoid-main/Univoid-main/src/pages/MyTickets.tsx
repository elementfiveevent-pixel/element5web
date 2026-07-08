import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUserTickets, type TicketWithDetails } from "@/services/ticketService";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeRegistrations } from "@/hooks/useRealtimeRegistrations";
import AuthModal from "@/components/auth/AuthModal";
import { 
  Ticket, Calendar, MapPin, CheckCircle, XCircle, 
  AlertTriangle, Copy, Shield, Clock, Hourglass, Bell, RefreshCw
} from "lucide-react";
import { format, isPast } from "date-fns";
import QRCode from "qrcode";
import { useToast } from "@/hooks/use-toast";

interface PendingRegistration {
  id: string;
  event_id: string;
  payment_status: string;
  created_at: string;
  event: {
    id: string;
    title: string;
    start_date: string;
    venue_name: string | null;
    flyer_url: string | null;
  };
}

const MyTickets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [qrImages, setQrImages] = useState<Record<string, string>>({});

  // Real-time updates for registrations and tickets
  useRealtimeRegistrations({ userId: user?.id, enabled: !!user });

  // Fetch approved tickets
  const { data: tickets, isLoading, error, refetch: refetchTickets } = useQuery({
    queryKey: ["my-tickets", user?.id],
    queryFn: () => fetchUserTickets(user!.id),
    enabled: !!user,
    staleTime: 10000, // Reduced for faster updates
  });

  // Fetch pending and rejected registrations
  const { data: pendingRegistrations, refetch: refetchPending } = useQuery({
    queryKey: ["my-pending-registrations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select(`
          id, event_id, payment_status, created_at,
          event:events(id, title, start_date, venue_name, flyer_url)
        `)
        .eq("user_id", user!.id)
        .in("payment_status", ["pending", "rejected"])
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as unknown as PendingRegistration[];
    },
    enabled: !!user,
    staleTime: 10000,
  });

  // Generate QR codes on-demand (never store actual tokens)
  useEffect(() => {
    if (tickets) {
      tickets.forEach(async (ticket) => {
        if (!qrImages[ticket.id] && !ticket.is_used) {
          try {
            // QR contains opaque token - URL format for scanning
            const qrData = ticket.qr_code;
            const url = await QRCode.toDataURL(qrData, { 
              width: 200, 
              margin: 2,
              errorCorrectionLevel: 'H'
            });
            setQrImages(prev => ({ ...prev, [ticket.id]: url }));
          } catch (err) {
            console.error('QR generation failed:', err);
          }
        }
      });
    }
  }, [tickets]);

  // Categorize tickets
  const { upcomingTickets, usedTickets, expiredTickets } = useMemo(() => {
    if (!tickets) return { upcomingTickets: [], usedTickets: [], expiredTickets: [] };
    
    return {
      upcomingTickets: tickets.filter(t => !t.is_used && !isPast(new Date(t.event.start_date))),
      usedTickets: tickets.filter(t => t.is_used),
      expiredTickets: tickets.filter(t => !t.is_used && isPast(new Date(t.event.start_date))),
    };
  }, [tickets]);

  const copyTicketId = (ticketId: string) => {
    navigator.clipboard.writeText(ticketId);
    toast({ title: "Ticket ID copied", description: "Use for manual verification if needed" });
  };

  const getStatusBadge = (ticket: TicketWithDetails) => {
    if (ticket.abuse_flag) {
      return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Flagged</Badge>;
    }
    if (ticket.is_used) {
      return <Badge variant="secondary"><CheckCircle className="w-3 h-3 mr-1" /> Used</Badge>;
    }
    if (isPast(new Date(ticket.event.start_date))) {
      return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Expired</Badge>;
    }
    return <Badge className="bg-green-600"><Shield className="w-3 h-3 mr-1" /> Valid</Badge>;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Login Required</h1>
          <p className="text-muted-foreground mb-6">Sign in to view your event tickets</p>
          <Button onClick={() => setShowAuthModal(true)}>Login</Button>
        </main>
      </div>
    );
  }

  const TicketCard = ({ ticket }: { ticket: TicketWithDetails }) => {
    const isExpired = isPast(new Date(ticket.event.start_date));
    const isValid = !ticket.is_used && !isExpired && !ticket.abuse_flag;

    return (
      <Card className={`overflow-hidden transition-all ${!isValid ? "opacity-70" : "hover:shadow-lg"}`}>
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            {/* Event Info */}
            <div className="flex-1 p-4 sm:p-6 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <Link to={`/events/${ticket.event.id}`}>
                    <h3 className="font-display font-bold text-lg hover:text-primary transition-colors truncate">
                      {ticket.event.title}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    {format(new Date(ticket.event.start_date), "EEE, MMM d 'at' h:mm a")}
                  </div>
                  {ticket.event.venue_name && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{ticket.event.venue_name}</span>
                    </div>
                  )}
                </div>
                {getStatusBadge(ticket)}
              </div>

              {/* Ticket ID for manual verification */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Ticket ID (for manual entry)</p>
                    <p className="font-mono text-xs truncate max-w-[180px]">{ticket.id}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyTicketId(ticket.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Used info */}
              {ticket.is_used && ticket.used_at && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  <CheckCircle className="w-3 h-3" />
                  Checked in {format(new Date(ticket.used_at), "MMM d 'at' h:mm a")}
                  {ticket.verification_method && (
                    <Badge variant="outline" className="text-[10px] ml-auto">
                      via {ticket.verification_method}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className={`border-t sm:border-t-0 sm:border-l border-dashed p-4 flex flex-col items-center justify-center min-w-[160px] ${!isValid ? 'bg-muted/50' : 'bg-muted/30'}`}>
              {isValid ? (
                <>
                  {qrImages[ticket.id] ? (
                    <img 
                      src={qrImages[ticket.id]} 
                      alt="Ticket QR" 
                      className="w-32 h-32 rounded-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-muted rounded-lg animate-pulse" />
                  )}
                  <p className="text-xs text-muted-foreground mt-2 text-center flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Show at entry
                  </p>
                </>
              ) : (
                <div className="w-32 h-32 rounded-lg bg-muted flex items-center justify-center">
                  {ticket.is_used ? (
                    <CheckCircle className="w-12 h-12 text-muted-foreground" />
                  ) : (
                    <XCircle className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <main className="flex-1 container mx-auto px-4 py-6 pb-24 md:pb-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold flex items-center gap-3">
            <Ticket className="w-8 h-8 text-primary" />
            My Tickets
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Shield className="w-4 h-4" />
            Secure event tickets with anti-fraud protection
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <Card key={i} className="h-40 animate-pulse bg-muted" />
            ))}
          </div>
        ) : error ? (
          <Card className="text-center py-12">
            <CardContent>
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Error Loading Tickets</h3>
              <p className="text-muted-foreground">Please try refreshing the page</p>
            </CardContent>
          </Card>
        ) : tickets?.length === 0 ? (
          <Card className="text-center py-20">
            <CardContent>
              <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Tickets Yet</h3>
              <p className="text-muted-foreground mb-6">Register for events to get your tickets here</p>
              <Link to="/events">
                <Button>Browse Events</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="upcoming">
            <TabsList className="mb-6 flex-wrap">
              <TabsTrigger value="upcoming" className="gap-2">
                Upcoming 
                {upcomingTickets.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{upcomingTickets.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-2">
                Pending
                {(pendingRegistrations?.length || 0) > 0 && (
                  <Badge variant="secondary" className="ml-1">{pendingRegistrations?.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="used">
                Used
                {usedTickets.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{usedTickets.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="expired">
                Expired
                {expiredTickets.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{expiredTickets.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingTickets.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <p className="text-muted-foreground">No upcoming tickets</p>
                    <Link to="/events" className="inline-block mt-4">
                      <Button variant="outline" size="sm">Find Events</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                upcomingTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {(!pendingRegistrations || pendingRegistrations.length === 0) ? (
                <p className="text-center py-8 text-muted-foreground">No pending registrations</p>
              ) : (
                pendingRegistrations.map(reg => (
                  <Card 
                    key={reg.id} 
                    className={`overflow-hidden border-2 ${
                      reg.payment_status === 'rejected' 
                        ? 'border-destructive/30 bg-destructive/5' 
                        : 'border-dashed border-primary/30'
                    }`}
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row">
                        {/* Event Info */}
                        <div className="flex-1 p-4 sm:p-6 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <Link to={`/events/${reg.event.id}`}>
                                <h3 className="font-display font-bold text-lg hover:text-primary transition-colors truncate">
                                  {reg.event.title}
                                </h3>
                              </Link>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Calendar className="w-4 h-4 flex-shrink-0" />
                                {format(new Date(reg.event.start_date), "EEE, MMM d 'at' h:mm a")}
                              </div>
                              {reg.event.venue_name && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <MapPin className="w-4 h-4 flex-shrink-0" />
                                  <span className="truncate">{reg.event.venue_name}</span>
                                </div>
                              )}
                            </div>
                            {reg.payment_status === 'rejected' ? (
                              <Badge variant="destructive" className="gap-1">
                                <XCircle className="w-3 h-3" /> Rejected
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                                <Hourglass className="w-3 h-3 mr-1" /> Pending
                              </Badge>
                            )}
                          </div>

                          {/* Status-specific message */}
                          {reg.payment_status === 'rejected' ? (
                            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mt-4">
                              <div className="flex items-start gap-3">
                                <XCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                                <div>
                                  <h4 className="font-semibold text-foreground">Registration Rejected</h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Your registration was not approved. You can try registering again.
                                  </p>
                                  <Link to={`/events/${reg.event.id}`}>
                                    <Button variant="outline" size="sm" className="mt-3 gap-2">
                                      <RefreshCw className="w-4 h-4" />
                                      Try Again
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
                              <div className="flex items-start gap-3">
                                <Hourglass className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                                <div>
                                  <h4 className="font-semibold text-foreground">⏳ Waiting for Confirmation</h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Your registration has been received. You will be notified once approved.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          <p className="text-xs text-muted-foreground">
                            Submitted on {format(new Date(reg.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>

                        {/* Placeholder for QR */}
                        <div className="border-t sm:border-t-0 sm:border-l border-dashed p-4 flex flex-col items-center justify-center min-w-[160px] bg-muted/30">
                          <div className="w-32 h-32 rounded-lg bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                            {reg.payment_status === 'rejected' ? (
                              <XCircle className="w-12 h-12 text-destructive/50" />
                            ) : (
                              <Hourglass className="w-12 h-12 text-muted-foreground/50" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 text-center">
                            {reg.payment_status === 'rejected' ? 'Registration failed' : 'QR will appear after approval'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="used" className="space-y-4">
              {usedTickets.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No used tickets</p>
              ) : (
                usedTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)
              )}
            </TabsContent>

            <TabsContent value="expired" className="space-y-4">
              {expiredTickets.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No expired tickets</p>
              ) : (
                expiredTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default MyTickets;