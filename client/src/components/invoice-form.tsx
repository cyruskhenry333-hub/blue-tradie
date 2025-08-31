import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Trash2, Sparkles } from "lucide-react";

const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.01, "Quantity must be positive"),
  rate: z.number().min(0.01, "Rate must be positive"),
  amount: z.number(),
});

const invoiceSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Valid email required").optional().or(z.literal("")),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
  dueDate: z.string().optional(),
});

type InvoiceForm = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  initialData?: any;
  onSuccess?: () => void;
}

export default function InvoiceForm({ initialData, onSuccess }: InvoiceFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user info for GST rate
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const form = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: initialData ? {
      customerName: initialData.customerName || "",
      customerEmail: initialData.customerEmail || "",
      lineItems: initialData.lineItems || [
        {
          description: "Labor",
          quantity: 1,
          rate: 85,
          amount: 85,
        }
      ],
      dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : "",
    } : {
      customerName: "",
      customerEmail: "",
      lineItems: [
        {
          description: "Labor",
          quantity: 1,
          rate: 85,
          amount: 85,
        }
      ],
      dueDate: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  const watchedLineItems = form.watch("lineItems");

  // Calculate totals with region-appropriate GST rate (only if GST registered)
  const subtotal = watchedLineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const gstRate = user?.isGstRegistered ? (user?.country === "New Zealand" ? 0.15 : 0.1) : 0;
  const gst = subtotal * gstRate;
  const total = subtotal + gst;

  // Update amount when quantity or rate changes
  const updateAmount = (index: number) => {
    const item = watchedLineItems[index];
    if (item) {
      const amount = item.quantity * item.rate;
      form.setValue(`lineItems.${index}.amount`, amount);
    }
  };

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceForm) => {
      const method = initialData ? "PUT" : "POST";
      const url = initialData ? `/api/invoices/${initialData.id}` : "/api/invoices";
      await apiRequest(method, url, {
        ...data,
        subtotal: subtotal.toFixed(2),
        gst: gst.toFixed(2),
        total: total.toFixed(2),
        status: "draft",
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      });
    },
    onSuccess: () => {
      toast({
        title: initialData ? "Invoice Updated" : "Invoice Created",
        description: initialData ? "Your invoice has been updated successfully!" : "Your invoice has been created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateContentMutation = useMutation({
    mutationFn: async ({ jobDescription, customerName }: { jobDescription: string; customerName: string }) => {
      const response = await apiRequest("POST", "/api/invoices/generate", {
        jobDescription,
        customerName,
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Update form with generated content
      if (data.lineItems && data.lineItems.length > 0) {
        form.setValue("lineItems", data.lineItems);
      }
      toast({
        title: "Content Generated!",
        description: "AI has generated line items for your invoice.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate content. Please create manually.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateContent = () => {
    const customerName = form.getValues("customerName");
    if (!customerName) {
      toast({
        title: "Customer Name Required",
        description: "Please enter a customer name first.",
        variant: "destructive",
      });
      return;
    }

    const jobDescription = prompt("Describe the job briefly (e.g., 'Replace kitchen tap and fix leaking pipe'):");
    if (jobDescription) {
      setIsGenerating(true);
      generateContentMutation.mutate({ jobDescription, customerName });
      setIsGenerating(false);
    }
  };

  const addLineItem = () => {
    append({
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0,
    });
  };

  const onSubmit = (data: InvoiceForm) => {
    createInvoiceMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer Details */}
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Name *</FormLabel>
                <FormControl>
                  <Input placeholder="John Smith" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customerEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Email</FormLabel>
                <FormControl>
                  <Input placeholder="john@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <FormLabel>Invoice Number</FormLabel>
            <div className="px-3 py-2 bg-gray-50 rounded-md border text-gray-600">
              Auto-generated (INV-001, INV-002, etc.)
            </div>
            <p className="text-xs text-gray-500">
              Your invoice numbers are auto-generated and reset each year.
            </p>
          </div>

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* AI Generate Button */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Line Items</h3>
          <Button
            type="button"
            variant="outline"
            onClick={handleGenerateContent}
            disabled={isGenerating || generateContentMutation.isPending}
            className="text-tradie-blue border-tradie-blue"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {generateContentMutation.isPending ? "Generating..." : "AI Generate"}
          </Button>
        </div>

        {/* Line Items Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="w-20">Qty</TableHead>
                <TableHead className="w-24">Rate ($)</TableHead>
                <TableHead className="w-24">Amount ($)</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Labor, materials, etc." {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) => {
                                field.onChange(parseFloat(e.target.value) || 0);
                                setTimeout(() => updateAmount(index), 0);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.rate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) => {
                                field.onChange(parseFloat(e.target.value) || 0);
                                setTimeout(() => updateAmount(index), 0);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      ${(watchedLineItems[index]?.amount || 0).toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="p-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={addLineItem}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Line Item
            </Button>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {user?.isGstRegistered ? (
              <div className="flex justify-between">
                <span>GST ({user?.country === "New Zealand" ? "15%" : "10%"}):</span>
                <span>${gst.toFixed(2)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-gray-500">
                <span>GST (Not registered):</span>
                <span>$0.00</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline">
            Save as Draft
          </Button>
          <Button 
            type="submit" 
            disabled={createInvoiceMutation.isPending}
            className="btn-tradie-primary"
          >
            {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
