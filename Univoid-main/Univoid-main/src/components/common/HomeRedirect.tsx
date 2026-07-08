import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface HomeRedirectProps {
  children: React.ReactNode;
}

export function HomeRedirect({ children }: HomeRedirectProps) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect after auth has finished loading
    if (!isLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Show nothing briefly while checking auth
  if (isLoading) {
    return null;
  }

  // If user is logged in, they will be redirected
  if (user) {
    return null;
  }

  return <>{children}</>;
}
