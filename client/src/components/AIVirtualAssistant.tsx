import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  MessageCircle,
  Send,
  Bot,
  User,
  HelpCircle,
  Settings,
  FileText,
  Star,
  Minimize2,
  Maximize2
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "faq" | "setup" | "feedback" | "general";
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
}

export default function AIVirtualAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "faq" | "setup">("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: chatHistory } = useQuery<ChatMessage[]>({
    queryKey: ["/api/va/chat-history"],
    retry: false,
  });

  const { data: faqs } = useQuery<FAQItem[]>({
    queryKey: ["/api/va/faqs"],
    retry: false,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, type = "general" }: { message: string; type?: string }) => {
      const response = await apiRequest("POST", "/api/va/chat", { message, type });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/va/chat-history"] });
      setMessage("");
    },
    onError: () => {
      toast({
        title: "Message Failed",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  });

  const logFeedbackMutation = useMutation({
    mutationFn: async ({ feedback, context }: { feedback: string; context: string }) => {
      const response = await apiRequest("POST", "/api/va/feedback", { feedback, context });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback Logged",
        description: "Thank you for your feedback. We'll use it to improve Blue Tradie."
      });
    }
  });

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Removed auto-show behavior - let users open it manually when they want it

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    sendMessageMutation.mutate({ 
      message: message.trim(),
      type: activeTab 
    });
  };

  const handleFAQClick = (faq: FAQItem) => {
    sendMessageMutation.mutate({ 
      message: faq.question,
      type: "faq"
    });
    setActiveTab("chat");
  };

  const quickStartItems = [
    { title: "Set up my first invoice", action: "invoice-setup" },
    { title: "Add a new job", action: "job-setup" },
    { title: "Connect with AI advisors", action: "ai-intro" },
    { title: "Understand GST settings", action: "gst-help" },
    { title: "Set business goals", action: "goals-setup" }
  ];

  const faqCategories = faqs ? Array.from(new Set(faqs.map(faq => faq.category))) : [];

  return (
    <>
      {/* Floating Button with Label */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative group">
          {/* Always visible label */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full shadow-sm font-medium whitespace-nowrap">
            AI Assistant
          </div>
          <Button
            onClick={() => setIsOpen(true)}
            className="rounded-full w-14 h-14 shadow-lg bg-blue-600 hover:bg-blue-700"
          >
            <MessageCircle className="w-6 h-6" />
          </Button>
          <div className="absolute bottom-16 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Get instant business help
          </div>
        </div>
      </div>

      {/* AI Assistant Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className={`max-w-lg ${isMinimized ? 'h-16' : 'h-[70vh]'} transition-all duration-200`}>
          <DialogHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-600" />
              <DialogTitle>Blue Tradie Assistant</DialogTitle>
              <Badge variant="secondary" className="text-xs">Beta</Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
            </div>
          </DialogHeader>

          {!isMinimized && (
            <div className="flex flex-col h-full">
              {/* Tabs */}
              <div className="flex border-b">
                <button
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "chat" 
                      ? "border-blue-500 text-blue-600" 
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("chat")}
                >
                  <MessageCircle className="w-4 h-4 inline mr-2" />
                  Chat
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "faq" 
                      ? "border-blue-500 text-blue-600" 
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("faq")}
                >
                  <HelpCircle className="w-4 h-4 inline mr-2" />
                  FAQs
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "setup" 
                      ? "border-blue-500 text-blue-600" 
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("setup")}
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  Quick Setup
                </button>
              </div>

              {/* Chat Tab */}
              {activeTab === "chat" && (
                <div className="flex flex-col flex-1">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {/* Welcome Message */}
                      {(!chatHistory || chatHistory.length === 0) && (
                        <div className="flex gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Bot className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-sm">
                                Hey there! I'm your Blue Tradie assistant. I can help you with:
                              </p>
                              <ul className="text-sm mt-2 space-y-1 text-gray-600">
                                <li>• Setting up invoices and jobs</li>
                                <li>• Understanding features</li>
                                <li>• Troubleshooting issues</li>
                                <li>• Collecting your feedback</li>
                              </ul>
                              <p className="text-sm mt-2">What can I help you with today?</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Chat Messages */}
                      {chatHistory?.map((msg) => (
                        <div key={msg.id} className="flex gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            msg.role === "user" 
                              ? "bg-blue-500" 
                              : "bg-gray-100"
                          }`}>
                            {msg.role === "user" ? (
                              <User className="w-4 h-4 text-white" />
                            ) : (
                              <Bot className="w-4 h-4 text-gray-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className={`rounded-lg p-3 ${
                              msg.role === "user" 
                                ? "bg-blue-500 text-white ml-8" 
                                : "bg-gray-50"
                            }`}>
                              <p className="text-sm">{msg.content}</p>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {msg.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Ask me anything about Blue Tradie..."
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!message.trim() || sendMessageMutation.isPending}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* FAQ Tab */}
              {activeTab === "faq" && (
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {faqCategories.map(category => (
                      <div key={category}>
                        <h3 className="font-semibold text-sm text-gray-700 mb-2">{category}</h3>
                        <div className="space-y-2">
                          {faqs?.filter(faq => faq.category === category).map(faq => (
                            <Card key={faq.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleFAQClick(faq)}>
                              <CardContent className="p-3">
                                <p className="text-sm font-medium">{faq.question}</p>
                                <p className="text-xs text-gray-600 mt-1">{faq.answer.slice(0, 100)}...</p>
                                <div className="flex items-center justify-between mt-2">
                                  <Badge variant="outline" className="text-xs">{faq.category}</Badge>
                                  <div className="flex items-center text-xs text-gray-500">
                                    <Star className="w-3 h-3 mr-1" />
                                    {faq.helpful}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {/* Quick Setup Tab */}
              {activeTab === "setup" && (
                <div className="flex-1 p-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Quick Setup Guides</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Click any item below and I'll guide you through the process
                      </p>
                    </div>
                    
                    <div className="grid gap-3">
                      {quickStartItems.map(item => (
                        <Card key={item.action} className="cursor-pointer hover:bg-blue-50" onClick={() => {
                          sendMessageMutation.mutate({ 
                            message: `Help me ${item.title.toLowerCase()}`,
                            type: "setup"
                          });
                          setActiveTab("chat");
                        }}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{item.title}</span>
                              <FileText className="w-4 h-4 text-gray-400" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-sm text-blue-800 mb-2">Need More Help?</h4>
                      <p className="text-sm text-blue-700 mb-3">
                        I'm here to help with any questions about Blue Tradie. Just ask!
                      </p>
                      <Button size="sm" variant="outline" onClick={() => setActiveTab("chat")}>
                        Start Chatting
                        <MessageCircle className="w-3 h-3 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}