import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Users, Star, TrendingUp, Gift, Zap, Crown, Timer } from "lucide-react";
import { useAnalytics } from "@/lib/analytics";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

export default function Waitlist() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("");
  const [trade, setTrade] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [urgencyMessage, setUrgencyMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState({ days: 6, hours: 14, minutes: 32 });
  const analytics = useAnalytics();

  const { data: waitlistStatus } = useQuery({
    queryKey: ['/api/waitlist/status'],
    refetchInterval: 30000 // Update every 30 seconds
  });

  // Simulate real-time activity and urgency
  useEffect(() => {
    const messages = [
      "Someone from Sydney just joined 12 seconds ago",
      "A tradie from Auckland reserved their spot 8 seconds ago", 
      "2 people viewing this page right now",
      "Someone from Melbourne just joined 15 seconds ago",
      "A tradie from Brisbane reserved their spot 23 seconds ago"
    ];
    
    const updateUrgency = () => {
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      setUrgencyMessage(randomMessage);
    };
    
    updateUrgency(); // Initial message
    const interval = setInterval(updateUrgency, 15000); // Update every 15 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Countdown timer for early bird discount
  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7); // 7 days from now
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;
      
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft({ days, hours, minutes });
      
      if (distance < 0) {
        clearInterval(interval);
      }
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  const joinWaitlistMutation = useMutation({
    mutationFn: async (data: { email: string; firstName: string; lastName: string; country: string; trade?: string }) => {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to join waitlist');
      return response.json();
    },
    onSuccess: (data) => {
      analytics.trackWaitlistSubmission(email);
      setIsSubmitted(true);
    },
    onError: (error) => {
      console.error('Waitlist submission failed:', error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !firstName || !country) {
      return;
    }

    joinWaitlistMutation.mutate({
      email,
      firstName,
      lastName,
      country,
      trade: trade || undefined
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-green-600">Welcome to the VIP List!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-gray-600">
              Congratulations! You're now part of an exclusive group getting first access to Blue Tradie.
            </p>
            
            {/* Success benefits */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg space-y-3">
              <div className="flex items-center justify-center space-x-2 text-green-700 font-semibold">
                <Gift className="h-5 w-5" />
                <span>Your VIP Benefits Unlocked:</span>
              </div>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>🎯 <strong>First 100 Early Bird:</strong> 30% off Blue Lite first year (save $108)</li>
                <li>⚡ <strong>Priority Access:</strong> Skip the wait - get 14-day demo when platform launches</li>
                <li>👑 <strong>Founding Member Path:</strong> Submit 30-sec testimonial and get 10% off Blue Core for 1 year</li>
                <li>🤖 <strong>Full AI Demo:</strong> 1,000,000 free AI tokens for business guidance (accountant, marketer, coach, legal)</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">
                🚀 <strong>Need Early Access?</strong> Reply to welcome email saying "Yes, I need early access"
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Skip the wait + full access to demo platform
              </p>
            </div>
            
            <Link href="/">
              <Button variant="outline" className="w-full">
                Back to Homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded text-white flex items-center justify-center font-bold">
                BT
              </div>
              <span className="text-xl font-bold text-gray-900">Blue Tradie</span>
            </div>
          </Link>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Urgency Banner */}
          {urgencyMessage && (
            <div className="bg-orange-100 border border-orange-200 rounded-lg p-3 mb-6 text-center">
              <div className="flex items-center justify-center space-x-2 text-orange-800">
                <Zap className="h-4 w-4 animate-pulse" />
                <span className="text-sm font-medium">{urgencyMessage}</span>
              </div>
            </div>
          )}

          {/* Status Section */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Crown className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Join the VIP Launch List
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Be part of the exclusive first 100 tradies to access Blue Tradie. Early adopters get first-year savings and founding member benefits.
            </p>
            
            {/* Early Bird Countdown */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <Timer className="h-5 w-5 text-red-600" />
                <span className="text-lg font-bold text-red-800">Early Bird Special Ends In:</span>
              </div>
              <div className="flex justify-center space-x-6 text-center">
                <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                  <div className="text-2xl font-bold text-red-600">{timeLeft.days}</div>
                  <div className="text-xs text-gray-600">DAYS</div>
                </div>
                <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                  <div className="text-2xl font-bold text-red-600">{timeLeft.hours}</div>
                  <div className="text-xs text-gray-600">HOURS</div>
                </div>
                <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                  <div className="text-2xl font-bold text-red-600">{timeLeft.minutes}</div>
                  <div className="text-xs text-gray-600">MINS</div>
                </div>
              </div>
              <p className="text-sm text-red-700 mt-3 font-medium">
                First 100 members: 30% off Blue Lite for 1 year
              </p>
            </div>
            
            {waitlistStatus && (waitlistStatus as any)?.waitlistCount && (
              <div className="bg-blue-50 rounded-lg p-6 mb-8">
                <div className="flex items-center justify-center space-x-4">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                  <span className="text-lg font-semibold text-blue-800">
                    {(waitlistStatus as any)?.waitlistCount || '0'} VIP members joined
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min((parseInt(String((waitlistStatus as any)?.waitlistCount || '0')) / 100) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {100 - parseInt(String((waitlistStatus as any)?.waitlistCount || '0'))} early bird spots left
                </p>
              </div>
            )}
          </div>

          {/* Waitlist Form */}
          <Card className="border-2 border-blue-200 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Crown className="h-6 w-6 text-purple-600" />
                <CardTitle className="text-2xl text-center text-gray-900">Claim Your VIP Spot</CardTitle>
              </div>
              <p className="text-center text-gray-600">
                Join the exclusive first 100 early adopters and get 30% off Blue Lite for your first year
              </p>
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-300 rounded-lg p-3 mt-4">
                <p className="text-center text-sm font-semibold text-purple-800">
                  🎯 First 100 members: 30% off Blue Lite first year (save $108)
                </p>
                <div className="flex justify-center space-x-4 mt-2 text-xs text-gray-700">
                  <span>🤖 1M demo tokens</span>
                  <span>🤝 Full demo access</span>
                  <span>👑 Founding member access</span>
                </div>
                <p className="text-center text-xs text-gray-500 mt-2 italic">
                  *Demo tokens = fuel for testing virtual accountant, marketer, business coach & legal advisor
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Your first name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Your last name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Select value={country} onValueChange={setCountry} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Australia">🇦🇺 Australia</SelectItem>
                      <SelectItem value="New Zealand">🇳🇿 New Zealand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="trade">Your Trade (Optional)</Label>
                  <Select value={trade} onValueChange={setTrade}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your trade" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Updated trade icons to match mobile version */}
                      <SelectItem value="Electrician">⚡ Electrician</SelectItem>
                      <SelectItem value="Plumber">🚰 Plumber</SelectItem>
                      <SelectItem value="Carpenter">🔨 Carpenter</SelectItem>
                      <SelectItem value="Builder">🏗️ Builder</SelectItem>
                      <SelectItem value="HVAC Technician">❄️ HVAC Technician</SelectItem>
                      <SelectItem value="Landscaper">🌿 Landscaper</SelectItem>
                      <SelectItem value="Painter">🎨 Painter</SelectItem>
                      <SelectItem value="Tiler">🟫 Tiler</SelectItem>
                      <SelectItem value="Roofer">🏠 Roofer</SelectItem>
                      <SelectItem value="Concreter">🧱 Concreter</SelectItem>
                      <SelectItem value="Glazier">🔳 Glazier</SelectItem>
                      <SelectItem value="Other">⚒️ Other Trade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg py-4 font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
                  disabled={joinWaitlistMutation.isPending || !email || !firstName || !country}
                >
                  {joinWaitlistMutation.isPending ? "Securing Your Spot..." : "🚀 Reserve My VIP Spot (FREE)"}
                </Button>
                
                <p className="text-center text-xs text-gray-500 mt-2">
                  No spam, ever. Unsubscribe with one click.
                </p>
              </form>

              {/* Enhanced Benefits */}
              <div className="mt-8 space-y-4">
                <h3 className="font-semibold text-gray-900 text-center text-lg">Your VIP Member Benefits:</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">1</span>
                      </div>
                      <div>
                        <div className="font-semibold text-green-800">30% Off Blue Lite</div>
                        <div className="text-sm text-green-700">Save $108 on your first year ($29.99/month plan)</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">2</span>
                      </div>
                      <div>
                        <div className="font-semibold text-purple-800">Priority Demo Access</div>
                        <div className="text-sm text-purple-700">Skip the wait - get 14-day demo when platform launches</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">3</span>
                      </div>
                      <div>
                        <div className="font-semibold text-blue-800">Tradie Mate Referral Reward</div>
                        <div className="text-sm text-blue-700">Refer a mate — get $5 off your next bill for every paying user you bring in. No limit.</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">4</span>
                      </div>
                      <div>
                        <div className="font-semibold text-orange-800">Founding Member Upgrade</div>
                        <div className="text-sm text-orange-700">Submit a 30-sec testimonial and get 10% off Blue Core for 1 year<br/>Manual approval required.</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 mt-6">
                  <div className="text-center">
                    <div className="font-bold text-yellow-800 mb-1">🔥 First 100 Members Get Everything:</div>
                    <div className="text-sm text-yellow-700">
                      • 30% off Blue Lite for 1 year<br/>
                      • 14-day demo access (1M tokens)<br/>
                      • $5 referral rewards<br/>
                      • Access to Founding Member badge & upgrade path
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}