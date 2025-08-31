import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function InvoicePaid() {
  const [, setLocation] = useLocation();

  // Extract query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const invoiceId = urlParams.get('inv');
  const sessionId = urlParams.get('session_id');

  useEffect(() => {
    // Log the successful payment for tracking
    console.log('✅ Invoice payment successful:', {
      invoiceId,
      sessionId,
      timestamp: new Date().toISOString()
    });
  }, [invoiceId, sessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">Payment Successful!</CardTitle>
          <CardDescription className="text-green-600">
            Your invoice payment has been processed successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-700">
              <strong>Invoice ID:</strong> {invoiceId}
            </p>
            {sessionId && (
              <p className="text-sm text-green-700 mt-1">
                <strong>Payment Reference:</strong> {sessionId.slice(-8)}
              </p>
            )}
          </div>
          
          <div className="text-center text-sm text-gray-600">
            <p>A receipt has been sent to your email address.</p>
            <p>You can now close this window.</p>
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => setLocation('/dashboard')}
              className="w-full"
            >
              Return to Dashboard
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.close()}
              className="w-full"
            >
              Close Window
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}