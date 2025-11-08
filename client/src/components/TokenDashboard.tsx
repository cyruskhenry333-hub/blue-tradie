import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Zap, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

interface TokenStats {
  currentBalance: number;
  monthlyLimit: number;
  usedThisMonth: number;
  usagePercentage: number;
  rolledOverFromLastMonth: number;
}

export function TokenDashboard() {
  const { data: stats, isLoading, error } = useQuery<TokenStats>({
    queryKey: ['/api/tokens/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Unable to load token statistics. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const usagePercentage = Math.min(100, stats.usagePercentage);
  const isWarningLevel = usagePercentage >= 80 && usagePercentage < 100;
  const isDepleted = usagePercentage >= 100;

  // Calculate estimated conversations remaining (assuming ~150 tokens per chat)
  const estimatedChatsRemaining = Math.floor(stats.currentBalance / 150);

  // Determine progress bar color
  let progressColor = "bg-green-500";
  if (usagePercentage >= 100) {
    progressColor = "bg-red-500";
  } else if (usagePercentage >= 80) {
    progressColor = "bg-yellow-500";
  } else if (usagePercentage >= 50) {
    progressColor = "bg-blue-500";
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-blue-500" />
            <span>Token Balance</span>
          </CardTitle>
          <Badge variant="secondary">
            {stats.monthlyLimit.toLocaleString()} per month
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 80% Warning Alert */}
        {isWarningLevel && (
          <Alert className="border-yellow-500 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              You've used 80% of your monthly tokens. Consider upgrading your plan or waiting for next month's rollover.
            </AlertDescription>
          </Alert>
        )}

        {/* 100% Depleted Alert */}
        {isDepleted && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your monthly token limit has been reached. Tokens will reset on the 1st of next month. Upgrade your plan for immediate access.
            </AlertDescription>
          </Alert>
        )}

        {/* Success state for healthy usage */}
        {!isWarningLevel && !isDepleted && stats.currentBalance > 0 && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              You have {estimatedChatsRemaining} estimated conversations remaining this month.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Balance Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Current Balance</span>
            <span className="font-semibold text-2xl">
              {stats.currentBalance.toLocaleString()}
            </span>
          </div>

          <Progress
            value={usagePercentage}
            className="h-3"
          />

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{stats.usedThisMonth.toLocaleString()} used</span>
            <span>{usagePercentage.toFixed(1)}% consumed</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <div className="text-xs text-gray-500">Used This Month</div>
            <div className="text-lg font-semibold text-gray-900">
              {stats.usedThisMonth.toLocaleString()}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-gray-500 flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>Rolled Over</span>
            </div>
            <div className="text-lg font-semibold text-blue-600">
              {stats.rolledOverFromLastMonth.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Info Tip */}
        <div className="pt-2 border-t">
          <p className="text-xs text-gray-500">
            =¡ Tip: Cached responses don't use tokens. Unused tokens roll over month-to-month.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
