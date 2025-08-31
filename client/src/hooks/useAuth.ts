import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false, // Don't retry on auth failures
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchInterval: false, // Don't poll
    staleTime: 0, // Always consider data stale for demo users
    // Handle 401 responses gracefully - they indicate "not authenticated" not "loading"
    throwOnError: false,
  });

  // If we get a 401 error, user is simply not authenticated (not loading)
  const isUnauthenticated = error && (error as any).status === 401;

  return {
    user,
    isLoading: isLoading && !isUnauthenticated,
    isAuthenticated: !!user,
  };
}
