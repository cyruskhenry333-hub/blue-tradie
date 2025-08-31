import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  DollarSign,
  Calendar,
  Users,
  Plus,
  Eye,
  Lock,
  Play,
  BarChart3,
  Compass,
  Lightbulb,
  Trophy,
  Star,
  MapPin,
  Heart,
  Plane,
  Home,
  Car,
  Camera,
  Briefcase
} from "lucide-react";
import { Link } from "wouter";

// Demo data matching the original sophisticated dashboard
const demoUser = {
  firstName: "Demo",
  lastName: "User",
  businessName: "Demo Electrical Services",
  trade: "Electrician",
  country: "Australia",
  onboardingProgress: 75
};

const demoGoals = {
  financial: {
    monthlyTarget: 8000,
    currentRevenue: 5200,
    targetRevenue: 120000,
    targetClients: 50,
    currentClients: 32
  },
  work: {
    workLifeBalance: "better",
    weeklyHours: 40,
    businessGrowth: "scale"
  },
  personal: {
    holiday: "Bali vacation", 
    holidayActivity: "relaxing on beaches",
    purchase: "new ute",
    timeframe: "12 months"
  },
  vision: "Building a successful electrical business that generates $8000/month while maintaining work-life balance for family time"
};

const demoVisionBoard = [
  {
    id: "1",
    category: "Financial",
    title: "Monthly Income Goal",
    description: "Earning $8,000/month consistently",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop",
    progress: 65,
    priority: "high"
  },
  {
    id: "2",
    category: "Personal",
    title: "Bali Vacation",
    description: "Relaxing family holiday in Bali",
    image: "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=400&h=300&fit=crop",
    progress: 20,
    priority: "medium"
  },
  {
    id: "3",
    category: "Business",
    title: "New Work Ute",
    description: "Professional vehicle for job sites",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    progress: 40,
    priority: "high"
  },
  {
    id: "4",
    category: "Personal",
    title: "Work-Life Balance",
    description: "Quality time with family",
    image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=300&fit=crop",
    progress: 55,
    priority: "medium"
  },
  {
    id: "5",
    category: "Financial",
    title: "Business Growth",
    description: "Expand to 50+ regular clients",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
    progress: 64,
    priority: "high"
  },
  {
    id: "6",
    category: "Business",
    title: "Professional Setup",
    description: "Fully equipped electrical business",
    image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop",
    progress: 75,
    priority: "medium"
  }
];

const demoMilestones = [
  { id: "profile", title: "Complete your profile", completed: true, description: "Business details and regional setup" },
  { id: "goals", title: "Set business and personal goals", completed: true, description: "Financial targets and vision planning" },
  { id: "first_invoice", title: "Create your first invoice", completed: true, description: "Professional invoicing system" },
  { id: "ai_chat", title: "Chat with an AI agent", completed: true, description: "Get business advice from AI assistants" },
  { id: "first_job", title: "Add your first job", completed: false, description: "Track jobs and customer details" },
  { id: "expense_tracking", title: "Track business expenses", completed: false, description: "Monitor costs and GST claims" },
  { id: "weekly_review", title: "Complete weekly business review", completed: false, description: "Analyze performance and plan ahead" }
];

const demoBusinessMetrics = {
  weeklyIncome: 3240,
  monthlyIncome: 12960,
  outstandingAmount: 1580,
  totalJobs: 47,
  completedJobs: 42,
  activeJobs: 5,
  avgJobValue: 275,
  clientSatisfaction: 4.8
};

const demoSetupChecklist = [
  { id: "abn", title: "ABN Registration", completed: true, description: "Australian Business Number verified" },
  { id: "gst", title: "GST Registration", completed: true, description: "Registered for 10% GST" },
  { id: "insurance", title: "Public Liability Insurance", completed: false, description: "Professional indemnity coverage" },
  { id: "bank", title: "Business Bank Account", completed: true, description: "Separate business banking" },
  { id: "tools", title: "Essential Tools & Equipment", completed: false, description: "Professional electrical tools" }
];

