import { useEffect, useState } from "react";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useSearch } from "wouter";
import blueTradieLogo from "@assets/Blue Tradie Logo_1753253697164.png";

export default function Welcome() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const search = useSearch();
  
  // Get session_id from URL parameters
  const urlParams = new URLSearchParams(search);
  const sessionId = urlParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      // Stripe checkout was successful, user account should be created via webhook
      // Give it a moment to process then redirect
      setTimeout(() => {
        setIsLoading(false);
      }, 3000);
    } else {
      setError("No session found. Please try signing up again.");
      setIsLoading(false);
    }
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-tradie-light to-white flex items-center justify-center">
        <div className="text-center">
          <img 
            src={blueTradieLogo} 
            alt="Blue Tradie Logo" 
            className="h-20 w-20 mx-auto mb-6"
          />
          <div className="flex items-center gap-2 text-xl font-semibold text-tradie-blue mb-4">
            <Loader2 className="h-6 w-6 animate-spin" />
            Setting up your account...
          </div>
          <p className="text-gray-600">
            Your payment was successful! We're creating your Blue Tradie workspace.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-tradie-light to-white flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-red-600 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Setup Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/signup">
              <Button className="w-full">Try Again</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-tradie-light to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <img 
                src={blueTradieLogo} 
                alt="Blue Tradie Logo" 
                className="h-16 w-16 object-contain"
              />
              <span className="text-2xl font-bold text-tradie-blue">Blue Tradie</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-8">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          {/* Welcome Message */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Blue Tradie! 🎉
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            Your free trial has started. You now have full access to all features for 30 days.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Card>
              <CardContent className="p-6">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-lg font-semibold mb-2">6 AI Business Advisors</h3>
                <p className="text-gray-600 text-sm">
                  Get instant help with quotes, invoices, business strategy, and more
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-4xl mb-4">📄</div>
                <h3 className="text-lg font-semibold mb-2">Smart Invoicing</h3>
                <p className="text-gray-600 text-sm">
                  Professional invoices with automatic GST calculation for AU/NZ
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-4xl mb-4">🤝</div>
                <h3 className="text-lg font-semibold mb-2">Tradie Network</h3>
                <p className="text-gray-600 text-sm">
                  Connect with other tradies, share referrals, build partnerships
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-lg font-semibold mb-2">Smart Automation</h3>
                <p className="text-gray-600 text-sm">
                  Automate follow-ups, reminders, and routine business tasks
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Trial Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Your Free Trial Details
            </h3>
            <p className="text-blue-800 mb-2">
              ✅ Full access to all features until {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </p>
            <p className="text-blue-800 mb-2">
              📧 You'll receive 3 friendly reminder emails before billing starts
            </p>
            <p className="text-blue-800">
              🚪 Cancel anytime from your billing settings - no questions asked
            </p>
          </div>

          {/* CTA Button */}
          <Link href="/dashboard">
            <Button size="lg" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-4 text-lg">
              Get Started Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>

          <p className="text-sm text-gray-500 mt-4">
            Questions? Contact our support team anytime - we're here to help!
          </p>
        </div>
      </div>
    </div>
  );
}