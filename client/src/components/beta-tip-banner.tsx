import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Lightbulb, MessageSquare, FileText, Calculator } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getRegionalEncouragement, getRegionalNoProblem } from "@/utils/language-utils";

interface BetaTip {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    text: string;
    href: string;
  };
}

export default function BetaTipBanner() {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const tips: BetaTip[] = [
    {
      id: "accountant-gst",
      icon: <Calculator className="h-5 w-5" />,
      title: "New to Blue Tradie?",
      description: `${user?.country === "New Zealand" ? "Sweet as" : "No dramas"} — your Accountant knows ${user?.country === "Australia" ? "ATO" : "IRD"} regulations inside out!`,
      action: {
        text: "Chat with Accountant",
        href: "/chat/accountant"
      }
    },
    {
      id: "ai-invoices",
      icon: <FileText className="h-5 w-5" />,
      title: "Speed up invoicing",
      description: `${getRegionalEncouragement(user?.country)} — use AI to auto-fill invoice details from your job description`,
      action: {
        text: "Try AI Invoice",
        href: "/invoices"
      }
    },
    {
      id: "legal-contracts",
      icon: <MessageSquare className="h-5 w-5" />,
      title: "Need contract help?",
      description: `${getRegionalNoProblem(user?.country)} — Legal agent has ${user?.country} templates ready to download`,
      action: {
        text: "Get Contract Template",
        href: "/chat/legal"
      }
    },
    {
      id: "business-coach",
      icon: <Lightbulb className="h-5 w-5" />,
      title: "Growing your business?",
      description: `Chat with your Business Coach for pricing and expansion advice — they're here to help you grow`,
      action: {
        text: "Get Business Advice",
        href: "/chat/coach"
      }
    }
  ];

  useEffect(() => {
    // Check if banner was dismissed today
    const today = new Date().toDateString();
    const dismissedToday = localStorage.getItem(`beta-tip-dismissed-${today}`);
    if (dismissedToday) {
      setDismissed(true);
      return;
    }

    // Rotate tips every 30 seconds
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tips.length);
    }, 30000);

    return () => clearInterval(interval);
  }, [tips.length]);

  const handleDismiss = () => {
    const today = new Date().toDateString();
    localStorage.setItem(`beta-tip-dismissed-${today}`, "true");
    setDismissed(true);
  };

  if (!user || dismissed || !user.isBetaUser) return null;

  const currentTip = tips[currentTipIndex];

  return (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-blue-600">
              {currentTip.icon}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900">{currentTip.title}</h4>
              <p className="text-sm text-blue-700">{currentTip.description}</p>
            </div>
            {currentTip.action && (
              <Button
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
                onClick={() => window.location.href = currentTip.action!.href}
              >
                {currentTip.action.text}
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-blue-600 hover:text-blue-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Tip rotation indicator */}
        <div className="flex justify-center space-x-1 mt-3">
          {tips.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentTipIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentTipIndex ? 'bg-blue-500' : 'bg-blue-200'
              }`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}