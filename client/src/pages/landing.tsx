import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calculator, Bot, TrendingUp, Smartphone, DollarSign, MessageSquare, User, Gavel, HardHat, X, Check, Star, Users, Crown, Timer, CheckCircle } from "lucide-react";
import { TestimonialsSection } from "@/components/testimonials-section";

import { useAnalytics } from "@/lib/analytics";
import { useLocation } from "wouter";
import { usePublicRegionalAssets } from "@/utils/regional-assets";
import { config, getPhase1Features, getPhase2PlusFeatures } from "@shared/config";
import { useQuery } from "@tanstack/react-query";

export default function Landing() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);

  const [, setLocation] = useLocation();
  const regionalAssets = usePublicRegionalAssets();
  const analytics = useAnalytics();

  // Get waitlist status for live counters
  const { data: waitlistStatus } = useQuery({
    queryKey: ['/api/waitlist/status'],
    refetchInterval: 30000 // Update every 30 seconds
  });

  const handleStartFreeTrial = () => {
    analytics.trackCTAClick("Start Free Trial", "hero_section");
    setLocation("/signup");
  };

  const handleViewPricing = () => {
    setShowPricingModal(true);
  };

  const handleLogin = () => {
    setLocation('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-tradie-light to-white">
      {/* Free Trial Banner */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-2">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">
                Start Your Free Trial Today
              </span>
            </div>
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={handleStartFreeTrial}
              className="bg-white text-blue-600 hover:bg-gray-100 text-xs px-3 py-1"
            >
              Get Started Free
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
              <button onClick={handleViewPricing} className="text-gray-600 hover:text-tradie-blue transition-colors">Pricing</button>
              <Button variant="ghost" onClick={handleLogin}>Login</Button>
              <Button onClick={handleStartFreeTrial} className="btn-tradie-primary">
                Start Free Trial
              </Button>
            </div>
            
            <div className="md:hidden">
              <Button onClick={handleStartFreeTrial}>Get Started</Button>
            </div>
          </div>
        </div>
      </nav>

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

            {/* Free Trial Offer */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 mb-8 max-w-md mx-auto md:mx-0 border border-green-200">
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-600 font-semibold">Free Month Trial</span>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  Full access to all features. No payment required. Cancel anytime.
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• AI Business Advisors (6 specialists)</li>
                  <li>• Professional Invoicing & Quotes</li>
                  <li>• Tradie Directory & Networking</li>
                  <li>• Smart Business Automation</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button 
                onClick={handleStartFreeTrial}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white text-lg px-8 py-4 shadow-lg"
                size="lg"
              >
                Start Free Trial
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="text-lg px-8 py-4 border-2 border-gray-300 bg-white text-black hover:bg-gray-100 hover:text-tradie-blue"
                onClick={handleViewPricing}
              >
                📋 View Pricing Plans
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-black mb-4">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-xl text-gray-600">30-day free trial. Cancel anytime before billing starts.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center border-2 hover:border-green-300 transition-colors">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl font-semibold mb-3">1. Sign Up Free</CardTitle>
                <p className="text-gray-600 mb-4">Create your account in under 60 seconds. Start your 30-day free trial instantly.</p>
                <div className="text-sm text-green-600 font-medium">30-Day Free Trial • Cancel anytime</div>
              </CardHeader>
            </Card>
            
            <Card className="text-center border-2 hover:border-blue-300 transition-colors">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HardHat className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-semibold mb-3">2. Set Up Your Business</CardTitle>
                <p className="text-gray-600 mb-4">Quick onboarding tailored for tradies. Connect your business details and you're ready to go.</p>
                <div className="text-sm text-blue-600 font-medium">Guided Setup • 5 Minutes</div>
              </CardHeader>
            </Card>
            
            <Card className="text-center border-2 hover:border-purple-300 transition-colors">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl font-semibold mb-3">3. Grow Your Business</CardTitle>
                <p className="text-gray-600 mb-4">Use AI advisors, create professional invoices, network with other tradies, and automate your workflow.</p>
                <div className="text-sm text-purple-600 font-medium">Full Platform Access</div>
              </CardHeader>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button 
              onClick={handleStartFreeTrial}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-4"
            >
              Start Your Free Trial Now
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need to Run Your Business</h2>
            <p className="text-xl text-gray-600">Built specifically for Australian and New Zealand tradies</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI Advisors */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Bot className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>6 AI Business Advisors</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Get expert advice from specialized AI coaches for business, legal, financial, marketing, operations, and technology.</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Business Coach & Motivation</li>
                  <li>• Legal & Compliance Expert</li>
                  <li>• Financial & Tax Advisor</li>
                  <li>• Marketing Specialist</li>
                  <li>• Operations Manager</li>
                  <li>• Technology Consultant</li>
                </ul>
              </CardContent>
            </Card>

            {/* Smart Invoicing */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <DollarSign className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Smart Invoicing & Quotes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Professional invoices with automatic GST calculation for Australia (10%) and New Zealand (15%).</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Region-specific tax handling</li>
                  <li>• Professional templates</li>
                  <li>• Payment tracking</li>
                  <li>• Automated follow-ups</li>
                </ul>
              </CardContent>
            </Card>

            {/* Tradie Directory */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Tradie Directory & Network</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Connect with other tradies, send referrals, and build your professional network.</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Find trusted tradies</li>
                  <li>• Send/receive referrals</li>
                  <li>• Build your network</li>
                  <li>• Rate & review system</li>
                </ul>
              </CardContent>
            </Card>

            {/* Automation */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-orange-600 mb-4" />
                <CardTitle>Smart Business Automation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Automate routine tasks with intelligent rules that learn from your business patterns.</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Follow-up reminders</li>
                  <li>• Invoice generation</li>
                  <li>• Customer communications</li>
                  <li>• Business insights</li>
                </ul>
              </CardContent>
            </Card>

            {/* Mobile App */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Smartphone className="h-12 w-12 text-blue-500 mb-4" />
                <CardTitle>Mobile-First Design</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Works perfectly on your phone, tablet, or computer. Manage your business from anywhere.</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Responsive design</li>
                  <li>• Offline capabilities</li>
                  <li>• Photo uploads</li>
                  <li>• GPS job tracking</li>
                </ul>
              </CardContent>
            </Card>

            {/* Compliance */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Gavel className="h-12 w-12 text-red-600 mb-4" />
                <CardTitle>Local Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Built for Australian and New Zealand regulations, tax requirements, and business practices.</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• ATO/IRD compliant</li>
                  <li>• Local business templates</li>
                  <li>• Regional tax handling</li>
                  <li>• Compliance monitoring</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Sort Your Business?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">Join hundreds of tradies who've streamlined their business with Blue Tradie</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={handleStartFreeTrial}
              size="lg"
              className="bg-white text-tradie-blue hover:bg-gray-100 text-lg px-8 py-4 font-semibold"
            >
              Start Your Free Trial
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="text-lg px-8 py-4 border-2 border-white bg-white text-black hover:bg-gray-100 hover:text-tradie-blue"
              onClick={handleViewPricing}
            >
              📋 View Pricing Plans
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Modal */}
      <Dialog open={showPricingModal} onOpenChange={setShowPricingModal}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Choose Your Plan</DialogTitle>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-6 mt-6 max-w-4xl mx-auto">
            {/* Pro Plan */}
            <Card className="border-2 border-blue-500 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              <CardHeader className="text-center pt-8">
                <CardTitle className="text-xl">Pro Plan</CardTitle>
                <div className="text-3xl font-bold">$59</div>
                <div className="text-gray-500">per month • Perfect for sole traders</div>
                <div className="text-sm text-green-600 font-semibold mt-2">30-day free trial included</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><Check className="h-4 w-4 text-blue-500 mr-2" />6 AI Business Advisors</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-blue-500 mr-2" />Smart invoicing with automation</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-blue-500 mr-2" />Job & client management</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-blue-500 mr-2" />Expense tracking</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-blue-500 mr-2" />Advanced reporting</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-blue-500 mr-2" />Priority support</li>
                </ul>
                <Button onClick={() => handleStartFreeTrial('pro')} className="w-full mt-6 bg-blue-600 hover:bg-blue-700">
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            {/* Teams Plan */}
            <Card className="border-2 border-purple-500">
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Teams Plan</CardTitle>
                <div className="text-3xl font-bold">$149</div>
                <div className="text-gray-500">per month • For growing businesses</div>
                <div className="text-sm text-green-600 font-semibold mt-2">30-day free trial included</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><Check className="h-4 w-4 text-purple-500 mr-2" />Everything in Pro</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-purple-500 mr-2" />Team collaboration tools</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-purple-500 mr-2" />Multi-user access</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-purple-500 mr-2" />Advanced analytics dashboard</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-purple-500 mr-2" />White-label options</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-purple-500 mr-2" />API access</li>
                </ul>
                <Button onClick={() => handleStartFreeTrial('teams')} variant="outline" className="w-full mt-6 border-purple-500 text-purple-600 hover:bg-purple-50">
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              ✅ 30 days completely free • ✅ No charge until day 31 • ✅ Cancel anytime
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-blue-900 to-green-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <HardHat className="h-8 w-8" />
                <span className="text-2xl font-bold">Blue Tradie</span>
              </div>
              <p className="text-blue-100 mb-4">
                The complete business platform built specifically for Australian and New Zealand tradies. 
                Manage jobs, invoices, and grow your business with AI-powered tools.
              </p>
              <div className="text-sm text-blue-200">
                🇦🇺 Made for Australian & New Zealand Tradies 🇳🇿
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-blue-100">
                <li>AI Business Advisors</li>
                <li>Smart Invoicing</li>
                <li>Job Management</li>
                <li>Tradie Directory</li>
                <li>Expense Tracking</li>
                <li>Business Analytics</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-blue-100">
                <li><a href="/terms" className="hover:text-white">Terms of Service</a></li>
                <li><a href="/privacy" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="mailto:support@bluetradie.com" className="hover:text-white">Contact Support</a></li>
                <li><a href="/help" className="hover:text-white">Help Center</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-blue-700 mt-8 pt-8 text-center text-sm text-blue-200">
            <p>&copy; 2025 Blue Tradie. All rights reserved. Built for tradies across Australia and New Zealand.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}