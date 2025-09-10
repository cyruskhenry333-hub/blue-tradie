import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppUser } from "@shared/types/user";
import { toAppUser } from "@shared/utils/toAppUser";
import { type JourneyData, toJourneyData } from "@shared/types/journey";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, Circle, Sparkles, MessageSquare, FileText, User, Target } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getRegionalGreeting, getRegionalLetsGo, getRegionalAffirmation } from "@/utils/language-utils";
import { TestimonialForm } from "./testimonial-form";
import { BetaConsentModal } from "./beta-consent-modal";

interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  action?: () => void;
}

interface WelcomeOnboardingProps {
  onTaskComplete?: (taskId: string) => void;
}

export default function WelcomeOnboarding({ onTaskComplete }: WelcomeOnboardingProps) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const [showBetaConsent, setShowBetaConsent] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: userData } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });
  const user = toAppUser(userData);

  const { data: invoices } = useQuery({
    queryKey: ["/api/invoices"],
    retry: false,
  });

  const { data: journeyDataRaw } = useQuery({
    queryKey: ["/api/journey"],
    retry: false,
  });
  const journeyData = toJourneyData(journeyDataRaw);

  const updateOnboardingMutation = useMutation({
    mutationFn: (taskId: string) => apiRequest("POST", `/api/onboarding/task/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    }
  });

  useEffect(() => {
    // Show welcome dialog for new users who have completed onboarding but haven't seen welcome yet
    // Show welcome for all newly onboarded users (including demo users for testing)
    if (user?.id && user?.isOnboarded && !localStorage.getItem(`welcome-shown-${user.id}`)) {
      setShowWelcome(true);
      localStorage.setItem(`welcome-shown-${user.id}`, "true");
    }

    // Auto-detect completed tasks based on user data and journey milestones
    if (user && journeyData) {
      const autoCompletedTasks = [];
      
      // Goals task: Only mark complete if milestone exists in journeyData
      if (journeyData?.completedMilestones?.includes("goals_set")) {
        autoCompletedTasks.push("goals");
      }
      
      // Profile task: Only mark complete if milestone exists in journeyData  
      if (journeyData?.completedMilestones?.includes("profile_completed")) {
        autoCompletedTasks.push("profile");
      }
      
      // Invoice task: Check if user has created any invoices OR completed the milestone
      if ((invoices && Array.isArray(invoices) && invoices.length > 0) || 
          (journeyData?.completedMilestones?.includes("first_invoice_created"))) {
        autoCompletedTasks.push("invoice");
      }

      // Goals task: Mark completed if user has goals set OR completed the goals milestone
      if (journeyData?.completedMilestones?.includes("goals_onboarding_completed") || 
          journeyData?.completedMilestones?.includes("goals_set") || 
          user?.goals) {
        autoCompletedTasks.push("goals");
      }

      // Chat task: Check if user has completed first_ai_chat milestone
      if (journeyData?.completedMilestones?.includes("first_ai_chat")) {
        autoCompletedTasks.push("chat");
      }
      
      // Load saved tasks from localStorage
      const saved = localStorage.getItem(`onboarding-${user.id}`);
      const savedTasks = saved ? JSON.parse(saved) : [];
      
      // Merge auto-completed and saved tasks
      const mergedTasks = [...autoCompletedTasks, ...savedTasks];
      const allCompletedTasks = Array.from(new Set(mergedTasks));
      
      setCompletedTasks(allCompletedTasks);
      
      // Save updated tasks back to localStorage
      localStorage.setItem(`onboarding-${user.id}`, JSON.stringify(allCompletedTasks));
    }
  }, [user, invoices, journeyData]);

  const tasks: OnboardingTask[] = [
    {
      id: "goals",
      title: "Set Your Business Goals & Vision",
      description: "Create a personalized vision board and AI assistant",
      icon: <Target className="h-5 w-5" />,
      completed: completedTasks.includes("goals"),
      action: () => window.location.href = "/goals"
    },
    {
      id: "profile",
      title: "Complete your profile",
      description: "Add your business logo and details",
      icon: <User className="h-5 w-5" />,
      completed: completedTasks.includes("profile"),
      action: () => window.location.href = "/profile"
    },
    {
      id: "invoice",
      title: "Create your first invoice",
      description: "Try the invoice builder with region-specific GST",
      icon: <FileText className="h-5 w-5" />,
      completed: completedTasks.includes("invoice") || Boolean(invoices && Array.isArray(invoices) && invoices.length > 0),
      action: () => window.location.href = "/invoices"
    },
    {
      id: "chat",
      title: "Chat with your AI Business Coach",
      description: `Get personalized business advice using your goals`,
      icon: <MessageSquare className="h-5 w-5" />,
      completed: completedTasks.includes("chat"),
      action: () => window.location.href = "/chat/coach"
    }
  ];

  const markTaskComplete = (taskId: string) => {
    if (!completedTasks.includes(taskId)) {
      const updated = [...completedTasks, taskId];
      setCompletedTasks(updated);
      localStorage.setItem(`onboarding-${user?.id}`, JSON.stringify(updated));
      updateOnboardingMutation.mutate(taskId);
      onTaskComplete?.(taskId);
    }
  };

  const completedCount = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;

  if (!user || !user.isOnboarded) return null;

  return (
    <>
      {/* Welcome Dialog */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="max-w-lg dialog-overlay" style={{ zIndex: 100000 }}>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>🎉</span>
              <span>Welcome to Blue Tradie!</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              {getRegionalGreeting(user.country || "Australia")}! Thanks for joining our beta. 
              Blue Tradie is built specifically for {user.country === "Australia" ? "Aussie" : "Kiwi"} tradies like you.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">What's special about your region:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• GST automatically set to {user.country === "New Zealand" ? "15%" : "10%"}</li>
                <li>• AI agents trained on {user.country === "Australia" ? "ATO" : "IRD"} regulations</li>
                <li>• Contract templates for {user.country} law</li>
              </ul>
            </div>
            <p className="text-sm text-gray-600">
              Ready to get started? Check out the setup checklist below to make the most of your new platform.
            </p>
            <div className="flex space-x-2">
              <Button 
                onClick={() => {
                  // Set tour flag and close modal simultaneously for immediate transition
                  localStorage.setItem('blue-tradie-start-tour-after-welcome', 'true');
                  setShowWelcome(false);
                  // Start tour immediately without delay to prevent flash
                  requestAnimationFrame(() => {
                    window.dispatchEvent(new CustomEvent('start-tour-after-welcome'));
                  });
                  // Show testimonial form after user has had time to explore (5 minutes)
                  setTimeout(() => setShowTestimonialForm(true), 300000);
                }} 
                className="flex-1 btn-tradie-primary"
              >
                {getRegionalLetsGo(user.country || "Australia")}!
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Onboarding Checklist Card */}
      {completedCount < totalTasks && (
        <Card className="mb-6 border-l-4 border-l-tradie-blue">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Getting Started Checklist</CardTitle>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {completedCount}/{totalTasks} Complete
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-tradie-blue h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedCount / totalTasks) * 100}%` }}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                <button
                  onClick={() => markTaskComplete(task.id)}
                  className="flex-shrink-0"
                >
                  {task.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400 hover:text-tradie-blue" />
                  )}
                </button>
                <div className="flex-shrink-0 text-tradie-blue">
                  {task.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${task.completed ? 'text-green-700 line-through' : 'text-gray-900'}`}>
                    {task.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    {task.description}
                  </p>
                </div>
                {!task.completed && task.action && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={task.action}
                    className="flex-shrink-0"
                  >
                    Start
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Testimonial Form */}
      <TestimonialForm 
        isOpen={showTestimonialForm} 
        onClose={() => setShowTestimonialForm(false)}
        trigger="onboarding"
      />
    </>
  );
}