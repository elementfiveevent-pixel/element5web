import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Mail, Send, Loader2, CheckCircle, AlertCircle, Users, History, UserCheck, ExternalLink, Plus, X, Link } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface EmailButton {
  label: string;
  url: string;
}

type AudienceType = 'all' | 'registered' | 'external';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AdminBroadcastEmail = () => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [audienceType, setAudienceType] = useState<AudienceType>('all');
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string; sent?: number; failed?: number } | null>(null);
  
  // External emails state
  const [externalEmailsText, setExternalEmailsText] = useState('');
  const [singleEmail, setSingleEmail] = useState('');
  
  // Custom buttons state
  const [buttons, setButtons] = useState<EmailButton[]>([]);

  // Parse and validate external emails
  const parsedExternalEmails = useMemo(() => {
    if (!externalEmailsText.trim()) return [];
    
    // Split by comma, newline, semicolon, or space
    const emails = externalEmailsText
      .split(/[,\n;\s]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e.length > 0);
    
    // Remove duplicates and validate
    const uniqueEmails = [...new Set(emails)];
    return uniqueEmails.map(email => ({
      email,
      valid: EMAIL_REGEX.test(email)
    }));
  }, [externalEmailsText]);

  const validExternalEmails = parsedExternalEmails.filter(e => e.valid).map(e => e.email);
  const invalidExternalEmails = parsedExternalEmails.filter(e => !e.valid);

  // Add single email to bulk list
  const handleAddSingleEmail = () => {
    if (!singleEmail.trim()) return;
    if (!EMAIL_REGEX.test(singleEmail.trim())) {
      toast.error('Invalid email format');
      return;
    }
    const newEmail = singleEmail.trim().toLowerCase();
    if (validExternalEmails.includes(newEmail)) {
      toast.error('Email already added');
      return;
    }
    setExternalEmailsText(prev => prev ? `${prev}\n${newEmail}` : newEmail);
    setSingleEmail('');
  };

  // Button management
  const addButton = () => {
    if (buttons.length >= 4) {
      toast.error('Maximum 4 buttons allowed');
      return;
    }
    setButtons([...buttons, { label: '', url: '' }]);
  };

  const updateButton = (index: number, field: 'label' | 'url', value: string) => {
    const updated = [...buttons];
    updated[index][field] = value;
    setButtons(updated);
  };

  const removeButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  // Fetch user counts based on registration status
  const { data: userCounts } = useQuery({
    queryKey: ['user-counts-by-registration'],
    queryFn: async () => {
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_disabled', false);
      
      if (profilesError) throw profilesError;
      
      const { data: registeredUsers, error: regError } = await supabase
        .from('event_registrations')
        .select('user_id')
        .not('user_id', 'is', null);
      
      if (regError) throw regError;
      
      const registeredUserIds = new Set(registeredUsers?.map(r => r.user_id) || []);
      const totalUsers = allProfiles?.length || 0;
      const registeredCount = registeredUserIds.size;
      
      return {
        total: totalUsers,
        registered: registeredCount,
      };
    },
  });

  // Fetch email logs
  const { data: emailLogs, refetch: refetchLogs } = useQuery({
    queryKey: ['admin-email-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .eq('sender_type', 'admin')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const getAudienceCount = () => {
    if (audienceType === 'external') return validExternalEmails.length;
    if (!userCounts) return '...';
    switch (audienceType) {
      case 'all': return userCounts.total;
      case 'registered': return userCounts.registered;
    }
  };

  const getAudienceLabel = () => {
    switch (audienceType) {
      case 'all': return 'All Platform Users';
      case 'registered': return 'All Registered Users (anyone who registered for any event)';
      case 'external': return `External Emails (${validExternalEmails.length} addresses)`;
    }
  };

  const handleSend = async () => {
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in subject and message');
      return;
    }

    if (audienceType === 'external' && validExternalEmails.length === 0) {
      toast.error('Please add at least one valid email address');
      return;
    }

    setShowConfirmDialog(false);
    setIsSending(true);
    setLastResult(null);

    try {
      // Filter out empty buttons
      const validButtons = buttons.filter(b => b.label.trim() && b.url.trim());
      
      const { data, error } = await supabase.functions.invoke('send-broadcast-email', {
        body: {
          subject: subject.trim(),
          message: message.trim(),
          buttons: validButtons.length > 0 ? validButtons : undefined,
          audienceType,
          externalEmails: audienceType === 'external' ? validExternalEmails : undefined,
          adminKey: 'UNIVOID_BROADCAST_2025',
          senderId: user.id,
        },
      });

      if (error) throw error;

      if (data?.success || data?.sent > 0) {
        setLastResult({
          success: true,
          message: `Broadcast complete!`,
          sent: data.sent,
          failed: data.failed,
        });
        toast.success(`Email sent to ${data.sent} recipients`);
        // Clear form on success
        setSubject('');
        setMessage('');
        setButtons([]);
        if (audienceType === 'external') {
          setExternalEmailsText('');
        }
        // Refresh logs
        refetchLogs();
      } else {
        throw new Error(data?.error || 'Failed to send broadcast');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error sending broadcast:', error);
      setLastResult({
        success: false,
        message: errorMessage,
      });
      toast.error(`Failed: ${errorMessage}`);
    } finally {
      setIsSending(false);
    }
  };

  const isFormValid = subject.trim().length > 0 && message.trim().length > 0 && 
    (audienceType !== 'external' || validExternalEmails.length > 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Custom Email Broadcast
          </CardTitle>
          <CardDescription>
            Send fully custom emails to specific user groups
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Audience Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Select Audience</Label>
            <RadioGroup
              value={audienceType}
              onValueChange={(val) => setAudienceType(val as AudienceType)}
              className="grid gap-3 sm:grid-cols-3"
            >
              <Label
                htmlFor="audience-all"
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  audienceType === 'all' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value="all" id="audience-all" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">All Users</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {userCounts?.total ?? '...'} platform users
                  </p>
                </div>
              </Label>
              
              <Label
                htmlFor="audience-registered"
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  audienceType === 'registered' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value="registered" id="audience-registered" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-green-600" />
                    <span className="font-medium">All Registered Users</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {userCounts?.registered ?? '...'} users who registered for any event
                  </p>
                </div>
              </Label>
              
              <Label
                htmlFor="audience-external"
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  audienceType === 'external' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value="external" id="audience-external" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">External</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Custom email list
                  </p>
                </div>
              </Label>
            </RadioGroup>
          </div>

          {/* External Email Input */}
          {audienceType === 'external' && (
            <div className="space-y-4 p-4 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Add Email Addresses</Label>
                <div className="flex gap-2">
                  <Input
                    value={singleEmail}
                    onChange={(e) => setSingleEmail(e.target.value)}
                    placeholder="Enter email address"
                    type="email"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSingleEmail())}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={handleAddSingleEmail}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Bulk Paste Emails 
                  <span className="text-muted-foreground font-normal ml-1">
                    (comma, newline, or semicolon separated)
                  </span>
                </Label>
                <Textarea
                  value={externalEmailsText}
                  onChange={(e) => setExternalEmailsText(e.target.value)}
                  placeholder="email1@example.com, email2@example.com&#10;email3@example.com&#10;email4@example.com"
                  rows={5}
                  className="font-mono text-sm"
                />
              </div>

              {/* Email Stats */}
              {parsedExternalEmails.length > 0 && (
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="default" className="bg-green-600">
                    {validExternalEmails.length} valid
                  </Badge>
                  {invalidExternalEmails.length > 0 && (
                    <Badge variant="destructive">
                      {invalidExternalEmails.length} invalid
                    </Badge>
                  )}
                </div>
              )}

              {/* Show invalid emails */}
              {invalidExternalEmails.length > 0 && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <p className="font-medium mb-1">Invalid emails (will be skipped):</p>
                  <div className="flex flex-wrap gap-1">
                    {invalidExternalEmails.slice(0, 10).map((e, i) => (
                      <code key={i} className="px-1.5 py-0.5 bg-destructive/20 rounded text-xs">
                        {e.email}
                      </code>
                    ))}
                    {invalidExternalEmails.length > 10 && (
                      <span className="text-xs">+{invalidExternalEmails.length - 10} more</span>
                    )}
                  </div>
                </div>
              )}

              {/* Clear button */}
              {externalEmailsText && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setExternalEmailsText('')}
                  className="text-muted-foreground"
                >
                  <X className="w-3 h-3 mr-1" /> Clear all emails
                </Button>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="broadcast-subject">Email Subject *</Label>
            <Input
              id="broadcast-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., 🎉 Special Announcement from UniVoid"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="broadcast-message">Email Body (HTML supported) *</Label>
            <Textarea
              id="broadcast-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your complete email content here...&#10;&#10;You can use HTML tags like <b>bold</b>, <i>italic</i>, <a href='url'>links</a>, etc.&#10;&#10;Line breaks will be preserved."
              rows={10}
              className="resize-none font-mono text-sm"
            />
          </div>

          {/* Custom Buttons Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Link className="w-4 h-4" />
                Call-to-Action Buttons (Optional)
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addButton}
                disabled={buttons.length >= 4}
              >
                <Plus className="w-3 h-3 mr-1" /> Add Button
              </Button>
            </div>
            
            {buttons.length > 0 && (
              <div className="space-y-2">
                {buttons.map((button, index) => (
                  <div key={index} className="flex gap-2 items-center p-3 rounded-lg border bg-muted/30">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        value={button.label}
                        onChange={(e) => updateButton(index, 'label', e.target.value)}
                        placeholder="Button text (e.g., Register Now)"
                        className="text-sm"
                      />
                      <Input
                        value={button.url}
                        onChange={(e) => updateButton(index, 'url', e.target.value)}
                        placeholder="https://..."
                        type="url"
                        className="text-sm"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeButton(index)}
                      className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              Add up to 4 buttons with custom links. They'll appear below your message.
            </p>
          </div>

          <Button
            onClick={() => setShowConfirmDialog(true)}
            disabled={isSending || !isFormValid}
            className="w-full gap-2"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending emails...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send to {getAudienceCount()} {audienceType === 'external' ? 'Recipients' : 'Users'}
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

      {/* Email History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Recent Email History
          </CardTitle>
          <CardDescription>
            Last 10 broadcast emails sent from admin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailLogs && emailLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {log.subject}
                      </TableCell>
                      <TableCell>{log.recipients_count}</TableCell>
                      <TableCell>
                        <Badge variant={log.status === 'sent' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {log.sent_at ? format(new Date(log.sent_at), 'MMM d, h:mm a') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">
              No broadcast emails sent yet
            </p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Broadcast</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to send this email to <strong>{getAudienceCount()}</strong> users?
              </p>
              <p className="text-sm">
                <strong>Audience:</strong> {getAudienceLabel()}
              </p>
              <p className="text-sm">
                <strong>Subject:</strong> {subject}
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                ⚠️ This action cannot be undone. Make sure your content is correct.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend} disabled={isSending}>
              {isSending ? 'Sending...' : 'Yes, Send Now'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};