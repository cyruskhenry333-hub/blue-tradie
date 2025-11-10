// @ts-nocheck
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TokenDashboard } from "@/components/TokenDashboard";
import {
  Brain,
  Scale,
  Calculator,
  Megaphone,
  Settings,
  Zap,
  Send,
  Mic,
  MicOff
} from "lucide-react";

interface AdvisorMessage {
  id: string;
  advisor: string;
  message: string;
  timestamp: Date;
  type: 'advice' | 'question' | 'insight';
}

const advisors = [
  {
    id: 'business',
    name: 'Business + Motivation Coach',
    icon: Brain,
    color: 'bg-blue-500',
    description: 'Your Personal CEO & Cheerleader',
    specialties: ['Goal Setting', 'Motivation', 'Decision Support', 'Productivity']
  },
  {
    id: 'legal',
    name: 'Legal + Compliance Coach',
    icon: Scale,
    color: 'bg-purple-500',
    description: 'Your Pocket Lawyer & Safety Officer',
    specialties: ['Contracts', 'Compliance', 'Safety', 'Licenses']
  },
  {
    id: 'financial',
    name: 'Financial + Tax Coach',
    icon: Calculator,
    color: 'bg-green-500',
    description: 'Your Personal CFO & Tax Strategist',
    specialties: ['Cash Flow', 'Tax Optimization', 'Pricing', 'Investment']
  },
  {
    id: 'marketing',
    name: 'Marketing + Brand Coach',
    icon: Megaphone,
    color: 'bg-orange-500',
    description: 'Your Social Media Manager & Brand Builder',
    specialties: ['Content', 'Reviews', 'Lead Generation', 'Branding']
  },
  {
    id: 'operations',
    name: 'Operations + Efficiency Coach',
    icon: Settings,
    color: 'bg-gray-600',
    description: 'Your Process Optimizer & Time Manager',
    specialties: ['Route Planning', 'Inventory', 'Workflow', 'Equipment']
  },
  {
    id: 'technology',
    name: 'Technology + Innovation Coach',
    icon: Zap,
    color: 'bg-indigo-500',
    description: 'Your Tech Advisor & Future Planner',
    specialties: ['Tools', 'Automation', 'Industry Trends', 'Innovation']
  }
];

export default function AIAdvisors() {
  const [activeAdvisor, setActiveAdvisor] = useState('business');
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [chatHistory, setChatHistory] = useState<AdvisorMessage[]>([
    {
      id: '1',
      advisor: 'business',
      message: "G'day mate! Ready to smash your business goals today? I've been looking at your numbers and I reckon we should chat about that pricing strategy. You're leaving money on the table!",
      timestamp: new Date(),
      type: 'advice'
    }
  ]);

  const currentAdvisor = advisors.find(a => a.id === activeAdvisor);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    const newMessage: AdvisorMessage = {
      id: Date.now().toString(),
      advisor: activeAdvisor,
      message: userMessage,
      timestamp: new Date(),
      type: 'question'
    };

    setChatHistory(prev => [...prev, newMessage]);
    setMessage('');

    // Call real AI backend
    try {
      const agentTypeMap: Record<string, string> = {
        business: 'business_coach',
        financial: 'accountant',
        marketing: 'marketing',
        legal: 'legal',
        operations: 'operations',
        technology: 'technology'
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          agentType: agentTypeMap[activeAdvisor] || 'business_coach',
          tone: 'casual'
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      const aiResponse: AdvisorMessage = {
        id: (Date.now() + 1).toString(),
        advisor: activeAdvisor,
        message: data.message,
        timestamp: new Date(),
        type: 'advice'
      };

      setChatHistory(prev => [...prev, aiResponse]);

    } catch (error) {
      console.error('Error getting AI response:', error);

      // Show error message
      const errorResponse: AdvisorMessage = {
        id: (Date.now() + 1).toString(),
        advisor: activeAdvisor,
        message: "Sorry mate, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
        type: 'advice'
      };

      setChatHistory(prev => [...prev, errorResponse]);
    }
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    // Voice recognition would be implemented here
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">AI Business Advisors</h1>
        <p className="text-gray-600 mt-2">Your expert team of AI coaches, ready 24/7 to help grow your business</p>
      </div>

      {/* Token Usage Dashboard */}
      <div className="mb-6">
        <TokenDashboard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Advisor Selection */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Your Advisory Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {advisors.map((advisor) => {
                const IconComponent = advisor.icon;
                return (
                  <div
                    key={advisor.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      activeAdvisor === advisor.id
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                    onClick={() => setActiveAdvisor(advisor.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${advisor.color} text-white`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{advisor.name}</h3>
                        <p className="text-xs text-gray-600 mt-1">{advisor.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {advisor.specialties.slice(0, 2).map((specialty) => (
                            <Badge key={specialty} variant="secondary" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center space-x-3">
                {currentAdvisor && (
                  <>
                    <div className={`p-2 rounded-lg ${currentAdvisor.color} text-white`}>
                      <currentAdvisor.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{currentAdvisor.name}</CardTitle>
                      <p className="text-sm text-gray-600">{currentAdvisor.description}</p>
                    </div>
                  </>
                )}
              </div>
            </CardHeader>

            {/* Chat Messages */}
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-full p-4">
                <div className="space-y-4">
                  {chatHistory
                    .filter(msg => msg.advisor === activeAdvisor)
                    .map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.type === 'question' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.type === 'question'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-1 ${
                          msg.type === 'question' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {msg.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <Input
                  placeholder={`Ask your ${currentAdvisor?.name.toLowerCase()}...`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleListening}
                  className={isListening ? 'bg-red-500 text-white' : ''}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Button onClick={handleSendMessage} disabled={!message.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Try: "Should I raise my rates?", "Help me write a quote", or "What should I focus on today?"
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-green-500" />
            <div>
              <h3 className="font-semibold">Tax Health Check</h3>
              <p className="text-sm text-gray-600">Get instant tax optimization tips</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-blue-500" />
            <div>
              <h3 className="font-semibold">Business Goals Review</h3>
              <p className="text-sm text-gray-600">Check progress on your targets</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Megaphone className="w-5 h-5 text-orange-500" />
            <div>
              <h3 className="font-semibold">Marketing Boost</h3>
              <p className="text-sm text-gray-600">Get content ideas for this week</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}