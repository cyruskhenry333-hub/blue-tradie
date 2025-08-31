import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import DemoGuidedTour from "@/components/demo-guided-tour";
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
  Briefcase,
  ArrowRight,
  FileText,
  Receipt,
  MessageSquare,
  User,
  Gavel,
  Globe
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

// Regional business setup checklists
const australianSetupChecklist = [
  { id: "abn", title: "ABN Registration", completed: true, description: "Australian Business Number verified" },
  { id: "gst", title: "GST Registration", completed: true, description: "Registered for 10% GST (>$75k revenue)" },
  { id: "insurance", title: "Public Liability Insurance", completed: false, description: "WorkCover & professional indemnity coverage" },
  { id: "bank", title: "Business Bank Account", completed: true, description: "Separate business banking with Australian bank" },
  { id: "tools", title: "Essential Tools & Equipment", completed: false, description: "Professional electrical tools & AS/NZS compliance" }
];

const newZealandSetupChecklist = [
  { id: "nzbn", title: "NZBN Registration", completed: true, description: "New Zealand Business Number verified" },
  { id: "gst", title: "GST Registration", completed: true, description: "Registered for 15% GST (>$60k revenue)" },
  { id: "insurance", title: "Public Liability Insurance", completed: false, description: "ACC coverage & professional indemnity" },
  { id: "bank", title: "Business Bank Account", completed: true, description: "Separate business banking with NZ bank" },
  { id: "tools", title: "Essential Tools & Equipment", completed: false, description: "Professional electrical tools & NZ standards compliance" }
];

const recentJobs = [
  { id: 1, client: "Smith Residence", type: "Electrical Install", status: "In Progress", value: 450 },
  { id: 2, client: "ABC Warehouse", type: "Safety Inspection", status: "Completed", value: 280 },
  { id: 3, client: "Jones Family", type: "Circuit Repair", status: "Scheduled", value: 320 }
];

const recentInvoices = [
  { id: "INV-001", client: "Smith Residence", amount: 450, status: "Paid", date: "2025-01-25" },
  { id: "INV-002", client: "ABC Warehouse", amount: 280, status: "Overdue", date: "2025-01-20" },
  { id: "INV-003", client: "Local Cafe", amount: 180, status: "Sent", date: "2025-01-23" }
];

// AI Agent rotating prompts to showcase intelligence and usefulness
const aiAgentPrompts = {
  accountant: [
    "Your monthly revenue is on track! Want to review GST optimization?",
    "Would you like me to generate a cash flow summary for this quarter?",
    "Let's reconcile your bank feed — I'll highlight unmatched items."
  ],
  marketing: [
    "Time to expand your client base! Want a referral campaign template?",
    "Would you like me to write a promo post for social media?",
    "There's a long weekend coming up — shall we run a local ad?"
  ],
  coach: [
    "You're 65% to your income goal. Want a 2-minute goal reset?",
    "Let's schedule your weekly check-in.",
    "Would you like to set a new goal for this month?"
  ],
  legal: [
    "Need help writing a subcontractor agreement?",
    "Do you want to update your cancellation terms for new clients?",
    "Your ABN is sorted. Want me to auto-generate a compliant invoice footer?"
  ]
};

