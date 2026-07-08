import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { EmailVerificationPending } from "./EmailVerificationPending";

interface ProtectedRouteProps {
  children: React.ReactNode;
  skipOnboarding?: boolean;
}

const ProtectedRoute = ({ children, skipOnboarding = false }: ProtectedRouteProps) => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while auth is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/?auth=login" state={{ from: location.pathname }} replace />;
  }

  // Check if email is verified
  // OAuth users (Google, etc.) are trusted and verified by default
  const provider = user.app_metadata?.provider;
  const isOAuthUser = (provider && provider !== 'email') || 
    (user.identities?.some((identity: any) => identity.provider && identity.provider !== 'email'));
  const emailConfirmed = user.email_confirmed_at !== null;
  const isVerified = isOAuthUser || emailConfirmed;

  if (!isVerified) {
    return <EmailVerificationPending email={user.email || ''} />;
  }

  // Wait for profile to load before checking completion
  // This prevents redirect race conditions for new OAuth users
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Onboarding is no longer a forced redirect — users see a dismissable
  // "Complete your profile" banner on the dashboard instead (ProfileCompletionBanner).

  return <>{children}</>;
};

export default ProtectedRoute;
