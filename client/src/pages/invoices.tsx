import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, HardHat, Plus, FileText, DollarSign, Send, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import InvoiceForm from "@/components/invoice-form";

import blueTradieLogo from "@assets/Blue Tradie Logo_1753253697164.png";

export default function Invoices() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["/api/invoices"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'status-paid';
      case 'overdue': return 'status-overdue';
      case 'sent': return 'status-pending';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const totalOutstanding = (invoices as any[])?.reduce((sum: number, inv: any) => 
    ['sent', 'overdue'].includes(inv.status) ? sum + Number(inv.total) : sum, 0) || 0;

  const totalPaid = (invoices as any[])?.reduce((sum: number, inv: any) => 
    inv.status === 'paid' ? sum + Number(inv.total) : sum, 0) || 0;

  const sendInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      const response = await apiRequest("POST", `/api/invoices/${invoiceId}/send`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Invoice Feature Info",
        description: data.demoNote || "Invoice sent successfully!",
        variant: data.demoNote ? "default" : "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send invoice. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-tradie-light to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/dashboard">
                <img 
                  src={blueTradieLogo} 
                  alt="Blue Tradie Logo" 
                  className="h-16 w-16 md:h-18 md:w-18 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-tradie-blue">Blue Tradie</h1>
                <p className="text-sm text-gray-600">Invoice Management</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8 invoices-summary">
          <Card className="card-tradie">
            <CardContent className="p-6 text-center">
              <DollarSign className="h-8 w-8 text-tradie-warning mx-auto mb-2" />
              <div className="text-2xl font-bold text-tradie-warning mb-1">
                ${totalOutstanding.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Outstanding</div>
            </CardContent>
          </Card>
          
          <Card className="card-tradie">
            <CardContent className="p-6 text-center">
              <DollarSign className="h-8 w-8 text-tradie-success mx-auto mb-2" />
              <div className="text-2xl font-bold text-tradie-success mb-1">
                ${totalPaid.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Paid This Month</div>
            </CardContent>
          </Card>
          
          <Card className="card-tradie">
            <CardContent className="p-6 text-center">
              <FileText className="h-8 w-8 text-tradie-blue mx-auto mb-2" />
              <div className="text-2xl font-bold text-tradie-blue mb-1">
{(invoices as any[])?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Total Invoices</div>
            </CardContent>
          </Card>
        </div>

        {/* Header with Create Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Invoices</h2>
          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogTrigger asChild>
              <Button className="btn-tradie-primary invoice-create-button">
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
              </DialogHeader>
              <InvoiceForm onSuccess={() => setShowCreateForm(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Invoices List */}
        {(invoices as any[]) && (invoices as any[]).length > 0 ? (
          <div className="space-y-4 recent-invoices">
            {(invoices as any[]).map((invoice: any) => (
              <Card key={invoice.id} className="card-tradie">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="text-lg font-semibold">{invoice.customerName}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Invoice #:</span> {invoice.invoiceNumber}
                        </div>
                        <div>
                          <span className="font-medium">Created:</span> {new Date(invoice.createdAt).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Due Date:</span> {
                            invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Not set'
                          }
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-tradie-blue mb-1">
                        ${Number(invoice.total).toFixed(2)}
                      </div>
                      <div className="space-x-2">
                        <Button variant="outline" size="sm">View</Button>
                        {invoice.status === 'draft' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setEditingInvoice(invoice)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              className="btn-tradie-primary"
                              onClick={() => sendInvoiceMutation.mutate(invoice.id)}
                              disabled={sendInvoiceMutation.isPending}
                            >
                              <Send className="w-4 h-4 mr-1" />
                              {sendInvoiceMutation.isPending ? "Sending..." : "Send"}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="card-tradie">
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No invoices yet</h3>
              <p className="text-gray-600 mb-6">Create your first invoice to get started</p>
              <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
                <DialogTrigger asChild>
                  <Button className="btn-tradie-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Invoice
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Invoice</DialogTitle>
                  </DialogHeader>
                  <InvoiceForm onSuccess={() => setShowCreateForm(false)} />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Invoice Dialog */}
      {editingInvoice && (
        <Dialog open={!!editingInvoice} onOpenChange={() => setEditingInvoice(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Invoice</DialogTitle>
            </DialogHeader>
            <InvoiceForm 
              initialData={editingInvoice}
              onSuccess={() => setEditingInvoice(null)} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
