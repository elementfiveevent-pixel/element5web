import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to redirect users to appropriate dashboard based on their role
 * - admin / admin_assistant → /admin
 * - organizer → /organizer-dashboard
 * - regular user → /dashboard
 */
export function useRoleRedirect() {
  const { user, userRoles, isLoading, isAdmin, isAdminOrAssistant } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Don't redirect while loading or if no user
    if (isLoading || !user) {
      hasRedirected.current = false;
      return;
    }

    // Only redirect once per login session
    if (hasRedirected.current) return;

    // Skip redirect if already on a dashboard or admin page
    const currentPath = location.pathname;
    const isDashboardPage = 
      currentPath === '/dashboard' ||
      currentPath === '/admin' ||
      currentPath === '/organizer/dashboard' ||
      currentPath.startsWith('/organizer/');

    if (isDashboardPage) {
      hasRedirected.current = true;
      return;
    }

    // Only auto-redirect from root or auth pages
    const shouldAutoRedirect = 
      currentPath === '/' ||
      currentPath === '/auth' ||
      currentPath.startsWith('/auth/');

    // Never redirect away from event detail pages (user may be registering)
    const isEventPage = currentPath.startsWith('/events/');

    if (!shouldAutoRedirect || isEventPage) return;

    // Determine redirect path based on role
    let redirectPath = '/dashboard';

    if (isAdmin || isAdminOrAssistant) {
      redirectPath = '/admin';
    } else if (userRoles.includes('organizer')) {
      redirectPath = '/organizer/dashboard';
    }

    hasRedirected.current = true;
    navigate(redirectPath, { replace: true });
  }, [user, userRoles, isLoading, isAdmin, isAdminOrAssistant, navigate, location.pathname]);

  return {
    getRedirectPath: () => {
      if (isAdmin || isAdminOrAssistant) return '/admin';
      if (userRoles.includes('organizer')) return '/organizer/dashboard';
      return '/dashboard';
    }
  };
}

/**
 * Helper function to get redirect path based on roles (for OAuth callback)
 */
export function getRoleBasedRedirectPath(roles: string[]): string {
  if (roles.includes('admin') || roles.includes('admin_assistant')) {
    return '/admin';
  }
  if (roles.includes('organizer')) {
    return '/organizer/dashboard';
  }
  return '/dashboard';
}
