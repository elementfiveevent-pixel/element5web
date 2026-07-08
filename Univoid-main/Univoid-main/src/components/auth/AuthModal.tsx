import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  message?: string;
  returnTo?: string;
}

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

import { useRateLimiter } from "@/hooks/useRateLimiter";

// ... existing code ...

const AuthModal = ({ isOpen, onClose, onSuccess, message, returnTo }: AuthModalProps) => {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRoles, isAdmin, isAdminOrAssistant, isLoading } = useAuth();

  const { checkLimit } = useRateLimiter({
    key: 'auth_google_signin',
    limit: 5,
    window: 60000, // 5 attempts per minute
  });

  // Auto-close modal when user logs in - redirect handled by useRoleRedirect hook
  useEffect(() => {
    if (user && !isLoading && isOpen) {
      onClose();
      onSuccess?.();
      // Don't navigate here - let useRoleRedirect in App.tsx handle the redirect
      // to avoid race conditions with OAuth callback
    }
  }, [user, isLoading, isOpen, onClose, onSuccess]);

  const handleGoogleSignIn = async () => {
    if (!checkLimit()) return;
    setIsGoogleLoading(true);
    try {
      // If returnTo is provided, redirect back there after OAuth; otherwise go to root
      const redirectUrl = returnTo 
        ? `${window.location.origin}${returnTo}` 
        : `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered') || error.message.includes('different credential')) {
          toast({
            title: "Account exists",
            description: "An account with this email already exists. Please sign in with your original method.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Google sign-in failed",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign in with Google. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Header - Sketch style */}
        <div className="bg-primary px-6 py-8 text-center border-b border-border">
          <div className="w-14 h-14 bg-card border border-border rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sketch-sm">
            <span className="text-foreground font-bold text-xl">U</span>
          </div>
          <DialogTitle className="text-xl font-display font-bold text-primary-foreground mb-2">
            Welcome to UniVoid
          </DialogTitle>
          {message && (
            <p className="text-primary-foreground/80 text-sm">{message}</p>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 bg-card">
          <div className="text-center">
            <p className="text-muted-foreground text-sm mb-6">
              Sign in with your Google account to continue
            </p>
          </div>

          {/* Google Sign-In Button - Sketch style */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 font-bold text-base"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            <span className="ml-3">Continue with Google</span>
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By signing in, you agree to our{" "}
            <a href="/terms" className="text-foreground font-semibold hover:underline">Terms</a>
            {" "}and{" "}
            <a href="/privacy-policy" className="text-foreground font-semibold hover:underline">Privacy Policy</a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
