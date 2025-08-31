import { useEffect, useState } from 'react';
import { useSearch } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react';
import { Link } from 'wouter';

export default function InvoiceCancel() {
  const search = useSearch();
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [retryUrl, setRetryUrl] = useState<string>('');
  
  useEffect(() => {
    const params = new URLSearchParams(search);
    const id = params.get('inv');
    setInvoiceId(id);
    if (id) {
      setRetryUrl(`/api/invoices/${id}/paylink`);
    }
  }, [search]);

  const handleRetryPayment = async () => {
    if (!invoiceId) return;
    
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/paylink`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Failed to create new payment link:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl text-red-600 dark:text-red-400">
            Payment Cancelled
          </CardTitle>
          <CardDescription>
            Your payment was cancelled. The invoice remains unpaid.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {invoiceId && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Invoice ID:</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  #{invoiceId}
                </span>
              </div>
            </div>
          )}
          
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>Don't worry! Your invoice is still available for payment.</p>
            <p className="mt-2">You can try again anytime using the payment link.</p>
          </div>
          
          <div className="flex space-x-3">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            {invoiceId && (
              <Button onClick={handleRetryPayment} className="flex-1">
                <CreditCard className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}