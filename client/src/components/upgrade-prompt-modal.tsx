import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap, TrendingUp, Users, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface UpgradePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: 'limit_reached' | 'high_usage' | 'manual';
}

export default function UpgradePromptModal({ isOpen, onClose, reason = 'manual' }: UpgradePromptModalProps) {
  const { user } = useAuth();
  const isDemo = user?.subscriptionTier === 'demo' || !user?.subscriptionTier;
  
  // Hide upgrade prompt modal entirely for now
  return null;
  
  const plans = [
    {
      name: "Blue Lite",
      price: 29.99,
      tokens: "10,000",
      features: [
        "AI Business Advisors (4 specialist agents)",
        "Job & invoice management",
        "Expense tracking with GST",
        "Customer database",
        "Weekly business insights"
      ],
      popular: true,
      savings: isDemo ? "First year: AU$108 off" : null
    },
    {
      name: "Blue Core", 
      price: 79.99,
      tokens: "25,000",
      features: [
        "Everything in Blue Lite",
        "Advanced automation features",
        "Priority customer support",
        "Custom business reports",
        "Team collaboration (up to 3 users)"
      ],
      popular: false
    },
    {
      name: "Blue Teams",
      price: 159.99, 
      tokens: "50,000",
      features: [
        "Everything in Blue Core",
        "Unlimited team members",
        "Advanced analytics dashboard",
        "API access for integrations",
        "Dedicated account manager"
      ],
      popular: false
    }
  ];

  const getHeaderContent = () => {
    switch (reason) {
      case 'limit_reached':
        return {
          title: "Demo limit reached!",
          description: "You've used all your free tokens. Upgrade to keep your AI business team working for you."
        };
      case 'high_usage':
        return {
          title: "Heavy AI user detected!",
          description: "You're getting great value from your AI advisors. Consider upgrading for more tokens and features."
        };
      default:
        return {
          title: "Upgrade your Blue Tradie experience",
          description: "Get more tokens and unlock powerful features to grow your business faster."
        };
    }
  };

  const headerContent = getHeaderContent();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {headerContent.title}
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            {headerContent.description}
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          {plans.map((plan) => (
            <Card key={plan.name} className={`relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white">
                  <Star className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">AU${plan.price}</span>
                  <span className="text-gray-600">/month</span>
                </div>
                {plan.savings && (
                  <Badge variant="outline" className="text-green-700 border-green-300 mt-2">
                    {plan.savings}
                  </Badge>
                )}
                <div className="flex items-center justify-center mt-2 text-sm text-gray-600">
                  <Zap className="h-4 w-4 mr-1" />
                  {plan.tokens} AI tokens/month
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => {
                    // TODO: Implement actual upgrade flow
                    console.log(`Upgrading to ${plan.name}`);
                    onClose();
                  }}
                >
                  {reason === 'limit_reached' ? 'Upgrade Now' : `Choose ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>All plans include:</strong> Unlimited jobs & invoices • GST/Tax tracking • 
            Customer management • Mobile access • Regular updates
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Cancel anytime • 30-day money-back guarantee • Australian customer support
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}