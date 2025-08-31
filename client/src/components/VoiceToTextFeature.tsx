import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Smartphone, 
  Zap, 
  CheckCircle2, 
  Clock,
  HardHat,
  Wrench,
  FileText,
  MessageSquare,
  Play,
  ArrowRight
} from "lucide-react";

interface VoiceFeature {
  title: string;
  description: string;
  icon: typeof Mic;
  status: "available" | "beta" | "coming-soon";
}

export default function VoiceToTextFeature() {
  const [isRecording, setIsRecording] = useState(false);
  const [betaSignup, setBetaSignup] = useState({ email: "", phone: "", trade: "" });
  const { toast } = useToast();

  const voiceFeatures: VoiceFeature[] = [
    {
      title: "Voice Invoice Creation",
      description: "Create invoices hands-free while on the job site",
      icon: FileText,
      status: "beta"
    },
    {
      title: "Voice Job Notes", 
      description: "Add job progress notes without stopping work",
      icon: MessageSquare,
      status: "beta"
    },
    {
      title: "AI Voice Assistant",
      description: "Ask your business advisors questions verbally",
      icon: Volume2, 
      status: "coming-soon"
    },
    {
      title: "Expense Capture",
      description: "Log receipts and expenses by speaking to your phone",
      icon: Wrench,
      status: "coming-soon"
    }
  ];

  const demoScript = [
    "Hey Blue Tradie, create an invoice for John Smith",
    "Labor: 6 hours at 85 dollars per hour", 
    "Materials: bathroom vanity, 450 dollars",
    "Add 10% GST and mark as sent"
  ];

  const handleDemoPlay = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      toast({
        title: "Demo Complete!",
        description: "Invoice created in 30 seconds - no typing needed!",
      });
    }, 3000);
  };

  const handleBetaSignup = () => {
    if (!betaSignup.email || !betaSignup.trade) {
      toast({
        title: "Missing Information",
        description: "Please fill in your email and trade type.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Beta Access Requested!",
      description: "We'll notify you when voice features are ready for testing.",
    });
    setBetaSignup({ email: "", phone: "", trade: "" });
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-6 bg-gradient-to-r from-tradie-light to-white p-8 rounded-lg">
        <div className="flex justify-center space-x-4 mb-4">
          <div className="p-4 bg-white rounded-full shadow-md">
            <Mic className="w-8 h-8 text-tradie-blue" />
          </div>
          <div className="p-4 bg-white rounded-full shadow-md">
            <Smartphone className="w-8 h-8 text-tradie-blue" />
          </div>
          <div className="p-4 bg-white rounded-full shadow-md">
            <Zap className="w-8 h-8 text-tradie-blue" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-tradie-blue">Voice-to-Text Revolution</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          The only tradie app with hands-free invoice creation. Work with gloves on, create invoices by talking, 
          and never miss a billable hour again.
        </p>
        
        <div className="flex items-center justify-center space-x-2">
          <Badge className="bg-orange-500 text-white animate-pulse">🚧 BETA TESTING</Badge>
          <Badge variant="outline">Coming Q2 2025</Badge>
        </div>
      </div>

      {/* Interactive Demo */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Play className="w-6 h-6 text-orange-500" />
            Try the Demo - Voice Invoice Creation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center justify-center mb-4">
              <Button 
                size="lg"
                className={`rounded-full w-20 h-20 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-tradie-blue hover:bg-blue-700'}`}
                onClick={handleDemoPlay}
                disabled={isRecording}
              >
                {isRecording ? (
                  <MicOff className="w-8 h-8 animate-pulse" />
                ) : (
                  <Play className="w-8 h-8" />
                )}
              </Button>
            </div>
            
            <div className="text-center space-y-2">
              <p className="font-medium">
                {isRecording ? "🎤 Recording Demo..." : "Click to hear voice invoice creation"}
              </p>
              <p className="text-sm text-gray-600">
                {isRecording ? "Creating invoice from voice commands..." : "30-second demonstration"}
              </p>
            </div>
          </div>
          
          {/* Demo Script */}
          <div className="space-y-3">
            <h4 className="font-semibold">Demo Script:</h4>
            <div className="space-y-2">
              {demoScript.map((line, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-blue-50 rounded">
                  <div className="w-6 h-6 bg-tradie-blue text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <span className="text-gray-700">"{line}"</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">Result:</span>
            </div>
            <p className="text-green-700">
              Complete invoice created in 30 seconds - no typing, no stopping work, no missing details!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {voiceFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-tradie-light rounded-lg">
                        <Icon className="w-6 h-6 text-tradie-blue" />
                      </div>
                      <h3 className="font-bold text-lg">{feature.title}</h3>
                    </div>
                    <Badge variant={
                      feature.status === "available" ? "default" :
                      feature.status === "beta" ? "secondary" :
                      "outline"
                    }>
                      {feature.status === "available" ? "Live" :
                       feature.status === "beta" ? "Beta" :
                       "Soon"}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-600">{feature.description}</p>
                  
                  {feature.status === "beta" && (
                    <div className="flex items-center space-x-2 text-sm text-orange-600">
                      <Clock className="w-4 h-4" />
                      <span>Available for beta testing</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Why Voice Matters for Tradies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <HardHat className="w-6 h-6 text-tradie-blue" />
            Why Voice Tech is Perfect for Tradies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Wrench className="w-8 h-8 text-tradie-blue" />
              </div>
              <h4 className="font-semibold">Hands Stay Clean</h4>
              <p className="text-sm text-gray-600">
                No need to clean hands or remove gloves to update jobs and create invoices
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-semibold">Save Time</h4>
              <p className="text-sm text-gray-600">
                Speaking is 3x faster than typing - capture details while they're fresh
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <Zap className="w-8 h-8 text-orange-600" />
              </div>
              <h4 className="font-semibold">Never Miss Details</h4>
              <p className="text-sm text-gray-600">
                Record everything on-site without interrupting your workflow
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Beta Signup */}
      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-orange-800">
            🚧 Get Early Access to Voice Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md mx-auto space-y-4">
            <p className="text-center text-gray-700">
              Join our beta testing program and be the first to try hands-free invoice creation.
            </p>
            
            <div className="space-y-3">
              <Input 
                placeholder="Your email address"
                type="email"
                value={betaSignup.email}
                onChange={(e) => setBetaSignup(prev => ({ ...prev, email: e.target.value }))}
              />
              <Input 
                placeholder="Phone number (optional)"
                type="tel"
                value={betaSignup.phone}
                onChange={(e) => setBetaSignup(prev => ({ ...prev, phone: e.target.value }))}
              />
              <Input 
                placeholder="What's your trade? (e.g., Plumber, Electrician)"
                value={betaSignup.trade}
                onChange={(e) => setBetaSignup(prev => ({ ...prev, trade: e.target.value }))}
              />
            </div>
            
            <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={handleBetaSignup}>
              <Mic className="w-4 h-4 mr-2" />
              Request Beta Access
            </Button>
            
            <p className="text-xs text-center text-gray-600">
              Beta testing starts Q2 2025. We'll notify you when it's ready!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}