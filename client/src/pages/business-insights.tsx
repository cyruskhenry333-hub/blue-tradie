import { useQuery } from "@tantml:react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  Zap,
  Calendar,
  Users,
  Activity,
} from "lucide-react";

export default function BusinessInsights() {
  // Fetch business insights
  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['/api/analytics/insights'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/insights?days=30', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch insights');
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch revenue timeline
  const { data: revenue, isLoading: revenueLoading } = useQuery({
    queryKey: ['/api/analytics/revenue'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/revenue?days=30', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch revenue');
      return response.json();
    },
  });

  // Fetch AI usage stats
  const { data: aiUsage, isLoading: aiLoading } = useQuery({
    queryKey: ['/api/analytics/ai-usage'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/ai-usage?days=30', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch AI usage');
      return response.json();
    },
  });

  // Fetch recent activity
  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ['/api/analytics/activity'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/activity?limit=10', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch activity');
      return response.json();
    },
  });

  if (insightsLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Business Insights</h1>
        <p className="text-gray-600 mt-2">Your business performance over the last 30 days</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(insights?.totalRevenue || 0)}</div>
            <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Job Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(insights?.averageJobValue || 0)}</div>
            <p className="text-xs text-gray-500 mt-1">Per completed job</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Quote Conversion</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights?.quoteConversionRate?.toFixed(1) || 0}%</div>
            <p className="text-xs text-gray-500 mt-1">Quotes accepted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Payment Rate</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights?.invoicePaymentRate?.toFixed(1) || 0}%</div>
            <p className="text-xs text-gray-500 mt-1">Invoices paid</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed views */}
      <Tabs defaultValue="revenue" className="w-full">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="ai">AI Usage</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : revenue && revenue.length > 0 ? (
                <div className="space-y-3">
                  {revenue.slice(0, 10).map((day: any) => (
                    <div key={day.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{new Date(day.date).toLocaleDateString()}</div>
                        <div className="text-sm text-gray-600">
                          {day.invoicesPaid || 0} invoices paid / {day.invoicesSent || 0} sent
                        </div>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(parseFloat(day.revenue || '0'))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No revenue data yet. Start creating invoices to track your earnings!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Performing Days */}
          {insights?.topPerformingDays && insights.topPerformingDays.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <span>Top Performing Days</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {insights.topPerformingDays.map((day: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {day}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI Usage Tab */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Advisor Usage</CardTitle>
            </CardHeader>
            <CardContent>
              {aiLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : aiUsage && aiUsage.length > 0 ? (
                <div className="space-y-4">
                  {aiUsage.map((advisor: any) => (
                    <div key={advisor.agentType} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Zap className="w-5 h-5 text-blue-500" />
                        <div>
                          <div className="font-medium capitalize">{advisor.agentType?.replace('_', ' ')}</div>
                          <div className="text-sm text-gray-600">
                            {advisor.totalTokens?.toLocaleString() || 0} tokens used
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{advisor.count || 0}</div>
                        <div className="text-xs text-gray-500">chats</div>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      💡 Total AI chats: <span className="font-semibold">{insights?.aiUsageCount || 0}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Start chatting with AI advisors to see usage stats!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : activity && activity.length > 0 ? (
                <div className="space-y-3">
                  {activity.map((event: any) => (
                    <div key={event.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Activity className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium">{event.description}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {event.category}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Your activity will appear here as you use Blue Tradie
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
