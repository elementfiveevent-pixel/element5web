import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  UserPlus, 
  Loader2, 
  Trash2, 
  Mail, 
  Clock, 
  CheckCircle,
  XCircle,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  getAdminInvites,
  getAdminAssistants,
  sendAdminInvite,
  removeAdminAssistant,
  revokeAdminInvite,
  AdminInvite,
  AdminAssistant,
} from '@/services/adminInviteService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Props {
  isFullAdmin: boolean;
}

export default function AdminAssistantManager({ isFullAdmin }: Props) {
  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [assistants, setAssistants] = useState<AdminAssistant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [removeConfirm, setRemoveConfirm] = useState<{ type: 'invite' | 'assistant'; id: string; name: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invitesData, assistantsData] = await Promise.all([
        getAdminInvites(),
        getAdminAssistants(),
      ]);
      setInvites(invitesData);
      setAssistants(assistantsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load admin assistants');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSending(true);
    const { error } = await sendAdminInvite(email.trim());
    setIsSending(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`Invite sent to ${email}`);
    setEmail('');
    fetchData();
  };

  const handleRemoveAssistant = async () => {
    if (!removeConfirm || removeConfirm.type !== 'assistant') return;

    setProcessingId(removeConfirm.id);
    const { error } = await removeAdminAssistant(removeConfirm.id);
    setProcessingId(null);
    setRemoveConfirm(null);

    if (error) {
      toast.error('Failed to remove assistant: ' + error.message);
      return;
    }

    toast.success('Admin assistant removed');
    setAssistants(prev => prev.filter(a => a.user_id !== removeConfirm.id));
  };

  const handleRevokeInvite = async () => {
    if (!removeConfirm || removeConfirm.type !== 'invite') return;

    setProcessingId(removeConfirm.id);
    const { error } = await revokeAdminInvite(removeConfirm.id);
    setProcessingId(null);
    setRemoveConfirm(null);

    if (error) {
      toast.error('Failed to revoke invite: ' + error.message);
      return;
    }

    toast.success('Invite revoked');
    setInvites(prev => prev.filter(i => i.id !== removeConfirm.id));
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    
    if (isExpired && status === 'pending') {
      return <Badge variant="destructive" className="text-xs"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>;
    }
    
    switch (status) {
      case 'accepted':
        return <Badge variant="default" className="bg-green-500/20 text-green-600 border-green-500/30 text-xs"><CheckCircle className="w-3 h-3 mr-1" />Accepted</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="text-xs"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const pendingInvites = invites.filter(i => i.status === 'pending' && new Date(i.expires_at) > new Date());

  return (
    <div className="space-y-6">
      {/* Invite Form - Only for full admins */}
      {isFullAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Invite Admin Assistant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendInvite} className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
                disabled={isSending}
              />
              <Button type="submit" disabled={isSending || !email.trim()}>
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Invite
                  </>
                )}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">
              The invited user will receive an email. Once they sign in with Google using that email, they'll automatically become an Admin Assistant.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Current Admin Assistants */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Admin Assistants ({assistants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {assistants.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No admin assistants yet</p>
          ) : (
            <div className="space-y-3">
              {assistants.map((assistant) => (
                <div key={assistant.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={assistant.profile?.profile_photo_url || ''} />
                      <AvatarFallback>
                        {assistant.profile?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">
                        {assistant.profile?.full_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {assistant.profile?.email || 'No email'}
                      </p>
                    </div>
                  </div>
                  {isFullAdmin && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setRemoveConfirm({ 
                        type: 'assistant', 
                        id: assistant.user_id, 
                        name: assistant.profile?.full_name || 'this assistant' 
                      })}
                      disabled={processingId === assistant.user_id}
                    >
                      {processingId === assistant.user_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Invites ({pendingInvites.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{invite.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Invited by {invite.inviter_name} • Expires {format(new Date(invite.expires_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(invite.status, invite.expires_at)}
                    {isFullAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRemoveConfirm({ 
                          type: 'invite', 
                          id: invite.id, 
                          name: invite.email 
                        })}
                        disabled={processingId === invite.id}
                      >
                        {processingId === invite.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!removeConfirm} onOpenChange={() => setRemoveConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {removeConfirm?.type === 'assistant' ? 'Remove Admin Assistant?' : 'Revoke Invite?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {removeConfirm?.type === 'assistant' 
                ? `Are you sure you want to remove ${removeConfirm?.name} as an Admin Assistant? They will lose access to moderation features.`
                : `Are you sure you want to revoke the invite for ${removeConfirm?.name}?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={removeConfirm?.type === 'assistant' ? handleRemoveAssistant : handleRevokeInvite}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeConfirm?.type === 'assistant' ? 'Remove' : 'Revoke'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
