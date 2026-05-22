'use client';

import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'driver' | 'owner';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If the auth check is done and there is no user, kick them to login
    if (!loading && !user) {
      router.push(requiredRole === 'owner' ? '/owner-login' : '/driver-login');
    }
  }, [user, loading, router, requiredRole]);

  // Show a loading spinner while Firebase checks the user's token
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--background)">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-(--brand-blue)"></div>
      </div>
    );
  }

  // If user exists, render the dashboard
  return user ? <>{children}</> : null;
}