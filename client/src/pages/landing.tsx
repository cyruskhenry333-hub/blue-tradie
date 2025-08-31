import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calculator, Bot, TrendingUp, Smartphone, DollarSign, MessageSquare, User, Gavel, HardHat, X, Check, Star, Users, Crown, Timer, CheckCircle } from "lucide-react";
import { TestimonialsSection } from "@/components/testimonials-section";

import { useAnalytics } from "@/lib/analytics";
import { useBetaStatus } from "@/hooks/useBetaStatus";
import { useLocation } from "wouter";
import { usePublicRegionalAssets } from "@/utils/regional-assets";
import { config, getPhase1Features, getPhase2PlusFeatures } from "@shared/config";
import { useQuery } from "@tanstack/react-query";

export default function Landing() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [showLifetimeModal, setShowLifetimeModal] = useState(false);

  const { data: betaStatus, isLoading: betaLoading } = useBetaStatus();
  const [, setLocation] = useLocation();
  const regionalAssets = usePublicRegionalAssets();
  const analytics = useAnalytics();

  // Get waitlist status for live counters
  const { data: waitlistStatus } = useQuery({
    queryKey: ['/api/waitlist/status'],
    refetchInterval: 30000 // Update every 30 seconds
  });

  // Real-time signup notifications (only show when actual signups occur)
  // TODO: Implement real signup event listener when backend supports it

  const handleGetStarted = () => {
    analytics.trackCTAClick("Get Demo Code", "hero_section");
    // Since the homepage is now the demo request form, stay on current page
    // User will see the demo request form
  };

  const handleGetDemoCode = () => {
    analytics.trackCTAClick("Get Demo Code", "hero_section");
    setLocation("/demo-request");
  };

  const handleDemoLogin = () => {
    setLocation('/demo');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-tradie-light to-white">
      {/* Demo Access Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-2">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">
                Live Demo Available
              </span>
            </div>
            <div className="hidden sm:block">•</div>
            <div className="flex items-center space-x-2">
              <Timer className="h-4 w-4" />
              <span>
                Get instant access to Blue Tradie
              </span>
            </div>
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={handleGetDemoCode}
              className="bg-white text-blue-600 hover:bg-gray-100 text-xs px-3 py-1"
            >
              Get Demo Code
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img 
                src={regionalAssets.logo} 
                alt="Blue Tradie Logo" 
                className="h-20 w-20 md:h-24 md:w-24 object-contain"
              />
              <span className="text-2xl font-bold text-tradie-blue">Blue Tradie</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-gray-600 hover:text-tradie-blue transition-colors">Features</a>
              <a href="/roadmap" className="text-gray-600 hover:text-tradie-blue transition-colors">Roadmap</a>
              {/* <a href="#pricing" className="text-gray-600 hover:text-tradie-blue transition-colors">Pricing</a> */}
              <Button variant="ghost" onClick={handleDemoLogin}>Demo Login</Button>
              <Button onClick={handleGetDemoCode} className="btn-tradie-primary">
                Get Demo Code
              </Button>
            </div>
            
            <div className="md:hidden">
              <Button onClick={handleGetDemoCode}>Get Demo Code</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Beta Banner - HIDDEN FOR WAITLIST LAUNCH */}
      {/* 
      <div className="bg-gradient-to-r from-blue-100 to-blue-200 py-3">
        <div className="container mx-auto px-4 text-center">
          {betaStatus?.canJoin ? (
            <p className="text-sm md:text-base font-medium text-blue-800">
              🎉 Beta is now live! Got a code? 
              <a href="/beta" className="ml-2 underline hover:no-underline font-bold text-blue-900">
                Enter Here →
              </a>
            </p>
          ) : (
            <p className="text-sm md:text-base font-medium text-blue-800">
              🎉 The first 100 tradies are in! Join the waitlist and get 40% off your first year.
            </p>
          )}
        </div>
      </div>
      */}

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-tradie-light to-white relative overflow-hidden min-h-[80vh]">
        {/* Blue Tradie Model - positioned to the left */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1/2 lg:w-2/5 bg-contain bg-left bg-no-repeat opacity-100 z-0 hidden md:block"
          style={{ backgroundImage: `url(${regionalAssets.hero.model})` }}
        ></div>
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto md:ml-auto md:mr-0 md:w-1/2 lg:w-3/5 text-center md:text-left relative z-10">
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-6 leading-tight">
              Your Business, Sorted.<br />
              <span className="text-tradie-blue">Easy As.</span>
            </h1>
            <p className="text-xl text-black mb-4 max-w-2xl mx-auto md:mx-0 font-semibold">
              The all-in-one platform built for Aussie & Kiwi tradies. Get your quotes, invoices, and books all sorted with your personal AI business team that actually gets your business.
            </p>

            
            {/* Beta Status Indicator - HIDDEN FOR WAITLIST LAUNCH */}
            {/* 
            {betaStatus && (
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 mb-8 max-w-md mx-auto md:mx-0 border">
                {betaStatus.canJoin ? (
                  <div className="text-center md:text-left">
                    <p className="text-sm text-gray-600 mb-2">🚀 Beta signup is live!</p>
                    <p className="text-lg font-semibold text-green-600">
                      {betaStatus.betaLimit - betaStatus.betaCount} spots remaining out of {betaStatus.betaLimit}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {betaStatus.message}
                    </p>
                    
                    {config.features.lifetimeAccessOffer.enabled && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                          <span className="text-yellow-600 font-medium text-sm">🎯 Early Access Special</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">
                          Get lifetime access to Phase 1 features
                        </p>
                        <button 
                          className="text-xs text-tradie-blue hover:text-blue-700 underline decoration-dotted"
                          onClick={() => setShowLifetimeModal(true)}
                        >
                          What's included? • Terms apply
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center md:text-left">
                    <p className="text-sm text-gray-600 mb-2">🎉 Beta is full!</p>
                    <p className="text-lg font-semibold text-orange-600">
                      {betaStatus.waitlistCount} people on waitlist
                    </p>
                  </div>
                )}
              </div>
            )}
            */}
            
            <div className="flex flex-col items-center md:items-start gap-4 mb-12">
              <div className="flex flex-col gap-6 items-center sm:flex-row sm:gap-4">
                <div className="relative">
                  <Button 
                    onClick={handleGetDemoCode}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg px-8 py-4 shadow-lg"
                    size="lg"
                  >
                    Get Demo Code
                  </Button>

                </div>
                <div className="mt-4 sm:mt-0">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="text-lg px-8 py-4 border-2 border-gray-300 bg-white text-black hover:bg-gray-100 hover:text-tradie-blue"
                    onClick={() => setLocation('/demo')}
                  >
                    👁️ View Demo Dashboard
                  </Button>
                </div>
              </div>
              <Button 
                variant="ghost"
                className="text-gray-600 hover:text-tradie-blue underline"
                onClick={() => {
                  const roadmapElement = document.querySelector('#roadmap') as HTMLElement;
                  if (roadmapElement) {
                    window.scrollTo({ top: roadmapElement.offsetTop, behavior: 'smooth' });
                  } else {
                    window.location.href = '/roadmap';
                  }
                }}
              >
                🔗 View Our Roadmap
              </Button>
            </div>
            
            {/* Trust indicators */}
            <div className="flex items-center justify-center md:justify-start space-x-8 text-sm">
              <div className="flex items-center space-x-2">
                <span>🇦🇺</span>
                <span className="text-black font-medium">GST 10% (Australia)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🇳🇿</span>
                <span className="text-black font-medium">GST 15% (New Zealand)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🤖</span>
                <span className="text-black font-medium">AI Agents for ATO & IRD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real signup notifications will be added here when backend supports it */}

      </section>

      {/* 3-Tier Beta Access Section - REMOVED FOR WAITLIST LAUNCH */}

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How Blue Tradie Works
            </h2>
            <p className="text-xl text-gray-600">Start with a free demo, then upgrade to Blue Tradie Pro when you're ready</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center p-6 border-2 border-blue-200 bg-white shadow-lg">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📧</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">1. Request Demo Access</h3>
              <p className="text-gray-600 mb-4">Fill out our quick form and get instant access to your personalized demo code. Takes less than 30 seconds.</p>
              <div className="text-sm text-blue-600 font-medium">Free demo with 1M tokens</div>
            </Card>
            
            <Card className="text-center p-6 border-2 border-purple-200 bg-white shadow-lg">
              <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">2. Try the Demo Dashboard</h3>
              <p className="text-gray-600 mb-4">Explore the full platform with real features. Create invoices, chat with AI agents, track jobs and expenses.</p>
              <div className="text-sm text-purple-600 font-medium">Full feature access in demo mode</div>
            </Card>
            
            <Card className="text-center p-6 border-2 border-orange-200 bg-white shadow-lg">
              <div className="w-16 h-16 bg-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💳</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">3. Upgrade to Paid Plan</h3>
              <p className="text-gray-600 mb-4">Ready to streamline your business? Choose your plan and start with secure Stripe payments and automated invoicing.</p>
              <div className="text-sm text-orange-600 font-medium">Monthly or annual billing available</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Run Your Trade Business
            </h2>
            <p className="text-xl text-gray-600">No tech degree required. Just simple tools that work.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-tradie-orange rounded-xl flex items-center justify-center mx-auto mb-4">
                <Calculator className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Invoicing</h3>
              <p className="text-gray-600">Create professional quotes and invoices in seconds. Get paid faster with integrated payments.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-tradie-orange rounded-xl flex items-center justify-center mx-auto mb-4">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Assistants</h3>
              <p className="text-gray-600">Your personal business coach, accountant, marketer, and legal advisor. Available 24/7.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-tradie-orange rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Everything</h3>
              <p className="text-gray-600">See your income, expenses, and profits in real-time. Know exactly how your business is going.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-tradie-orange rounded-xl flex items-center justify-center mx-auto mb-4">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Mobile First</h3>
              <p className="text-gray-600">Run your business from your phone. Update jobs, send quotes, and chat with customers on the go.</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Assistants Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet Your AI Business Team</h2>
            <p className="text-xl text-gray-600">Four expert assistants to help grow your business</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="agent-card-accountant h-full">
              <CardContent className="p-6 text-center">
                <DollarSign className="h-12 w-12 text-tradie-success mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">💸 Accountant Agent</h3>
                <p className="text-gray-600">Tracks your money, sorts your expenses, and keeps the ATO happy. BAS prep made easy.</p>
              </CardContent>
            </Card>
            
            <Card className="agent-card-marketing h-full">
              <CardContent className="p-6 text-center">
                <MessageSquare className="h-12 w-12 text-tradie-orange mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">📣 Marketing Agent</h3>
                <p className="text-gray-600">Writes your ads, replies to customers, and helps you find local jobs. Your personal sales mate.</p>
              </CardContent>
            </Card>
            
            <Card className="agent-card-coach h-full">
              <CardContent className="p-6 text-center">
                <User className="h-12 w-12 text-tradie-blue mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">🧠 Business Coach</h3>
                <p className="text-gray-600">Weekly check-ins, pricing advice, and productivity tips. Like having a business mentor in your pocket.</p>
              </CardContent>
            </Card>
            
            <Card className="agent-card-legal h-full">
              <CardContent className="p-6 text-center">
                <Gavel className="h-12 w-12 text-tradie-danger mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">📜 Legal Agent</h3>
                <p className="text-gray-600">Contract templates, insurance reminders, and compliance tips. Keeps you covered and sorted.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Your Business Dashboard</h2>
            <p className="text-xl text-gray-600">Everything you need to know, at a glance</p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-2xl">
              <CardContent className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-semibold mb-1">Hey Mate!</h3>
                    <p className="text-gray-600">Here's how your business is tracking</p>
                  </div>
                  <Button variant="outline">📅 This Week</Button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-tradie-blue mb-1">4</div>
                      <div className="text-gray-600 text-sm">Today's Jobs</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-tradie-success mb-1">$2,890</div>
                      <div className="text-gray-600 text-sm">This Week</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-tradie-warning mb-1">$1,240</div>
                      <div className="text-gray-600 text-sm">Outstanding</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-tradie-blue mb-1">7</div>
                      <div className="text-gray-600 text-sm">New Messages</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button className="btn-tradie-primary">📝 New Quote</Button>
                  <Button variant="outline" className="border-tradie-success text-tradie-success">➕ Add Job</Button>
                  <Button variant="outline" className="border-tradie-warning text-tradie-warning">🧾 Add Expense</Button>
                  <Button variant="outline" className="border-tradie-blue text-tradie-blue">🤖 Chat AI</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>


      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* CTA Section */}
      <section className="py-20 px-4 bg-tradie-blue text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Your Business Sorted?</h2>
          <p className="text-xl mb-4 opacity-90">
            Be one of the first tradies to streamline your business with Blue Tradie
          </p>
          <p className="text-lg mb-8 opacity-80">
            — the AI business app built to make your work (and life) easier
          </p>
          
          {/* Lifetime Access Offer - HIDDEN FOR WAITLIST LAUNCH */}
          {/*
          {betaStatus?.canJoin && config.features.lifetimeAccessOffer.enabled && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6 border border-white/20 max-w-md mx-auto">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-yellow-300 font-semibold">{config.features.lifetimeAccessOffer.title}</span>
              </div>
              <p className="text-lg font-medium mb-1">
                {config.features.lifetimeAccessOffer.subtitle}
              </p>
              <button 
                className="text-sm text-white/80 hover:text-white underline decoration-dotted"
                onClick={() => setShowLifetimeModal(true)}
              >
                {config.features.lifetimeAccessOffer.ctaText}
              </button>
            </div>
          )}
          */}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={handleGetDemoCode}
              size="lg"
              className="bg-orange-600 hover:bg-orange-700 text-white text-lg px-8 py-4"
              disabled={betaLoading}
            >
              {betaLoading ? (
                "Loading..."
              ) : (
                "Get Demo Code"
              )}
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="text-lg px-8 py-4 border-2 border-white bg-white text-black hover:bg-gray-100 hover:text-tradie-blue"
              onClick={() => setLocation('/demo')}
            >
              👁️ View Demo Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <img 
              src={regionalAssets.logo} 
              alt="Blue Tradie Logo" 
              className="h-20 w-20 object-contain"
            />
            <span className="text-xl font-bold">Blue Tradie</span>
          </div>
          <p className="text-gray-400 mb-2">Built by tradies, for tradies.</p>
          <p className="text-gray-500 text-sm">© 2025 Blue Tradie. All rights reserved.</p>
        </div>
      </footer>



      {/* Lifetime Access Terms Modal */}
      <Dialog open={showLifetimeModal} onOpenChange={setShowLifetimeModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              🎯 Lifetime Access - Early Access Special
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {/* What's Included */}
            <div>
              <h3 className="font-semibold text-lg mb-3 text-tradie-blue">Phase 1 Features (Lifetime Access)</h3>
              <div className="grid gap-2">
                {getPhase1Features().map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Future Phases */}
            <div>
              <h3 className="font-semibold text-lg mb-3 text-orange-600">Phase 2+ Features (Separate Pricing)</h3>
              <div className="grid gap-2">
                {getPhase2PlusFeatures().map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <X className="w-4 h-4 text-orange-500" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Terms */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Terms & Conditions</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Lifetime access applies to Phase 1 features only</li>
                <li>• Available during beta testing period (limited time)</li>
                <li>• Future platform updates & security patches included</li>
                <li>• Phase 2+ features require separate subscription</li>
                <li>• Standard service terms & privacy policy apply</li>
                <li>• Blue Tradie reserves right to end offer at any time</li>
              </ul>
            </div>

          </div>
          <div className="flex gap-3 pt-4 border-t flex-shrink-0">
            <Button 
              variant="outline" 
              onClick={() => setShowLifetimeModal(false)}
              className="flex-1"
            >
              Close
            </Button>
            <Button 
              onClick={() => {
                setShowLifetimeModal(false);
                handleGetStarted();
              }}
              className="btn-tradie-primary flex-1"
            >
              Get Lifetime Access
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
