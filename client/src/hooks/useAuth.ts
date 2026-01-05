import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { AppUser } from "@shared/types/user";
import { toAppUser } from "@shared/utils/toAppUser";

export function useAuth() {
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false, // Don't retry on auth failures
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchInterval: false, // Don't poll
    staleTime: 0, // Always consider data stale for demo users
    // Handle 401 responses gracefully - they indicate "not authenticated" not "loading"
    throwOnError: false,
  });

  const user = toAppUser(userData) as AppUser | null;

  // If we get a 401 error, user is simply not authenticated (not loading)
  const isUnauthenticated = error && (error as any).status === 401;

  // First-load diagnostic logging (only on state changes)
  const lastStateRef = useRef<string>('');
  useEffect(() => {
    const currentState = JSON.stringify({
      hasUser: !!user,
      isLoading,
      isUnauthenticated,
      hasData: !!userData,
    });

    if (currentState !== lastStateRef.current) {
      console.log('[useAuth] State change:', {
        hasUser: !!user,
        isLoading,
        isUnauthenticated,
        userData: userData ? 'present' : 'null',
      });

      if (error && !isUnauthenticated) {
        console.error('[useAuth] Auth fetch error:', error);
      }

      lastStateRef.current = currentState;
    }
  }, [user, isLoading, isUnauthenticated, userData, error]);

  return {
    user,
    isLoading: isLoading && !isUnauthenticated,
    isAuthenticated: !!user,
  };
}
