import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, isAdmin, isAdminOrAssistant, isLoading } = useAuth();
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

  // Redirect to dashboard if not admin or admin assistant
  if (!isAdmin && !isAdminOrAssistant) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
