import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, RefreshCw, CheckCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface EmailVerificationPendingProps {
  email: string;
}

export function EmailVerificationPending({ email }: EmailVerificationPendingProps) {
  const [isResending, setIsResending] = useState(false);
  const [lastResent, setLastResent] = useState<number>(0);
  const { signOut } = useAuth();
  const { toast } = useToast();

  const RESEND_COOLDOWN = 60000; // 1 minute cooldown

  const canResend = Date.now() - lastResent > RESEND_COOLDOWN;
  const cooldownRemaining = Math.ceil((RESEND_COOLDOWN - (Date.now() - lastResent)) / 1000);

  const handleResendEmail = async () => {
    if (!canResend) {
      toast({
        title: "Please wait",
        description: `You can resend in ${cooldownRemaining} seconds`,
        variant: "destructive",
      });
      return;
    }

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      setLastResent(Date.now());
      toast({
        title: "Email sent!",
        description: "Check your inbox for the verification link.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to resend",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription className="text-base">
            Please verify your email to continue using UniVoid.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-secondary/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">
              We sent a verification link to:
            </p>
            <p className="font-medium text-foreground">{email}</p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleResendEmail}
              disabled={isResending || !canResend}
              className="w-full"
              variant="outline"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : !canResend ? (
                `Resend in ${cooldownRemaining}s`
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>

            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Sign out and try again
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p className="flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              After verification, you'll be redirected automatically
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}