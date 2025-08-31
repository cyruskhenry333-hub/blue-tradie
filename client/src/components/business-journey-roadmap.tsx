import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Target, TrendingUp, Award, Briefcase, Home } from 'lucide-react';

interface JourneyStage {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  milestones: string[];
  color: string;
  bgColor: string;
}

interface BusinessJourneyRoadmapProps {
  currentStage: number;
  completedMilestones: string[];
  onStageUpdate?: (stage: number) => void;
}

const journeyStages: JourneyStage[] = [
  {
    id: 1,
    title: "Starting Out",
    description: "Setting the foundations of your business",
    icon: <Briefcase className="w-6 h-6" />,
    milestones: [
      "business_registered",
      "profile_completed", 
      "first_ai_chat",
      "country_selected"
    ],
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200"
  },
  {
    id: 2,
    title: "Getting Set Up", 
    description: "Building your business identity and tools",
    icon: <Target className="w-6 h-6" />,
    milestones: [
      "first_invoice_created",
      "goals_set",
      "logo_created",
      "marketing_started"
    ],
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200"
  },
  {
    id: 3,
    title: "Gaining Confidence",
    description: "Understanding your business flow and growth",
    icon: <TrendingUp className="w-6 h-6" />,
    milestones: [
      "multiple_jobs_completed",
      "cash_flow_understood", 
      "smart_goals_set",
      "regular_ai_usage"
    ],
    color: "text-purple-600",
    bgColor: "bg-purple-50 border-purple-200"
  },
  {
    id: 4,
    title: "Momentum Builder",
    description: "Consistent growth and family goal achievement",
    icon: <Home className="w-6 h-6" />,
    milestones: [
      "consistent_income",
      "expense_tracking",
      "family_goals_set",
      "referrals_made"
    ],
    color: "text-orange-600",
    bgColor: "bg-orange-50 border-orange-200"
  },
  {
    id: 5,
    title: "Confident Owner",
    description: "Thriving business supporting your family's dreams",
    icon: <Award className="w-6 h-6" />,
    milestones: [
      "business_pride",
      "family_support",
      "stress_reduced",
      "mentor_others"
    ],
    color: "text-gold-600",
    bgColor: "bg-yellow-50 border-yellow-200"
  }
];

const milestoneLabels: Record<string, string> = {
  // Stage 1 - Starting Out
  business_registered: "Business registered or side hustle started",
  profile_completed: "Complete business profile (including logo)",
  first_ai_chat: "Chat with your first AI assistant",
  country_selected: "Country and region set up",
  
  // Stage 2 - Getting Set Up
  first_invoice_created: "Create your first invoice",
  goals_set: "Set business and personal goals",
  goals_onboarding_completed: "Complete goals & vision onboarding",
  logo_created: "Design or upload business logo",
  marketing_started: "Start basic marketing activities",
  
  // Stage 3 - Gaining Confidence
  multiple_jobs_completed: "Complete multiple jobs successfully",
  cash_flow_understood: "Understand your cash flow patterns",
  smart_goals_set: "Set SMART business goals",
  regular_ai_usage: "Use AI Coach regularly for guidance",
  
  // Stage 4 - Momentum Builder
  consistent_income: "Achieve consistent monthly income",
  expense_tracking: "Track and manage business expenses",
  family_goals_set: "Set family goals (holidays, savings)",
  referrals_made: "Refer friends to Blue Tradie",
  
  // Stage 5 - Confident Owner
  business_pride: "Feel proud of your business achievements",
  family_support: "Business successfully supports family",
  stress_reduced: "Experience reduced financial stress",
  mentor_others: "Help mentor other tradies"
};

