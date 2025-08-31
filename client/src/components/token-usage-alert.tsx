import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Zap, TrendingUp, CreditCard } from "lucide-react";
import { useTokenStats } from "@/hooks/useTokenStats";
import { useAuth } from "@/hooks/useAuth";

interface TokenUsageAlertProps {
  onUpgrade?: () => void;
}

export default function TokenUsageAlert({ onUpgrade }: TokenUsageAlertProps) {
  const { data: tokenStats } = useTokenStats();
  const { user } = useAuth();
  
  if (!tokenStats) return null;
  
  const usagePercentage = ((tokenStats.monthlyLimit - tokenStats.tokensRemaining) / tokenStats.monthlyLimit) * 100;
  const isDemo = user?.subscriptionTier === 'demo' || !user?.subscriptionTier;
  
  // Show alert at 80% usage
  if (usagePercentage < 80) return null;
  
  // Demo user hit limit - show upgrade prompt
  if (isDemo && tokenStats.tokensRemaining <= 0) {
    return (
      <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <p className="font-medium text-red-800 dark:text-red-200">Demo limit reached!</p>
            <p className="text-sm text-red-600 dark:text-red-300">
              You've used all {tokenStats.monthlyLimit.toLocaleString()} tokens. Upgrade to keep using your AI business team.
            </p>
          </div>
          <Button 
            onClick={onUpgrade}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white ml-4"
          >
            <CreditCard className="h-4 w-4 mr-1" />
            Upgrade Now
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  // High usage warning (80-95%)
  if (usagePercentage >= 80 && usagePercentage < 95) {
    return (
      <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-orange-800 dark:text-orange-200">
                High AI usage this month
              </p>
              <p className="text-sm text-orange-600 dark:text-orange-300">
                You've used {Math.round(usagePercentage)}% of your monthly tokens ({tokenStats.tokensRemaining.toLocaleString()} left)
              </p>
            </div>
            <Badge variant="outline" className="text-orange-700 border-orange-300">
              <Zap className="h-3 w-3 mr-1" />
              {Math.round(usagePercentage)}%
            </Badge>
          </div>
        </AlertDescription>
      </Alert>
    );
  }
  
  // Critical usage warning (95%+)
  if (usagePercentage >= 95) {
    return (
      <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">
                Almost out of tokens!
              </p>
              <p className="text-sm text-red-600 dark:text-red-300">
                Only {tokenStats.tokensRemaining.toLocaleString()} tokens left this month
              </p>
            </div>
            {/* Upgrade button temporarily hidden
            {isDemo && (
              <Button 
                onClick={onUpgrade}
                size="sm"
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                Upgrade
              </Button>
            )}
            */}
          </div>
        </AlertDescription>
      </Alert>
    );
  }
  
  return null;
}