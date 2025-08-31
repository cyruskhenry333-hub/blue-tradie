import { useQuery } from "@tanstack/react-query";

interface TrialStatus {
  isTrialActive: boolean;
  daysRemaining: number;
  trialEndDate: Date | null;
  isEligible: boolean;
}

interface TrialSystemStatus {
  trialSystemActive: boolean;
  betaUserCount: number;
  betaCapacity: number;
  isBetaFull: boolean;
  message: string;
}

export function useTrialStatus() {
  const { data: status, isLoading } = useQuery<TrialStatus>({
    queryKey: ["/api/trial/status"],
    retry: false,
  });

  return {
    status: status || { isTrialActive: false, daysRemaining: 0, trialEndDate: null, isEligible: false },
    isLoading,
    isTrialActive: status?.isTrialActive || false,
    daysRemaining: status?.daysRemaining || 0,
    trialEndDate: status?.trialEndDate,
    isEligible: status?.isEligible || false,
  };
}

export function useTrialSystemStatus() {
  const { data: systemStatus, isLoading } = useQuery<TrialSystemStatus>({
    queryKey: ["/api/trial/system-status"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    systemStatus: systemStatus || {
      trialSystemActive: false,
      betaUserCount: 0,
      betaCapacity: 100,
      isBetaFull: false,
      message: "Loading..."
    },
    isLoading,
    trialSystemActive: systemStatus?.trialSystemActive || false,
    isBetaFull: systemStatus?.isBetaFull || false,
    betaUserCount: systemStatus?.betaUserCount || 0,
  };
}