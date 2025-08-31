import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mail, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function DemoPage() {
  const [demoCode, setDemoCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  // Check for demo code in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('code');
    if (codeParam) {
      setDemoCode(codeParam);
    }
  }, []);

  const handleDemoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!demoCode.trim()) {
      toast({
        title: "Demo code required",
        description: "Please enter your demo code to continue.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    console.log('[DEMO FRONTEND] Starting demo login with code:', demoCode);
    
    try {
      const response = await fetch('/api/demo/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensure cookies are sent
        body: JSON.stringify({ demoCode: demoCode.trim() })
      });

      const data = await response.json();
      console.log('[DEMO FRONTEND] Login response:', data);
      
      if (response.ok && data.success) {
        console.log('[DEMO FRONTEND] Login successful, user:', data.user);
        
        toast({
          title: "Demo access granted!",
          description: "Welcome to Blue Tradie. Setting up your experience...",
        });

        // Add 10-second timeout for auth check
        const authTimeout = setTimeout(() => {
          console.error('[DEMO FRONTEND] Auth check timeout - forcing redirect');
          toast({
            title: "Timeout",
            description: "Taking longer than expected. Redirecting...",
            variant: "destructive"
          });
          window.location.href = data.user?.isOnboarded ? '/dashboard' : '/onboarding';
        }, 10000);

        try {
          // Force refetch auth state after login success
          console.log('[DEMO FRONTEND] Checking auth state...');
          const authResponse = await fetch('/api/auth/user', {
            credentials: 'include',
            headers: { 'Cache-Control': 'no-cache' }
          });
          
          clearTimeout(authTimeout);
          
          if (authResponse.ok) {
            const authUser = await authResponse.json();
            console.log('[DEMO FRONTEND] Auth check successful:', authUser);
            
            // Hard redirect based on onboarding status from database
            if (authUser.isOnboarded === true) {
              console.log('[DEMO FRONTEND] User onboarded - redirecting to dashboard');
              window.location.href = '/dashboard';
            } else {
              console.log('[DEMO FRONTEND] User needs onboarding - redirecting to onboarding');
              window.location.href = '/onboarding';
            }
          } else {
            console.error('[DEMO FRONTEND] Auth check failed - using fallback redirect');
            window.location.href = data.user?.isOnboarded ? '/dashboard' : '/onboarding';
          }
        } catch (authError) {
          clearTimeout(authTimeout);
          console.error('[DEMO FRONTEND] Auth check error:', authError);
          window.location.href = data.user?.isOnboarded ? '/dashboard' : '/onboarding';
        }
      } else {
        console.error('[DEMO FRONTEND] Login failed:', data);
        toast({
          title: "Invalid demo code",
          description: data.message || "Please check your demo code and try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('[DEMO FRONTEND] Demo login error:', error);
      toast({
        title: "Connection error",
        description: "Unable to connect to server. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resendEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email to resend the demo code.",
        variant: "destructive"
      });
      return;
    }

    setResendLoading(true);
    try {
      const response = await fetch('/api/demo/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail.trim() })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Demo code resent!",
          description: "Check your email for your demo code.",
        });
        setShowResend(false);
        setResendEmail("");
      } else {
        toast({
          title: "Resend failed",
          description: data.message || "Unable to resend demo code. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Demo resend error:', error);
      toast({
        title: "Connection error",
        description: "Unable to connect to server. Please try again.",
        variant: "destructive"
      });
    } finally {
      setResendLoading(false);
    }
  };

  if (showResend) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-tradie-light to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-tradie-blue">
              Resend Demo Code
            </CardTitle>
            <p className="text-gray-600">
              Enter your email to get your demo code again
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resendEmail">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="resendEmail"
                    type="email"
                    placeholder="your.email@example.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={resendLoading}
              >
                {resendLoading ? "Sending..." : "Resend Demo Code"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowResend(false);
                  setResendEmail("");
                }}
                className="text-sm"
              >
                Back to demo login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-tradie-light to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-tradie-blue">
            Demo Access
          </CardTitle>
          <p className="text-gray-600">
            Enter your demo code to experience Blue Tradie
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDemoLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="demoCode">Demo Code</Label>
              <div className="relative">
                <Input
                  id="demoCode"
                  type={showPassword ? "text" : "password"}
                  placeholder="Demo####"
                  value={demoCode}
                  onChange={(e) => setDemoCode(e.target.value)}
                  className="pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Accessing Demo..." : "Access Demo"}
            </Button>
          </form>

          <div className="mt-6 space-y-3">
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => setShowResend(true)}
                className="text-sm"
              >
                Didn't receive your code? Resend email
              </Button>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Don't have a demo code yet?
              </p>
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
                className="text-sm"
              >
                Get demo code
              </Button>
            </div>
          </div>

          <div className="mt-6 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Demo includes:</p>
                <ul className="text-xs space-y-1">
                  <li>• Complete business management tools</li>
                  <li>• AI-powered advisors</li>
                  <li>• Invoice & job management</li>
                  <li>• 1 million demo tokens</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}