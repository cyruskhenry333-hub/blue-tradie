import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Onboarding from "@/pages/onboarding";
import Chat from "@/pages/chat";
import Invoices from "@/pages/invoices";
import Subscribe from "@/pages/subscribe";
import NotFound from "@/pages/not-found";
import JobsPage from "@/pages/jobs";
import BetaSignup from "@/pages/beta-signup";
import ThreeTierBetaSignup from "@/components/ThreeTierBetaSignup";
import AdminAnalytics from "@/pages/admin-analytics";
import AdminRoadmap from "@/pages/admin-roadmap";
import AdminUsers from "@/pages/admin-users";
import PublicRoadmap from "@/pages/public-roadmap";
import Profile from "@/pages/profile";
import GoalsOnboarding from "@/pages/goals-onboarding";
import Settings from "@/pages/settings";
import WaitlistPage from "@/pages/waitlist";
import DemoDashboard from "@/pages/demo-dashboard";
import DemoDashboardAdvanced from "@/pages/demo-dashboard-advanced";
import ClientPortal from "@/pages/ClientPortal";
import Migration from "@/pages/migration";
import TestimonialPage from "@/pages/testimonial";

import AdminUsagePage from "@/pages/admin-usage";

import AIVirtualAssistant from "@/components/AIVirtualAssistant";
import QuickAccessPanel from "@/components/QuickAccessPanel";
import ExpensesPage from "@/pages/expenses";
import Logbook from "@/pages/logbook";
import GuidedTour from "@/components/guided-tour";
import FeedbackWidget from "@/components/feedback-widget";
import ReferralDashboard from "@/pages/referral-dashboard";
import DemoLogin from "@/pages/demo-login";
import DemoPage from "@/pages/demo";
import DemoRequestPage from "@/pages/demo-request";
import InvoicePaid from "@/pages/invoice-paid";
import InvoiceCancelled from "@/pages/invoice-cancelled";
import EarlyAccessSent from "@/pages/early-access-sent-simple";
import EarlyAccessError from "@/pages/early-access-error-simple";
import DemoAccessConfirmed from "@/pages/demo-access-confirmed";
import TestEmailButton from "@/pages/test-email-button";
import AIAdvisors from "@/pages/ai-advisors";
import TradieDirectory from "@/pages/tradie-directory";
import Automation from "@/pages/automation";
import BusinessInsights from "@/pages/business-insights";
import Quotes from "@/pages/quotes";
import CustomerPortal from "@/pages/customer-portal";
import Team from "@/pages/team";
import CalendarPage from "@/pages/calendar";
import DocumentsPage from "@/pages/documents";
import Tax from "@/pages/tax";
import VoiceQuote from "@/pages/voice-quote";
import Signup from "@/pages/signup";
import Welcome from "@/pages/welcome";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import Contact from "@/pages/contact";
import Help from "@/pages/help";
import { useGuidedTour } from "@/hooks/useGuidedTour";
import { VersionFooter } from "@/components/VersionFooter";
import { initPWA } from "@/utils/pwa";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { showTour, closeTour } = useGuidedTour();

  // Initialize PWA on mount
  useEffect(() => {
    initPWA();
  }, []);

  // Check if user needs onboarding flow  
  useEffect(() => {
    if (isAuthenticated && user && !user.isOnboarded) {
      // Don't show OnboardingFlow popup - users go directly to /onboarding route instead
      setShowOnboarding(false);
    }
  }, [isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <Switch>
        {/* Global routes available in both auth states for seamless transitions */}
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/demo-login" component={DemoLogin} />
        <Route path="/demo-dashboard" component={DemoDashboard} />
        <Route path="/invoice-paid" component={InvoicePaid} />
        <Route path="/invoice-cancelled" component={InvoiceCancelled} />
        <Route path="/invoice/success" component={InvoicePaid} />
        <Route path="/invoice/cancel" component={InvoiceCancelled} />
        <Route path="/demo-dashboard-advanced" component={DemoDashboardAdvanced} />
        
        {!isAuthenticated ? (
          <>
            <Route path="/demo" component={DemoPage} />
            <Route path="/beta" component={ThreeTierBetaSignup} />
            <Route path="/waitlist" component={WaitlistPage} />
            <Route path="/early-access-sent" component={EarlyAccessSent} />
            <Route path="/early-access-error" component={EarlyAccessError} />
            <Route path="/demo-access-confirmed" component={DemoAccessConfirmed} />
            <Route path="/test-email-button" component={TestEmailButton} />
            <Route path="/roadmap" component={PublicRoadmap} />
            <Route path="/client/:jobId/:token" component={ClientPortal} />
            <Route path="/portal" component={CustomerPortal} />

            {/* Redirects */}
            <Route path="/vip" component={() => { window.location.href = '/demo'; return null; }} />
            <Route path="/early-access" component={() => { window.location.href = '/demo'; return null; }} />

            <Route path="/" component={Landing} />
            <Route path="/signup" component={Signup} />
            <Route path="/welcome" component={Welcome} />
            <Route path="/terms" component={Terms} />
            <Route path="/privacy" component={Privacy} />
            <Route path="/contact" component={Contact} />
            <Route path="/help" component={Help} />
            <Route path="/demo-request" component={DemoRequestPage} />
          </>
        ) : (
          <>
            {user && !user.isOnboarded ? (
              <Route path="/" component={Onboarding} />
            ) : (
              <>
                <Route path="/" component={Dashboard} />
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/chat/:agentType?" component={Chat} />
                <Route path="/invoices" component={Invoices} />
                <Route path="/quotes" component={Quotes} />
                <Route path="/jobs" component={JobsPage} />
                <Route path="/expenses" component={ExpensesPage} />
                <Route path="/logbook" component={Logbook} />
                <Route path="/profile" component={Profile} />
                <Route path="/goals" component={GoalsOnboarding} />
                <Route path="/subscribe" component={Subscribe} />
                <Route path="/admin" component={AdminAnalytics} />
                <Route path="/admin/roadmap" component={AdminRoadmap} />
                <Route path="/admin/users" component={AdminUsers} />
                <Route path="/admin-usage" component={AdminUsagePage} />
                <Route path="/roadmap" component={PublicRoadmap} />
                <Route path="/migration" component={Migration} />
                <Route path="/settings" component={Settings} />
                <Route path="/testimonial" component={TestimonialPage} />
                <Route path="/referrals" component={ReferralDashboard} />
                <Route path="/ai-advisors" component={AIAdvisors} />
                <Route path="/insights" component={BusinessInsights} />
                <Route path="/directory" component={TradieDirectory} />
                <Route path="/automation" component={Automation} />
                <Route path="/team" component={Team} />
                <Route path="/calendar" component={CalendarPage} />
                <Route path="/documents" component={DocumentsPage} />
                <Route path="/tax" component={Tax} />
                <Route path="/voice-quote" component={VoiceQuote} />

              </>
            )}
          </>
        )}
        
        <Route component={NotFound} />
      </Switch>



      {/* Persistent components for authenticated users - OUTSIDE Switch for true persistence */}
      {isAuthenticated && (
        <>
          <QuickAccessPanel />
          <AIVirtualAssistant />
          <FeedbackWidget />
          {/* Global tour component - persists across all authenticated pages */}
          <GuidedTour 
            isOpen={showTour} 
            onClose={closeTour} 
            autoStart={true}
          />
        </>
      )}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <VersionFooter />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
