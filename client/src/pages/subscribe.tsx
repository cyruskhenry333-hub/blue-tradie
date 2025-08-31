import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, HardHat, Check, Star, Crown } from "lucide-react";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
let stripePromise: Promise<any> | null = null;

if (import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
} else {
  console.warn('Warning: VITE_STRIPE_PUBLIC_KEY not found. Subscription functionality will be disabled.');
}

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Subscription Successful!",
        description: "Welcome to Blue Tradie Pro! You now have access to all premium features.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button type="submit" className="w-full btn-tradie-primary" size="lg">
        Subscribe to Blue Tradie Pro
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "elite">("pro");

  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  useEffect(() => {
    if (user) {
      // Create subscription as soon as the page loads
      apiRequest("POST", "/api/get-or-create-subscription")
        .then((res) => res.json())
        .then((data) => {
          setClientSecret(data.clientSecret);
        })
        .catch((error) => {
          if (isUnauthorizedError(error)) {
            toast({
              title: "Unauthorized",
              description: "You are logged out. Logging in again...",
              variant: "destructive",
            });
            setTimeout(() => {
              window.location.href = "/api/login";
            }, 500);
            return;
          }
          toast({
            title: "Subscription Error",
            description: "Failed to set up subscription. Please try again.",
            variant: "destructive",
          });
        });
    }
  }, [user, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const plans = [
    {
      id: "free",
      name: "Free Tier",
      price: "Free",
      description: "Basic tools to get started",
      icon: HardHat,
      features: [
        "Basic invoicing",
        "Limited AI agent access",
        "5 jobs per month",
        "Email support"
      ],
      current: true
    },
    {
      id: "pro",
      name: "Pro Tier",
      price: "$39/month",
      description: "Everything you need to run your business",
      icon: Star,
      popular: true,
      features: [
        "Unlimited invoicing & payments",
        "All 4 AI agents with full access",
        "Bank account sync",
        "Unlimited jobs & expenses",
        "Priority agent memory",
        "Email & chat support",
        "Advanced reporting"
      ]
    },
    {
      id: "elite",
      name: "Elite Tier",
      price: "$99/month",
      description: "Premium support for growing businesses",
      icon: Crown,
      features: [
        "Everything in Pro",
        "Real human VA support",
        "Monthly business review calls",
        "Custom template creation",
        "Priority phone support",
        "Advanced integrations",
        "White-label options"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-tradie-light to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <HardHat className="h-8 w-8 text-tradie-blue" />
              <div>
                <h1 className="text-2xl font-bold text-tradie-blue">Blue Tradie</h1>
                <p className="text-sm text-gray-600">Choose Your Plan</p>
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
        {/* Header Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Choose the Right Plan for Your Business
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start free and upgrade as you grow. All plans include our core features to help you run your trade business better.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative card-tradie ${
                plan.popular ? 'ring-2 ring-tradie-blue shadow-lg scale-105' : ''
              } ${plan.current ? 'opacity-75' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-tradie-blue text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className={`p-3 rounded-lg ${
                    plan.id === 'free' ? 'bg-gray-100' :
                    plan.id === 'pro' ? 'bg-tradie-blue/10' : 'bg-tradie-warning/10'
                  }`}>
                    <plan.icon className={`h-8 w-8 ${
                      plan.id === 'free' ? 'text-gray-600' :
                      plan.id === 'pro' ? 'text-tradie-blue' : 'text-tradie-warning'
                    }`} />
                  </div>
                </div>
                <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
                <div className="text-3xl font-bold text-tradie-blue mb-2">{plan.price}</div>
                <p className="text-gray-600 text-sm">{plan.description}</p>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <Check className="h-4 w-4 text-tradie-success flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${
                    plan.current ? 'bg-gray-400 cursor-not-allowed' :
                    plan.id === 'free' ? 'bg-gray-600 hover:bg-gray-700' :
                    'btn-tradie-primary'
                  }`}
                  disabled={plan.current}
                  onClick={() => {
                    if (plan.id === 'pro') {
                      // Scroll to payment form if already visible, or trigger subscription setup
                      if (clientSecret) {
                        const paymentElement = document.querySelector('[data-testid="payment-form"]');
                        if (paymentElement) {
                          paymentElement.scrollIntoView({ behavior: 'smooth' });
                        }
                      } else {
                        // Trigger the subscription setup
                        setSelectedPlan('pro');
                      }
                    } else if (plan.id === 'elite') {
                      toast({
                        title: "Coming Soon",
                        description: "Elite tier will be available soon. Pro tier has everything you need!",
                      });
                    }
                  }}
                >
                  {plan.current ? 'Current Plan' : 
                   plan.id === 'free' ? 'Downgrade' : 
                   plan.id === 'pro' ? 'Start Pro Subscription' : 'Upgrade Now'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payment Form */}
        {clientSecret && stripePromise && (
          <div className="max-w-2xl mx-auto" data-testid="payment-form">
            <Card className="card-tradie">
              <CardHeader>
                <CardTitle className="text-center">Complete Your Subscription</CardTitle>
                <p className="text-center text-gray-600">
                  You're upgrading to <strong>Blue Tradie Pro</strong> for $39/month
                </p>
              </CardHeader>
              <CardContent>
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <SubscribeForm />
                </Elements>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">What happens next?</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Your subscription starts immediately</li>
                    <li>• You'll get full access to all Pro features</li>
                    <li>• Your first payment is processed today</li>
                    <li>• You can cancel anytime from your account settings</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stripe Configuration Warning */}
        {!stripePromise && (
          <div className="max-w-2xl mx-auto mb-8">
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Crown className="h-6 w-6 text-orange-600" />
                  <div>
                    <h3 className="font-semibold text-orange-800">Payment Setup Required</h3>
                    <p className="text-orange-700 text-sm mt-1">
                      Stripe payment processing is not configured. Contact support to enable subscriptions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <h3 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold mb-2">Can I change plans anytime?</h4>
              <p className="text-gray-600 text-sm">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Is there a setup fee?</h4>
              <p className="text-gray-600 text-sm">
                No setup fees ever. You only pay the monthly subscription price for your chosen plan.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">What payment methods do you accept?</h4>
              <p className="text-gray-600 text-sm">
                We accept all major credit cards, debit cards, and bank transfers through our secure payment processor.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Is my data secure?</h4>
              <p className="text-gray-600 text-sm">
                Absolutely. We use bank-level encryption and security measures to protect your business data at all times.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
