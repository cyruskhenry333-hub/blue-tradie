import { useQuery } from "@tanstack/react-query";

export interface TierInfo {
  current: number;
  max: number;
  available: number;
}

export interface BetaStatus {
  canJoin: boolean;
  message: string;
  tierProgress: {
    founding: { current: number; max: number };
    earlySupporter: { current: number; max: number };
    betaTester: { current: number; max: number };
    total: { current: number; max: number };
  };
  nextTier?: string;
  betaCount: number;
  waitlistCount: number;
  betaLimit: number;
  betaFull?: boolean;
  tiers: {
    founding: TierInfo;
    earlySupporter: TierInfo;
    betaTester: TierInfo;
  };
}

export function useBetaStatus() {
  return useQuery<BetaStatus>({
    queryKey: ["/api/beta/status"],
    refetchInterval: 30000, // Refresh every 30 seconds to keep status current
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}

interface TrialSystemStatus {
  trialSystemActive: boolean;
  betaUserCount: number;
  betaCapacity: number;
  isBetaFull: boolean;
  message: string;
}

export function useTrialSystemStatus() {
  return useQuery<TrialSystemStatus>({
    queryKey: ["/api/trial/system-status"],
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}