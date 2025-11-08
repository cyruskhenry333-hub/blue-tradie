import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  Mail,
  Phone,
} from "lucide-react";

interface Quote {
  id: number;
  quoteNumber: string;
  title: string;
  description?: string;
  customerName: string;
  customerEmail?: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    type?: string;
  }>;
  subtotal: string;
  gst: string;
  total: string;
  status: string;
  validUntil?: string;
  sentAt?: string;
  createdAt: string;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  customerName: string;
  status: string;
  subtotal: string;
  gst: string;
  total: string;
  dueDate?: string;
  paidDate?: string;
  paidAt?: string;
  paymentStatus?: string;
  createdAt: string;
  lineItems?: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
}

export default function CustomerPortal() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [customerNotes, setCustomerNotes] = useState('');

  // Extract token from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, []);

  // Verify token
  const { data: verification, isLoading: verifyLoading } = useQuery({
    queryKey: ['/api/portal/verify', token],
    queryFn: async () => {
      if (!token) throw new Error('No token provided');
      const response = await fetch(`/api/portal/verify?token=${token}`);
      if (!response.ok) throw new Error('Invalid or expired token');
      return response.json();
    },
    enabled: !!token,
  });

  // Fetch quotes
  const { data: quotes, isLoading: quotesLoading } = useQuery<Quote[]>({
    queryKey: ['/api/portal/quotes', token],
    queryFn: async () => {
      if (!token) throw new Error('No token provided');
      const response = await fetch(`/api/portal/quotes?token=${token}`);
      if (!response.ok) throw new Error('Failed to fetch quotes');
      return response.json();
    },
    enabled: !!token && !!verification?.valid,
  });

  // Fetch invoices
  const { data: invoices, isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ['/api/portal/invoices', token],
    queryFn: async () => {
      if (!token) throw new Error('No token provided');
      const response = await fetch(`/api/portal/invoices?token=${token}`);
      if (!response.ok) throw new Error('Failed to fetch invoices');
      return response.json();
    },
    enabled: !!token && !!verification?.valid,
  });

  // Accept quote mutation
  const acceptMutation = useMutation({
    mutationFn: async ({ quoteId, notes }: { quoteId: number; notes?: string }) => {
      const response = await fetch(`/api/portal/quotes/${quoteId}/accept?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerNotes: notes }),
      });
      if (!response.ok) throw new Error('Failed to accept quote');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portal/quotes'] });
      setShowAcceptDialog(false);
      setCustomerNotes('');
      toast({
        title: "Quote accepted!",
        description: "The tradie will be notified and will start work soon.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Reject quote mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ quoteId, notes }: { quoteId: number; notes?: string }) => {
      const response = await fetch(`/api/portal/quotes/${quoteId}/reject?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerNotes: notes }),
      });
      if (!response.ok) throw new Error('Failed to reject quote');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portal/quotes'] });
      setShowRejectDialog(false);
      setCustomerNotes('');
      toast({
        title: "Quote declined",
        description: "The tradie has been notified.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Payment link mutation for invoices
  const payInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      const response = await fetch(`/api/invoices/${invoiceId}/paylink`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to create payment link');
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast({
        title: "Payment Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string; color: string }> = {
      // Quote statuses
      draft: { variant: "secondary", icon: Clock, label: "Draft", color: "text-gray-600" },
      sent: { variant: "default", icon: FileText, label: "Pending", color: "text-blue-600" },
      viewed: { variant: "default", icon: FileText, label: "Viewed", color: "text-blue-600" },
      accepted: { variant: "default", icon: CheckCircle, label: "Accepted", color: "text-green-600" },
      rejected: { variant: "destructive", icon: XCircle, label: "Declined", color: "text-red-600" },
      converted: { variant: "default", icon: FileText, label: "Converted", color: "text-green-600" },

      // Invoice/Payment statuses
      paid: { variant: "default", icon: CheckCircle, label: "Paid", color: "text-green-600" },
      pending: { variant: "default", icon: Clock, label: "Pending", color: "text-blue-600" },
      overdue: { variant: "destructive", icon: XCircle, label: "Overdue", color: "text-red-600" },
      failed: { variant: "destructive", icon: XCircle, label: "Failed", color: "text-red-600" },
    };

    const config = variants[status] || variants.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="w-3 h-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  if (verifyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!token || !verification?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h2>
            <p className="text-gray-600">
              This link is invalid or has expired. Please contact your tradie for a new link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {verification.customerName}!</h1>
          <p className="text-gray-600 mt-2">View and manage your quotes and invoices</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="quotes" className="w-full">
          <TabsList>
            <TabsTrigger value="quotes">
              Quotes {quotes && quotes.length > 0 && `(${quotes.length})`}
            </TabsTrigger>
            <TabsTrigger value="invoices">
              Invoices {invoices && invoices.length > 0 && `(${invoices.length})`}
            </TabsTrigger>
          </TabsList>

          {/* Quotes Tab */}
          <TabsContent value="quotes" className="space-y-4">
            {quotesLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : quotes && quotes.length > 0 ? (
              quotes.map((quote) => (
                <Card key={quote.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-3">
                          <h3 className="text-xl font-semibold">{quote.title}</h3>
                          {getStatusBadge(quote.status)}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Quote #{quote.quoteNumber}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatCurrency(quote.total)}
                        </div>
                        <p className="text-sm text-gray-500">Total</p>
                      </div>
                    </div>

                    {quote.description && (
                      <p className="text-gray-700 mb-4">{quote.description}</p>
                    )}

                    {/* Line Items */}
                    <div className="border-t border-b py-4 mb-4">
                      <h4 className="font-medium mb-3">Items:</h4>
                      <div className="space-y-2">
                        {quote.lineItems.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-700">
                              {item.description} ({item.quantity} × {formatCurrency(item.rate)})
                            </span>
                            <span className="font-medium">{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(quote.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>GST:</span>
                          <span>{formatCurrency(quote.gst)}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span>Total:</span>
                          <span>{formatCurrency(quote.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Valid Until */}
                    {quote.validUntil && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                        <Calendar className="w-4 h-4" />
                        <span>Valid until: {new Date(quote.validUntil).toLocaleDateString()}</span>
                      </div>
                    )}

                    {/* Actions */}
                    {(quote.status === 'sent' || quote.status === 'viewed') && (
                      <div className="flex space-x-3">
                        <Button
                          className="flex-1"
                          onClick={() => {
                            setSelectedQuote(quote);
                            setShowAcceptDialog(true);
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accept Quote
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setSelectedQuote(quote);
                            setShowRejectDialog(true);
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    )}

                    {quote.status === 'accepted' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                        <CheckCircle className="w-6 h-6 mx-auto text-green-600 mb-2" />
                        <p className="font-medium text-green-900">Quote Accepted</p>
                        <p className="text-sm text-green-700">Work will begin soon!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No quotes available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-4">
            {invoicesLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : invoices && invoices.length > 0 ? (
              invoices.map((invoice) => {
                const isPaid = invoice.paymentStatus === 'paid' || invoice.status === 'paid';
                const isPending = invoice.paymentStatus === 'pending' || invoice.paymentStatus === 'sent';
                const canPay = !isPaid && !isPending;

                return (
                  <Card key={invoice.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center space-x-3">
                            <h3 className="text-xl font-semibold">Invoice #{invoice.invoiceNumber}</h3>
                            {getStatusBadge(invoice.paymentStatus || invoice.status)}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Created: {new Date(invoice.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {formatCurrency(invoice.total)}
                          </div>
                          {invoice.dueDate && (
                            <p className="text-sm text-gray-500">
                              Due: {new Date(invoice.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Line Items */}
                      {invoice.lineItems && invoice.lineItems.length > 0 && (
                        <div className="border-t border-b py-4 mb-4">
                          <h4 className="font-medium mb-3">Items:</h4>
                          <div className="space-y-2">
                            {invoice.lineItems.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-700">
                                  {item.description} ({item.quantity} × {formatCurrency(item.rate)})
                                </span>
                                <span className="font-medium">{formatCurrency(item.amount)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Subtotal:</span>
                              <span>{formatCurrency(invoice.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>GST:</span>
                              <span>{formatCurrency(invoice.gst)}</span>
                            </div>
                            <div className="flex justify-between font-bold">
                              <span>Total:</span>
                              <span>{formatCurrency(invoice.total)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Payment Actions */}
                      {isPaid && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                          <CheckCircle className="w-6 h-6 mx-auto text-green-600 mb-2" />
                          <p className="font-medium text-green-900">Paid</p>
                          {invoice.paidAt && (
                            <p className="text-sm text-green-700">
                              on {new Date(invoice.paidAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}

                      {canPay && (
                        <Button
                          className="w-full"
                          onClick={() => payInvoiceMutation.mutate(invoice.id)}
                          disabled={payInvoiceMutation.isPending}
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          {payInvoiceMutation.isPending ? 'Processing...' : 'Pay Now'}
                        </Button>
                      )}

                      {isPending && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                          <Clock className="w-6 h-6 mx-auto text-blue-600 mb-2" />
                          <p className="font-medium text-blue-900">Payment Pending</p>
                          <p className="text-sm text-blue-700">
                            Please complete your payment or contact us if you need help
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No invoices available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Accept Dialog */}
        <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Accept Quote</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-600">
                You're about to accept this quote for {selectedQuote && formatCurrency(selectedQuote.total)}.
                Work will begin soon!
              </p>
              <Textarea
                placeholder="Add any notes or questions (optional)"
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAcceptDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedQuote) {
                    acceptMutation.mutate({ quoteId: selectedQuote.id, notes: customerNotes });
                  }
                }}
                disabled={acceptMutation.isPending}
              >
                {acceptMutation.isPending ? 'Accepting...' : 'Confirm Accept'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Decline Quote</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-600">
                Let us know why you're declining this quote (optional):
              </p>
              <Textarea
                placeholder="Reason for declining..."
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedQuote) {
                    rejectMutation.mutate({ quoteId: selectedQuote.id, notes: customerNotes });
                  }
                }}
                disabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending ? 'Declining...' : 'Confirm Decline'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