export default function DemoDashboard() {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [showDemoTour, setShowDemoTour] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState<'Australia' | 'New Zealand'>('Australia');
  
  // Get the current checklist based on selected region
  const demoSetupChecklist = selectedRegion === 'Australia' ? australianSetupChecklist : newZealandSetupChecklist;

  const handleLockedClick = (feature: string) => {
    setShowTooltip(feature);
    setTimeout(() => setShowTooltip(null), 2500);
  };

  // Rotate AI agent prompts every 4 seconds to show intelligence
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromptIndex((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const LockedButton = ({ children, feature, className = "", removeOpacity = false }: { 
    children: React.ReactNode; 
    feature: string; 
    className?: string;
    removeOpacity?: boolean;
  }) => (
    <div className="relative">
      <Button 
        className={`${className} cursor-not-allowed ${removeOpacity ? '' : 'opacity-75'} relative`}
        onClick={() => handleLockedClick(feature)}
        disabled
      >
        {children}
        <Lock className="w-4 h-4 ml-2" />
      </Button>
      {showTooltip === feature && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-sm px-3 py-2 rounded shadow-lg z-10 whitespace-nowrap">
          Join the waitlist to access this feature
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-black"></div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Demo Header Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <Eye className="w-4 h-4" />
            <span className="block sm:hidden">DEMO MODE</span>
            <span className="hidden sm:block">DEMO MODE - Experience the Complete Blue Tradie Dashboard</span>
            <span className="hidden lg:inline">• All original features restored</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          {/* Mobile Layout */}
          <div className="flex md:hidden items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg text-white flex items-center justify-center font-bold text-sm shadow-sm">
                BT
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-gray-900 leading-tight">Blue Tradie</span>
                <span className="text-xs bg-gradient-to-r from-orange-500 to-orange-600 text-white px-2 py-0.5 rounded-full font-medium">DEMO</span>
              </div>
            </div>
            <Button onClick={() => setShowDemoTour(true)} variant="outline" size="sm" className="text-orange-600 border-orange-300 hover:bg-orange-50 shadow-sm">
              <Play className="w-4 h-4 mr-1" />
              <span className="text-sm font-medium">Tour</span>
            </Button>
          </div>
          
          {/* Desktop Layout */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded text-white flex items-center justify-center font-bold">
                BT
              </div>
              <span className="text-xl font-bold text-gray-900">Blue Tradie</span>
              <span className="text-sm bg-orange-100 text-orange-700 px-2 py-1 rounded">DEMO</span>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={() => setShowDemoTour(true)} variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50">
                <Play className="w-4 h-4 mr-2" />
                Start Tour
              </Button>
              <Link href="/">
                <Button variant="outline">← Back to Homepage</Button>
              </Link>
              <Link href="/waitlist">
                <Button className="bg-orange-600 hover:bg-orange-700">Join Waitlist</Button>
              </Link>
            </div>
          </div>
          
          {/* Mobile Navigation Links (Below main nav) */}
          <div className="md:hidden mt-3 pt-3 border-t border-gray-100 flex gap-3 justify-center">
            <Link href="/">
              <Button variant="outline" size="sm" className="text-sm font-medium px-4">← Home</Button>
            </Link>
            <Link href="/waitlist">
              <Button size="sm" className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-sm font-medium px-4 shadow-sm">Join Waitlist</Button>
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

        {/* AI Business Team - MOVED UP as main selling point */}
        <Card className="mb-6 ai-business-team">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              Your AI Business Team
              <Badge variant="outline" className="ml-2 text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                Live Demo
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Accountant Agent */}
              <Card className="agent-card-accountant h-full hover:shadow-md transition-all cursor-pointer min-h-[200px] md:min-h-[280px] bg-white">
                <CardContent className="p-4 md:p-6 text-center h-full flex flex-col justify-between">
                  <div className="flex-1 flex flex-col justify-center">
                    <DollarSign className="h-8 md:h-12 w-8 md:w-12 text-tradie-success mx-auto mb-3 md:mb-4" />
                    <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-900">💸 Accountant Agent</h3>
                    <p className="text-sm md:text-base text-gray-900 leading-relaxed text-center font-medium md:font-semibold overflow-wrap-break-word whitespace-normal transition-opacity duration-300 ease-in-out pb-3 md:pb-4">
                      "{aiAgentPrompts.accountant[currentPromptIndex]}"
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Marketing Agent */}
              <Card className="agent-card-marketing h-full hover:shadow-md transition-all cursor-pointer min-h-[200px] md:min-h-[280px] bg-white">
                <CardContent className="p-4 md:p-6 text-center h-full flex flex-col justify-between">
                  <div className="flex-1 flex flex-col justify-center">
                    <MessageSquare className="h-8 md:h-12 w-8 md:w-12 text-tradie-orange mx-auto mb-3 md:mb-4" />
                    <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-900">📣 Marketing Agent</h3>
                    <p className="text-sm md:text-base text-gray-900 leading-relaxed text-center font-medium md:font-semibold overflow-wrap-break-word whitespace-normal transition-opacity duration-300 ease-in-out pb-3 md:pb-4">
                      "{aiAgentPrompts.marketing[currentPromptIndex]}"
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Business Coach Agent */}
              <Card className="agent-card-coach h-full hover:shadow-md transition-all cursor-pointer min-h-[200px] md:min-h-[280px] bg-white">
                <CardContent className="p-4 md:p-6 text-center h-full flex flex-col justify-between">
                  <div className="flex-1 flex flex-col justify-center">
                    <User className="h-8 md:h-12 w-8 md:w-12 text-tradie-blue mx-auto mb-3 md:mb-4" />
                    <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-900">🎯 Business Coach</h3>
                    <p className="text-sm md:text-base text-gray-900 leading-relaxed text-center font-medium md:font-semibold overflow-wrap-break-word whitespace-normal transition-opacity duration-300 ease-in-out pb-3 md:pb-4">
                      "{aiAgentPrompts.coach[currentPromptIndex]}"
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Legal Agent */}
              <Card className="agent-card-legal h-full hover:shadow-md transition-all cursor-pointer min-h-[200px] md:min-h-[280px] bg-white">
                <CardContent className="p-4 md:p-6 text-center h-full flex flex-col justify-between">
                  <div className="flex-1 flex flex-col justify-center">
                    <Gavel className="h-8 md:h-12 w-8 md:w-12 text-tradie-danger mx-auto mb-3 md:mb-4" />
                    <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-900">📜 Legal Agent</h3>
                    <p className="text-sm md:text-base text-gray-900 leading-relaxed text-center font-medium md:font-semibold overflow-wrap-break-word whitespace-normal transition-opacity duration-300 ease-in-out pb-3 md:pb-4">
                        "{aiAgentPrompts.legal[currentPromptIndex]}"
                      </p>
                    </div>
                  </CardContent>
                </Card>
            </div>
          </CardContent>
        </Card>

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
            {/* Regional Toggle */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <Label htmlFor="region-toggle" className="text-sm font-medium text-blue-700">
                    Regional Requirements
                  </Label>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <span className={`text-xs md:text-sm whitespace-nowrap ${selectedRegion === 'Australia' ? 'font-semibold text-blue-700' : 'text-gray-600'}`}>
                    🇦🇺 AU
                  </span>
                  <Switch
                    id="region-toggle"
                    checked={selectedRegion === 'New Zealand'}
                    onCheckedChange={(checked) => setSelectedRegion(checked ? 'New Zealand' : 'Australia')}
                  />
                  <span className={`text-xs md:text-sm whitespace-nowrap ${selectedRegion === 'New Zealand' ? 'font-semibold text-blue-700' : 'text-gray-600'}`}>
                    🇳🇿 NZ
                  </span>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Toggle to see region-specific business setup requirements for {selectedRegion}
              </p>
            </div>
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

        {/* Recent Activity */}
        <div className="grid md:grid-cols-2 gap-8 mb-8 recent-activity">
          {/* Recent Jobs */}
          <Card className="recent-jobs">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Jobs</CardTitle>
              <LockedButton feature="view-all-jobs" className="text-sm">
                View All
              </LockedButton>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{job.client}</p>
                      <p className="text-sm text-gray-600">{job.type}</p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={job.status === 'Completed' ? 'default' : job.status === 'In Progress' ? 'secondary' : 'outline'}
                      >
                        {job.status}
                      </Badge>
                      <p className="text-sm font-medium mt-1">${job.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Invoices */}
          <Card className="recent-invoices">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Invoices</CardTitle>
              <LockedButton feature="view-all-invoices" className="text-sm">
                View All
              </LockedButton>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{invoice.id}</p>
                      <p className="text-sm text-gray-600">{invoice.client}</p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={invoice.status === 'Paid' ? 'default' : invoice.status === 'Overdue' ? 'destructive' : 'outline'}
                      >
                        {invoice.status}
                      </Badge>
                      <p className="text-sm font-medium mt-1">${invoice.amount}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>



        {/* Demo CTA */}
        <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Build Your Business Empire?</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              This is the complete Blue Tradie dashboard - AI-powered business guidance, goal tracking, 
              milestone management, and comprehensive business tools. Join our waitlist to get priority 
              access when we launch.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/waitlist">
                <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white px-8">
                  Join the Waitlist Now
                  <ArrowRight className="w-4 h-4 ml-2" />
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

      {/* Demo Guided Tour Component */}
      <DemoGuidedTour 
        isOpen={showDemoTour} 
        onClose={() => setShowDemoTour(false)} 
      />
    </div>
  );
}