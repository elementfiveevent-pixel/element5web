import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface OrganizerRouteProps {
  children: React.ReactNode;
}

/**
 * OrganizerRoute - Protects organizer-only routes
 * Requires user to be authenticated AND have organizer or admin role
 */
const OrganizerRoute = ({ children }: OrganizerRouteProps) => {
  const { user, isOrganizer, isLoading } = useAuth();
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

  // Redirect to dashboard if not an organizer
  if (!isOrganizer) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default OrganizerRoute;
