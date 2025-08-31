import { useEffect, useState } from 'react';
import { useSearch } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Receipt, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

interface PaymentDetails {
  session_id: string;
  invoice_id: string;
  payment_status: string;
}

export default function InvoiceSuccess() {
  const search = useSearch();
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const params = new URLSearchParams(search);
    const sessionId = params.get('session_id');
    const invoiceId = params.get('inv');
    
    if (sessionId && invoiceId) {
      setPaymentDetails({
        session_id: sessionId,
        invoice_id: invoiceId,
        payment_status: 'paid'
      });
    }
    
    setLoading(false);
  }, [search]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl text-green-600 dark:text-green-400">
            Payment Successful!
          </CardTitle>
          <CardDescription>
            Your invoice payment has been processed successfully.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {paymentDetails && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Invoice ID:</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  #{paymentDetails.invoice_id}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Payment Status:</span>
                <span className="font-medium text-green-600 dark:text-green-400 capitalize">
                  {paymentDetails.payment_status}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Session ID:</span>
                <span className="font-mono text-xs text-gray-800 dark:text-gray-200">
                  {paymentDetails.session_id.substring(0, 20)}...
                </span>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Receipt className="w-4 h-4" />
              <span>You will receive an email receipt shortly</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Invoice has been marked as paid</span>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}