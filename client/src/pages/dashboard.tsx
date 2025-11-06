import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useGuidedTour } from "@/hooks/useGuidedTour";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import WelcomeOnboarding from "@/components/welcome-onboarding";
import { getRegionalGreeting } from "@/utils/language-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HardHat, Plus, FileText, Receipt, MessageSquare, LogOut, Settings, Calendar, TrendingUp, DollarSign, Clock, Users, Play } from "lucide-react";
import blueTradieLogo from "@assets/Blue Tradie Logo_1753253697164.png";
import GlobalBusinessMetrics from "@/components/global-business-metrics";
import DashboardMetrics from "@/components/dashboard-metrics";
import EnhancedChatUI from "@/components/enhanced-chat-ui";
import WeeklySummary from "@/components/weekly-summary";
import FeedbackWidget from "@/components/feedback-widget";

import BusinessJourneyRoadmap from "@/components/business-journey-roadmap";
import DashboardGoalsVision from "@/components/DashboardGoalsVision";
import QuickAccessPanel from "@/components/QuickAccessPanel";
import BusinessSetupChecklist from "@/components/BusinessSetupChecklist";


export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const { resetTour } = useGuidedTour();
  const { toast } = useToast();
  const [showQuickChat, setShowQuickChat] = useState(false);

  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["/api/dashboard"],
    retry: false,
  });

  const { data: journeyData, isLoading: isJourneyLoading } = useQuery({
    queryKey: ["/api/journey"],
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
    
    // Redirect to onboarding if user is not onboarded
    if (!isLoading && user && !user.isOnboarded) {
      console.log('[DASHBOARD] User not onboarded, redirecting to onboarding');
      window.location.href = "/onboarding";
      return;
    }
  }, [user, isLoading, toast]);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (isLoading || isDashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const firstName = user?.firstName || "Mate";

  return (
    <div className="min-h-screen bg-gradient-to-br from-tradie-light to-white">



      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {user?.businessLogo && user?.businessName ? (
                <Link href="/dashboard">
                  <div className="w-16 h-16 md:w-18 md:h-18 bg-tradie-blue rounded-lg flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                    <span className="text-white font-bold text-lg">{user.businessName.slice(0, 2).toUpperCase()}</span>
                  </div>
                </Link>
              ) : (
                <Link href="/dashboard">
                  <img 
                    src={blueTradieLogo} 
                    alt="Blue Tradie Logo" 
                    className="h-16 w-16 md:h-18 md:w-18 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                  />
                </Link>
              )}
              <div>
                <h1 className="text-2xl font-bold text-tradie-blue">
                  {user?.businessName || "Blue Tradie"}
                </h1>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-600">{getRegionalGreeting(user?.country || "Australia")} {firstName}!</p>
                  {user?.country && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex items-center space-x-1 country-indicator">
                      <span>{user.country === "Australia" ? "🇦🇺" : "🇳🇿"}</span>
                      <span>{user.country === "Australia" ? "AU" : "NZ"}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetTour}
                className="text-xs border-gray-300 text-gray-600 hover:bg-gray-50"
                title="Get a quick refresher on how everything works"
              >
                Take the Tour Again
              </Button>
              {/* Upgrade to Pro button temporarily hidden 
              <Link href="/subscribe">
                <Button variant="outline" size="sm" className="border-tradie-blue text-tradie-blue hover:bg-tradie-blue hover:text-white font-medium">
                  🚀 Upgrade to Pro
                </Button>
              </Link>
              */}
              <Link href="/settings" className="settings-link">
                <Button variant="ghost" size="sm" className="navbar-settings">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4">
        {/* Welcome Onboarding & Beta Tips - Very Top */}
        <WelcomeOnboarding />
        
        {/* AI Business Team Panel - Second Priority */}
        <div className="mb-6 ai-agents ai-agents-preview ai-business-team dashboard-welcome">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-tradie-blue" />
              Your AI Business Team
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/chat/accountant">
              <Card className="agent-card-accountant hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-3 text-center">
                  <div className="text-xl mb-1">💸</div>
                  <h4 className="font-medium text-sm">Accountant</h4>
                  <p className="text-xs text-gray-600">GST & Tax</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/chat/marketing">
              <Card className="agent-card-marketing hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-3 text-center">
                  <div className="text-xl mb-1">📣</div>
                  <h4 className="font-medium text-sm">Marketing</h4>
                  <p className="text-xs text-gray-600">Branding & Ads</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/chat/coach">
              <Card className="agent-card-coach hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-3 text-center">
                  <div className="text-xl mb-1">🎯</div>
                  <h4 className="font-medium text-sm">Business Coach</h4>
                  <p className="text-xs text-gray-600">Strategy & Goals</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/chat/legal">
              <Card className="agent-card-legal hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-3 text-center">
                  <div className="text-xl mb-1">📜</div>
                  <h4 className="font-medium text-sm">Legal</h4>
                  <p className="text-xs text-gray-600">Contracts & Safety</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Business Setup Checklist - Fixed at Top Until Complete */}
        <div className="mb-6 business-setup">
          <BusinessSetupChecklist />
        </div>

        {/* Quick Glance at Your Business - Metrics (Primary Business Dashboard) */}
        <div className="mb-6 dashboard-metrics quick-glance-panel">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-tradie-blue">
            <TrendingUp className="h-6 w-6 text-tradie-blue" />
            Quick Glance at Your Business
          </h3>
          <DashboardMetrics data={dashboardData as any} />
        </div>

        {/* Goals & Vision - Compact Version */}
        <div className="mb-6 vision-board">
          <DashboardGoalsVision />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 recent-activity">
          {/* Today's Jobs */}
          <Card className="card-tradie recent-jobs">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-tradie-blue" />
                <span>Today's Jobs</span>
              </CardTitle>
              <Link href="/jobs">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {(dashboardData as any)?.recentJobs?.length > 0 ? (
                <div className="space-y-3">
                  {(dashboardData as any).recentJobs.map((job: any) => (
                    <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{job.customerName}</p>
                        <p className="text-sm text-gray-600">{job.description}</p>
                        <p className="text-xs text-gray-500">
                          {job.scheduledDate ? new Date(job.scheduledDate).toLocaleTimeString() : 'No time set'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          job.status === 'completed' ? 'status-paid' :
                          job.status === 'in_progress' ? 'status-pending' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No jobs scheduled for today</p>
                  <Link href="/jobs">
                    <Button className="mt-3" size="sm">Add a Job</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Invoices */}
          <Card className="card-tradie recent-invoices">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-tradie-orange" />
                <span>Outstanding Invoices</span>
              </CardTitle>
              <Link href="/invoices">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {(dashboardData as any)?.recentInvoices?.length > 0 ? (
                <div className="space-y-3">
                  {(dashboardData as any).recentInvoices.map((invoice: any) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{invoice.customerName}</p>
                        <p className="text-sm text-gray-600">#{invoice.invoiceNumber}</p>
                        <p className="text-xs text-gray-500">
                          Due: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'No due date'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${Number(invoice.total).toFixed(2)}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          invoice.status === 'paid' ? 'status-paid' :
                          invoice.status === 'overdue' ? 'status-overdue' : 'status-pending'
                        }`}>
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No outstanding invoices</p>
                  <Link href="/invoices">
                    <Button className="mt-3" size="sm">Create Invoice</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>



        {/* Expenses Summary */}
        <div className="mb-6 expense-summary">
          <Card className="card-tradie">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Receipt className="h-5 w-5 text-tradie-orange" />
                <span>This Week's Expenses</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">Track business expenses for tax deductions</p>
                <Link href="/expenses">
                  <Button className="mt-3" size="sm">Log Expenses</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Business Journey Roadmap */}
        <div className="mt-8 business-journey">
          <BusinessJourneyRoadmap 
            currentStage={(journeyData as any)?.currentStage || 1}
            completedMilestones={(journeyData as any)?.completedMilestones || []}
          />
        </div>


      </div>

      {/* Quick Chat Dialog */}
      <Dialog open={showQuickChat} onOpenChange={setShowQuickChat}>
        <DialogContent className="max-w-4xl max-h-[90vh] h-[80vh]">
          <DialogHeader>
            <DialogTitle>Chat with AI Assistant</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <EnhancedChatUI />
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Access Panel */}
      <QuickAccessPanel />

      {/* Feedback Widget */}
      <FeedbackWidget />
      


    </div>
  );
}
