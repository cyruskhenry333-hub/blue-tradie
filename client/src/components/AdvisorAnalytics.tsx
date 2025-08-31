import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Users, MessageSquare, Calendar, Flag } from "lucide-react";

interface AdvisorUsageData {
  agent: string;
  icon: string;
  totalChats: number;
  thisWeek: number;
  lastWeek: number;
  auUsers: number;
  nzUsers: number;
  soloUsers: number;
  teamUsers: number;
  averageMessages: number;
  popularTopics: string[];
}

interface UsageAnalytics {
  advisorStats: AdvisorUsageData[];
  totalEngagement: number;
  regionBreakdown: { au: number; nz: number };
  userTypeBreakdown: { solo: number; team: number };
  weeklyTrends: { week: string; engagement: number }[];
  topGrowthAgent: string;
}

export default function AdvisorAnalytics() {
  const { data: analytics, isLoading } = useQuery<UsageAnalytics>({
    queryKey: ["/api/analytics/advisor-usage"],
    refetchInterval: 30000, // Refresh every 30 seconds for real-time feel
  });

  if (isLoading || !analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            AI Advisor Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const agentColors = {
    "Accountant": "#ef4444", // red
    "Marketing": "#f97316", // orange  
    "Business Coach": "#3b82f6", // blue
    "Legal": "#8b5cf6" // purple
  };

  const regionData = [
    { name: "Australia", value: analytics.regionBreakdown.au, color: "#1e40af" },
    { name: "New Zealand", value: analytics.regionBreakdown.nz, color: "#0ea5e9" }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Engagement</p>
                <p className="text-2xl font-bold text-tradie-blue">{analytics.totalEngagement}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-tradie-blue" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Top Agent</p>
                <p className="text-lg font-bold text-green-600">{analytics.topGrowthAgent}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">AU Users</p>
                <p className="text-xl font-bold">🇦🇺 {analytics.regionBreakdown.au}</p>
              </div>
              <Flag className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">NZ Users</p>
                <p className="text-xl font-bold">🇳🇿 {analytics.regionBreakdown.nz}</p>
              </div>
              <Flag className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advisor Performance Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            AI Advisor Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.advisorStats.map((advisor) => {
              const weeklyGrowth = advisor.lastWeek > 0 
                ? ((advisor.thisWeek - advisor.lastWeek) / advisor.lastWeek * 100)
                : (advisor.thisWeek > 0 ? 100 : 0);
              
              return (
                <Card key={advisor.agent} className="border-l-4" style={{borderLeftColor: agentColors[advisor.agent as keyof typeof agentColors]}}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{advisor.icon}</span>
                          <h4 className="font-semibold text-sm">{advisor.agent}</h4>
                        </div>
                        {weeklyGrowth > 0 && (
                          <Badge variant="outline" className="text-xs text-green-600">
                            +{weeklyGrowth.toFixed(0)}%
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Total Chats</span>
                          <span className="font-bold">{advisor.totalChats}</span>
                        </div>
                        
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">This Week</span>
                          <span className="font-bold text-blue-600">{advisor.thisWeek}</span>
                        </div>
                        
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Avg Messages</span>
                          <span className="font-bold">{advisor.averageMessages}</span>
                        </div>
                      </div>

                      {/* Regional Split */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>🇦🇺 AU: {advisor.auUsers}</span>
                          <span>🇳🇿 NZ: {advisor.nzUsers}</span>
                        </div>
                        <Progress 
                          value={(advisor.auUsers / (advisor.auUsers + advisor.nzUsers)) * 100} 
                          className="h-1"
                        />
                      </div>

                      {/* User Type Split */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Solo: {advisor.soloUsers}</span>
                          <span>Team: {advisor.teamUsers}</span>
                        </div>
                        <Progress 
                          value={(advisor.soloUsers / (advisor.soloUsers + advisor.teamUsers)) * 100} 
                          className="h-1"
                        />
                      </div>

                      {/* Popular Topics */}
                      {advisor.popularTopics.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs text-gray-600">Top Topics:</p>
                          <div className="flex flex-wrap gap-1">
                            {advisor.popularTopics.slice(0, 2).map((topic, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Weekly Engagement Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.weeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="engagement" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Regional Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5" />
              Regional Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={regionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {regionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-4 mt-4">
              {regionData.map((item) => (
                <div key={item.name} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{backgroundColor: item.color}}
                  ></div>
                  <span className="text-sm">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}