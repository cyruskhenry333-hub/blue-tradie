import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertCircle, Calendar, DollarSign, FileText, MessageSquare } from "lucide-react";
import type { AppUser } from "@shared/types/user";
import { toAppUser } from "@shared/utils/toAppUser";

interface WeeklySummaryProps {
  onChatWithAgent?: (agentType: string, message: string) => void;
}

export default function WeeklySummary({ onChatWithAgent }: WeeklySummaryProps) {
  const { data: weeklyDataRaw } = useQuery({
    queryKey: ["/api/weekly-summary"],
    retry: false,
  });
  const weeklyData = toAppUser(weeklyDataRaw);

  if (!weeklyData) return null;

  const handleFollowUp = () => {
    const message = `I earned $${weeklyData?.totalEarnings ?? 0} this week but have ${weeklyData?.unpaidInvoices ?? 0} unpaid invoices. Can you help me with follow-up strategies?`;
    onChatWithAgent?.("accountant", message);
  };

  const handleMarketingAdvice = () => {
    const message = `I completed ${weeklyData?.completedJobs ?? 0} jobs this week. What's the best way to ask these customers for reviews and referrals?`;
    onChatWithAgent?.("marketing", message);
  };

  const handleBusinessCoaching = () => {
    const message = `Looking at my week: ${weeklyData?.completedJobs ?? 0} jobs completed, $${weeklyData?.totalEarnings ?? 0} earned. How can I improve my productivity and grow my business?`;
    onChatWithAgent?.("coach", message);
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span>Your Week at a Glance</span>
          <Badge variant="secondary">Week {weeklyData?.weekNumber ?? 1}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">${weeklyData?.totalEarnings ?? 0}</div>
            <div className="text-sm text-gray-600">Earned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{weeklyData?.completedJobs ?? 0}</div>
            <div className="text-sm text-gray-600">Jobs Done</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{weeklyData?.unpaidInvoices ?? 0}</div>
            <div className="text-sm text-gray-600">Unpaid</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{weeklyData?.newCustomers ?? 0}</div>
            <div className="text-sm text-gray-600">New Clients</div>
          </div>
        </div>

        {/* Weekly Insight */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-start space-x-3">
            <TrendingUp className="w-5 h-5 text-green-600 mt-1" />
            <div className="flex-1">
              <h4 className="font-semibold mb-2">Weekly Insight</h4>
              <p className="text-gray-700 text-sm">
                {weeklyData?.insight || `Great week! You completed ${weeklyData?.completedJobs ?? 0} jobs and earned $${weeklyData?.totalEarnings ?? 0}. ${(weeklyData?.unpaidInvoices ?? 0) > 0 ? `You have ${weeklyData?.unpaidInvoices ?? 0} unpaid invoices worth following up on.` : 'All invoices are up to date!'}`}
              </p>
            </div>
          </div>
        </div>

        {/* Action Suggestions */}
        {(weeklyData?.unpaidInvoices ?? 0) > 0 && (
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold text-orange-800 mb-2">Action Needed</h4>
                <p className="text-orange-700 text-sm mb-3">
                  You have {weeklyData?.unpaidInvoices ?? 0} unpaid invoices. Want help following up?
                </p>
                <Button 
                  onClick={handleFollowUp}
                  size="sm" 
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Get Follow-up Help
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleMarketingAdvice}
            variant="outline" 
            size="sm"
            className="flex-1 min-w-0"
          >
            <FileText className="w-4 h-4 mr-2" />
            Get Reviews
          </Button>
          <Button 
            onClick={handleBusinessCoaching}
            variant="outline" 
            size="sm"
            className="flex-1 min-w-0"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Growth Tips
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}