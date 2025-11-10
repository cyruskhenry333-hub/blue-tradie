import { useParams } from "wouter";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, HardHat, Palette } from "lucide-react";
import blueTradieLogo from "@assets/Blue Tradie Logo_1753253697164.png";
import EnhancedChatUI from "@/components/enhanced-chat-ui";
import LogoCreationWizard from "@/components/LogoCreationWizard";
import { toAppUser } from "@shared/utils/toAppUser";


const AGENTS = {
  accountant: {
    name: "💸 Accountant Agent",
    description: "Your personal bookkeeper and tax advisor",
    color: "agent-card-accountant"
  },
  marketing: {
    name: "📣 Marketing & Branding Agent", 
    description: "Your creative partner for marketing, branding, and logo design",
    color: "agent-card-marketing"
  },
  coach: {
    name: "🎯 Business Coach",
    description: "Your mentor for business growth and strategy",
    color: "agent-card-coach"
  },
  legal: {
    name: "📜 Legal Agent",
    description: "Your advisor for contracts and compliance",
    color: "agent-card-legal"
  }
};

export default function Chat() {
  const { agentType } = useParams();
  
  const { data: userData } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });
  const user = toAppUser(userData);
  
  const selectedAgent = agentType ? AGENTS[agentType as keyof typeof AGENTS] : null;

  if (!agentType || !selectedAgent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-tradie-light to-white">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Link href="/dashboard">
                  <img 
                    src={blueTradieLogo} 
                    alt="Blue Tradie Logo" 
                    className="h-16 w-16 md:h-18 md:w-18 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                  />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-tradie-blue">Blue Tradie</h1>
                  <p className="text-sm text-gray-600">AI Business Team</p>
                </div>
              </div>
              <Link href="/">
                <Button variant="ghost">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your AI Assistant</h2>
            <p className="text-gray-600">Select an agent to start chatting</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto ai-agents-preview">
            {Object.entries(AGENTS).map(([key, agent]) => (
              <Link key={key} href={`/chat/${key}`}>
                <Card className={`${agent.color} hover:shadow-lg transition-all cursor-pointer h-full`}>
                  <CardHeader className="text-center">
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-gray-600 text-sm">{agent.description}</p>
                    <Button className="mt-4 w-full">Start Chat</Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-tradie-light to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {user?.businessLogo && user?.businessName ? (
                <Link href="/dashboard">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-tradie-blue rounded-lg flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                    <span className="text-white font-bold text-sm md:text-base">{user.businessName.slice(0, 2).toUpperCase()}</span>
                  </div>
                </Link>
              ) : (
                <Link href="/dashboard">
                  <img 
                    src={blueTradieLogo} 
                    alt="Blue Tradie Logo" 
                    className="h-14 w-14 md:h-16 md:w-16 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                  />
                </Link>
              )}
              <div>
                <h1 className="text-xl font-bold text-tradie-blue">
                  {user?.businessName || "Blue Tradie"}
                </h1>
                <p className="text-sm text-gray-600">{selectedAgent.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/chat">
                <Button variant="ghost" size="sm">Switch Agent</Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Card className={`${selectedAgent.color} max-w-4xl mx-auto`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedAgent.name}</span>
              <div className="flex items-center space-x-3">
                <span className="text-sm font-normal text-gray-600">{selectedAgent.description}</span>
              </div>
            </CardTitle>
          </CardHeader>
          <div className="p-6">
            <EnhancedChatUI agentType={agentType} />
          </div>
        </Card>
      </div>


    </div>
  );
}
