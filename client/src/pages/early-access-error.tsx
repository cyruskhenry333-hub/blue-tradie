import { useLocation } from "wouter";
import { AlertCircle, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EarlyAccessError() {
  const [location] = useLocation();
  const urlParams = new URLSearchParams(location.split('?')[1]);
  const email = urlParams.get('email') || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-800">
            Something Went Wrong
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <p className="text-gray-600">
              We couldn't process your early access request for:
            </p>
            <div className="flex items-center justify-center gap-2 p-3 bg-red-50 rounded-lg">
              <Mail className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-800">{email}</span>
            </div>
          </div>

          <div className="space-y-3 text-sm text-gray-600">
            <p className="font-medium">This might be because:</p>
            <ul className="space-y-1 text-left">
              <li>• Email not found in our waitlist</li>
              <li>• Technical issue on our end</li>
              <li>• You may have already received access</li>
            </ul>
          </div>

          <div className="pt-4 border-t space-y-3">
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">Need Help?</p>
              <p className="text-xs text-blue-600 mt-1">
                Email us at <a href="mailto:support@bluetradie.com" className="underline">support@bluetradie.com</a> with your email address and we'll sort it out within 24 hours.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}