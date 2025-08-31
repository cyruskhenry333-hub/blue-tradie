import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Send, Loader2, Bot, User, Lightbulb, MessageSquare, Settings, Zap } from "lucide-react";
import TokenUsageAlert from "@/components/token-usage-alert";
import UpgradePromptModal from "@/components/upgrade-prompt-modal";


interface EnhancedChatUIProps {
  agentType?: string;
  onAgentChange?: (agentType: string) => void;
}

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatResponse {
  message: string;
  suggestions?: string[];
  quickActions?: string[];
}

const agents = [
  {
    id: "accountant",
    name: "💸 Accountant",
    description: "Tax & GST\nCash Flow",
    color: "bg-green-100 text-green-800",
    persona: "Financial Expert"
  },
  {
    id: "marketing",
    name: "📣 Marketing",
    description: "Get Customers\nGrow Business",
    color: "bg-blue-100 text-blue-800",
    persona: "Marketing Guru"
  },
  {
    id: "coach",
    name: "🎯 Business Coach",
    description: "Hit Goals\nStay Focused",
    color: "bg-purple-100 text-purple-800",
    persona: "Business Mentor"
  },
  {
    id: "legal",
    name: "📜 Legal",
    description: "Contracts\n& Compliance",
    color: "bg-orange-100 text-orange-800",
    persona: "Legal Advisor"
  }
];

