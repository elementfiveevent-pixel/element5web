import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { useGlobalRealtimeNotifications } from '@/hooks/useGlobalRealtimeNotifications';

/**
 * Provider component that enables global real-time notifications
 * Place this inside AuthProvider to have access to user context
 */
export function GlobalRealtimeProvider({ children }: { children: React.ReactNode }) {
  // Safely check if we're inside AuthProvider before enabling realtime
  const authContext = useContext(AuthContext);
  
  // Only render the realtime hook wrapper if auth context is available
  return (
    <>
      {authContext !== undefined && <RealtimeNotificationsWrapper />}
      {children}
    </>
  );
}

// Separate component to safely use the hook
function RealtimeNotificationsWrapper() {
  useGlobalRealtimeNotifications();
  return null;
}
