import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ThumbsUp, Calendar, Lightbulb, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
// Don't import useAuth to avoid infinite loop
import type { RoadmapItem } from "@shared/schema";

const featureRequestSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  priority: z.string().default("medium"),
});

type FeatureRequestFormData = z.infer<typeof featureRequestSchema>;

const statusColors = {
  planned: "bg-blue-100 text-blue-800",
  "in-progress": "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800", 
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export default function PublicRoadmap() {
  const { toast } = useToast();
  // Set isAuthenticated to false for public roadmap to avoid infinite auth loop
  const isAuthenticated = false;
  const queryClient = useQueryClient();
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  const { data: roadmapItems = [] } = useQuery<RoadmapItem[]>({
    queryKey: ["/api/roadmap", { public: true }],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/roadmap?public=true");
      return response.json();
    },
    retry: false, // Don't retry on errors for faster loading
  });

  const { data: userVotes = [] } = useQuery<number[]>({
    queryKey: ["/api/roadmap/votes/user"],
    enabled: isAuthenticated, // Only fetch votes if user is authenticated
    retry: false, // Don't retry on 401 errors
  });

  // Define priority order for strategic sorting
  const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };

  const form = useForm<FeatureRequestFormData>({
    resolver: zodResolver(featureRequestSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      priority: "medium",
    },
  });

  const submitFeatureRequest = useMutation({
    mutationFn: (data: FeatureRequestFormData) => apiRequest("POST", "/api/feature-requests", data),
    onSuccess: () => {
      toast({ 
        title: "Thanks for your suggestion!", 
        description: "We'll review your feature request and consider it for our roadmap." 
      });
      setShowRequestDialog(false);
      form.reset();
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to submit feature request. Please try again.", 
        variant: "destructive" 
      });
    },
  });

  const voteForItem = useMutation({
    mutationFn: (itemId: number) => apiRequest("POST", `/api/roadmap/${itemId}/vote`),
    onSuccess: () => {
      toast({ title: "Vote recorded!", description: "Thanks for your feedback!" });
      queryClient.invalidateQueries({ queryKey: ["/api/roadmap"] });
      queryClient.invalidateQueries({ queryKey: ["/api/roadmap/votes/user"] });
    },
    onError: (error: Error) => {
      if (error.message.includes("401") || error.message.includes("Unauthorized")) {
        toast({ 
          title: "Sign in required", 
          description: "Please log in to vote on roadmap features.", 
          variant: "default" 
        });
      } else {
        toast({ 
          title: "Already voted", 
          description: "You can only vote once per feature.", 
          variant: "destructive" 
        });
      }
    },
  });

  const onSubmit = (data: FeatureRequestFormData) => {
    submitFeatureRequest.mutate(data);
  };

  // Organize items by phases based on quarter and development notes
  const getPhaseFromItem = (item: RoadmapItem) => {
    const notes = item.developmentNotes || '';
    if (notes.includes('Phase 1') || item.estimatedQuarter === 'Q1-2025') return '1';
    if (notes.includes('Phase 2') || item.estimatedQuarter === 'Q2-2025') return '2';
    if (notes.includes('Phase 3') || item.estimatedQuarter === 'Q3-2025') return '3';
    if (notes.includes('Phase 4') || item.estimatedQuarter === 'Q4-2025') return '4';
    return '1'; // Default to Phase 1
  };

  const phases = {
    '1': { title: 'Beta Launch & Core Operations', quarter: 'Q1 2025 (COMPLETED)', items: [] as RoadmapItem[] },
    '2': { title: 'Growth & Advanced Features', quarter: 'Q2 2025 (Months 4-6)', items: [] as RoadmapItem[] },
    '3': { title: 'Enterprise & Network Features', quarter: 'Q3 2025 (Months 7-9)', items: [] as RoadmapItem[] },
    '4': { title: 'Platform Maturity', quarter: 'Q4 2025 (Months 10-12)', items: [] as RoadmapItem[] },
  };

  // Organize items into phases
  roadmapItems.forEach(item => {
    const phase = getPhaseFromItem(item);
    phases[phase as keyof typeof phases].items.push(item);
  });

  // Sort items within each phase by priority, then by votes
  Object.values(phases).forEach(phase => {
    phase.items.sort((a, b) => {
      const aPriorityOrder = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 4;
      const bPriorityOrder = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 4;
      if (aPriorityOrder !== bPriorityOrder) {
        return aPriorityOrder - bPriorityOrder;
      }
      return b.votesCount - a.votesCount;
    });
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "in-progress":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "planned":
        return <Calendar className="w-4 h-4 text-blue-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Blue Tradie Roadmap</h1>
              <p className="text-gray-600 mt-2">See what we're building next and vote for your favorite features</p>
            </div>
            <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
              <DialogTrigger asChild>
                <Button className="btn-tradie-primary">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Suggest Feature
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Suggest a New Feature</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Feature Title</FormLabel>
                          <FormControl>
                            <Input placeholder="What feature would you like to see?" {...field} />
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
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Tell us more about how this would help your business..." {...field} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="What type of feature is this?" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="invoicing">Invoicing & Payments</SelectItem>
                              <SelectItem value="scheduling">Job Scheduling</SelectItem>
                              <SelectItem value="ai-features">AI Assistants</SelectItem>
                              <SelectItem value="branding">Branding & Marketing</SelectItem>
                              <SelectItem value="reporting">Reports & Analytics</SelectItem>
                              <SelectItem value="mobile">Mobile App</SelectItem>
                              <SelectItem value="integrations">Integrations</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={submitFeatureRequest.isPending}>
                      {submitFeatureRequest.isPending ? "Submitting..." : "Submit Suggestion"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Roadmap Content - Organized by Phases */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        
        {/* Phase Organization */}
        {Object.entries(phases).map(([phaseNumber, phase]) => {
          if (phase.items.length === 0) return null;
          
          const PhaseIcon = phaseNumber === '1' ? CheckCircle2 : 
                            phaseNumber === '2' ? TrendingUp :
                            phaseNumber === '3' ? Lightbulb : 
                            Calendar;
          
          const phaseColor = phaseNumber === '1' ? 'text-green-600' :
                            phaseNumber === '2' ? 'text-blue-600' :
                            phaseNumber === '3' ? 'text-purple-600' :
                            'text-orange-600';
                            
          const borderColor = phaseNumber === '1' ? 'border-l-green-500' :
                             phaseNumber === '2' ? 'border-l-blue-500' :
                             phaseNumber === '3' ? 'border-l-purple-500' :
                             'border-l-orange-500';

          return (
            <section key={phaseNumber} className="space-y-6">
              {/* Phase Header */}
              <div className="border-b pb-4">
                <div className="flex items-center space-x-3 mb-2">
                  {PhaseIcon && <PhaseIcon className={`w-6 h-6 ${phaseColor}`} />}
                  <h2 className="text-2xl font-bold text-gray-900">
                    Phase {phaseNumber}: {phase.title}
                  </h2>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className={`font-medium ${phaseColor}`}>{phase.quarter}</span>
                  <span>•</span>
                  <span>{phase.items.length} features</span>
                  <span>•</span>
                  <span>
                    {phase.items.filter(item => item.status === 'completed').length} completed, {' '}
                    {phase.items.filter(item => item.status === 'planned').length} planned
                  </span>
                </div>
              </div>

              {/* Phase Features */}
              <div className="grid gap-4 md:grid-cols-2">
                {phase.items.map((item) => {
                  const hasVoted = userVotes.includes(item.id);
                  const isCompleted = item.status === 'completed';
                  const isPlanned = item.status === 'planned';
                  
                  return (
                    <Card key={item.id} className={`${borderColor} border-l-4 ${isPlanned ? 'hover:shadow-md transition-shadow' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{item.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            <div className="flex items-center space-x-2 mt-3">
                              <Badge className={statusColors[item.status as keyof typeof statusColors]}>
                                {item.status === 'completed' ? 'Completed' : 
                                 item.status === 'in-progress' ? 'In Progress' : 'Planned'}
                              </Badge>
                              <Badge className={`text-xs ${priorityColors[item.priority as keyof typeof priorityColors]}`}>
                                {item.priority} priority
                              </Badge>
                              {item.estimatedQuarter && (
                                <Badge variant="outline" className="text-xs">
                                  {item.estimatedQuarter}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {/* Voting Section for Planned Items */}
                          {isPlanned && (
                            <div className="flex flex-col items-center space-y-2">
                              <Button
                                variant={hasVoted ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => voteForItem.mutate(item.id)}
                                disabled={hasVoted || voteForItem.isPending}
                                className="min-w-[60px]"
                              >
                                <div className="flex items-center space-x-1">
                                  <ThumbsUp className="w-3 h-3" />
                                  <span>{item.votesCount}</span>
                                </div>
                              </Button>
                              {hasVoted && <span className="text-xs text-green-600">✓ Voted</span>}
                            </div>
                          )}
                          
                          {/* Vote Count for Completed Items */}
                          {isCompleted && (
                            <div className="flex items-center space-x-1 text-gray-500">
                              <ThumbsUp className="w-4 h-4" />
                              <span className="text-sm">{item.votesCount}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Voting Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <div className="flex items-start space-x-3">
            <ThumbsUp className="w-5 h-5 text-blue-600 mt-1" />
            <div>
              <h3 className="font-medium text-blue-900 mb-2">Help Shape Our Roadmap</h3>
              <p className="text-sm text-blue-700">
                Vote for the features that matter most to your tradie business. Your feedback helps us prioritize 
                development and build exactly what you need to grow your business.
                <span className="block mt-2 font-medium">💡 Sign in to vote and track your preferences</span>
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-white rounded-lg border p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Don't see what you're looking for?</h3>
          <p className="text-gray-600 mb-4">
            We're always looking for new ways to help tradies succeed. Share your ideas with us!
          </p>
          <Button onClick={() => setShowRequestDialog(true)} className="btn-tradie-primary">
            <Lightbulb className="w-4 h-4 mr-2" />
            Suggest a Feature
          </Button>
        </div>
      </div>
    </div>
  );
}