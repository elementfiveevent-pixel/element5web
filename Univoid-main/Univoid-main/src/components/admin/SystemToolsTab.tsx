import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Bell, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import CollegeDataIngestion from './CollegeDataIngestion';

interface SystemToolsTabProps {
  userId?: string;
}

export const SystemToolsTab = ({ userId }: SystemToolsTabProps) => {
  const [isSending, setIsSending] = useState(false);
  const [testTitle, setTestTitle] = useState('🔔 Test Notification');
  const [testMessage, setTestMessage] = useState('This is a test push notification from UniVoid admin.');
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);

  const sendTestPushNotification = async () => {
    if (!userId) {
      toast.error('User not authenticated');
      return;
    }

    setIsSending(true);
    setLastResult(null);

    try {
      // First, create an in-app notification for the current user
      // Link to dashboard instead of admin for safety (non-admins shouldn't be directed to /admin)
      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: userId,
        title: testTitle,
        message: testMessage,
        type: 'system',
        link: '/dashboard',
        is_read: false,
      });

      if (notifError) {
        throw new Error(`Failed to create notification: ${notifError.message}`);
      }

      // Try to send web push via edge function
      const { data, error } = await supabase.functions.invoke('send-web-push', {
        body: {
          user_ids: [userId],
          notification: {
            title: testTitle,
            body: testMessage,
            icon: '/favicon.png',
            link: '/dashboard',
            tag: 'test-notification',
          },
        },
      });

      if (error) {
        console.warn('Web push failed (may not be configured):', error);
        setLastResult({
          success: true,
          message: `In-app notification created. Web push: ${error.message || 'Not configured'}`,
        });
      } else {
        setLastResult({
          success: true,
          message: `Notification sent! In-app: ✓, Web push: ${data?.sent || 0} delivered`,
        });
      }

      toast.success('Test notification sent!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error sending test notification:', error);
      setLastResult({
        success: false,
        message: errorMessage,
      });
      toast.error(`Failed: ${errorMessage}`);
    } finally {
      setIsSending(false);
    }
  };

  const sendBroadcastNotification = async () => {
    setIsSending(true);
    setLastResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-personalized-notification', {
        body: {
          type: 'system',
          action: 'created',
          data: {
            id: 'test-broadcast',
            title: testTitle,
            description: testMessage,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      setLastResult({
        success: true,
        message: `Broadcast sent to ${data?.notificationsSent || 0} users`,
      });
      toast.success('Broadcast notification sent!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error broadcasting:', error);
      setLastResult({
        success: false,
        message: errorMessage,
      });
      toast.error(`Failed: ${errorMessage}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Push Notification Tester
          </CardTitle>
          <CardDescription>
            Test the notification system by sending notifications to yourself or all users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-title">Notification Title</Label>
            <Input
              id="test-title"
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              placeholder="Enter notification title..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-message">Notification Message</Label>
            <Textarea
              id="test-message"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter notification message..."
              rows={3}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={sendTestPushNotification}
              disabled={isSending || !testTitle.trim()}
              className="gap-2"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send to Myself
            </Button>

            <Button
              variant="secondary"
              onClick={sendBroadcastNotification}
              disabled={isSending || !testTitle.trim()}
              className="gap-2"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
              Broadcast to All Users
            </Button>
          </div>

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
              <p className="text-sm">{lastResult.message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Push Notification Status</CardTitle>
          <CardDescription>
            Current configuration and subscription status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">VAPID Keys:</span>
              <span className="font-medium">
                {import.meta.env.VITE_VAPID_PUBLIC_KEY ? '✓ Configured' : '✗ Not set'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Browser Support:</span>
              <span className="font-medium">
                {'Notification' in window ? '✓ Supported' : '✗ Not supported'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Permission:</span>
              <span className="font-medium">
                {'Notification' in window ? Notification.permission : 'N/A'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* College Data Ingestion */}
      <CollegeDataIngestion />
    </div>
  );
};
