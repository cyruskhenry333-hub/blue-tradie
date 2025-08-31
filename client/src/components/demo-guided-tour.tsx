// Demo-specific guided tour component that works without authentication
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Play, 
  TrendingUp,
  Target,
  DollarSign,
  CheckCircle,
  Compass,
  Bot,
  Globe
} from "lucide-react";

interface DemoTourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector to highlight
  icon: React.ReactNode;
  scrollTo?: boolean;
  highlight?: boolean;
}

const demoTourSteps: DemoTourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Blue Tradie Demo!",
    description: "Experience the complete Blue Tradie dashboard with all the sophisticated features that make us unique. This demo showcases exactly what you'll get when you join the platform.",
    target: ".dashboard-welcome",
    icon: <Play className="w-5 h-5" />,
    scrollTo: false,
    highlight: false
  },
  {
    id: "dashboard-metrics",
    title: "Your Business Numbers Dashboard", 
    description: "This is your business control center. These key numbers tell you exactly how your business is performing: weekly income and outstanding invoices. Check your cashflow health every morning here.",
    target: ".dashboard-metrics",
    icon: <TrendingUp className="w-5 h-5" />,
    scrollTo: true,
    highlight: true
  },
  {
    id: "vision-board",
    title: "Your Personal Vision Board",
    description: "These images represent your goals - financial targets, dream purchases, family aspirations. Daily visual motivation to keep you focused on what you're working toward.",
    target: ".vision-board",
    icon: <Target className="w-5 h-5" />,
    scrollTo: true,
    highlight: true
  },
  {
    id: "ai-business-team",
    title: "AI Business Team - The Game Changer",
    description: "Get 24/7 advice from AI experts who understand Australian and New Zealand trade businesses. Your personal Accountant, Marketing specialist, Business Coach, and Legal advisor - all in one place.",
    target: ".ai-business-team",
    icon: <Bot className="w-5 h-5" />,
    scrollTo: true,
    highlight: true
  },
  {
    id: "business-setup",
    title: "Business Setup Checklist",
    description: "Track your business compliance requirements. Blue Tradie automatically monitors ABN, GST registration, insurance, and other essentials for Australian and New Zealand tradesman.",
    target: ".business-setup",
    icon: <CheckCircle className="w-5 h-5" />,
    scrollTo: true,
    highlight: true
  },
  {
    id: "business-journey",
    title: "Business Journey Roadmap",
    description: "Follow a step-by-step roadmap from startup to established business. Complete milestones, unlock achievements, and see what's next on your journey.",
    target: ".business-journey",
    icon: <Compass className="w-5 h-5" />,
    scrollTo: true,
    highlight: true
  }
];

