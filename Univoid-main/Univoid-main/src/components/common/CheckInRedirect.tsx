import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const CheckInRedirect = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "invalid" | "found">("loading");
  const [ticketInfo, setTicketInfo] = useState<{
    eventId: string;
    eventTitle: string;
    ticketId: string;
  } | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setStatus("invalid");
        return;
      }

      try {
        // Look up ticket by QR code token
        const { data: ticket, error } = await supabase
          .from("event_tickets")
          .select(`
            id,
            event_id,
            qr_code,
            is_used,
            events:event_id (
              title
            )
          `)
          .eq("qr_code", token)
          .single();

        if (error || !ticket) {
          setStatus("invalid");
          return;
        }

        const eventData = ticket.events as { title: string } | null;
        
        setTicketInfo({
          eventId: ticket.event_id,
          eventTitle: eventData?.title || "Event",
          ticketId: ticket.id,
        });
        setStatus("found");
      } catch (err) {
        console.error("Token validation error:", err);
        setStatus("invalid");
      }
    };

    validateToken();
  }, [token]);

  const handleGoToCheckIn = () => {
    if (ticketInfo) {
      navigate(`/organizer/check-in/${ticketInfo.eventId}?ticket=${ticketInfo.ticketId}`);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Validating ticket...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <CardTitle>Invalid QR Code</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              This QR code is invalid or has expired. Please check with the event organizer.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate("/my-events")} variant="default">
                View My Tickets
              </Button>
              <Button onClick={() => navigate("/events")} variant="outline">
                Browse Events
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <CardTitle>Ticket Found</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div>
            <p className="font-medium text-lg">{ticketInfo?.eventTitle}</p>
            <p className="text-sm text-muted-foreground">
              Ticket ID: {ticketInfo?.ticketId.slice(0, 8)}...
            </p>
          </div>
          <p className="text-muted-foreground">
            This ticket is valid. Organizers can proceed to check-in.
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={handleGoToCheckIn} variant="default">
              Go to Check-In Page
            </Button>
            <Button onClick={() => navigate("/events")} variant="outline">
              Back to Events
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckInRedirect;
