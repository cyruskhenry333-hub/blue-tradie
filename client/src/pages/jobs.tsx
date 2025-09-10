import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import InvoiceForm from "@/components/invoice-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, MapPin, Phone, Mail, Plus, FileText, Clock, CheckCircle, AlertCircle, ArrowLeft, Edit } from "lucide-react";
import AIActionCostDisplay from "@/components/ai-action-cost-display";

// Form input schema (what the form expects)
const jobFormSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z.string().min(1, "Phone number is required"),
  customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  description: z.string().min(1, "Job description is required"),
  totalAmount: z.union([z.number(), z.string()]).transform(val => {
    if (val === '' || val === null || val === undefined) return 0;
    return typeof val === 'string' ? parseFloat(val) || 0 : val;
  }).refine(val => val >= 0, "Value must be positive"),
  scheduledDate: z.string().optional(),
});

// API submission schema (what gets sent to backend)
const jobApiSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z.string().min(1, "Phone number is required"),
  customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  description: z.string().min(1, "Job description is required"),
  totalAmount: z.string(),
  scheduledDate: z.date(),
});

type JobForm = z.infer<typeof jobFormSchema>;
type JobApiData = z.infer<typeof jobApiSchema>;

interface Job {
  id: number | string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address?: string;
  description: string;
  status: "scheduled" | "in_progress" | "completed";
  scheduledDate: string;
  totalAmount: number;
}

