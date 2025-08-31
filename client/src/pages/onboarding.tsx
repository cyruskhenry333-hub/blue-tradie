import OnboardingWizard from "@/components/onboarding-wizard";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const handleOnboardingComplete = async () => {
    try {
      // Invalidate and refetch user cache to reflect updated isOnboarded status
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Wait for the auth state to update before navigating
      await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
      
      // Navigate to dashboard
      setLocation("/");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      // Fallback navigation even if refetch fails
      setLocation("/");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-tradie-light to-white">
      <OnboardingWizard onComplete={handleOnboardingComplete} />
    </div>
  );
}
