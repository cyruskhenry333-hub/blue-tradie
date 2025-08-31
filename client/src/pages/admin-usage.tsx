import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, RefreshCw, Activity, Database, Mail, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UsageStats {
  apiCalls: number;
  dbQueries: number;
  emailsSent: number;
  aiRequests: number;
  timestamp: Date;
  limits: {
    apiCalls: number;
    dbQueries: number;
    emailsSent: number;
    aiRequests: number;
  };
  percentages: {
    apiCalls: number;
    dbQueries: number;
    emailsSent: number;
    aiRequests: number;
  };
  status: 'NORMAL' | 'APPROACHING_LIMIT' | 'OVER_LIMIT';
}

export default function AdminUsagePage() {
  const { toast } = useToast();
  
  const { data: usageStats, isLoading, refetch } = useQuery<UsageStats>({
    queryKey: ['/api/admin/usage-stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleResetStats = async () => {
    try {
      const response = await fetch('/api/admin/usage-reset', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        toast({
          title: "Usage stats reset",
          description: "Daily usage counters have been reset successfully."
        });
        refetch();
      } else {
        throw new Error('Failed to reset stats');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset usage stats. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading || !usageStats) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading usage statistics...</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 80) return 'text-orange-600';
    return 'text-green-600';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 80) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usage Monitoring</h1>
          <p className="text-muted-foreground">Monitor Blue Tradie platform resource usage</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => refetch()}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={handleResetStats}
            variant="outline"
            size="sm"
          >
            Reset Stats
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      {usageStats.status !== 'NORMAL' && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-800">
                  {usageStats.status === 'OVER_LIMIT' ? 'Usage Limits Exceeded' : 'Approaching Usage Limits'}
                </h3>
                <p className="text-sm text-orange-600">
                  {usageStats.status === 'OVER_LIMIT' 
                    ? 'Some services may be throttled or unavailable until limits reset.'
                    : 'Monitor usage closely to avoid service interruptions.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* API Calls */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats.apiCalls.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              of {usageStats.limits.apiCalls.toLocaleString()} daily limit
            </p>
            <Progress 
              value={usageStats.percentages.apiCalls} 
              className="h-2"
              style={{
                background: usageStats.percentages.apiCalls >= 80 ? '#fee2e2' : '#f1f5f9'
              }}
            />
            <p className={`text-xs mt-2 ${getStatusColor(usageStats.percentages.apiCalls)}`}>
              {usageStats.percentages.apiCalls.toFixed(1)}% used
            </p>
          </CardContent>
        </Card>

        {/* Database Queries */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DB Queries</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats.dbQueries.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              of {usageStats.limits.dbQueries.toLocaleString()} daily limit
            </p>
            <Progress 
              value={usageStats.percentages.dbQueries} 
              className="h-2"
            />
            <p className={`text-xs mt-2 ${getStatusColor(usageStats.percentages.dbQueries)}`}>
              {usageStats.percentages.dbQueries.toFixed(1)}% used
            </p>
          </CardContent>
        </Card>

        {/* Emails Sent */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats.emailsSent}
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              of {usageStats.limits.emailsSent} daily limit
            </p>
            <Progress 
              value={usageStats.percentages.emailsSent} 
              className="h-2"
            />
            <p className={`text-xs mt-2 ${getStatusColor(usageStats.percentages.emailsSent)}`}>
              {usageStats.percentages.emailsSent.toFixed(1)}% used
            </p>
          </CardContent>
        </Card>

        {/* AI Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Requests</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats.aiRequests}
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              of {usageStats.limits.aiRequests} daily limit
            </p>
            <Progress 
              value={usageStats.percentages.aiRequests} 
              className="h-2"
            />
            <p className={`text-xs mt-2 ${getStatusColor(usageStats.percentages.aiRequests)}`}>
              {usageStats.percentages.aiRequests.toFixed(1)}% used
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Insights</CardTitle>
          <CardDescription>
            Understanding your platform resource consumption
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">High Impact User Actions</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• AI Chat Sessions (API + DB)</li>
                <li>• Welcome Email Sending (SendGrid)</li>
                <li>• File Uploads (Storage + Processing)</li>
                <li>• Dashboard Analytics (Complex DB Queries)</li>
                <li>• Invoice Generation (PDF + Storage)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Optimization Tips</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Cache expensive dashboard queries</li>
                <li>• Implement AI chat rate limiting</li>
                <li>• Queue heavy operations</li>
                <li>• Use graceful degradation near limits</li>
                <li>• Monitor usage daily during beta</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900">Beta Testing Estimates</h4>
            <p className="text-sm text-blue-800 mt-1">
              With 100 active beta users: ~$150-450/month operational costs
              (varies significantly based on AI chat usage and email frequency)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}