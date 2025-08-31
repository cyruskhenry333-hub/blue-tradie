import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, ArrowLeft } from 'lucide-react';

export default function InvoiceCancelled() {
  const [, setLocation] = useLocation();

  // Extract query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const invoiceId = urlParams.get('inv');

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl text-orange-800">Payment Cancelled</CardTitle>
          <CardDescription className="text-orange-600">
            Your payment was cancelled. No charges were made.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invoiceId && (
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-700">
                <strong>Invoice ID:</strong> {invoiceId}
              </p>
              <p className="text-sm text-orange-600 mt-2">
                This invoice is still pending payment.
              </p>
            </div>
          )}
          
          <div className="text-center text-sm text-gray-600">
            <p>You can try again later or contact support if you need assistance.</p>
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => setLocation('/dashboard')}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
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