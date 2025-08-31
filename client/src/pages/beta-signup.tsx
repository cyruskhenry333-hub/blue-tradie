import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { ArrowLeft, CheckCircle } from "lucide-react";

export default function BetaSignup() {
  const [inviteCode, setInviteCode] = useState("");
  const [email, setEmail] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const validateInvite = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: "Invite code required",
        description: "Please enter your beta invite code",
        variant: "destructive"
      });
      return;
    }

    setIsValidating(true);
    try {
      const response = await fetch('/api/beta/validate-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode, email })
      });

      const data = await response.json();
      
      if (data.valid) {
        setIsValidated(true);
        toast({
          title: "Welcome to Blue Tradie Beta!",
          description: "Your invite code is valid. You can now access the platform.",
        });
      } else {
        toast({
          title: "Invalid invite code",
          description: data.message || "Please check your invite code and try again",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Validation failed",
        description: "Unable to validate invite code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const proceedToLogin = async () => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    try {
      // Use simple login for beta testing
      const response = await fetch('/api/simple-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          firstName: "Beta",
          lastName: "Tester"
        })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      toast({
        title: "Welcome to Blue Tradie!",
        description: "You're now logged in to the beta platform",
      });

      // Redirect to dashboard
      window.location.href = '/';
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Unable to log you in. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-tradie-blue via-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="ghost" className="text-tradie-blue hover:text-tradie-orange">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-tradie-orange rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">BT</span>
            </div>
            <span className="font-bold text-tradie-blue">Blue Tradie</span>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-tradie-blue">
                {isValidated ? "Welcome to Beta!" : "Join Blue Tradie Beta"}
              </CardTitle>
              <p className="text-gray-600 mt-2">
                {isValidated 
                  ? "You're all set to start managing your trade business"
                  : "Enter your invite code to get early access"
                }
              </p>
            </CardHeader>
            <CardContent>
              {!isValidated ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="inviteCode">Beta Invite Code</Label>
                    <Input
                      id="inviteCode"
                      type="text"
                      placeholder="Enter your invite code"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Don't have a code? Contact us for early access.
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <Button 
                    onClick={validateInvite}
                    disabled={isValidating}
                    className="w-full bg-tradie-orange hover:bg-orange-600"
                  >
                    {isValidating ? "Validating..." : "Validate Invite Code"}
                  </Button>

                  <div className="text-center text-sm text-gray-500">
                    <p>Beta testing includes:</p>
                    <ul className="mt-2 space-y-1">
                      <li>• AI business assistants</li>
                      <li>• Invoice & job management</li>
                      <li>• Early access to new features</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-700">
                      Invite Code Validated!
                    </h3>
                    <p className="text-gray-600 mt-2">
                      Welcome to the Blue Tradie beta program. Click below to sign in and start managing your trade business.
                    </p>
                  </div>
                  
                  <Button 
                    onClick={proceedToLogin}
                    className="w-full bg-tradie-blue hover:bg-blue-700"
                  >
                    Sign In to Blue Tradie
                  </Button>
                  
                  <div className="bg-blue-50 p-4 rounded-lg text-sm">
                    <p className="font-medium text-tradie-blue">What's Next?</p>
                    <ul className="mt-2 space-y-1 text-gray-600">
                      <li>• Complete your business profile</li>
                      <li>• Start chatting with AI assistants</li>
                      <li>• Create your first invoice</li>
                      <li>• Share feedback to help us improve</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}