export default function EnhancedChatUI({ agentType = "coach", onAgentChange }: EnhancedChatUIProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [quickActions, setQuickActions] = useState<string[]>([]);
  const [currentAgent, setCurrentAgent] = useState(agentType);
  const [tone, setTone] = useState("casual");
  const [showSettings, setShowSettings] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [lastActionFeedback, setLastActionFeedback] = useState<{
    tokensUsed: number;
    costAud: number;
    source: 'cached' | 'openai';
    agentType: string;
    show: boolean;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const selectedAgent = agents.find(agent => agent.id === currentAgent) || agents[2];

  // Load chat history
  const { data: chatHistory } = useQuery({
    queryKey: [`/api/chat/${currentAgent}/history`],
    retry: false,
  });

  useEffect(() => {
    if (chatHistory) {
      setMessages(chatHistory);
    }
  }, [chatHistory, currentAgent]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string): Promise<ChatResponse> => {
      // Show reading indicator
      setIsReading(true);
      await new Promise(resolve => setTimeout(resolve, 800)); // Reading animation
      
      setIsReading(false);
      setIsThinking(true);
      
      const response = await apiRequest("POST", "/api/chat", {
        agentType: currentAgent,
        message: messageText,
        tone: tone,
      });
      
      setIsThinking(false);
      return response.json();
    },
    onSuccess: (response) => {
      // Add assistant response to messages
      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setSuggestions(response.suggestions || []);
      setQuickActions(response.quickActions || []);
      
      // Show token usage feedback
      if (response.tokens_used && response.cost_aud !== undefined) {
        setLastActionFeedback({
          tokensUsed: response.tokens_used,
          costAud: response.cost_aud,
          source: response.source || 'openai',
          agentType: currentAgent,
          show: true
        });
      }
    },
    onError: (error: Error) => {
      setIsReading(false);
      setIsThinking(false);
      toast({
        title: "Chat Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (messageText?: string) => {
    const textToSend = messageText || message.trim();
    if (!textToSend) return;

    // Add user message to chat immediately
    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    
    // Send to AI
    sendMessageMutation.mutate(textToSend);
  };

  const handleAgentChange = (agentId: string) => {
    setCurrentAgent(agentId);
    setMessages([]);
    setSuggestions([]);
    onAgentChange?.(agentId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickStarters = {
    accountant: [
      "I'm just starting out - explain GST simply",
      "What expenses can I claim as a tradie?",
      "How much tax should I set aside?",
      "Can you explain that more simply?"
    ],
    marketing: [
      "How do I start a business?",
      "I'm new to marketing - help me get started",
      "What's the easiest way to get customers?",
      "Write a simple Facebook post for me"
    ],
    coach: [
      "I'm feeling overwhelmed - help me",
      "I don't know where to start with my business",
      "Can you break this down step by step?",
      "I need some encouragement and motivation"
    ],
    legal: [
      "I'm confused about contracts - help me",
      "What legal stuff do I need to know?",
      "Explain this like I'm new to business",
      "What does this mean for my business?"
    ]
  };

  const handleUpgrade = () => {
    setShowUpgradeModal(true);
  };

  const hideActionFeedback = () => {
    setLastActionFeedback(prev => prev ? { ...prev, show: false } : null);
  };

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      {/* Token Usage Alert */}
      <div className="mb-4">
        <TokenUsageAlert onUpgrade={handleUpgrade} />
      </div>

      {/* Agent Selector */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Choose Your AI Assistant</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {agents.map((agent) => (
              <Button
                key={agent.id}
                variant={currentAgent === agent.id ? "default" : "outline"}
                onClick={() => handleAgentChange(agent.id)}
                className={`p-4 h-auto min-h-[100px] text-left flex flex-col justify-center ${currentAgent === agent.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}`}
              >
                <div className="space-y-2 w-full">
                  <div className="font-medium text-sm leading-tight">{agent.name}</div>
                  <div className="text-xs opacity-75 leading-tight whitespace-pre-line">{agent.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">{selectedAgent.name}</CardTitle>
                <p className="text-sm text-gray-600">{selectedAgent.description}</p>
              </div>
              <Badge className={selectedAgent.color}>Active</Badge>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
          
          {showSettings && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium">Tone:</label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-600 mb-2">Start a conversation</h3>
              <p className="text-gray-500 text-sm mb-4">
                Your friendly AI assistant - just ask in your own words!
              </p>
              
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mx-4 mb-6 text-left max-w-lg mx-auto">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Lightbulb className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-700">
                      <strong>💡 Not sure how to ask?</strong> Most tradies aren't experienced with AI - try phrases like:
                      <br />• "Explain this like I'm new to business"
                      <br />• "Break this down step-by-step" 
                      <br />• "I'm feeling overwhelmed - help me"
                      <br />• "Can you explain that more simply?"
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Quick starters */}
              <div className="space-y-2 max-w-md mx-auto">
                <p className="text-sm font-medium text-gray-700">Quick starters:</p>
                <div className="grid gap-2">
                  {quickStarters[currentAgent as keyof typeof quickStarters]?.map((starter, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendMessage(starter)}
                      className="text-left justify-start h-auto p-3"
                    >
                      <Lightbulb className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="text-sm">{starter}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex space-x-3 max-w-3xl ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-600'
                    }`}>
                      {msg.role === 'user' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div
                      className={`p-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                      <div className={`text-xs mt-1 ${
                        msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* AI Status Indicators */}
              {(isReading || isThinking) && (
                <div className="flex justify-start">
                  <div className="flex space-x-3 max-w-3xl">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-600">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="p-3 rounded-lg bg-gray-100 text-gray-900">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {isReading ? `Reading your message...` : `Thinking & writing...`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </CardContent>

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <div className="px-4 pb-2">
            <div className="mb-2">
              <p className="text-xs font-medium text-gray-500 mb-2">Quick Actions:</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Check if this is an invoice-related action that might benefit from auto-fill
                      if (action.toLowerCase().includes('invoice') || action.toLowerCase().includes('quote')) {
                        const message = `${action} - I need help creating this. Can you draft the details and auto-fill what you can?`;
                        handleSendMessage(message);
                      } else {
                        handleSendMessage(action);
                      }
                    }}
                    className="text-xs bg-blue-50 border-blue-200 hover:bg-blue-100"
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    {action}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendMessage(suggestion)}
                  className="text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isReading ? "Reading your message..." :
                isThinking ? "AI is thinking..." :
                `Try: "Explain GST like I'm new to it" or "How do I get more winter jobs?"`
              }
              disabled={sendMessageMutation.isPending || isReading || isThinking}
              className="flex-1"
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={sendMessageMutation.isPending || !message.trim() || isReading || isThinking}
              className="btn-tradie-primary"
            >
              {(sendMessageMutation.isPending || isReading || isThinking) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Upgrade Modal */}
      <UpgradePromptModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason="manual"
      />

      {/* Token Action Feedback */}

    </div>
  );
}