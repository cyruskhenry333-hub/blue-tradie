import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CreditCard, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface TrialLockoutProps {
  daysRemaining?: number;
  trialEndDate?: Date | null;
  onUpgrade: () => void;
}

export function TrialLockout({ daysRemaining = 0, trialEndDate, onUpgrade }: TrialLockoutProps) {
  const { user } = useAuth();
  const isExpired = daysRemaining <= 0;
  const isLastDay = daysRemaining === 1;
  const countryGreeting = user?.country === "New Zealand" ? "Hey bro" : "Hey mate";

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200 dark:border-red-800">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-xl text-red-900 dark:text-red-100">
              Your trial has ended
            </CardTitle>
            <CardDescription className="text-red-700 dark:text-red-300">
              {countryGreeting}, your 14-day free trial is now complete
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                Don't worry - all your data is safe and waiting for you:
              </p>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-red-600" />
                  Your jobs and invoices
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-red-600" />
                  AI chat history
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-red-600" />
                  Expense records
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                Continue with Blue Tradie Premium
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Only $29/month</li>
                <li>• All your data restored instantly</li>
                <li>• Unlimited AI advisor access</li>
                <li>• Advanced business tools</li>
              </ul>
            </div>
            
            <Button 
              onClick={onUpgrade} 
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              size="lg"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Upgrade to Premium
            </Button>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Cancel anytime • 30-day money-back guarantee
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLastDay) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950 border-l-4 border-amber-400 p-4 mb-6">
        <div className="flex items-start">
          <Clock className="w-5 h-5 text-amber-400 mt-0.5 mr-3" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
              ⏰ Last day of your free trial
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              {countryGreeting}, your trial ends today. Upgrade now to keep all your data and continue using Blue Tradie.
            </p>
            <div className="mt-3">
              <Button 
                onClick={onUpgrade}
                variant="outline"
                size="sm"
                className="border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900"
              >
                Upgrade to Premium ($29/month)
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show reminder for days 2-3 remaining
  if (daysRemaining <= 3) {
    return (
      <div className="bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-400 p-4 mb-6">
        <div className="flex items-start">
          <Clock className="w-5 h-5 text-blue-400 mt-0.5 mr-3" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              {daysRemaining} day{daysRemaining === 1 ? '' : 's'} left in your free trial
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              You're doing great! Upgrade anytime to keep using Blue Tradie after {trialEndDate?.toLocaleDateString()}.
            </p>
            <div className="mt-3">
              <Button 
                onClick={onUpgrade}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-800 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-200 dark:hover:bg-blue-900"
              >
                Upgrade Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}