// Enhanced Interactive Guided Tour Component for Blue Tradie
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Play, 
  MessageSquare, 
  FileText, 
  Receipt, 
  CheckCircle,
  Target,
  DollarSign,
  Users,
  Plus,
  TrendingUp,
  Compass,
  Smartphone,
  Sparkles,
  Bot,
  Clock,
  Coins,
  Settings
} from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector to highlight
  position: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'overlay';
  icon: React.ReactNode;
  route?: string;
  aiAgent?: {
    name: string;
    suggestion: string;
    route: string;
  };
  scrollTo?: boolean;
  highlight?: boolean;
}

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  autoStart?: boolean;
}

export default function GuidedTour({ isOpen, onClose, autoStart = false }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPositionedRelative, setIsPositionedRelative] = useState(false);
  const [arrowDirection, setArrowDirection] = useState('');
  const tourBoxRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const countryGreeting = user?.country === "New Zealand" ? "bro" : "mate";
  const countryContext = user?.country === "New Zealand" ? "Kiwi" : "Aussie";
  const gstRate = user?.country === "New Zealand" ? "15%" : "10%";
  const taxAuthority = user?.country === "New Zealand" ? "IRD" : "ATO";

  const tourSteps: TourStep[] = [
    {
      id: "welcome",
      title: `Welcome to Blue Tradie, ${user?.firstName || countryGreeting}!`,
      description: `Welcome to your complete business management platform! I'll take you through each section step-by-step with actionable instructions. You'll learn exactly where everything is, how to use it, and why it matters for your business. 

💡 Pro tip: You can click and drag this tour guide around if it ever covers something you need to see!

This tour takes about 6 minutes and covers all essential features. Let's get started!`,
      target: ".dashboard-welcome",
      position: "overlay",
      icon: <Play className="w-5 h-5" />,
      scrollTo: false,
      highlight: false
    },
    {
      id: "dashboard-metrics",
      title: "Your Business Numbers Dashboard", 
      description: `This is your business control center. These key numbers tell you exactly how your tradie business is performing: weekly income (how much you've earned) and outstanding invoices (money owed to you). This is where you check your cashflow health every morning.`,
      target: ".dashboard-metrics",
      route: "/",
      position: "right",
      icon: <TrendingUp className="w-5 h-5" />,
      scrollTo: true,
      highlight: true,
      aiAgent: {
        name: "Business Coach",
        suggestion: "How do I set realistic income targets for my trade?",
        route: "/chat/coach"
      }
    },
    {
      id: "vision-board",
      title: "Your Personal Vision Board",
      description: `These images represent your goals from onboarding - financial targets, dream purchases, family aspirations. Daily visual motivation to keep you focused on what you're working toward.`,
      target: ".vision-board",
      route: "/",
      position: "right",
      icon: <Target className="w-5 h-5" />,
      scrollTo: true,
      highlight: true,
      aiAgent: {
        name: "Business Coach",
        suggestion: "Need help staying motivated or adjusting your goals?",
        route: "/chat/coach"
      }
    },
    {
      id: "ai-business-team",
      title: "Your AI Business Team - The Main Feature!",
      description: `This is what makes Blue Tradie special! Meet your 24/7 AI business advisors who understand Australian/NZ trade businesses. Each agent shows rotating live prompts demonstrating their intelligence. The Accountant, Marketing, Business Coach, and Legal agents are always ready to help.`,
      target: ".ai-business-team",
      route: "/",
      position: "center",
      icon: <Bot className="w-5 h-5" />,
      scrollTo: true,
      highlight: true,
      aiAgent: {
        name: "Business Coach",
        suggestion: "How can AI agents help grow my tradie business?",
        route: "/chat/coach"
      }
    },
    {
      id: "token-usage-education",
      title: "Your Tokens = Your AI Power",
      description: `You've got 1 million free tokens for your 14-day demo — that's more than enough to try everything.

Every task your AI team does — like quoting, invoicing, or planning — uses a small number of tokens. Most tasks cost less than 1 cent.

You'll see your token balance at the top of the screen, so you always know where you stand.

💡 Tip: Try different tools and see how far your tokens go — it's all included in your demo.`,
      target: ".token-usage-mini",
      route: "/",
      position: "bottom",
      icon: <Coins className="w-5 h-5" />,
      scrollTo: true,
      highlight: true,
      aiAgent: {
        name: "Business Coach",
        suggestion: "How can I use AI tokens most effectively for my business?",
        route: "/chat/coach"
      }
    },
    {
      id: "business-setup",
      title: "Business Setup Checklist - Stay Compliant",
      description: `Essential compliance tracking for ${user?.country === "New Zealand" ? "New Zealand" : "Australian"} tradies. Monitor your ${user?.country === "New Zealand" ? "NZBN, IRD, GST (15%)" : "ABN, ATO, GST (10%)"} registration and insurance requirements. Blue Tradie knows local regulations and keeps you compliant.`,
      target: ".business-setup",
      route: "/",
      position: "right",
      icon: <CheckCircle className="w-5 h-5" />,
      scrollTo: true,
      highlight: true,
      aiAgent: {
        name: "Legal",
        suggestion: "What registrations do I need as a tradie?",
        route: "/chat/legal"
      }
    },
    {
      id: "recent-activity", 
      title: "Recent Jobs & Invoices Overview",
      description: `Your business activity at a glance - recent jobs with status tracking and recent invoices with payment monitoring. This section shows the pulse of your day-to-day operations and cash flow status.`,
      target: ".recent-activity",
      route: "/",
      position: "center",
      icon: <Clock className="w-5 h-5" />,
      scrollTo: true,
      highlight: true,
      aiAgent: {
        name: "Accountant",
        suggestion: "How do I track outstanding payments effectively?",
        route: "/chat/accountant"
      }
    },
    {
      id: "jobs-tutorial",
      title: "Try Adding Your First Job - Do This Now",
      description: `ACTION STEP: Click the blue "New Job" button to practice adding a customer job. Fill in: Customer Name, Phone Number, Job Description, and Estimated Value. Once created, you can update job status as work progresses (scheduled → in-progress → completed), then directly create an invoice from each completed job. Try adding a practice job now to see how it works!`,
      target: ".jobs-add-button",
      route: "/jobs",
      position: "bottom",
      icon: <Plus className="w-5 h-5" />,
      scrollTo: true,
      highlight: true,
      aiAgent: {
        name: "Business Coach",
        suggestion: "What's the best way to track job progress and follow up with customers?",
        route: "/chat/coach"
      }
    },
    {
      id: "expenses-tracking",
      title: "Smart Expense Tracking for Tax Time", 
      description: `Now we're visiting the Expenses page - this is crucial for maximizing your tax deductions. Every business expense goes here: tools, materials, fuel, insurance, phone bills. Blue Tradie automatically calculates GST you can claim back and organizes everything for ${taxAuthority} at tax time. This can save you thousands of dollars in taxes.`,
      target: ".expense-summary",
      route: "/expenses",
      position: "center",
      icon: <Receipt className="w-5 h-5" />,
      scrollTo: true,
      highlight: true,
      aiAgent: {
        name: "Accountant",
        suggestion: "What business expenses can I claim as tax deductions?",
        route: "/chat/accountant"
      }
    },
    {
      id: "expenses-tutorial",
      title: "Log Your First Expense - Try This Action",
      description: `ACTION STEP: Click the blue "Add Expense" button to practice logging a business expense. Try adding something like "Drill bits - $45" or "Fuel - $80". Select the category (Tools & Equipment, Vehicle & Fuel, etc.), check "GST Claimable" if you paid GST, and Blue Tradie calculates how much you can claim back from ${taxAuthority}. Every expense logged here reduces your tax bill - try adding one now!`,
      target: ".expense-add-button",
      route: "/expenses",
      position: "bottom",
      icon: <DollarSign className="w-5 h-5" />,
      scrollTo: true,
      highlight: true,
      aiAgent: {
        name: "Accountant",
        suggestion: "Help me understand which expenses are tax deductible for my trade business",
        route: "/chat/accountant"
      }
    },
    {
      id: "ai-agents",
      title: "Your 24/7 AI Business Advisory Team",
      description: `Here are your four business experts available anytime: your Accountant (handles ${taxAuthority} rules, tax questions, GST), Legal advisor (contracts, employee issues, insurance), Marketing expert (getting more customers, pricing), and Business Coach (motivation, planning, growth strategies). Click any agent to start a conversation - they understand ${countryContext} tradie businesses inside-out.`,
      target: ".ai-agents-preview",
      route: "/chat",
      position: "center",
      icon: <MessageSquare className="w-5 h-5" />,
      scrollTo: true,
      highlight: true,
      aiAgent: {
        name: "Business Coach",
        suggestion: "How do I use AI agents to grow my tradie business?",
        route: "/chat/coach"
      }
    },
    {
      id: "quick-access-panel",
      title: "Quick Access Panel",
      description: `See that floating + button on the right edge? Click it from anywhere to instantly create invoices, add jobs, log expenses, or chat with AI. Works on mobile too - designed for big gloves and touch screens.`,
      target: ".quick-access-trigger, [data-tour-target='quick-access']",
      route: "/",
      position: "left",
      icon: <Plus className="w-5 h-5" />,
      scrollTo: false,
      highlight: true
    },
    {
      id: "business-journey",
      title: "Business Journey Roadmap",
      description: "Track your progress from startup to established business. Complete milestones, see what's next, and celebrate achievements. Plus suggest new features for the platform!",
      target: ".business-journey",
      route: "/",
      position: "top", 
      icon: <Compass className="w-5 h-5" />,
      scrollTo: true,
      highlight: true,
      aiAgent: {
        name: "Business Coach", 
        suggestion: "Want help planning your next business milestones?",
        route: "/chat/coach"
      }
    },
    {
      id: "settings-overview",
      title: "Settings - Customize Your Experience",
      description: `Want to customize how Blue Tradie works for you? The Settings page lets you control AI communication style, update your profile, and manage notifications. Let's check it out!`,
      target: ".navbar-settings, .settings-link, [href='/settings']",
      route: "/settings",
      position: "right",
      icon: <Settings className="w-5 h-5" />,
      scrollTo: true,
      highlight: true
    },
    {
      id: "ai-communication-settings",
      title: "AI Communication Preferences",
      description: `This is where you control how your AI assistants talk to you! Choose between "Matey & Casual" (friendly Aussie/Kiwi style with tradie slang) or "Professional & Direct" (structured business communication). Your AI team will adapt their personality to match your preference across all features.`,
      target: ".communication-tone-card, .tone-selector",
      route: "/settings", 
      position: "bottom",
      icon: <MessageSquare className="w-5 h-5" />,
      scrollTo: true,
      highlight: true
    },
    {
      id: "profile-settings",
      title: "Profile & Business Settings",
      description: `Click the "Profile" tab to update your business details, trade type, and region settings. This affects tax calculations (GST rates), currency display, and region-specific advice from your AI advisors.`,
      target: "[data-section='profile'], .profile-tab-button",
      route: "/settings",
      position: "bottom",
      icon: <Users className="w-5 h-5" />,
      scrollTo: true,
      highlight: true,

    },
    {
      id: "mobile-ready",
      title: "Mobile-First Design",
      description: `Blue Tradie works perfectly on phones and tablets. Big buttons for gloved hands, fast loading on mobile data, works offline. Built for real tradie conditions, not just office desks.`,
      target: ".dashboard-welcome",
      route: "/",
      position: "overlay",
      icon: <Smartphone className="w-5 h-5" />,
      scrollTo: false,
      highlight: false
    },
    {
      id: "complete",  
      title: `You're Ready to Go, ${countryGreeting}!`,
      description: `That's Blue Tradie - your complete business management platform with region-aware AI advisors. Everything's set up for ${countryContext} business requirements. Time to get your business sorted!`,
      target: ".dashboard-welcome",
      route: "/",
      position: "overlay",
      icon: <CheckCircle className="w-5 h-5" />,
      scrollTo: false,
      highlight: false
    }
  ];

  // Calculate optimal position for tooltip based on target element
  const calculateTooltipPosition = (targetElement: HTMLElement, preferredPosition: string) => {
    const targetRect = targetElement.getBoundingClientRect();
    const tooltipWidth = 400; // Approximate tooltip width
    const tooltipHeight = 300; // Approximate tooltip height
    const offset = 20; // Distance from target element
    
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    let x = 0;
    let y = 0;
    let actualPosition = preferredPosition;
    
    // Calculate based on preferred position, with fallback logic
    switch (preferredPosition) {
      case 'top':
        x = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
        y = targetRect.top - tooltipHeight - offset;
        
        // Fallback to bottom if not enough space above
        if (y < 0) {
          y = targetRect.bottom + offset;
          actualPosition = 'bottom';
        }
        break;
        
      case 'bottom':
        x = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
        y = targetRect.bottom + offset;
        
        // Fallback to top if not enough space below
        if (y + tooltipHeight > viewport.height) {
          y = targetRect.top - tooltipHeight - offset;
          actualPosition = 'top';
        }
        break;
        
      case 'left':
        x = targetRect.left - tooltipWidth - offset;
        y = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
        
        // Fallback to right if not enough space to the left
        if (x < 0) {
          x = targetRect.right + offset;
          actualPosition = 'right';
        }
        break;
        
      case 'right':
        x = targetRect.right + offset;
        y = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
        
        // Fallback to left if not enough space to the right
        if (x + tooltipWidth > viewport.width) {
          x = targetRect.left - tooltipWidth - offset;
          actualPosition = 'left';
        }
        break;
        
      case 'center':
      case 'overlay':
      default:
        // Center on screen (fallback for overlay steps)
        x = (viewport.width / 2) - (tooltipWidth / 2);
        y = (viewport.height / 2) - (tooltipHeight / 2);
        actualPosition = 'center';
        break;
    }
    
    // Ensure tooltip stays within viewport bounds
    x = Math.max(10, Math.min(x, viewport.width - tooltipWidth - 10));
    y = Math.max(10, Math.min(y, viewport.height - tooltipHeight - 10));
    
    console.log('Tour: Calculated position', { x, y, actualPosition, targetRect });
    
    // Map actual position to arrow direction (arrow points FROM tooltip TO target)
    let arrowDir = '';
    switch (actualPosition) {
      case 'top': arrowDir = 'bottom'; break; // tooltip above, arrow points down
      case 'bottom': arrowDir = 'top'; break; // tooltip below, arrow points up  
      case 'left': arrowDir = 'right'; break; // tooltip left, arrow points right
      case 'right': arrowDir = 'left'; break; // tooltip right, arrow points left
      default: arrowDir = ''; break;
    }
    
    return { x, y, actualPosition, arrowDirection: arrowDir };
  };

  // Enhanced auto-scroll to target element with better positioning
  const scrollToTarget = (target: string) => {
    const attemptScroll = (retryCount = 0) => {
      const element = document.querySelector(target);
      console.log(`Tour: Scrolling to target ${target} (attempt ${retryCount + 1})`, element ? 'Found' : 'Not found');
      
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'center'
        });
        return true;
      } else if (retryCount < 3) {
        // Retry up to 3 times with increasing delays
        setTimeout(() => attemptScroll(retryCount + 1), 500 * (retryCount + 1));
      } else {
        console.log('Tour: Failed to find target after retries:', target);
      }
      return false;
    };
    
    attemptScroll();
  };

  // Enhanced highlight target element with improved visibility and positioning
  const highlightTarget = (target: string) => {
    const attemptHighlight = (retryCount = 0) => {
      // First, always remove ALL existing highlights to prevent double highlighting
      removeHighlights();
      
      const element = document.querySelector(target) as HTMLElement;
      console.log(`Tour: Highlighting target ${target} (attempt ${retryCount + 1})`, element ? 'Found' : 'Not found');
      
      if (element) {        
        // Add enhanced highlight class with pulse animation
        element.classList.add('tour-highlight');
        setHighlightedElement(element);
        
        // Add temporary extra highlight for better visibility
        element.style.transition = 'all 0.3s ease-in-out';
        element.style.boxShadow = '0 0 20px 5px rgba(59, 130, 246, 0.5)';
        element.style.transform = 'scale(1.02)';
        
        // Calculate and set tooltip position relative to this element
        const currentTourStep = tourSteps[currentStep];
        if (currentTourStep && currentTourStep.position !== 'center' && currentTourStep.position !== 'overlay') {
          const newPosition = calculateTooltipPosition(element, currentTourStep.position);
          setPosition({ x: newPosition.x, y: newPosition.y });
          setArrowDirection(newPosition.arrowDirection);
          setIsPositionedRelative(true);
        } else {
          // Use center positioning for overlay/center steps
          setArrowDirection('');
          setIsPositionedRelative(false);
        }
        
        // Remove extra styles after animation
        setTimeout(() => {
          if (element) {
            element.style.transform = '';
            element.style.boxShadow = '';
          }
        }, 2000);
        
        return true;
      } else if (retryCount < 3) {
        // Retry up to 3 times with increasing delays
        setTimeout(() => attemptHighlight(retryCount + 1), 500 * (retryCount + 1));
      } else {
        console.log('Tour: Failed to find target for highlighting after retries:', target);
      }
      return false;
    };
    
    attemptHighlight();
  };

  // Remove highlights
  const removeHighlights = () => {
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
      // Clear any inline styles that might have been applied
      (el as HTMLElement).style.transform = '';
      (el as HTMLElement).style.boxShadow = '';
      (el as HTMLElement).style.transition = '';
    });
    setHighlightedElement(null);
  };

  useEffect(() => {
    // For new users immediately after onboarding, delay tour start to avoid overlap
    const onboardingCompleted = localStorage.getItem('blue-tradie-onboarding-completed');
    const tourCompleted = localStorage.getItem('blue-tradie-tour-completed');
    
    if (onboardingCompleted === 'true' && !tourCompleted) {
      localStorage.removeItem('blue-tradie-tour-active-step'); // Clear any stale step
      localStorage.removeItem('blue-tradie-onboarding-completed'); // Clear onboarding flag to prevent future conflicts
      // Don't start tour automatically - wait for welcome modal completion event
      return;
    }
    
    if (autoStart && isOpen) {
      setIsActive(true);
    }
    
    // Check if we should continue tour after AI agent visit or on page load
    const shouldContinue = localStorage.getItem('blue-tradie-tour-continue-after-agent');
    const savedStep = localStorage.getItem('blue-tradie-tour-active-step');
    
    if (shouldContinue === 'true') {
      localStorage.removeItem('blue-tradie-tour-continue-after-agent');
      setIsActive(true);
      
      // Load saved step from localStorage
      if (savedStep) {
        const stepIndex = parseInt(savedStep, 10);
        if (stepIndex >= 0 && stepIndex < tourSteps.length) {
          setCurrentStep(stepIndex);
        }
      }
    } else if (autoStart && isOpen && savedStep && !onboardingCompleted) {
      // Only auto-resume for existing users (not fresh from onboarding)
      const stepIndex = parseInt(savedStep, 10);
      if (stepIndex >= 0 && stepIndex < tourSteps.length) {
        setCurrentStep(stepIndex);
        setIsActive(true);
      }
    }
  }, [autoStart, isOpen, tourSteps.length]);

  // Listen for tour reset events and welcome modal completion
  useEffect(() => {
    
    const handleTourReset = () => {
      removeHighlights();
      document.body.classList.remove('tour-active');
      document.body.removeAttribute('data-tour-step');
      setPosition({ x: 0, y: 0 }); // Reset position
      setArrowDirection(''); // Reset arrow
      setIsPositionedRelative(false); // Reset relative positioning
      
      // Force tour to show by ensuring no modal detection conflicts
      setTimeout(() => {
        setCurrentStep(0);
        setIsActive(true);
        localStorage.setItem('blue-tradie-tour-active-step', '0');
      }, 100); // Small delay to ensure clean state
    };

    const handleStartTourAfterWelcome = () => {
      localStorage.removeItem('blue-tradie-start-tour-after-welcome');
      
      // Remove any existing highlights to prevent flash
      removeHighlights();
      document.body.classList.remove('tour-active');
      document.body.removeAttribute('data-tour-step');
      
      // Start tour immediately with smooth transition
      setCurrentStep(0);
      setIsActive(true);
      localStorage.setItem('blue-tradie-tour-active-step', '0');
    };

    // Listen for custom tour reset events and welcome modal completion
    window.addEventListener('tour-reset', handleTourReset);
    window.addEventListener('start-tour-after-welcome', handleStartTourAfterWelcome);
    
    return () => {
      window.removeEventListener('tour-reset', handleTourReset);
      window.removeEventListener('start-tour-after-welcome', handleStartTourAfterWelcome);
    };
  }, []);

  useEffect(() => {
    if (isActive && tourSteps[currentStep]) {
      const step = tourSteps[currentStep];
      
      // Add tour-active class and data attribute to body for CSS overrides
      document.body.classList.add('tour-active');
      document.body.setAttribute('data-tour-step', currentStep.toString());
      
      // Only auto-handle scroll/highlight for overlay steps or when on correct page
      // Navigation steps are handled in nextStep/prevStep functions
      const isOnCorrectPage = !step.route || step.route === window.location.pathname;
      
      if (isOnCorrectPage && (step.position === 'overlay' || step.position === 'center')) {
        // For overlay/center steps, handle immediately
        if (step.scrollTo && step.target) {
          setTimeout(() => scrollToTarget(step.target), 200);
        }
        if (step.highlight && step.target) {
          setTimeout(() => highlightTarget(step.target), 500);
        }
      }
    } else {
      // Remove tour-active class and data attribute when tour is not active
      document.body.classList.remove('tour-active');
      document.body.removeAttribute('data-tour-step');
    }
    
    return () => {
      if (!isActive) {
        removeHighlights();
        document.body.classList.remove('tour-active');
        document.body.removeAttribute('data-tour-step');
      }
    };
  }, [currentStep, isActive]);

  // Add scroll listener to update tooltip position when user scrolls
  useEffect(() => {
    const updateTooltipPosition = () => {
      if (isActive && isPositionedRelative && highlightedElement && !isDragging) {
        const currentTourStep = tourSteps[currentStep];
        if (currentTourStep && currentTourStep.position !== 'center' && currentTourStep.position !== 'overlay') {
          const newPosition = calculateTooltipPosition(highlightedElement, currentTourStep.position);
          setPosition({ x: newPosition.x, y: newPosition.y });
          setArrowDirection(newPosition.arrowDirection);
        }
      }
    };

    if (isActive && isPositionedRelative) {
      window.addEventListener('scroll', updateTooltipPosition, { passive: true });
      window.addEventListener('resize', updateTooltipPosition, { passive: true });
      
      return () => {
        window.removeEventListener('scroll', updateTooltipPosition);
        window.removeEventListener('resize', updateTooltipPosition);
      };
    }
  }, [isActive, isPositionedRelative, highlightedElement, currentStep, isDragging]);

  // Drag functionality handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!tourBoxRef.current) return;
    
    setIsDragging(true);
    setIsPositionedRelative(false); // Disable relative positioning when dragging
    setArrowDirection(''); // Remove arrow when dragging
    const rect = tourBoxRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !tourBoxRef.current) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Constrain to viewport
    const maxX = window.innerWidth - tourBoxRef.current.offsetWidth;
    const maxY = window.innerHeight - tourBoxRef.current.offsetHeight;
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse event listeners for dragging
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

  // Reset position when tour restarts
  useEffect(() => {
    if (isActive && currentStep === 0) {
      setPosition({ x: 0, y: 0 });
    }
  }, [isActive, currentStep]);

  // Open AI Agent function
  const openAIAgent = (route: string, suggestion: string) => {
    // Store current tour state
    localStorage.setItem('blue-tradie-tour-continue-after-agent', 'true');
    localStorage.setItem('blue-tradie-tour-active-step', currentStep.toString());
    
    // Navigate to AI agent
    setLocation(route);
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      removeHighlights(); // Clean up current highlights
      
      const nextStepIndex = currentStep + 1;
      const nextStepData = tourSteps[nextStepIndex];
      
      console.log('Tour: Next step', nextStepIndex, nextStepData.id, 'Route:', nextStepData.route, 'Current:', window.location.pathname);
      
      // Save step progress
      localStorage.setItem('blue-tradie-tour-active-step', nextStepIndex.toString());
      
      // Navigate to the route if specified
      if (nextStepData.route && nextStepData.route !== window.location.pathname) {
        console.log('Tour: Navigating to', nextStepData.route);
        setLocation(nextStepData.route);
        
        // Wait for navigation, then set step and handle scroll/highlight
        setTimeout(() => {
          setCurrentStep(nextStepIndex);
          
          // Wait for page to load, then scroll and highlight
          setTimeout(() => {
            if (nextStepData.scrollTo && nextStepData.target) {
              scrollToTarget(nextStepData.target);
            }
            if (nextStepData.highlight && nextStepData.target) {
              setTimeout(() => highlightTarget(nextStepData.target), 500);
            }
          }, 600);
        }, 800);
      } else {
        // Same page - immediately set step and handle scroll/highlight
        setCurrentStep(nextStepIndex);
        
        setTimeout(() => {
          if (nextStepData.scrollTo && nextStepData.target) {
            scrollToTarget(nextStepData.target);
          }
          if (nextStepData.highlight && nextStepData.target) {
            setTimeout(() => highlightTarget(nextStepData.target), 300);
          }
        }, 100);
      }
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1;
      const prevStepData = tourSteps[prevStepIndex];
      
      // Navigate to the route if specified BEFORE showing the step
      if (prevStepData.route && prevStepData.route !== window.location.pathname) {
        // Save step before navigation
        localStorage.setItem('blue-tradie-tour-active-step', prevStepIndex.toString());
        setLocation(prevStepData.route);
        // Wait for page navigation to complete, then continue tour
        setTimeout(() => {
          setCurrentStep(prevStepIndex);
          // Additional delay for section targeting after navigation
          if (prevStepData.scrollTo && prevStepData.target) {
            setTimeout(() => {
              scrollToTarget(prevStepData.target);
              if (prevStepData.highlight) {
                setTimeout(() => highlightTarget(prevStepData.target), 300);
              }
            }, 500);
          }
        }, 1200);
      } else {
        // No navigation needed, proceed immediately
        setCurrentStep(prevStepIndex);
        localStorage.setItem('blue-tradie-tour-active-step', prevStepIndex.toString());
      }
    }
  };

  const completeTour = () => {
    setIsActive(false);
    setCurrentStep(0);
    removeHighlights();
    document.body.classList.remove('tour-active');
    document.body.removeAttribute('data-tour-step');
    onClose();
    
    // Mark tour as completed and remove active step
    localStorage.setItem('blue-tradie-tour-completed', 'true');
    localStorage.removeItem('blue-tradie-tour-active-step');
  };
  
  const restartTour = () => {
    // Soft restart without page reload
    setIsActive(false);
    setCurrentStep(0);
    removeHighlights();
    document.body.classList.remove('tour-active');
    document.body.removeAttribute('data-tour-step');
    
    // Clear tour completion flags
    localStorage.removeItem('blue-tradie-tour-completed');
    localStorage.setItem('blue-tradie-tour-active-step', '0');
    
    // Restart tour with small delay
    setTimeout(() => {
      setIsActive(true);
      setCurrentStep(0);
      setPosition({ x: 0, y: 0 }); // Reset position
    }, 200);
  };

  const startTour = () => {
    setCurrentStep(0);
    localStorage.setItem('blue-tradie-tour-active-step', '0');
    setIsActive(true);
  };

  const skipTour = () => {
    document.body.classList.remove('tour-active');
    document.body.removeAttribute('data-tour-step');
    completeTour();
  };



  // Don't show tour if onboarding modal is currently visible (except when explicitly activated)
  const dialogElement = document.querySelector('[data-state="open"][role="dialog"]');
  const overlayElement = document.querySelector('.dialog-overlay');
  const onboardingElement = document.querySelector('[class*="onboarding"]');
  const hasOnboardingModal = dialogElement || overlayElement || onboardingElement;
  
  // Always show tour when it's been explicitly activated via welcome modal event or tour reset
  const tourExplicitlyActivated = isActive && currentStep >= 0;
  const hasActiveStep = localStorage.getItem('blue-tradie-tour-active-step') !== null;
  
  // Enhanced logic: Always show tour when explicitly activated, regardless of modal state
  if (!isOpen || (hasOnboardingModal && !tourExplicitlyActivated && !hasActiveStep && !isActive)) return null;

  const currentStepData = tourSteps[currentStep];
  
  // Loading guard: Don't render until we have valid step data
  if (!currentStepData) {
    return null;
  }
  
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  // Tour state calculated

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
        
        /* Hide floating AI assistant and panels during tour to avoid overlap */
        body.tour-active .floating-ai-assistant,
        body.tour-active .virtual-assistant-widget,
        body.tour-active [class*="ai-assistant"],
        body.tour-active [class*="floating-button"] {
          display: none !important;
        }
        
        /* Keep Quick Access Panel visible during its specific tour step */
        body.tour-active[data-tour-step="11"] .quick-access-panel,
        body.tour-active[data-tour-step="quick-access-panel"] .quick-access-panel {
          display: block !important;
        }

        /* Hide tour guide when important dialogs are open, but allow smooth transition */
        body:has([data-state="open"][role="dialog"]) .tour-tooltip-container,
        body:has(.dialog-overlay) .tour-tooltip-container,
        body:has([data-radix-focus-guard]) .tour-tooltip-container,
        body:has([class*="onboarding"]) .tour-tooltip-container {
          display: none !important;
        }
        
        /* Smooth transition from welcome modal to tour */
        body:has([class*="welcome"]) .tour-tooltip-container {
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        
        /* Prevent card flashing during modal transitions */
        .dashboard-welcome, 
        .ai-business-team,
        .card-tradie {
          transition: opacity 0.15s ease;
        }

        /* Ensure welcome dialogs and onboarding modals appear above tour guide */
        .dialog-overlay,
        [data-state="open"][role="dialog"],
        [class*="onboarding-flow"],
        [class*="welcome-dialog"] {
          z-index: 100000 !important;
        }

        /* Ensure all tour elements have high z-index but below dialogs */
        .tour-box,
        .tour-box *,
        [class*="tour"],
        .guided-tour-container,
        .guided-tour-container * {
          z-index: 50000 !important;
        }
        
        /* Tour tooltip container - clean single container with 80% opacity */
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

        /* Ensure clean rendering with maximum z-index */
        .tour-tooltip-container {
          z-index: 2147483647 !important;
        }
        
        /* Ensure tour appears above all page content */
        body.tour-active .tour-tooltip-container {
          z-index: 2147483647 !important;
        }
        
        /* Overlay positioning for welcome screens */
        .tour-box.position-overlay {
          left: 50% !important;
          top: 50% !important;
          transform: translateX(-50%) translateY(-50%) !important;
          z-index: 99999 !important;
        }
        
        @media (max-width: 640px) {
          .tour-box {
            max-width: 320px;
            left: 10px !important;
            right: 10px !important;
            transform: none !important;
            z-index: 99999 !important;
            position: fixed !important;
          }
          
          .tour-tooltip-container {
            bottom: 20px !important;
            right: 10px !important;
            left: auto !important;
            width: calc(100vw - 20px) !important;
            max-width: 360px !important;
            position: fixed !important;
            z-index: 99999 !important;
          }
          
          .tour-tooltip-card {
            width: 100% !important;
            max-width: none !important;
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.02); }
        }
      `}</style>

      {/* Tour Overlay - NO background dimming */}
      {isActive && (
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 2147483646 }}>
          {currentStepData.position === 'overlay' ? (
            // Center overlay for welcome/complete steps
            <Card className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 max-w-[90vw] pointer-events-auto shadow-2xl border-3 border-[#F3701A]" style={{ zIndex: 2147483647, background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(10px)' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-[#F3701A]/10 rounded-lg text-[#F3701A]">
                      {currentStepData.icon}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {currentStep + 1} of {tourSteps.length}
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

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div
                    className="bg-[#F3701A] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <h3 className="text-lg font-semibold mb-2 text-[#F3701A]">
                  {currentStepData.title}
                </h3>
                <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                  {currentStepData.description}
                </p>
                
                {/* Drag tip for welcome step */}
                {currentStep === 0 && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">💡</span>
                      <span className="text-sm font-medium text-blue-700">Pro Tip:</span>
                    </div>
                    <p className="text-sm text-blue-600 mt-1">
                      You can click and drag this tour guide around if it ever covers something you need to see!
                    </p>
                  </div>
                )}

                {/* AI Agent prompt */}
                {currentStepData.aiAgent && (
                  <div className="mb-4 p-4 bg-orange-50 border border-[#F3701A]/30 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-[#F3701A]" />
                      <span className="text-sm font-medium text-[#F3701A]">
                        Need help with this? Talk to the {currentStepData.aiAgent.name}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      Your AI {currentStepData.aiAgent.name} can answer: "{currentStepData.aiAgent.suggestion}"
                    </p>
                    <Button
                      size="sm"
                      onClick={() => openAIAgent(currentStepData.aiAgent!.route, currentStepData.aiAgent!.suggestion)}
                      className="bg-[#F3701A] hover:bg-[#F3701A]/90 text-white text-sm"
                    >
                      🤖 Open AI {currentStepData.aiAgent.name}
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="flex items-center space-x-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </Button>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={skipTour}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Skip Tour
                    </Button>
                    <Button
                      onClick={nextStep}
                      size="sm"
                      className="bg-[#F3701A] hover:bg-[#F3701A]/90 flex items-center space-x-1 text-white"
                    >
                      <span>{currentStep === tourSteps.length - 1 ? 'Finish Tour' : 'Next Step'}</span>
                      {currentStep !== tourSteps.length - 1 && <ArrowRight className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Fixed bottom-right corner positioning above AI Assistant - Single clean container
            <Card 
              ref={tourBoxRef}
              className={`pointer-events-auto tour-tooltip-container shadow-2xl border-3 border-[#F3701A] ${isDragging ? 'dragging' : ''}`}
              data-arrow={arrowDirection}
              onMouseDown={handleMouseDown}
              style={{ 
                position: 'fixed',
                // Use dynamic positioning when tooltip is anchored to element, fallback to bottom-right
                bottom: !isPositionedRelative && position.x === 0 && position.y === 0 ? '100px' : 'auto',
                right: !isPositionedRelative && position.x === 0 && position.y === 0 ? '24px' : 'auto',
                left: isPositionedRelative || position.x !== 0 ? `${position.x}px` : 'auto',
                top: isPositionedRelative || position.y !== 0 ? `${position.y}px` : 'auto',
                zIndex: 2147483647, 
                transform: 'translateZ(0)',
                maxWidth: '380px',
                width: '380px', // Fixed width for consistent positioning calculations
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                // Add smooth transition when repositioning
                transition: isDragging ? 'none' : 'left 0.3s ease-out, top 0.3s ease-out'
              }}
            >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-[#F3701A]/10 rounded text-[#F3701A]">
                        {currentStepData.icon}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {currentStep + 1} of {tourSteps.length}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={skipTour}
                      className="text-gray-500 hover:text-gray-700 p-1"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>

                  <h4 className="font-semibold mb-1.5 text-[#F3701A] text-sm">
                    {currentStepData.title}
                  </h4>
                  <p className="text-gray-600 mb-2.5 text-xs leading-relaxed">
                    {currentStepData.description}
                  </p>
                  
                  {/* Drag tip for welcome step */}
                  {currentStep === 0 && (
                    <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                      <div className="flex items-center space-x-1 mb-1">
                        <span>💡</span>
                        <span className="font-medium text-blue-700">Tip:</span>
                      </div>
                      <p className="text-blue-600">
                        You can drag this guide around if it covers anything important!
                      </p>
                    </div>
                  )}

                  {/* AI Agent prompt */}
                  {currentStepData.aiAgent && (
                    <div className="mb-2 p-2 bg-orange-50 border border-[#F3701A]/30 rounded">
                      <div className="flex items-center space-x-1 mb-1">
                        <MessageSquare className="w-3 h-3 text-[#F3701A]" />
                        <span className="text-xs font-medium text-[#F3701A]">
                          Need help? Talk to the {currentStepData.aiAgent.name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 mb-1.5">
                        Ask: "{currentStepData.aiAgent.suggestion}"
                      </p>
                      <Button
                        size="sm"
                        onClick={() => openAIAgent(currentStepData.aiAgent!.route, currentStepData.aiAgent!.suggestion)}
                        className="text-xs bg-[#F3701A] hover:bg-[#F3701A]/90 text-white h-6"
                      >
                        🤖 Open AI Agent
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevStep}
                      disabled={currentStep === 0}
                      className="flex items-center space-x-1 text-xs h-6 px-2"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Back</span>
                    </Button>

                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={skipTour}
                        className="text-gray-500 hover:text-gray-700 text-xs h-6 px-2"
                      >
                        Skip
                      </Button>
                      <Button
                        onClick={nextStep}
                        size="sm"
                        className="bg-[#F3701A] hover:bg-[#F3701A]/90 flex items-center space-x-1 text-xs h-6 px-2 text-white"
                      >
                        <span>{currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}</span>
                        {currentStep !== tourSteps.length - 1 && <ArrowRight className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tour starter (when not active) */}
      {!isActive && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center pointer-events-auto">
          <Card className="w-96 max-w-[90vw] shadow-2xl border-3 border-[#F3701A] bg-white">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-[#F3701A]/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Play className="w-8 h-8 text-[#F3701A]" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[#F3701A]">
                Ready for your Blue Tradie tour?
              </h3>
              <p className="text-gray-600 mb-6 text-sm">
                I'll walk you through every feature step-by-step - from creating invoices to chatting with AI advisors. 
                We'll visit each page so you know exactly how to run your tradie business from this platform.
              </p>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Skip for now
                </Button>
                <Button
                  onClick={startTour}
                  className="flex-1 bg-[#F3701A] hover:bg-[#F3701A]/90 text-white"
                >
                  Start Tour
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}