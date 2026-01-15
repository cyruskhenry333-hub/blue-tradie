import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Send, Loader2 } from "lucide-react";

interface AiChatProps {
  agentType: string;
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
}

export default function AiChat({ agentType }: AiChatProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load chat history
  const { data: chatHistory } = useQuery({
    queryKey: [`/api/chat/${agentType}/history`],
    retry: false,
  });

  useEffect(() => {
    if (chatHistory && Array.isArray(chatHistory)) {
      setMessages(chatHistory);
    }
  }, [chatHistory]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string): Promise<ChatResponse> => {
      const response = await apiRequest("POST", "/api/chat", {
        agentType,
        message,
      });
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
    },
    onError: (error: Error) => {
      console.error('[AiChat] Mutation error:', error);

      // Show specific error message for timeout vs other errors
      const isTimeout = error.message?.includes('timeout') || error.message?.includes('timed out');

      toast({
        title: isTimeout ? "Request Timed Out" : "Chat Error",
        description: isTimeout
          ? "The request took too long. Please try again with a shorter message or try again later."
          : error.message || "Failed to send message. Please try again.",
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getInitialMessage = () => {
    // Use regional greetings - simple fallback since user context may not be available
    const greeting = "Hey";
    
    const agentGreetings = {
      accountant: `${greeting}! I'm your Accountant Agent. I can help you track expenses, understand tax obligations, and keep your books in order. What money questions do you have today?`,
      marketing: `${greeting}! I'm your Marketing Agent. I can help you write ads, create social posts, follow up with customers, and find more jobs. What marketing challenge can I help you tackle?`,
      coach: `${greeting}! I'm your Business Coach. I'm here to help you grow your business, price jobs right, and work smarter. What's on your mind about your business today?`,
      legal: `${greeting}! I'm your Legal Agent. I can help with contracts, insurance requirements, safety compliance, and business legal matters. What legal question can I help you with?`
    };
    
    return agentGreetings[agentType as keyof typeof agentGreetings] || `${greeting}! How can I help you today?`;
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* Chat Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-lg scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
      >
        {messages.length === 0 && (
          <div className="chat-bubble-agent">
            <div className="text-sm font-medium text-gray-700 mb-1">
              {agentType.charAt(0).toUpperCase() + agentType.slice(1)} Agent
            </div>
            <div>{getInitialMessage()}</div>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-agent'}>
              {msg.role === 'assistant' && (
                <div className="text-sm font-medium text-gray-700 mb-1">
                  {agentType.charAt(0).toUpperCase() + agentType.slice(1)} Agent
                </div>
              )}
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        
        {sendMessageMutation.isPending && (
          <div className="flex justify-start">
            <div className="chat-bubble-agent">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      {suggestions.length > 0 && (
        <div className="p-4 border-t bg-white">
          <div className="text-sm text-gray-600 mb-2">Quick questions:</div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSendMessage(suggestion)}
                disabled={sendMessageMutation.isPending}
                className="text-xs"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex space-x-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={sendMessageMutation.isPending}
            className="flex-1"
          />
          <Button 
            onClick={() => handleSendMessage()}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="btn-tradie-primary px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
