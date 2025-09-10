// @ts-nocheck
import { useState } from "react";
import type { ReactNode } from "react";
import React from "react";
import AdminRoadmapValue from "@/components/AdminRoadmapValue";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, ThumbsUp, Calendar, Flag, BarChart3, Users, TrendingUp, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { RoadmapItem, FeatureRequest } from "@shared/schema";


const roadmapSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  priority: z.string().min(1, "Priority is required"),
  estimatedQuarter: z.string().optional(),
  isPublic: z.boolean().default(false),
});

type RoadmapFormData = z.infer<typeof roadmapSchema>;

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

export default function AdminRoadmap(): React.ReactElement {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null);

  const { data: roadmapItems = [] } = useQuery<RoadmapItem[]>({
    queryKey: ["/api/roadmap"],
  });

  const { data: userVotes = [] } = useQuery<number[]>({
    queryKey: ["/api/roadmap/votes/user"],
  });

  const { data: analytics = { totalVotes: 0, votesByCountry: {}, completedItemsThisQuarter: 0 } } = useQuery({
    queryKey: ["/api/admin/roadmap-analytics"],
  });

  // Type-safe analytics data
  const safeAnalytics = {
    totalVotes: (analytics as any)?.totalVotes || 0,
    votesByCountry: (analytics as any)?.votesByCountry || {},
    completedItemsThisQuarter: (analytics as any)?.completedItemsThisQuarter || 0,
  };

  const { data: featureRequests = [] } = useQuery<FeatureRequest[]>({
    queryKey: ["/api/feature-requests"],
  });

  const form = useForm<RoadmapFormData>({
    resolver: zodResolver(roadmapSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      priority: "medium",
      estimatedQuarter: "",
      isPublic: false,
    },
  });

  const createRoadmapItem = useMutation({
    mutationFn: (data: RoadmapFormData) => apiRequest("POST", "/api/roadmap", data),
    onSuccess: () => {
      toast({ title: "Success", description: "Roadmap item created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/roadmap"] });
      setShowCreateDialog(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create roadmap item", variant: "destructive" });
    },
  });

  const updateRoadmapItem = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<RoadmapItem>) => 
      apiRequest("PUT", `/api/roadmap/${id}`, data),
    onSuccess: () => {
      toast({ title: "Success", description: "Roadmap item updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/roadmap"] });
      setEditingItem(null);
    },
  });

  const voteForItem = useMutation({
    mutationFn: (itemId: number) => apiRequest("POST", `/api/roadmap/${itemId}/vote`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roadmap"] });
      queryClient.invalidateQueries({ queryKey: ["/api/roadmap/votes/user"] });
    },
  });

  const onSubmit = (data: RoadmapFormData) => {
    if (editingItem) {
      updateRoadmapItem.mutate({ id: editingItem.id, ...data });
    } else {
      createRoadmapItem.mutate(data);
    }
  };

  const filteredItems = roadmapItems.filter(item => 
    selectedStatus === "all" || item.status === selectedStatus
  );

  const itemsByStatus = {
    planned: roadmapItems.filter(item => item.status === "planned"),
    "in-progress": roadmapItems.filter(item => item.status === "in-progress"),
    completed: roadmapItems.filter(item => item.status === "completed"),
    cancelled: roadmapItems.filter(item => item.status === "cancelled"),
  };

  const itemsByPhase = {
    phase1: roadmapItems.filter(item => item.title.includes("Phase 1") || 
                                      item.estimatedQuarter === "Q1-2025"),
    phase2: roadmapItems.filter(item => item.title.includes("Phase 2") || 
                                      (item.estimatedQuarter === "Q2-2025" && !item.title.includes("Phase 3"))),
    phase3: roadmapItems.filter(item => item.title.includes("Phase 3") || 
                                      item.estimatedQuarter?.includes("Q2-Q3-2025")),
    phase4: roadmapItems.filter(item => item.title.includes("Phase 4") || 
                                      item.estimatedQuarter?.includes("Q3-Q4-2025")),
    phase5: roadmapItems.filter(item => item.title.includes("Phase 5") || 
                                      item.estimatedQuarter?.includes("Q4-2025-Q1-2026")),
  };

  const phaseInfo = {
    phase1: { name: "Phase 1: Beta Foundation", status: "✅ Complete", color: "bg-green-100 text-green-800" },
    phase2: { name: "Phase 2: Small Teams & Directory", status: "⏳ Next Priority", color: "bg-blue-100 text-blue-800" },
    phase3: { name: "Phase 3: Mobile & Offline Power", status: "⚙️ Prioritized", color: "bg-orange-100 text-orange-800" },
    phase4: { name: "Phase 4: Advanced AI & Insights", status: "📊 Future", color: "bg-purple-100 text-purple-800" },
    phase5: { name: "Phase 5: Global Scale & Enterprise", status: "🌍 Long Term", color: "bg-gray-100 text-gray-800" },
  };

  const getCountryFlag = (country: string): ReactNode => {
    switch (country) {
      case "Australia": return "🇦🇺";
      case "New Zealand": return "🇳🇿";
      default: return "🌍";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Roadmap</h1>
          <p className="text-gray-600">Manage features, priorities, and regional feedback</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="btn-tradie-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Feature
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Roadmap Item</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Feature name..." {...field} />
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
                        <Textarea placeholder="Detailed description..." {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="feature">New Feature</SelectItem>
                            <SelectItem value="improvement">Improvement</SelectItem>
                            <SelectItem value="bug-fix">Bug Fix</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="estimatedQuarter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Quarter (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Q2-2025" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <Label>Make public for user voting</Label>
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createRoadmapItem.isPending}>
                  <AdminRoadmapValue value={createRoadmapItem.isPending ? "Creating..." : "Create Feature"} />
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold"><AdminRoadmapValue value={safeAnalytics.totalVotes} /></div>
              <p className="text-xs text-muted-foreground">
                User feature votes
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AU Votes</CardTitle>
              <span className="text-lg">🇦🇺</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold"><AdminRoadmapValue value={safeAnalytics.votesByCountry.Australia || 0} /></div>
              <p className="text-xs text-muted-foreground">
                Australian users
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">NZ Votes</CardTitle>
              <span className="text-lg">🇳🇿</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold"><AdminRoadmapValue value={safeAnalytics.votesByCountry["New Zealand"] || 0} /></div>
              <p className="text-xs text-muted-foreground">
                New Zealand users
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold"><AdminRoadmapValue value={safeAnalytics.completedItemsThisQuarter} /></div>
              <p className="text-xs text-muted-foreground">
                This quarter
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="phases" className="space-y-4">
        <TabsList>
          <TabsTrigger value="phases">Phase View</TabsTrigger>
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          <TabsTrigger value="requests">Feature Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="phases">
          <div className="space-y-6">
            {Object.entries(phaseInfo).map(([phaseKey, phase]) => {
              const phaseItems = itemsByPhase[phaseKey as keyof typeof itemsByPhase] || [];
              return (
                <Card key={phaseKey}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl"><AdminRoadmapValue value={phase.name} /></CardTitle>
                      <Badge className={phase.color}>
                        <AdminRoadmapValue value={phase.status} />
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {phaseItems.map((item) => (
                        <Card key={item.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => setEditingItem(item)}>
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium text-sm leading-tight"><AdminRoadmapValue value={item.title} /></h4>
                              <div className="flex items-center space-x-2">
                                {item.isPublic && <Flag className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                                <Badge className={`text-xs ${statusColors[item.status as keyof typeof statusColors]}`}>
                                  <AdminRoadmapValue value={item.status} />
                                </Badge>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-3"><AdminRoadmapValue value={item.description} /></p>
                            <div className="flex items-center justify-between">
                              <Badge className={`text-xs ${priorityColors[item.priority as keyof typeof priorityColors]}`}>
                                <AdminRoadmapValue value={item.priority} />
                              </Badge>
                              {item.votesCount > 0 && (
                                <div className="flex items-center space-x-1">
                                  <ThumbsUp className="w-3 h-3" />
                                  <span className="text-xs"><AdminRoadmapValue value={item.votesCount} /></span>
                                </div>
                              )}
                            </div>
                            {item.estimatedQuarter && (
                              <Badge variant="outline" className="text-xs">
                                <AdminRoadmapValue value={item.estimatedQuarter} />
                              </Badge>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                    {phaseItems.length === 0 && (
                      <p className="text-gray-500 text-center py-8">No items in this phase yet</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="kanban">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(itemsByStatus).map(([status, items]) => (
              <Card key={status} className="h-fit">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium capitalize flex items-center justify-between">
                    <AdminRoadmapValue value={status.replace("-", " ")} />
                    <Badge variant="secondary"><AdminRoadmapValue value={items.length} /></Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.map((item) => (
                    <Card key={item.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => setEditingItem(item)}>
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm leading-tight"><AdminRoadmapValue value={item.title} /></h4>
                          {item.isPublic && <Flag className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2"><AdminRoadmapValue value={item.description} /></p>
                        <div className="flex items-center justify-between">
                          <Badge className={`text-xs ${priorityColors[item.priority as keyof typeof priorityColors]}`}>
                            <AdminRoadmapValue value={item.priority} />
                          </Badge>
                          {item.votesCount > 0 && (
                            <div className="flex items-center space-x-1">
                              <ThumbsUp className="w-3 h-3" />
                              <span className="text-xs"><AdminRoadmapValue value={item.votesCount} /></span>
                            </div>
                          )}
                        </div>
                        {item.estimatedQuarter && (
                          <Badge variant="outline" className="text-xs">
                            <AdminRoadmapValue value={item.estimatedQuarter} />
                          </Badge>
                        )}
                      </div>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Development Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roadmapItems
                  .filter(item => item.estimatedQuarter)
                  .sort((a, b) => (a.estimatedQuarter || "").localeCompare(b.estimatedQuarter || ""))
                  .map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                      <Badge className={statusColors[item.status as keyof typeof statusColors]}>
                        <AdminRoadmapValue value={item.status} />
                      </Badge>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium"><AdminRoadmapValue value={item.title} /></h4>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline"><AdminRoadmapValue value={item.estimatedQuarter} /></Badge>
                            {item.votesCount > 0 && (
                              <div className="flex items-center space-x-1">
                                <ThumbsUp className="w-4 h-4" />
                                <span className="text-sm"><AdminRoadmapValue value={item.votesCount} /></span>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1"><AdminRoadmapValue value={item.description} /></p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>User Feature Requests</CardTitle>
              <p className="text-sm text-gray-600">Community-submitted ideas by region</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {featureRequests.map((request) => (
                  <div key={request.id} className="flex items-start space-x-4 p-3 border rounded-lg">
                    <span className="text-lg">
                      <AdminRoadmapValue value={getCountryFlag(request.country)} />
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium"><AdminRoadmapValue value={request.title} /></h4>
                        <div className="flex items-center space-x-2">
                          <Badge className={`text-xs ${priorityColors[request.priority as keyof typeof priorityColors]}`}>
                            <AdminRoadmapValue value={request.priority} />
                          </Badge>
                          <Badge variant="outline"><AdminRoadmapValue value={request.status} /></Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1"><AdminRoadmapValue value={request.description} /></p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          <AdminRoadmapValue value={`${request.country} • ${new Date(request.createdAt || new Date()).toLocaleDateString()}`} />
                        </span>
                        <Button size="sm" variant="outline"
                                onClick={() => {
                                  // Convert to roadmap item
                                  form.setValue("title", request.title);
                                  form.setValue("description", request.description);
                                  form.setValue("category", request.category);
                                  form.setValue("priority", request.priority || "medium");
                                  setShowCreateDialog(true);
                                }}>
                          Add to Roadmap
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Roadmap Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Status</Label>
                <Select 
                  value={editingItem.status}
                  onValueChange={(value) => 
                    updateRoadmapItem.mutate({ id: editingItem.id, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingItem.isPublic || false}
                  onCheckedChange={(checked) =>
                    updateRoadmapItem.mutate({ id: editingItem.id, isPublic: checked })
                  }
                />
                <Label>Public visibility</Label>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}