export default function BusinessJourneyRoadmap({ 
  currentStage, 
  completedMilestones,
  onStageUpdate 
}: BusinessJourneyRoadmapProps) {
  const progressPercentage = ((currentStage - 1) / (journeyStages.length - 1)) * 100;

  const isMilestoneCompleted = (milestoneId: string) => {
    return completedMilestones.includes(milestoneId);
  };

  const getStageProgress = (stage: JourneyStage) => {
    const completedCount = stage.milestones.filter(m => isMilestoneCompleted(m)).length;
    return (completedCount / stage.milestones.length) * 100;
  };

  const isStageCompleted = (stageId: number) => {
    return stageId < currentStage;
  };

  const isCurrentStage = (stageId: number) => {
    return stageId === currentStage;
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Your Business Journey</h3>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              Stage {currentStage} of 5
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Track your progress from beginner to confident business owner
          </p>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="space-y-4">
          {journeyStages.map((stage, index) => {
            const stageProgress = getStageProgress(stage);
            const completed = isStageCompleted(stage.id);
            const current = isCurrentStage(stage.id);
            
            return (
              <div key={stage.id} className="relative">
                {/* Connection Line */}
                {index < journeyStages.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200"></div>
                )}
                
                <div className={`
                  p-4 rounded-lg border-2 transition-all duration-200
                  ${current ? stage.bgColor + ' border-dashed' : ''}
                  ${completed ? 'bg-gray-50 border-gray-200' : ''}
                  ${!current && !completed ? 'bg-white border-gray-100' : ''}
                `}>
                  <div className="flex items-start space-x-4">
                    {/* Stage Icon */}
                    <div className={`
                      flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
                      ${completed ? 'bg-green-100 text-green-600' : ''}
                      ${current ? stage.bgColor.replace('50', '100') + ' ' + stage.color : ''}
                      ${!current && !completed ? 'bg-gray-100 text-gray-400' : ''}
                    `}>
                      {completed ? <CheckCircle className="w-6 h-6" /> : stage.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`
                          font-medium text-base
                          ${completed ? 'text-gray-600' : ''}
                          ${current ? 'text-gray-900' : ''}
                          ${!current && !completed ? 'text-gray-500' : ''}
                        `}>
                          {stage.title}
                        </h4>
                        {current && (
                          <Badge variant="secondary" className="text-xs">
                            Current Stage
                          </Badge>
                        )}
                        {completed && (
                          <Badge variant="default" className="text-xs bg-green-100 text-green-700">
                            Completed
                          </Badge>
                        )}
                      </div>
                      
                      <p className={`
                        text-sm mb-3
                        ${completed ? 'text-gray-500' : ''}
                        ${current ? 'text-gray-700' : ''}
                        ${!current && !completed ? 'text-gray-400' : ''}
                      `}>
                        {stage.description}
                      </p>

                      {/* Progress for current stage */}
                      {current && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">Progress</span>
                            <span className="text-xs text-gray-600">{Math.round(stageProgress)}%</span>
                          </div>
                          <Progress value={stageProgress} className="h-1.5" />
                        </div>
                      )}

                      {/* Milestones */}
                      <div className="space-y-1">
                        {stage.milestones.map((milestone) => {
                          const isCompleted = isMilestoneCompleted(milestone);
                          return (
                            <div key={milestone} className="flex items-center space-x-2">
                              {isCompleted ? (
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                              )}
                              <span className={`
                                text-xs
                                ${isCompleted ? 'text-gray-600 line-through' : ''}
                                ${current && !isCompleted ? 'text-gray-700' : ''}
                                ${!current && !isCompleted ? 'text-gray-400' : ''}
                              `}>
                                {milestoneLabels[milestone] || milestone}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Encouragement Message */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">
                {currentStage === 5 ? "Congratulations!" : "Keep Going!"}
              </h4>
              <p className="text-sm text-blue-700">
                {currentStage === 5 
                  ? "You've built a thriving business that supports your family's dreams. You should be proud of how far you've come!"
                  : `You're making great progress! Focus on completing your current stage milestones to move closer to becoming a confident business owner.`
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}