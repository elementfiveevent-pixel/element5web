import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Ticket, Send, Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TicketToSend {
  ticketId: string;
  registrationId: string;
  eventId: string;
  userId: string;
  qrCode: string;
  eventTitle: string;
  userName: string;
}

export const AdminResendTickets = () => {
  const [isSending, setIsSending] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [progress, setProgress] = useState({ sent: 0, failed: 0, total: 0 });
  const [lastResult, setLastResult] = useState<{ success: boolean; sent: number; failed: number } | null>(null);

  // Fetch all approved tickets that need to be sent
  const { data: ticketStats, isLoading, refetch } = useQuery({
    queryKey: ['all-approved-tickets'],
    queryFn: async () => {
      // Get all tickets with QR codes
      const { data: tickets, error } = await supabase
        .from('event_tickets')
        .select(`
          id,
          registration_id,
          event_id,
          user_id,
          qr_code,
          events!inner(title)
        `)
        .not('qr_code', 'is', null);

      if (error) {
        console.error('Error fetching tickets:', error);
        throw error;
      }

      console.log('Fetched tickets:', tickets?.length || 0);

      // Fetch user names separately to avoid join issues
      const ticketsWithNames = await Promise.all(
        (tickets || []).map(async (ticket: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', ticket.user_id)
            .maybeSingle();
          
          return {
            ...ticket,
            userName: profile?.full_name || 'Unknown User',
            eventTitle: ticket.events?.title || 'Unknown Event'
          };
        })
      );

      return {
        total: ticketsWithNames.length,
        tickets: ticketsWithNames
      };
    },
  });

  const handleResendAll = async () => {
    setShowConfirmDialog(false);
    setIsSending(true);
    setLastResult(null);
    
    const tickets = ticketStats?.tickets || [];
    setProgress({ sent: 0, failed: 0, total: tickets.length });

    let sent = 0;
    let failed = 0;

    // Process in batches to avoid overwhelming the server
    const batchSize = 5;
    for (let i = 0; i < tickets.length; i += batchSize) {
      const batch = tickets.slice(i, i + batchSize);
      
      const promises = batch.map(async (ticket: any) => {
        try {
          const { error } = await supabase.functions.invoke('send-ticket-email', {
            body: {
              ticketId: ticket.id,
              registrationId: ticket.registration_id,
              eventId: ticket.event_id,
              userId: ticket.user_id,
              qrCode: ticket.qr_code,
            },
          });

          if (error) throw error;
          return { success: true };
        } catch (err) {
          console.error(`Failed to send ticket ${ticket.id}:`, err);
          return { success: false };
        }
      });

      const results = await Promise.all(promises);
      
      results.forEach(result => {
        if (result.success) {
          sent++;
        } else {
          failed++;
        }
      });

      setProgress({ sent, failed, total: tickets.length });

      // Small delay between batches to prevent rate limiting
      if (i + batchSize < tickets.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setLastResult({ success: failed === 0, sent, failed });
    setIsSending(false);
    
    if (sent > 0) {
      toast.success(`Sent ${sent} ticket emails successfully`);
    }
    if (failed > 0) {
      toast.error(`${failed} emails failed to send`);
    }
  };

  const progressPercent = progress.total > 0 
    ? Math.round(((progress.sent + progress.failed) / progress.total) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="w-5 h-5" />
          Resend All Ticket Emails
        </CardTitle>
        <CardDescription>
          Send QR ticket emails to all registered users for their respective events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Total Tickets to Send</p>
            <p className="text-2xl font-bold">
              {isLoading ? '...' : ticketStats?.total || 0}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Progress during sending */}
        {isSending && (
          <div className="space-y-3 p-4 rounded-lg border bg-primary/5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending emails...
              </span>
              <span>{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <div className="flex gap-4 text-sm">
              <Badge variant="default" className="bg-green-600">
                {progress.sent} sent
              </Badge>
              {progress.failed > 0 && (
                <Badge variant="destructive">
                  {progress.failed} failed
                </Badge>
              )}
              <span className="text-muted-foreground">
                of {progress.total} total
              </span>
            </div>
          </div>
        )}

        {/* Last Result */}
        {lastResult && !isSending && (
          <div className={`p-4 rounded-lg border ${
            lastResult.success ? 'bg-green-50 border-green-200 dark:bg-green-900/20' : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20'
          }`}>
            <div className="flex items-center gap-2">
              {lastResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              )}
              <span className="font-medium">
                {lastResult.success ? 'All emails sent!' : 'Completed with some failures'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {lastResult.sent} sent successfully, {lastResult.failed} failed
            </p>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={() => setShowConfirmDialog(true)}
          disabled={isSending || isLoading || !ticketStats?.total}
          className="w-full"
          size="lg"
        >
          {isSending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Resend All Ticket Emails
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          This will send the UniVoid branded ticket email with QR code to each registered user
        </p>

        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Ticket Email Resend</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  You are about to send <strong>{ticketStats?.total || 0}</strong> ticket emails 
                  to all registered users.
                </p>
                <p>
                  Each user will receive their event QR ticket using the official UniVoid template.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleResendAll}>
                <Send className="w-4 h-4 mr-2" />
                Send All Tickets
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
