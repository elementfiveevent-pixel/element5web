import { useVerification } from '@/hooks/useVerification';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Mail, Phone, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function VerificationBanner() {
  const { user, profile } = useAuth();
  const { isVerified } = useVerification();
  const [isSending, setIsSending] = useState(false);

  if (!user || !profile || isVerified) {
    return null;
  }

  const handleResendVerification = async () => {
    if (!user?.email) return;
    
    setIsSending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    setIsSending(false);

    if (error) {
      toast.error('Failed to send verification email');
    } else {
      toast.success('Verification email sent! Check your inbox.');
    }
  };

  return (
    <Alert variant="destructive" className="mb-4 border-warning bg-warning/10 text-warning-foreground">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex flex-wrap items-center justify-between gap-4">
        <span>
          <strong>Account not verified.</strong> Verify your email or phone to upload materials, download files, and contact sellers.
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResendVerification}
          disabled={isSending}
          className="border-warning text-warning hover:bg-warning/20"
        >
          <Mail className="w-4 h-4 mr-2" />
          {isSending ? 'Sending...' : 'Resend Email'}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
