import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useBetaStatus } from "@/hooks/useBetaStatus";
import { Link, useLocation } from "wouter";
import { ArrowLeft, CheckCircle, Users, Clock, Gift, Star } from "lucide-react";
import { config } from "@shared/config";
import { useAnalytics } from "@/lib/analytics";

export default function ThreeTierBetaSignup() {
  const [inviteCode, setInviteCode] = useState("");
  const [email, setEmail] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { data: betaStatus, isLoading } = useBetaStatus();
  const analytics = useAnalytics();

  const validateInvite = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: "Invite code required",
        description: "Please enter your beta invite code",
        variant: "destructive"
      });
      return;
    }

    analytics.trackSignupAttempt();
    setIsValidating(true);
    try {
      const response = await fetch('/api/beta/validate-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode, email })
      });

      const result = await response.json();

      if (result.valid) {
        setIsValidated(true);
        toast({
          title: "Valid invite code!",
          description: result.tierMessage || "You can proceed with beta signup",
          variant: "default"
        });
      } else {
        if (result.betaFull) {
          // Show waitlist signup instead
          setLocation('/waitlist');
        } else {
          toast({
            title: "Invalid code",
            description: result.message,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      toast({
        title: "Validation failed",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const proceedToSignup = () => {
    // Store validated invite code and proceed to auth
    localStorage.setItem('validatedInviteCode', inviteCode);
    window.location.href = '/auth/replit';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading beta status...</p>
        </div>
      </div>
    );
  }

  // TODO: Beta disabled - force betaEnabled = false
  const betaEnabled = false;
  const tiers = betaEnabled ? [] : []; // TODO: Beta disabled - no tiers available

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Join Blue Tradie Beta</h1>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Beta Status Overview */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4 text-center">
                <div className="text-yellow-600 font-semibold">🔓 Founding Members</div>
                <div className="text-2xl font-bold text-yellow-800">
                  0 / 25 {/* TODO: Beta disabled - founding tier not available */}
                </div>
                <div className="text-sm text-yellow-600">spots available</div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4 text-center">
                <div className="text-blue-600 font-semibold">🟠 Early Crew</div>
                <div className="text-2xl font-bold text-blue-800">
                  {betaStatus?.tiers.earlySupporter.available || 0} / {betaStatus?.tiers.earlySupporter.max || 35}
                </div>
                <div className="text-sm text-blue-600">spots available</div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4 text-center">
                <div className="text-green-600 font-semibold">🔵 Beta Mates</div>
                <div className="text-2xl font-bold text-green-800">
                  {betaStatus?.tiers.betaTester.available || 0} / {betaStatus?.tiers.betaTester.max || 40}
                </div>
                <div className="text-sm text-green-600">spots available</div>
              </CardContent>
            </Card>
          </div>

          {/* Tier Details */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Founding Members */}
            <Card className="border-2 border-yellow-300">
              <CardHeader className="bg-yellow-100">
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-yellow-200 text-yellow-800">🏆 FOUNDING TRADIE</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2">Founding Tradie (Unavailable)</h3>
                <div className="text-lg font-bold text-yellow-800 mb-1">LIFETIME ACCESS</div>
                <div className="text-sm text-green-600 mb-4">"Never pay for Phase 1 again. Unlock future tools at 60% off for life."</div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <span className="text-green-600 font-bold mr-2">✅</span>
                    <span>Lifetime access to Core Platform (Phase 1 features)</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-green-600 font-bold mr-2">✅</span>
                    <span>Recognition as a Founding Tradie</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-green-600 font-bold mr-2">✅</span>
                    <span>60% off Phase 2+ features when launched</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-red-600 font-bold mr-2">❌</span>
                    <span>Phase 2+ not included — upgrade required</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Early Supporters */}
            <Card className="border-2 border-blue-300">
              <CardHeader className="bg-blue-100">
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-blue-200 text-blue-800">⚡ EARLY CREW</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2">Early Crew</h3>
                <div className="text-lg font-bold text-blue-800 mb-1">12 MONTHS FREE</div>
                <div className="text-sm text-green-600 mb-4">"Save $359.88 in your first year. Ongoing discount on advanced features."</div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <span className="text-green-600 font-bold mr-2">✅</span>
                    <span>12 months FREE access to Core Platform</span>
                  </div>  
                  <div className="flex items-center text-sm">
                    <span className="text-green-600 font-bold mr-2">✅</span>
                    <span>50% off Phase 2+ features</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-green-600 font-bold mr-2">✅</span>
                    <span>Priority support + early feature access</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Beta Testers */}
            <Card className="border-2 border-green-300">
              <CardHeader className="bg-green-100">
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-green-200 text-green-800">🧪 BETA MATE</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2">Beta Mate</h3>
                <div className="text-lg font-bold text-green-800 mb-1">6 MONTHS FREE</div>
                <div className="text-sm text-green-600 mb-4">"Get in early, test the platform, and save as we grow together."</div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <span className="text-green-600 font-bold mr-2">✅</span>
                    <span>6 months FREE access to Core Platform</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-green-600 font-bold mr-2">✅</span>
                    <span>40% off Phase 2+ features</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-green-600 font-bold mr-2">✅</span>
                    <span>Access to Beta testing community</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invite Code Entry */}
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Enter Your Invite Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isValidated ? (
                <>
                  <div>
                    <Label htmlFor="inviteCode">Beta Invite Code</Label>
                    <Input
                      id="inviteCode"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="BETA123, FOUNDING25, etc."
                      className="mt-1"
                    />
                  </div>
                  
                  <Button 
                    onClick={validateInvite}
                    disabled={isValidating || !inviteCode.trim()}
                    className="w-full"
                  >
                    {isValidating ? "Validating..." : "Validate Code"}
                  </Button>
                </>
              ) : (
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center text-green-600 gap-2">
                    <CheckCircle className="h-6 w-6" />
                    <span className="font-semibold">Code Validated!</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Your invite code is valid. You'll be assigned to the {betaStatus?.nextTier} tier.
                  </p>
                  <Button 
                    onClick={proceedToSignup}
                    className="w-full"
                  >
                    Continue to Signup
                  </Button>
                </div>
              )}

              {betaStatus && !betaStatus.canJoin && (
                <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 mb-2">
                    {betaStatus.message}
                  </p>
                  <Link href="/waitlist">
                    <Button variant="outline" size="sm">
                      Join Waitlist Instead
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}