interface DemoGuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DemoGuidedTour({ isOpen, onClose }: DemoGuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPositionedRelative, setIsPositionedRelative] = useState(false);
  const [arrowDirection, setArrowDirection] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const tourBoxRef = useRef<HTMLDivElement>(null);
  const positioningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsActive(true);
      setCurrentStep(0);
    } else {
      setIsActive(false);
      removeHighlights();
    }
  }, [isOpen]);

  const removeHighlights = () => {
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
    });
    setHighlightedElement(null);
  };

  const highlightElement = (selector: string) => {
    removeHighlights();
    
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.classList.add('tour-highlight');
      setHighlightedElement(element);
      return element;
    }
    return null;
  };

  const scrollToElement = (element: HTMLElement): Promise<void> => {
    console.log('Demo Tour: Scrolling to element:', element.className);
    
    return new Promise((resolve) => {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start', // Changed from 'center' to 'start' for better AI Business Team visibility
        inline: 'nearest'
      });
      
      // Simplified scroll wait - use fixed delay for more reliable timing
      setTimeout(() => {
        console.log('Demo Tour: Scroll completed for:', element.className);
        resolve();
      }, 600); // Fixed 600ms wait instead of complex scroll detection
    });
  };

  const calculateTooltipPosition = (targetElement: HTMLElement) => {
    // Force a reflow to ensure we get accurate positioning
    targetElement.offsetHeight;
    
    const rect = targetElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = 280; // Further reduced width to guarantee side positioning
    const tooltipHeight = 260; // Adjusted height
    const margin = 15; // Reduced margin

    console.log('Demo Tour: Element rect:', rect, 'Viewport:', viewportWidth, viewportHeight);

    // Force positioning to the side - prioritize right side
    let x, y, arrow;
    
    // Calculate ideal Y position - handle very tall elements and specific problematic sections
    const isVeryTallElement = rect.height > viewportHeight * 0.8;
    const isBusinessJourney = targetElement.classList.contains('business-journey');
    let idealY;
    
    if (isVeryTallElement) {
      // For very tall elements (like vision board), position tooltip at top third
      idealY = rect.top + (rect.height * 0.25) - (tooltipHeight / 2);
    } else if (isBusinessJourney) {
      // For business journey specifically, position at top to avoid center jumping
      idealY = rect.top + 50; // Fixed position near top of element
    } else {
      // Normal vertical centering for regular elements
      idealY = rect.top + (rect.height / 2) - (tooltipHeight / 2);
    }
    
    y = Math.max(margin, Math.min(idealY, viewportHeight - tooltipHeight - margin));

    // Try right side first
    if (rect.right + margin + tooltipWidth <= viewportWidth - margin) {
      // Position on right side
      x = rect.right + margin;
      arrow = 'left';
    } else {
      // Force left side positioning
      x = rect.left - tooltipWidth - margin;
      arrow = 'right';
      
      // If left side goes off-screen, overlap with element but stay visible
      if (x < margin) {
        x = margin;
        arrow = 'right';
      }
    }

    console.log('Demo Tour: Calculated position:', { x, y, arrow });
    return { x, y, arrow };
  };

  useEffect(() => {
    if (!isActive || isDragging || isTransitioning) return;

    const currentStepData = demoTourSteps[currentStep];
    if (!currentStepData) return;

    const handleStepDisplay = async () => {
      setIsTransitioning(true);
      
      // Clear any existing positioning timeout
      if (positioningTimeoutRef.current) {
        clearTimeout(positioningTimeoutRef.current);
      }

      let targetElement: HTMLElement | null = null;

      if (currentStepData.highlight && currentStepData.target) {
        targetElement = highlightElement(currentStepData.target);
      }

      if (currentStepData.scrollTo && targetElement) {
        // Wait for scroll to actually complete before positioning tooltip
        await scrollToElement(targetElement);
        
        // Shorter delay for faster transitions
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Position tooltip relative to highlighted element (NEVER center for steps > 0)
      if (targetElement && currentStep > 0) {
        // IMMEDIATELY calculate and set position to prevent any center flash
        const { x, y, arrow } = calculateTooltipPosition(targetElement);
        
        // BULLETPROOF: Never allow center positioning for any highlighted step
        if (x > 0 && y >= 0) {
          setPosition({ x, y });
          setArrowDirection(arrow);
        } else {
          // Emergency fallback to guaranteed left side if calculation somehow fails
          console.warn('Demo Tour: Emergency fallback positioning for step:', currentStep);
          setPosition({ x: 15, y: 100 });
          setArrowDirection('right');
        }
        setIsPositionedRelative(true);
        setIsTransitioning(false);
      } else {
        // Center overlay ONLY for welcome step (step 0)
        setIsPositionedRelative(false);
        setArrowDirection('');
        setIsTransitioning(false);
      }
    };

    handleStepDisplay();
  }, [currentStep, isActive, isDragging]);

  const nextStep = () => {
    if (currentStep < demoTourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    removeHighlights();
    setIsActive(false);
    onClose();
  };

  const skipTour = () => {
    completeTour();
  };

  // Drag functionality - only allow dragging from non-interactive areas
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!tourBoxRef.current) return;
    
    // Don't start dragging if clicking on buttons or interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]') || target.tagName === 'BUTTON') {
      return;
    }
    
    setIsDragging(true);
    setIsPositionedRelative(false);
    setArrowDirection('');
    const rect = tourBoxRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !tourBoxRef.current) return;
    
    const newPosition = {
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    };
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - tourBoxRef.current.offsetWidth;
    const maxY = window.innerHeight - tourBoxRef.current.offsetHeight;
    
    newPosition.x = Math.max(0, Math.min(newPosition.x, maxX));
    newPosition.y = Math.max(0, Math.min(newPosition.y, maxY));
    
    setPosition(newPosition);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  if (!isActive) return null;

  const currentStepData = demoTourSteps[currentStep];
  if (!currentStepData) return null;

  const progress = ((currentStep + 1) / demoTourSteps.length) * 100;

  return (
    <>
      {/* CSS for highlight effect and tour positioning */}
      <style>{`
        .tour-highlight {
          position: relative;
          z-index: 10;
        }
        
        .tour-highlight::before {
          content: '';
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          background: rgba(243, 112, 26, 0.1);
          border: 2px solid #F3701A;
          border-radius: 8px;
          animation: pulse 2s infinite;
          pointer-events: none;
          z-index: 1;
          box-shadow: 0 0 10px rgba(243, 112, 26, 0.2);
        }
        
        @keyframes pulse {
          0% { box-shadow: 0 0 10px rgba(243, 112, 26, 0.2); }
          50% { box-shadow: 0 0 20px rgba(243, 112, 26, 0.4); }
          100% { box-shadow: 0 0 10px rgba(243, 112, 26, 0.2); }
        }
        
        .tour-tooltip-container {
          cursor: grab;
          user-select: none;
          transition: background-color 0.2s ease;
        }
        
        .tour-tooltip-container:active,
        .tour-tooltip-container.dragging {
          cursor: grabbing;
          transition: none;
          background: rgba(255, 255, 255, 0.85) !important;
        }
        
        /* Arrow styles */
        .tour-tooltip-container[data-arrow="top"]::before {
          content: '';
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          border: 10px solid transparent;
          border-bottom-color: #F3701A;
        }
        
        .tour-tooltip-container[data-arrow="bottom"]::before {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          border: 10px solid transparent;
          border-top-color: #F3701A;
        }
        
        .tour-tooltip-container[data-arrow="left"]::before {
          content: '';
          position: absolute;
          left: -10px;
          top: 50%;
          transform: translateY(-50%);
          border: 10px solid transparent;
          border-right-color: #F3701A;
        }
        
        .tour-tooltip-container[data-arrow="right"]::before {
          content: '';
          position: absolute;
          right: -10px;
          top: 50%;
          transform: translateY(-50%);
          border: 10px solid transparent;
          border-left-color: #F3701A;
        }
      `}</style>

      {/* Tour Overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 2147483646 }}>
        {currentStep === 0 ? (
          // Center overlay for welcome step
          <Card className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 max-w-[90vw] pointer-events-auto shadow-2xl border-3 border-[#F3701A]" style={{ zIndex: 2147483647, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-[#F3701A]/10 rounded-lg text-[#F3701A]">
                    {currentStepData.icon}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {currentStep + 1} of {demoTourSteps.length}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipTour}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 mb-3">{currentStepData.title}</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">{currentStepData.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Step {currentStep + 1} of {demoTourSteps.length}
                </div>
                <div className="flex gap-2">
                  <Button onClick={nextStep} className="bg-[#F3701A] hover:bg-[#E5651A]">
                    Start Demo Tour
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Positioned tooltip for other steps
          <div
            ref={tourBoxRef}
            className={`tour-tooltip-container absolute pointer-events-auto ${isDragging ? 'dragging' : ''}`}
            data-arrow={arrowDirection}
            style={{
              left: isPositionedRelative ? `${position.x}px` : '50%',
              top: isPositionedRelative ? `${position.y}px` : '50%',
              transform: isPositionedRelative ? 'none' : 'translate(-50%, -50%)',
              zIndex: 2147483647,
              width: '280px',
              maxWidth: '90vw'
            }}
            onMouseDown={handleMouseDown}
          >
            <Card className="shadow-2xl border-2 border-[#F3701A]" style={{ background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(8px)' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-[#F3701A]/10 rounded-lg text-[#F3701A]">
                      {currentStepData.icon}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {currentStep + 1} of {demoTourSteps.length}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={skipTour}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <h2 className="text-lg font-bold text-gray-900 mb-3">{currentStepData.title}</h2>
                <p className="text-gray-600 mb-6 leading-relaxed text-sm">{currentStepData.description}</p>
                
                <div className="flex items-center justify-between">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={prevStep}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    disabled={currentStep === 0}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <div className="text-xs text-gray-500">
                    Step {currentStep + 1} of {demoTourSteps.length}
                  </div>
                  <Button 
                    size="sm" 
                    onClick={nextStep}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    className="bg-[#F3701A] hover:bg-[#E5651A]"
                  >
                    {currentStep === demoTourSteps.length - 1 ? 'Finish' : 'Next'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}