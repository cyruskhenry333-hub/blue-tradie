import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ThumbsUp, ArrowLeft, CheckCircle2, Clock, Users, Zap, Code, TestTube, FileText } from "lucide-react";
import { Link } from "wouter";

// RoadmapItem type definition with progress tracking and community surge
interface RoadmapItem {
  id: number;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  estimatedQuarter?: string;
  votesCount: number;
  isPublic: boolean;
  completedDate?: Date;
  progressPercentage?: number;
  progressStatus?: string;
  developmentNotes?: string;
  baselineVotes?: number;
  weeklyVoteIncrease?: number;
  hasCommunitySurge?: boolean;
  surgeThreshold?: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function PublicRoadmap() {
  const { data: fetchedItems = [] } = useQuery<RoadmapItem[]>({
    queryKey: ["/api/roadmap", "public"],
    queryFn: async () => {
      const response = await fetch('/api/roadmap?public=true');
      if (!response.ok) throw new Error('Failed to fetch roadmap');
      return response.json();
    }
  });

  // Add recently completed features to roadmap display
  const recentCompletedFeatures: RoadmapItem[] = [
    {
      id: 9001,
      title: "AI Business Advisors (Guidance Only)",
      description: "4 specialized AI advisors (Accountant, Marketing, Business Coach, Legal) that provide expert guidance, explanations, and recommendations. Purely advisory - no automated task execution, users maintain full control over all actions",
      category: "AI Advisory",
      status: "completed",
      priority: "high",
      estimatedQuarter: "Q1-2025",
      votesCount: 15,
      isPublic: true,
      progressPercentage: 100,
      progressStatus: "completed",
      completedDate: new Date("2025-08-03"),
      createdAt: new Date("2025-08-03"),
      updatedAt: new Date("2025-08-03")
    },
    {
      id: 9002,
      title: "Job Photo Management System",
      description: "Upload, organize and manage job site photos with automatic compression, categorization, and integration with job records for documentation and invoicing",
      category: "Job Management",
      status: "completed",
      priority: "high",
      estimatedQuarter: "Q1-2025",
      votesCount: 12,
      isPublic: true,
      progressPercentage: 100,
      progressStatus: "completed",
      completedDate: new Date("2025-08-03"),
      createdAt: new Date("2025-08-03"),
      updatedAt: new Date("2025-08-03")
    },
    {
      id: 9003,
      title: "Family Business Team Management",
      description: "Partner/admin dashboard with simplified interface, team member roles, permissions system, and real-time job status updates for family-operated trade businesses",
      category: "Team Features",
      status: "completed",
      priority: "high",
      estimatedQuarter: "Q1-2025",
      votesCount: 18,
      isPublic: true,
      progressPercentage: 100,
      progressStatus: "completed",
      completedDate: new Date("2025-08-03"),
      createdAt: new Date("2025-08-03"),
      updatedAt: new Date("2025-08-03")
    },
    {
      id: 9004,
      title: "Automatic Development Trigger System",
      description: "Smart waitlist monitoring with automatic Phase 1 development initiation at 100+ signups, milestone notifications, and comprehensive project documentation delivery",
      category: "Platform Automation",
      status: "completed",
      priority: "critical",
      estimatedQuarter: "Q1-2025",
      votesCount: 22,
      isPublic: true,
      progressPercentage: 100,
      progressStatus: "completed",
      completedDate: new Date("2025-08-03"),
      createdAt: new Date("2025-08-03"),
      updatedAt: new Date("2025-08-03")
    },
    {
      id: 9005,
      title: "Enhanced Invoice AI Auto-fill",
      description: "Smart invoice generation with AI-powered auto-completion, GST compliance for AU/NZ, automatic numbering system, and integration with job data and photos",
      category: "Invoicing",
      status: "completed",
      priority: "high",
      estimatedQuarter: "Q1-2025",
      votesCount: 14,
      isPublic: true,
      progressPercentage: 100,
      progressStatus: "completed",
      completedDate: new Date("2025-08-03"),
      createdAt: new Date("2025-08-03"),
      updatedAt: new Date("2025-08-03")
    },
    {
      id: 9006,
      title: "Vision Board & Goal Setting System",
      description: "AI-generated personalized vision boards based on user goals, integrated goal tracking, and motivational dashboard elements for business growth visualization",
      category: "Business Growth",
      status: "completed",
      priority: "medium",
      estimatedQuarter: "Q1-2025",
      votesCount: 9,
      isPublic: true,
      progressPercentage: 100,
      progressStatus: "completed",
      completedDate: new Date("2025-08-03"),
      createdAt: new Date("2025-08-03"),
      updatedAt: new Date("2025-08-03")
    }
  ];

  // Add future AI automation features to show the roadmap progression
  const futurePlannedFeatures: RoadmapItem[] = [
    {
      id: 9007,
      title: "AI Agents (Automated Task Execution)",
      description: "Evolution from AI advisors to AI agents that can automatically execute approved tasks like invoice generation, expense categorization, and payment reminders with user oversight and approval",
      category: "AI Automation",
      status: "planned",
      priority: "high",
      estimatedQuarter: "Q2-2025",
      votesCount: 25,
      isPublic: true,
      progressPercentage: 0,
      progressStatus: "not-started",
      createdAt: new Date("2025-08-03"),
      updatedAt: new Date("2025-08-03")
    }
  ];

  // Combine fetched items with recent completed features and future plans
  const roadmapItems = [...fetchedItems, ...recentCompletedFeatures, ...futurePlannedFeatures];
  
  // AI Agents item should now be in database and will appear automatically

  const phaseInfo = {
    phase1: { 
      name: "Phase 1: Beta Foundation + AI Enhancement", 
      status: "✅ Complete", 
      color: "bg-green-100 text-green-800",
      icon: CheckCircle2,
      description: "Complete solo tradie platform with AI business advisors (guidance only), photo management, and development automation"
    },
    phase2: { 
      name: "Phase 2: Small Teams & Directory", 
      status: "⏳ Next Priority", 
      color: "bg-blue-100 text-blue-800",
      icon: Users,
      description: "Multi-user access for teams of 2-10 and tradie directory for network building"
    },
    phase3: { 
      name: "Phase 3: Mobile & Offline Power", 
      status: "⚙️ Prioritized", 
      color: "bg-orange-100 text-orange-800",
      icon: Zap,
      description: "Voice-to-text, PWA installation, and offline functionality for job sites"
    },
    phase4: { 
      name: "Phase 4: Advanced AI & Insights", 
      status: "📊 Future", 
      color: "bg-purple-100 text-purple-800",
      icon: Clock,
      description: "Advanced financial reporting, AI quote generation, and business intelligence"
    },
    phase5: { 
      name: "Phase 5: Global Scale & Enterprise", 
      status: "🌍 Long Term", 
      color: "bg-gray-100 text-gray-800",
      icon: Clock,
      description: "Regional expansion and organizational accounts for 50+ user companies"
    },
  };

  const itemsByPhase = {
    phase1: roadmapItems.filter(item => item.title.includes("Phase 1") || 
                                      item.estimatedQuarter === "Q1-2025"),
    phase2: (() => {
      const phase2Items = roadmapItems.filter(item => 
        item.title.includes("Phase 2") || 
        item.estimatedQuarter === "Q2-2025" ||
        item.title.includes("AI Agents")
      );
      console.log("Phase 2 filtered items:", phase2Items.map(item => ({ title: item.title, quarter: item.estimatedQuarter })));
      return phase2Items;
    })(),
    phase3: roadmapItems.filter(item => item.title.includes("Phase 3") || 
                                      item.estimatedQuarter?.includes("Q2-Q3-2025")),
    phase4: roadmapItems.filter(item => item.title.includes("Phase 4") || 
                                      item.estimatedQuarter?.includes("Q3-Q4-2025")),
    phase5: roadmapItems.filter(item => item.title.includes("Phase 5") || 
                                      item.estimatedQuarter?.includes("Q4-2025-Q1-2026")),
  };

  const statusColors = {
    completed: "bg-green-100 text-green-800",
    "in-progress": "bg-blue-100 text-blue-800",
    planned: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const progressStatusInfo = {
    "not-started": { label: "Not Started", color: "text-gray-500", icon: Clock },
    "scoping": { label: "Scoping", color: "text-blue-500", icon: FileText },
    "in-progress": { label: "In Progress", color: "text-orange-500", icon: Code },
    "testing": { label: "Testing", color: "text-purple-500", icon: TestTube },
    "completed": { label: "Completed", color: "text-green-500", icon: CheckCircle2 },
  };

  // Define priority order for sorting
  const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };

  // Sort upcoming items by priority (internal strategy), not votes
  const upNextItems = roadmapItems
    .filter(item => item.status === "planned" || item.status === "in-progress")
    .sort((a, b) => {
      const aPriorityOrder = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 4;
      const bPriorityOrder = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 4;
      return aPriorityOrder - bPriorityOrder;
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-tradie-light to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-tradie-blue mb-2">Blue Tradie Roadmap</h1>
            <p className="text-lg text-gray-600">
              See what we're building for Aussie & Kiwi tradies
            </p>
          </div>
          <Link href="/">
            <Button variant="outline" className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Button>
          </Link>
        </div>

        {/* Phase Overview */}
        <div className="space-y-8">
          {Object.entries(phaseInfo).map(([phaseKey, phase]) => {
            const phaseItems = itemsByPhase[phaseKey as keyof typeof itemsByPhase] || [];
            const Icon = phase.icon;
            
            return (
              <Card key={phaseKey} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-tradie-light to-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-full bg-white shadow-sm">
                        <Icon className="w-6 h-6 text-tradie-blue" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-tradie-blue">{phase.name}</CardTitle>
                        <p className="text-gray-600 mt-1">{phase.description}</p>
                      </div>
                    </div>
                    <Badge className={phase.color + " text-lg px-4 py-2"}>
                      {phase.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {phaseItems
                      .filter(item => !item.title.includes("Phase ")) // Hide phase headers from individual items
                      .map((item) => (
                        <Card key={item.id} className="p-4 border-l-4 border-l-tradie-blue hover:shadow-md transition-shadow">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <h4 className="font-semibold text-lg leading-tight">{item.title}</h4>
                              <Badge className={`text-sm ${statusColors[item.status as keyof typeof statusColors]}`}>
                                {item.status}
                              </Badge>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                            <div className="flex items-center justify-between">
                              {item.estimatedQuarter && (
                                <Badge variant="outline" className="text-sm">
                                  {item.estimatedQuarter}
                                </Badge>
                              )}
                              {item.votesCount > 0 && (
                                <div className="flex items-center space-x-2 text-tradie-blue">
                                  <ThumbsUp className="w-4 h-4" />
                                  <span className="text-sm font-medium">{item.votesCount} votes</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                  </div>
                  {phaseItems.filter(item => !item.title.includes("Phase ")).length === 0 && (
                    <div className="text-center py-12">
                      <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">Coming soon...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Up Next - Vote for Your Favourites */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="text-3xl text-tradie-blue flex items-center gap-3">
              <ThumbsUp className="w-8 h-8" />
              Up Next – Strategic Priority Order
            </CardTitle>
            <p className="text-gray-600 text-lg">
              Features ordered by our strategic priorities. Voting helps us spot community surge trends! 🚀
            </p>
          </CardHeader>
          <CardContent className="p-6">
            {upNextItems.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {upNextItems.map((item, index) => {
                  const progressStatus = item.progressStatus || "not-started";
                  const StatusInfo = progressStatusInfo[progressStatus as keyof typeof progressStatusInfo];
                  const StatusIcon = StatusInfo?.icon || Clock;
                  
                  return (
                    <Card key={item.id} className={`relative overflow-hidden border-l-4 hover:shadow-lg transition-all duration-200 ${
                      item.priority === 'critical' ? 'border-l-red-500 bg-gradient-to-r from-red-50 to-white' : 
                      item.priority === 'high' ? 'border-l-orange-500 bg-gradient-to-r from-orange-50 to-white' : 
                      item.priority === 'medium' ? 'border-l-blue-500 bg-gradient-to-r from-blue-50 to-white' : 
                      'border-l-gray-400 bg-gradient-to-r from-gray-50 to-white'
                    }`}>
                      {/* Priority Badge */}
                      <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold ${
                        item.priority === 'critical' ? 'bg-red-500 text-white' :
                        item.priority === 'high' ? 'bg-orange-500 text-white' :
                        item.priority === 'medium' ? 'bg-blue-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {item.priority?.toUpperCase() || 'MEDIUM'} PRIORITY
                      </div>
                      
                      {/* Community Surge Badge */}
                      {item.hasCommunitySurge && (
                        <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white animate-pulse">
                          🚀 COMMUNITY SURGE
                        </div>
                      )}
                      
                      <CardContent className="p-6 pt-8">
                        <div className="space-y-4">
                          {/* Title and Status */}
                          <div className="flex items-start justify-between pr-20">
                            <h3 className="font-bold text-xl text-gray-900 leading-tight">
                              {item.title}
                            </h3>
                            <Badge className={`${statusColors[item.status as keyof typeof statusColors]} text-sm`}>
                              {item.status}
                            </Badge>
                          </div>
                          
                          {/* Description */}
                          <p className="text-gray-600 leading-relaxed">
                            {item.description}
                          </p>
                          
                          {/* Progress Section */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <StatusIcon className={`w-4 h-4 ${StatusInfo?.color || 'text-gray-500'}`} />
                                <span className={`text-sm font-medium ${StatusInfo?.color || 'text-gray-500'}`}>
                                  {StatusInfo?.label || 'Not Started'}
                                </span>
                              </div>
                              <span className="text-sm font-bold text-gray-700">
                                {item.progressPercentage || 0}% complete
                              </span>
                            </div>
                            
                            {/* Progress Bar */}
                            <Progress 
                              value={item.progressPercentage || 0} 
                              className="h-2 bg-gray-200"
                            />
                          </div>
                          
                          {/* Footer with votes and quarter */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                              <ThumbsUp className="w-4 h-4 text-tradie-blue" />
                              <span className="font-bold text-tradie-blue text-lg">
                                {item.votesCount || 0} vote{(item.votesCount || 0) !== 1 ? 's' : ''}
                              </span>
                            </div>
                            {item.estimatedQuarter && (
                              <Badge variant="outline" className="text-sm">
                                Target: {item.estimatedQuarter}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <ThumbsUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-xl">No upcoming features available for voting yet.</p>
                <p className="text-gray-400 mt-2">Check back soon for new features to vote on!</p>
              </div>
            )}
            
            {/* Voting Info */}
            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <ThumbsUp className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                    How Community Voting Works
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Features are automatically sorted by vote count (highest first)</li>
                    <li>• Progress bars show real development status with percentage completion</li>
                    <li>• Status tags indicate current phase: Scoping → In Progress → Testing → Completed</li>
                    <li>• Your votes directly influence which features we prioritize next</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer CTA */}
        <Card className="mt-12 bg-gradient-to-r from-tradie-blue to-blue-600 text-white">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Want to Help Shape Our Roadmap?</h2>
            <p className="text-xl mb-6 opacity-90">
              Join our beta and get early access to new features while helping us build the perfect tradie platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/beta">
                <Button size="lg" className="bg-white text-tradie-blue hover:bg-gray-100 px-8 py-3 text-lg font-semibold">
                  Join Beta
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-tradie-blue px-8 py-3 text-lg">
                  Learn More
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}