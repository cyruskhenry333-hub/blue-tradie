import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, MessageSquare, Lightbulb, Shield, Sparkles } from "lucide-react";

export function AIGuideOnboarding() {
  return (
    <div className="space-y-6">
      <Card className="border-l-4 border-l-tradie-blue">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-tradie-blue" />
            Welcome to Your AI Business Team!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Your AI agents are here to help grow your business. They understand Australian/New Zealand 
            trade regulations and speak your language. Here's how to get the most out of them:
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                How to Chat with AI Agents
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Just talk naturally - "Help me start my business"</li>
                <li>• Ask specific questions - "Can you make an invoice?"</li>
                <li>• Request examples - "Show me how to price electrical work"</li>
                <li>• Get step-by-step help - "Walk me through BAS lodgement"</li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Great Starter Questions
              </h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• "What should I charge for this job?"</li>
                <li>• "Help me write a quote"</li>
                <li>• "Explain GST in simple terms"</li>
                <li>• "What insurance do I need?"</li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
            <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Stay Safe & Smart
            </h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• All invoices are marked "Beta - Verify All Info" - double-check everything</li>
              <li>• Keep your own records during beta testing</li>
              <li>• Bank connections are disabled by default for your safety</li>
              <li>• Always verify financial advice with a qualified accountant</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Beginner-Friendly
            </Badge>
            <Badge variant="secondary">Australian/NZ Compliant</Badge>
            <Badge variant="secondary">Available 24/7</Badge>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600 mb-3">
              <strong>Pro Tip:</strong> If anything gets confusing, just say "Explain this like I'm new to business" 
              or "Can you simplify that?" - your agents will adjust their communication style.
            </p>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 text-center">
                Your AI agents get smarter as you use them. The more you chat, the better they understand your business needs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}