import { CheckCircle, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EarlyAccessSent() {
  // Get email from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get('email') || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-800">
            Demo Access Sent!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <p className="text-gray-600">
              We've sent your demo access details to:
            </p>
            <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Mail className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">{email}</span>
            </div>
          </div>

          <div className="space-y-3 text-sm text-gray-600">
            <p className="font-medium">What's in your email:</p>
            <ul className="space-y-1 text-left">
              <li>• Your unique demo code</li>
              <li>• Step-by-step login instructions</li>
              <li>• 1,000,000 AI tokens for 14 days</li>
              <li>• Full platform access</li>
            </ul>
          </div>

          <div className="pt-4 border-t">
            <Button 
              onClick={() => window.location.href = '/demo-login'}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              Go to Demo Login
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            
            <p className="text-xs text-gray-500 mt-3">
              Don't see the email? Check your spam folder or contact support@bluetradie.com
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}