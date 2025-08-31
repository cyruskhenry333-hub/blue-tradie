import { CheckCircle, Mail } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DemoAccessConfirmed() {
  // Get email from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get('email') || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-green-800">
            Demo Access Activated! 🚀
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <p className="text-lg text-gray-700 font-medium">
              Great! We've sent your login details to:
            </p>
            <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <Mail className="h-5 w-5 text-blue-600" />
              <span className="font-bold text-blue-800 text-lg">{email}</span>
            </div>
          </div>

          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
            <h3 className="font-bold text-orange-800 text-lg mb-3">📧 Check Your Email Now</h3>
            <div className="space-y-2 text-sm text-gray-700 text-left">
              <p className="font-medium">Your email contains:</p>
              <ul className="space-y-1 ml-4">
                <li>• Your unique Demo14 code</li>
                <li>• Step-by-step login instructions</li>
                <li>• 1,000,000 AI tokens for testing</li>
                <li>• Direct link to the demo platform</li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500">
              Don't see the email? Check your spam folder or contact{' '}
              <a href="mailto:support@bluetradie.com" className="text-blue-600 hover:underline">
                support@bluetradie.com
              </a>
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
            <p><strong>Next Steps:</strong> Use your full name, email, and demo code to log in. You'll have 14 days to test all features!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}