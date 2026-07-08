import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Mail, Send, Loader2, CheckCircle, AlertCircle, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface EventEmailComposerProps {
  eventId: string;
  eventTitle: string;
  registrationsCount: number;
}

export const EventEmailComposer = ({ eventId, eventTitle, registrationsCount }: EventEmailComposerProps) => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string; sent?: number; failed?: number } | null>(null);

  const handleSend = async () => {
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    if (!subject.trim() || !body.trim()) {
      toast.error('Please fill in both subject and message');
      return;
    }

    setShowConfirmDialog(false);
    setIsSending(true);
    setLastResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-event-email', {
        body: {
          eventId,
          subject: subject.trim(),
          body: body.trim(),
          senderId: user.id,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setLastResult({
          success: true,
          message: `Email sent successfully!`,
          sent: data.sent,
          failed: data.failed,
        });
        toast.success(`Email sent to ${data.sent} attendees`);
        // Clear form on success
        setSubject('');
        setBody('');
      } else {
        throw new Error(data?.error || 'Failed to send emails');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error sending event email:', error);
      setLastResult({
        success: false,
        message: errorMessage,
      });
      toast.error(`Failed: ${errorMessage}`);
    } finally {
      setIsSending(false);
    }
  };

  const isFormValid = subject.trim().length > 0 && body.trim().length > 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Attendees
          </CardTitle>
          <CardDescription>
            Send a custom email to all registered attendees for <strong>{eventTitle}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              This email will be sent to <strong className="text-foreground">{registrationsCount}</strong> registered attendee{registrationsCount !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-subject">Subject *</Label>
            <Input
              id="email-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Important update about the event"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">{subject.length}/100 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-body">Message *</Label>
            <Textarea
              id="email-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message here...&#10;&#10;You can use {{userName}} to personalize with the attendee's name.&#10;You can use {{eventName}} to insert the event name."
              rows={8}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Tip: Use <code className="px-1 py-0.5 bg-muted rounded">{"{{userName}}"}</code> and <code className="px-1 py-0.5 bg-muted rounded">{"{{eventName}}"}</code> for personalization
            </p>
          </div>

          <div className="bg-muted/50 border rounded-lg p-3 text-sm text-muted-foreground">
            <p>
              📱 A link to access tickets will be automatically included: <br />
              <span className="text-foreground">"You can access your ticket from the My Ticket page: https://univoid.tech/my-events"</span>
            </p>
          </div>

          <Button
            onClick={() => setShowConfirmDialog(true)}
            disabled={isSending || !isFormValid || registrationsCount === 0}
            className="w-full gap-2"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Email to {registrationsCount} Attendee{registrationsCount !== 1 ? 's' : ''}
              </>
            )}
          </Button>

          {lastResult && (
            <div
              className={`flex items-start gap-2 p-3 rounded-lg ${
                lastResult.success
                  ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                  : 'bg-destructive/10 text-destructive'
              }`}
            >
              {lastResult.success ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <div className="text-sm">
                <p>{lastResult.message}</p>
                {lastResult.sent !== undefined && (
                  <p className="text-xs mt-1 opacity-80">
                    Sent: {lastResult.sent}, Failed: {lastResult.failed || 0}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Email Send</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to send this email to <strong>{registrationsCount}</strong> attendee{registrationsCount !== 1 ? 's' : ''}?
              </p>
              <p className="text-sm">
                <strong>Subject:</strong> {subject}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend} disabled={isSending}>
              {isSending ? 'Sending...' : 'Yes, Send Email'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