export default function JobsPage() {
  const [showNewJobDialog, setShowNewJobDialog] = useState(false);
  const [showEditJobDialog, setShowEditJobDialog] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [jobForInvoice, setJobForInvoice] = useState<Job | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    retry: false,
  });

  const form = useForm<JobForm>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      address: "",
      description: "",
      totalAmount: 0,
      scheduledDate: new Date().toISOString().split('T')[0], // Today's date as default
    },
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: JobForm) => {
      // Transform form data to API format
      const apiData = {
        ...data,
        customerEmail: data.customerEmail || undefined,
        totalAmount: data.totalAmount.toString(),
        scheduledDate: data.scheduledDate || undefined, // Send as string, backend will convert
      };
      const response = await apiRequest("POST", "/api/jobs", apiData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Job Created",
        description: "Your new job has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setShowNewJobDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to create job. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: async (data: { id: number | string; jobData: JobForm }) => {
      const apiData = {
        ...data.jobData,
        customerEmail: data.jobData.customerEmail || undefined,
        totalAmount: data.jobData.totalAmount.toString(),
        scheduledDate: data.jobData.scheduledDate || undefined,
      };
      const response = await apiRequest("PUT", `/api/jobs/${data.id}`, apiData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Job Updated",
        description: "Your job has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setShowEditJobDialog(false);
      setEditingJob(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to update job. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: JobForm) => {
    if (editingJob) {
      updateJobMutation.mutate({ id: editingJob.id, jobData: data });
    } else {
      createJobMutation.mutate(data);
    }
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    form.reset({
      customerName: job.customerName,
      customerPhone: job.customerPhone,
      customerEmail: job.customerEmail || "",
      address: job.address || "",
      description: job.description,
      totalAmount: job.totalAmount,
      scheduledDate: job.scheduledDate.split('T')[0], // Ensure date format
    });
    setShowEditJobDialog(true);
  };

  const handleCreateInvoice = (job: Job) => {
    setJobForInvoice(job);
    setShowInvoiceDialog(true);
  };

  // Fallback demo jobs only when no real jobs exist
  const demoJobs: Job[] = [
    {
      id: 1,
      customerName: "John Smith",
      customerPhone: "0412 345 678",
      customerEmail: "john@example.com",
      address: "123 Main St, Sydney NSW",
      description: "Kitchen renovation - new benchtops and splashback",
      status: "scheduled",
      scheduledDate: "2025-01-22",
      totalAmount: 2500,
    },
    {
      id: 2,
      customerName: "Sarah Wilson",
      customerPhone: "0456 789 012",
      customerEmail: "sarah@example.com",
      address: "456 Oak Ave, Melbourne VIC",
      description: "Bathroom leak repair - urgent",
      status: "in_progress",
      scheduledDate: "2025-01-21",
      totalAmount: 450,
    },
    {
      id: 3,
      customerName: "Mike Johnson",
      customerPhone: "0423 456 789",
      customerEmail: "mike@example.com",
      address: "789 Pine Rd, Brisbane QLD",
      description: "Outdoor deck extension",
      status: "completed",
      scheduledDate: "2025-01-18",
      totalAmount: 3200,
    }
  ];

  // Use real jobs if available, otherwise show demo jobs for guidance
  const displayJobs: Job[] = jobs.length > 0 ? jobs : demoJobs;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case "in-progress":
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "in-progress":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-tradie-light to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 bg-tradie-blue rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">BT</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-tradie-blue">Blue Tradie</h1>
                <p className="text-sm text-gray-600">Client Book - Job Management</p>
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
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Client Book</h1>
              <p className="text-gray-600">Manage your jobs and customers</p>
            </div>
          
          <Dialog open={showNewJobDialog} onOpenChange={setShowNewJobDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 jobs-add-button">
                <Plus className="w-4 h-4 mr-2" />
                New Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Job</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="0412 345 678" {...field} />
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
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St, Sydney NSW" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Kitchen renovation..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="totalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Value</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="2500" 
                            type="number" 
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || value === null || value === undefined) {
                                field.onChange('');
                              } else {
                                field.onChange(parseFloat(value) || 0);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scheduledDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scheduled Date (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="sticky bottom-0 bg-white pt-4 border-t">
                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={createJobMutation.isPending}
                    >
                      {createJobMutation.isPending ? "Creating..." : "Create Job"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Edit Job Dialog */}
          <Dialog open={showEditJobDialog} onOpenChange={(open) => {
            setShowEditJobDialog(open);
            if (!open) {
              setEditingJob(null);
              form.reset();
            }
          }}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Job</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="0412 345 678" {...field} />
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
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St, Sydney NSW" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Kitchen renovation..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="totalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Value</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="2500" 
                            type="number" 
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || value === null || value === undefined) {
                                field.onChange('');
                              } else {
                                field.onChange(parseFloat(value) || 0);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="scheduledDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scheduled Date (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="sticky bottom-0 bg-white pt-4 border-t">
                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={updateJobMutation.isPending}
                    >
                      {updateJobMutation.isPending ? "Updating..." : "Update Job"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Invoice Creation Dialog */}
          {jobForInvoice && (
            <Dialog open={showInvoiceDialog} onOpenChange={(open) => {
              setShowInvoiceDialog(open);
              if (!open) {
                setJobForInvoice(null);
              }
            }}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Invoice for {jobForInvoice.customerName}</DialogTitle>
                </DialogHeader>
                <InvoiceForm 
                  initialData={{
                    customerName: jobForInvoice.customerName,
                    customerEmail: jobForInvoice.customerEmail || "",
                    lineItems: [{
                      description: jobForInvoice.description,
                      quantity: 1,
                      rate: jobForInvoice.totalAmount,
                      amount: jobForInvoice.totalAmount,
                    }],
                    dueDate: "",
                  }}
                  onSuccess={() => {
                    setShowInvoiceDialog(false);
                    setJobForInvoice(null);
                    toast({
                      title: "Invoice Created",
                      description: "Invoice created successfully from job data!",
                    });
                  }} 
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Scheduled</p>
                  <p className="text-2xl font-bold">
                    {displayJobs.filter((j: Job) => j.status === "scheduled").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold">
                    {displayJobs.filter((j: Job) => j.status === "in_progress").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">
                    {displayJobs.filter((j: Job) => j.status === "completed").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold">
                    ${displayJobs.reduce((sum: number, job: Job) => sum + job.totalAmount, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4 jobs-list recent-jobs">
        {jobs.length === 0 && demoJobs.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-blue-800 text-sm">
              <strong>Demo Data:</strong> These are example jobs to help you get started. Create your first real job using the "New Job" button above.
            </p>
          </div>
        )}
        {displayJobs.map((job: Job) => (
          <Card key={job.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    {getStatusIcon(job.status)}
                    <h3 className="text-lg font-semibold">{job.customerName}</h3>
                    {getStatusBadge(job.status)}
                  </div>
                  
                  <p className="text-gray-700 mb-3">{job.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(job.scheduledDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>{job.customerPhone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{job.address}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mt-3">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>{job.customerEmail || "No email"}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    ${job.totalAmount.toLocaleString()}
                  </p>
                  <div className="flex space-x-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => handleCreateInvoice(job)}>
                      <FileText className="w-4 h-4 mr-1" />
                      Create Invoice
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEditJob(job)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {jobs.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No jobs yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first job to get started with Blue Tradie
            </p>
            <Button onClick={() => setShowNewJobDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Job
            </Button>
          </CardContent>
        </Card>
      )}

      </div>
    </div>
  );
}