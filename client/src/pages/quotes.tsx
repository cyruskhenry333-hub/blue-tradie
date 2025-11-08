import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Plus,
  Send,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
} from "lucide-react";

interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  type: 'labor' | 'materials';
}

interface Quote {
  id: number;
  quoteNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  title: string;
  description?: string;
  lineItems: LineItem[];
  subtotal: string;
  gst: string;
  total: string;
  status: string;
  validUntil?: string;
  sentAt?: string;
  viewedAt?: string;
  respondedAt?: string;
  createdAt: string;
}

export default function QuotesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  // Fetch quotes
  const { data: quotes, isLoading } = useQuery<Quote[]>({
    queryKey: ['/api/quotes'],
    queryFn: async () => {
      const response = await fetch('/api/quotes', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch quotes');
      return response.json();
    },
  });

  // Fetch quote stats
  const { data: stats } = useQuery({
    queryKey: ['/api/quotes/stats/summary'],
    queryFn: async () => {
      const response = await fetch('/api/quotes/stats/summary', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  // Send quote mutation
  const sendQuoteMutation = useMutation({
    mutationFn: async (quoteId: number) => {
      const response = await fetch(`/api/quotes/${quoteId}/send`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to send quote');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
      toast({
        title: "Quote sent!",
        description: "Your quote has been emailed to the customer.",
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      draft: { variant: "secondary", icon: Clock, label: "Draft" },
      sent: { variant: "default", icon: Send, label: "Sent" },
      viewed: { variant: "default", icon: Eye, label: "Viewed" },
      accepted: { variant: "default", icon: CheckCircle, label: "Accepted" },
      rejected: { variant: "destructive", icon: XCircle, label: "Rejected" },
      converted: { variant: "default", icon: FileText, label: "Converted" },
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

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quotes</h1>
          <p className="text-gray-600 mt-2">Create and manage customer quotes</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Quote
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Quote</DialogTitle>
            </DialogHeader>
            <CreateQuoteForm
              onSuccess={() => {
                setIsCreateDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Quotes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQuotes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate?.toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Accepted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.acceptedQuotes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quotes List */}
      <div className="space-y-4">
        {quotes && quotes.length > 0 ? (
          quotes.map((quote) => (
            <Card key={quote.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold">{quote.title}</h3>
                      {getStatusBadge(quote.status)}
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Quote #:</span>
                        <span>{quote.quoteNumber}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Customer:</span>
                        <span>{quote.customerName}</span>
                        {quote.customerEmail && (
                          <span className="text-gray-400">({quote.customerEmail})</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold text-lg text-gray-900">
                          {formatCurrency(quote.total)}
                        </span>
                      </div>
                    </div>
                    {quote.description && (
                      <p className="mt-2 text-sm text-gray-600">{quote.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {quote.status === 'draft' && (
                      <Button
                        onClick={() => sendQuoteMutation.mutate(quote.id)}
                        disabled={sendQuoteMutation.isPending}
                        size="sm"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedQuote(quote)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
                {quote.sentAt && (
                  <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                    Sent {new Date(quote.sentAt).toLocaleDateString()}
                    {quote.viewedAt && ` • Viewed ${new Date(quote.viewedAt).toLocaleDateString()}`}
                    {quote.respondedAt && ` • Responded ${new Date(quote.respondedAt).toLocaleDateString()}`}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No quotes yet</h3>
              <p className="text-gray-600 mb-4">Create your first quote to get started</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Quote
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quote Detail Dialog */}
      {selectedQuote && (
        <Dialog open={!!selectedQuote} onOpenChange={() => setSelectedQuote(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Quote #{selectedQuote.quoteNumber}</DialogTitle>
            </DialogHeader>
            <QuoteDetail quote={selectedQuote} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Create Quote Form Component
function CreateQuoteForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, rate: 0, amount: 0, type: 'labor' },
  ]);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    title: '',
    description: '',
    validUntil: '',
  });

  const [gstRate] = useState(0.1); // 10% GST for AU

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const gst = subtotal * gstRate;
    const total = subtotal + gst;
    return { subtotal, gst, total };
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: '', quantity: 1, rate: 0, amount: 0, type: 'labor' },
    ]);
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };

    // Recalculate amount
    if (field === 'quantity' || field === 'rate') {
      updated[index].amount = updated[index].quantity * updated[index].rate;
    }

    setLineItems(updated);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const createQuoteMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to create quote');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Quote created!",
        description: "Your quote has been created successfully.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totals = calculateTotals();

    createQuoteMutation.mutate({
      ...formData,
      lineItems,
      subtotal: totals.subtotal.toString(),
      gst: totals.gst.toString(),
      total: totals.total.toString(),
      status: 'draft',
    });
  };

  const totals = calculateTotals();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Details */}
      <div className="space-y-4">
        <h3 className="font-semibold">Customer Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input
            placeholder="Customer Name"
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            required
          />
          <Input
            type="email"
            placeholder="Email"
            value={formData.customerEmail}
            onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
          />
          <Input
            placeholder="Phone"
            value={formData.customerPhone}
            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
          />
          <Input
            type="date"
            placeholder="Valid Until"
            value={formData.validUntil}
            onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
          />
        </div>
      </div>

      {/* Quote Details */}
      <div className="space-y-4">
        <h3 className="font-semibold">Quote Details</h3>
        <Input
          placeholder="Quote Title (e.g., Kitchen Renovation)"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
        <Textarea
          placeholder="Description (optional)"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      {/* Line Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Line Items</h3>
          <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
        {lineItems.map((item, index) => (
          <div key={index} className="flex items-start space-x-2">
            <Input
              placeholder="Description"
              value={item.description}
              onChange={(e) => updateLineItem(index, 'description', e.target.value)}
              className="flex-1"
              required
            />
            <Input
              type="number"
              placeholder="Qty"
              value={item.quantity}
              onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
              className="w-20"
              required
            />
            <Input
              type="number"
              placeholder="Rate"
              value={item.rate}
              onChange={(e) => updateLineItem(index, 'rate', parseFloat(e.target.value) || 0)}
              className="w-24"
              required
            />
            <Select
              value={item.type}
              onValueChange={(value: any) => updateLineItem(index, 'type', value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="labor">Labor</SelectItem>
                <SelectItem value="materials">Materials</SelectItem>
              </SelectContent>
            </Select>
            <div className="w-24 flex items-center">
              ${item.amount.toFixed(2)}
            </div>
            {lineItems.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeLineItem(index)}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal:</span>
          <span>${totals.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>GST (10%):</span>
          <span>${totals.gst.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span>${totals.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={createQuoteMutation.isPending}>
          {createQuoteMutation.isPending ? 'Creating...' : 'Create Quote'}
        </Button>
      </div>
    </form>
  );
}

// Quote Detail Component
function QuoteDetail({ quote }: { quote: Quote }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium">Customer:</span> {quote.customerName}
        </div>
        <div>
          <span className="font-medium">Email:</span> {quote.customerEmail}
        </div>
        <div>
          <span className="font-medium">Status:</span> {quote.status}
        </div>
        <div>
          <span className="font-medium">Created:</span> {new Date(quote.createdAt).toLocaleDateString()}
        </div>
      </div>

      {quote.description && (
        <div>
          <h4 className="font-medium mb-2">Description</h4>
          <p className="text-sm text-gray-600">{quote.description}</p>
        </div>
      )}

      <div>
        <h4 className="font-medium mb-2">Line Items</h4>
        <div className="space-y-2">
          {quote.lineItems.map((item: LineItem, index: number) => (
            <div key={index} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
              <span>{item.description}</span>
              <span>{item.quantity} × ${item.rate} = ${item.amount}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>${quote.subtotal}</span>
        </div>
        <div className="flex justify-between">
          <span>GST:</span>
          <span>${quote.gst}</span>
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span>${quote.total}</span>
        </div>
      </div>
    </div>
  );
}
