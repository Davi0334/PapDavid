import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { user } = useAuth();
  return !user ? <>{children}</> : <Navigate to="/" />;
} 