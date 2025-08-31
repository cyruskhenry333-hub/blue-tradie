import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

interface TokenStats {
  monthlyLimit: number;
  tokensUsed: number;
  tokensRemaining: number;
  totalCostAud: number;
  usagePercentage: number;
}

export function useTokenStats() {
  const { isAuthenticated } = useAuth();

  return useQuery<TokenStats>({
    queryKey: ["/api/ai/token-stats"],
    enabled: isAuthenticated,
    refetchInterval: 5000, // Refetch every 5 seconds for live updates
    refetchOnWindowFocus: true,
    retry: false,
  });
}