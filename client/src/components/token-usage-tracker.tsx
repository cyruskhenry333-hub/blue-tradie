import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTokenStats } from "@/hooks/useTokenStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Coins, AlertTriangle, TrendingUp, Info, Zap, DollarSign, Clock, MessageSquare } from "lucide-react";

interface TokenUsageTrackerProps {
  className?: string;
  showMini?: boolean;
}

export default function TokenUsageTracker({ className = "", showMini = false }: TokenUsageTrackerProps) {
  const { user } = useAuth();
  
  // Regional currency settings with 20% commission markup - accurate GPT-4o-mini pricing
  const currency = user?.country === "New Zealand" ? "NZD" : "AUD";
  const currencySymbol = user?.country === "New Zealand" ? "$" : "$";
  const tokenCostMultiplier = user?.country === "New Zealand" ? 0.00000218 : 0.00000182; // 1M tokens = $1.82 AUD / $2.18 NZD (20% markup)
  const [showDetails, setShowDetails] = useState(false);
  const [usageAlert, setUsageAlert] = useState<'low' | 'medium' | 'high' | null>(null);

  const { data: tokenStats, isLoading } = useTokenStats();
  
  // Use live data from API or demo defaults - check for demo user status properly
  const isDemoUser = user?.email?.includes('demo') || user?.email?.includes('test-user') || user?.email?.includes('cy-electrical') || user?.email?.includes('cy-vip-user') || user?.isDemoUser;
  const currentTokens = tokenStats?.tokensRemaining ?? (isDemoUser ? 1000000 : 2000);
  const monthlyAllocation = tokenStats?.monthlyLimit ?? (isDemoUser ? 1000000 : 
    user?.subscriptionTier === "Blue Teams" ? 50000 : 
    user?.subscriptionTier === "Blue Core" ? 25000 : 
    user?.subscriptionTier === "Blue Lite" ? 10000 : 2000
  );
  const tokensUsedToday = tokenStats?.tokensUsed ?? 0;
  const usagePercentage = ((monthlyAllocation - currentTokens) / monthlyAllocation) * 100;

  // Set usage alerts based on remaining tokens
  useEffect(() => {
    if (currentTokens <= 20) {
      setUsageAlert('high');
    } else if (currentTokens <= 50) {
      setUsageAlert('medium');
    } else if (currentTokens <= 80) {
      setUsageAlert('low');
    } else {
      setUsageAlert(null);
    }
  }, [currentTokens]);

  const getAlertColor = (alert: string | null) => {
    switch (alert) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getUsageColor = () => {
    if (usagePercentage >= 80) return 'bg-red-500';
    if (usagePercentage >= 60) return 'bg-orange-500';
    if (usagePercentage >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (showMini) {
    return (
      <div className={`token-usage-mini ${className}`}>
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center space-x-2 hover:bg-gray-50">
              <Coins className="h-4 w-4 text-tradie-blue" />
              <span className="font-medium">{currentTokens}</span>
              <span className="text-xs text-gray-500">tokens</span>
              {usageAlert && (
                <AlertTriangle className="h-3 w-3 text-orange-500" />
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Coins className="h-5 w-5 text-tradie-blue" />
                <span>AI Token Usage & Education</span>
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto pr-2">
              <TokenUsageDetails 
                currentTokens={currentTokens}
                monthlyAllocation={monthlyAllocation}
                tokensUsedToday={tokensUsedToday}
                usagePercentage={usagePercentage}
                usageAlert={usageAlert}
                isLoading={isLoading}
                tokenStats={tokenStats}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <Card className={`token-usage-tracker ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Coins className="h-5 w-5 text-tradie-blue" />
            <span>AI Token Balance</span>
          </div>
          <Badge variant={usageAlert ? "destructive" : "secondary"}>
            {currentTokens} remaining
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TokenUsageDetails 
          currentTokens={currentTokens}
          monthlyAllocation={monthlyAllocation}
          tokensUsedToday={tokensUsedToday}
          usagePercentage={usagePercentage}
          usageAlert={usageAlert}
          isLoading={isLoading}
          tokenStats={tokenStats}
        />
      </CardContent>
    </Card>
  );
}

function TokenUsageDetails({ 
  currentTokens, 
  monthlyAllocation, 
  tokensUsedToday, 
  usagePercentage, 
  usageAlert,
  isLoading = false,
  tokenStats = null
}: {
  currentTokens: number;
  monthlyAllocation: number;
  tokensUsedToday: number;
  usagePercentage: number;
  usageAlert: string | null;
  isLoading?: boolean;
  tokenStats?: any;
}) {
  const { user } = useAuth();
  const currency = user?.country === "New Zealand" ? "NZD" : "AUD";
  const currencySymbol = user?.country === "New Zealand" ? "$" : "$";
  const tokenCostMultiplier = user?.country === "New Zealand" ? 0.00000218 : 0.00000182;
  const getUsageColor = () => {
    if (usagePercentage >= 80) return 'bg-red-500';
    if (usagePercentage >= 60) return 'bg-orange-500';
    if (usagePercentage >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Current Token Display */}
      <div className="text-center">
        <div className="text-3xl font-bold text-tradie-blue mb-2">
          {isLoading ? (
            <div className="animate-pulse bg-gray-200 h-8 w-24 mx-auto rounded"></div>
          ) : (
            currentTokens.toLocaleString()
          )}
        </div>
        <div className="text-gray-600">tokens remaining</div>
        {tokenStats && (
          <div className="text-xs text-gray-500 mt-1">
            Used today: {tokensUsedToday.toLocaleString()} tokens
          </div>
        )}
        {usageAlert && (
          <Alert className={`mt-3 border ${
            usageAlert === 'high' ? 'border-red-200 bg-red-50' :
            usageAlert === 'medium' ? 'border-orange-200 bg-orange-50' :
            'border-yellow-200 bg-yellow-50'
          }`}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="font-medium">
              {usageAlert === 'high' ? 
                `Token Alert: Only ${currentTokens} tokens remaining! Consider purchasing more to continue using AI features.` :
                usageAlert === 'medium' ?
                `Token Warning: ${currentTokens} tokens left. Your AI conversations are limited until next month.` :
                `Token Notice: ${currentTokens} tokens remaining. Keep an eye on your usage.`
              }
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Usage Progress */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Monthly Usage</span>
          <span className="text-sm text-gray-600">
            {monthlyAllocation - currentTokens} / {monthlyAllocation} used
          </span>
        </div>
        <Progress value={usagePercentage} className="h-3" />
        <div className="text-xs text-gray-500 text-center">
          {usagePercentage.toFixed(1)}% of monthly allocation used
        </div>
      </div>

      {/* Today's Usage */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-600" />
            <span>Today's Activity</span>
          </span>
          <span className="text-lg font-bold text-tradie-blue">{tokensUsedToday}</span>
        </div>
        <div className="text-sm text-gray-600">
          Used for AI conversations and automation tasks
        </div>
      </div>

      {/* What Are Tokens? */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-semibold flex items-center space-x-2 mb-2">
          <Info className="h-4 w-4 text-blue-600" />
          <span>What Are AI Tokens?</span>
        </h4>
        <div className="space-y-2 text-sm text-gray-700">
          <p>Tokens are like fuel for your AI business team. Think of them as the "energy" that powers every AI conversation, task, and automation.</p>
          
          <div className="bg-blue-50 p-3 rounded border border-blue-200 my-3">
            <h5 className="font-semibold text-blue-800 mb-2">How Tokens Work:</h5>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Each word you type or receive from AI uses tokens</li>
              <li>• Complex tasks (like business planning) use more tokens</li>
              <li>• Simple questions use very few tokens</li>
              <li>• Your token balance updates in real-time as you use AI features</li>
            </ul>
          </div>
          
          {/* Demo bonus message */}
          <div className="bg-green-50 p-3 rounded border border-green-200 my-3">
            <p className="text-green-800 text-sm font-medium">✨ Demo Bonus: You get 1 million tokens free — enough to explore all Blue Tradie features extensively during your trial.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-3 w-3 text-green-600" />
              <span className="text-xs">Quick question: 3-5 tokens</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-3 w-3 text-blue-600" />
              <span className="text-xs">Invoice help: 8-15 tokens</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-3 w-3 text-purple-600" />
              <span className="text-xs">Business planning: 20-40 tokens</span>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-3 w-3 text-orange-600" />
              <span className="text-xs">Financial analysis: 25-50 tokens</span>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Cost Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">What Do Tokens Cost?</h4>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="text-center py-3 bg-blue-50 rounded border border-blue-200">
            <p className="font-medium text-blue-800">Most tasks cost less than 1 cent.</p>
            <p className="text-xs text-blue-600 mt-1">Your 1M free tokens go a long way — you won't run out.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center p-2 bg-white rounded">
              <div className="font-medium">Quick question</div>
              <div className="text-gray-500">5 tokens • ~$0.00001</div>
            </div>
            <div className="text-center p-2 bg-white rounded">
              <div className="font-medium">Business planning</div>
              <div className="text-gray-500">30 tokens • ~$0.00005</div>
            </div>
          </div>
          
          <div className="pt-2 border-t border-gray-200">
            <div className="bg-green-50 p-3 rounded text-center">
              <div className="font-medium text-green-800">✅ 1 million tokens included free with your demo</div>
              <div className="text-xs text-green-600 mt-1">Explore everything without worrying about cost!</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <Button className="flex-1 bg-tradie-blue hover:bg-tradie-navy">
          <Coins className="h-4 w-4 mr-2" />
          Buy More Tokens
        </Button>
        <Button variant="outline" className="flex-1">
          <TrendingUp className="h-4 w-4 mr-2" />
          Usage History
        </Button>
      </div>
    </div>
  );
}

// Cost indicator for actions throughout the app
export function TokenCostIndicator({ 
  tokens, 
  description, 
  className = "" 
}: { 
  tokens: number; 
  description: string; 
  className?: string; 
}) {
  const cost = (tokens * 0.00000182).toFixed(6); // Accurate GPT-4o-mini pricing
  
  return (
    <div className={`token-cost-indicator ${className}`}>
      <Badge variant="secondary" className="flex items-center space-x-1 text-xs">
        <Coins className="h-3 w-3 text-tradie-blue" />
        <span>{tokens} tokens</span>
        <span className="text-gray-500">·</span>
        <span>${cost}</span>
      </Badge>
      {description && (
        <div className="text-xs text-gray-500 mt-1">{description}</div>
      )}
    </div>
  );
}