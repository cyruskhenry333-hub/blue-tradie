import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  Users, 
  MessageSquare, 
  FileText, 
  TrendingUp, 
  ArrowLeft,
  BarChart3,
  Calendar,
  Download
} from "lucide-react";
import AdvisorAnalytics from "@/components/AdvisorAnalytics";

export default function AdminAnalytics() {
  const { toast } = useToast();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/admin/analytics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/analytics');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    }
  });

  const { data: feedback } = useQuery({
    queryKey: ['/api/admin/feedback'],
    queryFn: async () => {
      const response = await fetch('/api/admin/feedback');
      if (!response.ok) return [];
      return response.json();
    }
  });

  const exportFeedback = () => {
    if (!feedback || feedback.length === 0) {
      toast({
        title: "No feedback to export",
        description: "There are currently no feedback submissions",
        variant: "destructive"
      });
      return;
    }

    const csvContent = [
      ['Date', 'User ID', 'Type', 'Priority', 'Title', 'Description', 'Status'].join(','),
      ...feedback.map((item: any) => [
        new Date(item.createdAt).toLocaleDateString(),
        item.userId,
        item.type,
        item.priority,
        `"${item.title}"`,
        `"${item.description}"`,
        item.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blue-tradie-feedback-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Feedback exported",
      description: "Feedback data has been downloaded as CSV",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-tradie-blue mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" className="text-tradie-blue hover:text-tradie-orange">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to App
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-tradie-blue">Admin Analytics</h1>
              <p className="text-gray-600">Blue Tradie Beta Monitoring Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/admin">
              <Button variant="outline" className="border-tradie-blue text-tradie-blue font-medium">
                Analytics
              </Button>
            </Link>
            <Link href="/admin/roadmap">
              <Button variant="ghost" className="text-gray-600 hover:text-tradie-blue">
                Roadmap
              </Button>
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Beta Live
            </Badge>
            <Badge variant="outline">
              {new Date().toLocaleDateString()}
            </Badge>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-tradie-blue">
                    {analytics?.totalUsers || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-tradie-blue" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Beta Users</p>
                  <p className="text-3xl font-bold text-tradie-orange">
                    {analytics?.betaUsers || 0}
                  </p>
                </div>
                <Badge className="bg-orange-100 text-orange-700 h-8 px-3">BETA</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                  <p className="text-3xl font-bold text-green-600">
                    {analytics?.totalInvoices || 0}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">AI Messages</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {analytics?.totalChatMessages || 0}
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AI Agent Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-tradie-blue" />
                <span>AI Agent Popularity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.topAgents?.length > 0 ? (
                <div className="space-y-4">
                  {analytics.topAgents.map((agent: any, index: number) => (
                    <div key={agent.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-500' : 'bg-gray-300'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="font-medium">{agent.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-tradie-blue h-2 rounded-full"
                            style={{ width: `${(agent.usage / 40) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 min-w-[3rem]">
                          {agent.usage} uses
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No AI interactions yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Growth Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Weekly Growth</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    +{analytics?.weeklyGrowth || 0}%
                  </div>
                  <p className="text-gray-600">User growth this week</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-tradie-blue">
                      {Math.round((analytics?.totalInvoices || 0) / Math.max(analytics?.totalUsers || 1, 1))}
                    </p>
                    <p className="text-sm text-gray-600">Avg invoices per user</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">
                      {Math.round((analytics?.totalChatMessages || 0) / Math.max(analytics?.totalUsers || 1, 1))}
                    </p>
                    <p className="text-sm text-gray-600">Avg AI chats per user</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feedback Overview */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-tradie-orange" />
                <span>Recent Feedback</span>
              </CardTitle>
              <Button 
                onClick={exportFeedback}
                variant="outline" 
                size="sm"
                disabled={!feedback || feedback.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {feedback && feedback.length > 0 ? (
                <div className="space-y-4">
                  {feedback.slice(0, 5).map((item: any) => (
                    <div key={item.id} className="border-l-4 border-tradie-blue bg-gray-50 p-4 rounded">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant={
                              item.type === 'bug' ? 'destructive' :
                              item.type === 'feature' ? 'default' : 'secondary'
                            }>
                              {item.type}
                            </Badge>
                            <Badge variant="outline">{item.priority}</Badge>
                            <span className="text-sm text-gray-500">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="font-medium mb-1">{item.title}</h4>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                        <Badge variant={item.status === 'open' ? 'secondary' : 'default'}>
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {feedback.length > 5 && (
                    <div className="text-center pt-4">
                      <p className="text-sm text-gray-500">
                        Showing 5 of {feedback.length} feedback items. Export for full data.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No feedback submitted yet</p>
                  <p className="text-sm mt-1">Feedback will appear here as users submit it</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Real-Time Advisor Analytics */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-tradie-blue mb-6">AI Advisor Usage Analytics</h2>
          <AdvisorAnalytics />
        </div>
      </div>
    </div>
  );
}