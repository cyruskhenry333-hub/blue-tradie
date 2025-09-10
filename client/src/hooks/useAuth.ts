import { useQuery } from "@tanstack/react-query";
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

  return {
    user,
    isLoading: isLoading && !isUnauthenticated,
    isAuthenticated: !!user,
  };
}