export default function DemoDashboardAdvanced() {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [activeTourStep, setActiveTourStep] = useState<number | null>(null);
  const [showTour, setShowTour] = useState(false);

  const handleLockedClick = (feature: string) => {
    setShowTooltip(feature);
    setTimeout(() => setShowTooltip(null), 2500);
  };

  const startDemoTour = () => {
    setShowTour(true);
    setActiveTourStep(1);
  };

  const nextTourStep = () => {
    if (activeTourStep && activeTourStep < 8) {
      setActiveTourStep(activeTourStep + 1);
    } else {
      setShowTour(false);
      setActiveTourStep(null);
    }
  };

  const LockedButton = ({ children, feature, className = "" }: { 
    children: React.ReactNode; 
    feature: string; 
    className?: string; 
  }) => (
    <div className="relative">
      <Button 
        className={`${className} cursor-not-allowed opacity-75 relative`}
        onClick={() => handleLockedClick(feature)}
        disabled
      >
        {children}
        <Lock className="w-4 h-4 ml-2" />
      </Button>
      {showTooltip === feature && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-sm px-3 py-2 rounded shadow-lg z-10 whitespace-nowrap">
          Sign up to activate this feature
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-black"></div>
        </div>
      )}
    </div>
  );

  const TourOverlay = ({ step, title, description, target }: {
    step: number;
    title: string;
    description: string;
    target: string;
  }) => {
    if (!showTour || activeTourStep !== step) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              {step}
            </div>
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <p className="text-gray-600 mb-6">{description}</p>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => { setShowTour(false); setActiveTourStep(null); }}>
              Skip Tour
            </Button>
            <Button onClick={nextTourStep}>
              {step === 8 ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Demo Header Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <Eye className="w-4 h-4" />
            <span>ADVANCED DEMO MODE - Full Feature Preview</span>
            <span className="hidden sm:inline">• Experience the complete Blue Tradie dashboard</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded text-white flex items-center justify-center font-bold">
              BT
            </div>
            <span className="text-xl font-bold text-gray-900">Blue Tradie</span>
            <span className="text-sm bg-orange-100 text-orange-700 px-2 py-1 rounded">DEMO</span>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={startDemoTour} variant="outline" className="text-blue-600">
              <Play className="w-4 h-4 mr-2" />
              Start Tour
            </Button>
            <Link href="/">
              <Button variant="outline">← Back to Homepage</Button>
            </Link>
            <Link href="/waitlist">
              <Button className="bg-orange-600 hover:bg-orange-700">Sign Up Now</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8 dashboard-welcome">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {demoUser.firstName}! 👋
          </h1>
          <p className="text-gray-600">Here's what's happening with {demoUser.businessName} today</p>
        </div>

        {/* Business Setup Checklist */}
        <Card className="mb-6 business-setup">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Business Setup Checklist
              </span>
              <Badge variant="secondary">{demoSetupChecklist.filter(item => item.completed).length}/{demoSetupChecklist.length} Complete</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {demoSetupChecklist.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {item.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-orange-500" />
                    )}
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                  {!item.completed && (
                    <LockedButton feature={`setup-${item.id}`} className="text-sm">
                      Complete
                    </LockedButton>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Business Metrics Dashboard */}
        <Card className="mb-6 dashboard-metrics">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Quick Glance at Your Business
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-green-600">${demoBusinessMetrics.weeklyIncome.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-blue-600">${demoBusinessMetrics.monthlyIncome.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-orange-600">${demoBusinessMetrics.outstandingAmount.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold text-purple-600">{demoBusinessMetrics.activeJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goals & Vision Board */}
        <Card className="mb-6 vision-board">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Your Vision & Goals
              </span>
              <LockedButton feature="edit-goals" className="text-sm">
                Edit Goals
              </LockedButton>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Vision Statement */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-900 mb-2">Your Vision</h4>
              <p className="text-blue-800 italic">"{demoGoals.vision}"</p>
            </div>

            {/* Goals Progress */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h5 className="font-medium mb-2">Monthly Revenue Goal</h5>
                <div className="flex items-center gap-3">
                  <Progress value={(demoGoals.financial.currentRevenue / demoGoals.financial.monthlyTarget) * 100} className="flex-1" />
                  <span className="text-sm font-medium">${demoGoals.financial.currentRevenue}/${demoGoals.financial.monthlyTarget}</span>
                </div>
              </div>
              <div>
                <h5 className="font-medium mb-2">Client Growth Goal</h5>
                <div className="flex items-center gap-3">
                  <Progress value={(demoGoals.financial.currentClients / demoGoals.financial.targetClients) * 100} className="flex-1" />
                  <span className="text-sm font-medium">{demoGoals.financial.currentClients}/{demoGoals.financial.targetClients} clients</span>
                </div>
              </div>
            </div>

            {/* Vision Board Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {demoVisionBoard.map((item) => (
                <div key={item.id} className="relative group cursor-pointer">
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                      <div className="absolute bottom-2 left-2 right-2">
                        <h6 className="text-white font-medium text-sm">{item.title}</h6>
                        <p className="text-white/80 text-xs">{item.description}</p>
                        <div className="mt-1">
                          <Progress value={item.progress} className="h-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Business Journey Roadmap */}
        <Card className="mb-6 business-journey">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-purple-600" />
              Business Journey Roadmap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {demoMilestones.map((milestone, index) => (
                <div key={milestone.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {milestone.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-500">{index + 1}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h6 className="font-medium">{milestone.title}</h6>
                    <p className="text-sm text-gray-600">{milestone.description}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {milestone.completed ? (
                      <Badge variant="default" className="bg-green-100 text-green-700">Complete</Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Business Team */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              Your AI Business Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <LockedButton feature="accountant-chat" className="w-full justify-start bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
                💸 Accountant - "Your monthly revenue is on track! Consider GST optimization strategies."
              </LockedButton>
              <LockedButton feature="marketing-chat" className="w-full justify-start bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                📣 Marketing - "Time to expand your client base! Here's a referral strategy..."
              </LockedButton>
              <LockedButton feature="coach-chat" className="w-full justify-start bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100">
                🎯 Business Coach - "You're 65% to your income goal. Let's optimize your workflow."
              </LockedButton>
              <LockedButton feature="legal-chat" className="w-full justify-start bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100">
                📜 Legal - "Your ABN is sorted. Need help with a client contract template?"
              </LockedButton>
            </div>
          </CardContent>
        </Card>

        {/* Demo CTA */}
        <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Build Your Business Empire?</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              This advanced dashboard shows the full power of Blue Tradie - AI-powered business guidance, 
              goal tracking, milestone management, and comprehensive business tools. Join our waitlist to 
              get priority access when we launch.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/waitlist">
                <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white px-8">
                  Join the Waitlist Now
                </Button>
              </Link>
              <Link href="/">
                <Button size="lg" variant="outline">
                  Back to Homepage
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tour Overlays */}
      <TourOverlay 
        step={1} 
        title="Welcome to Blue Tradie!"
        description="This is your complete business dashboard. Let's take a quick tour of all the features that will help you grow your trade business."
        target="dashboard-welcome"
      />
      <TourOverlay 
        step={2} 
        title="Business Setup Checklist"
        description="Track your business compliance requirements. Blue Tradie automatically checks ABN, GST registration, insurance, and other essentials for Australian tradies."
        target="business-setup"
      />
      <TourOverlay 
        step={3} 
        title="Business Metrics Dashboard"
        description="Your financial health at a glance. Track weekly income, monthly revenue, outstanding invoices, and active jobs - all the numbers that matter."
        target="dashboard-metrics"
      />
      <TourOverlay 
        step={4} 
        title="Vision Board & Goals"
        description="Visualize your dreams and track progress toward your financial and personal goals. The AI creates motivational images based on your aspirations."
        target="vision-board"
      />
      <TourOverlay 
        step={5} 
        title="Business Journey Roadmap"
        description="Follow a step-by-step roadmap from startup to established business. Complete milestones, unlock achievements, and see what's next."
        target="business-journey"
      />
      <TourOverlay 
        step={6} 
        title="AI Business Team"
        description="Get 24/7 advice from AI experts who understand Australian trade businesses. Accountant, Marketing specialist, Business Coach, and Legal advisor."
        target="ai-team"
      />
      <TourOverlay 
        step={7} 
        title="Regional Intelligence"
        description="Everything is automatically customized for Australian/New Zealand tradies - GST rates, legal requirements, tax authorities, and local business practices."
        target="regional"
      />
      <TourOverlay 
        step={8} 
        title="You're Ready to Go!"
        description="That's Blue Tradie - your complete business management platform with AI guidance, goal tracking, and regional expertise. Ready to get your business sorted?"
        target="complete"
      />
    </div>
  );
}