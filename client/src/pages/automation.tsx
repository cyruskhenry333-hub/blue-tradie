import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Zap,
  Mail,
  MessageSquare,
  Star,
  CheckCircle,
  XCircle,
  Sparkles,
  Clock,
  TrendingUp,
  PlayCircle,
  Pause,
  Edit,
  Trash,
  BarChart3
} from "lucide-react";

interface AutomationRule {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  triggerType: string;
  triggerConditions?: any;
  delayDays?: number;
  delayHours?: number;
  actionType: string;
  actionConfig?: any;
  useAI: boolean;
  aiPrompt?: string;
  staticContent?: string;
  executionCount: number;
  successCount: number;
  failureCount: number;
  lastExecutedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ReviewRequest {
  id: number;
  customerName: string;
  customerEmail: string;
  requestType: string;
  status: string;
  reviewReceived: boolean;
  reviewRating?: number;
  sentAt: string;
  clickedAt?: string;
  completedAt?: string;
}

export default function Automation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [selectedRuleForHistory, setSelectedRuleForHistory] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    triggerType: "job_completed",
    actionType: "send_email",
    useAI: true,
    aiPrompt: "",
    staticContent: "",
    delayDays: 0,
    delayHours: 0,
    actionConfig: {} as any,
  });

  // Fetch automation rules
  const { data: rules = [], isLoading: rulesLoading } = useQuery<AutomationRule[]>({
    queryKey: ["/api/automation/rules"],
  });

  // Fetch review requests
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery<ReviewRequest[]>({
    queryKey: ["/api/automation/reviews"],
  });

  // Create rule mutation
  const createRuleMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/automation/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation/rules"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Automation rule created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update rule mutation
  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/automation/rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation/rules"] });
      setEditingRule(null);
      resetForm();
      toast({
        title: "Success",
        description: "Automation rule updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle rule mutation
  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await fetch(`/api/automation/rules/${id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation/rules"] });
      toast({
        title: "Success",
        description: "Automation rule toggled successfully",
      });
    },
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/automation/rules/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation/rules"] });
      toast({
        title: "Success",
        description: "Automation rule deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      triggerType: "job_completed",
      actionType: "send_email",
      useAI: true,
      aiPrompt: "",
      staticContent: "",
      delayDays: 0,
      delayHours: 0,
      actionConfig: {},
    });
  };

  const handleCreateRule = () => {
    const payload = {
      ...formData,
      actionConfig: formData.actionType === 'send_email'
        ? { subject: formData.actionConfig.subject || 'Message from your tradie' }
        : formData.actionType === 'request_review'
        ? { reviewType: formData.actionConfig.reviewType || 'google_review', subject: 'Could you leave us a review?' }
        : {},
    };
    createRuleMutation.mutate(payload);
  };

  const handleUpdateRule = () => {
    if (!editingRule) return;
    updateRuleMutation.mutate({ id: editingRule.id, data: formData });
  };

  const handleEdit = (rule: AutomationRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || "",
      triggerType: rule.triggerType,
      actionType: rule.actionType,
      useAI: rule.useAI,
      aiPrompt: rule.aiPrompt || "",
      staticContent: rule.staticContent || "",
      delayDays: rule.delayDays || 0,
      delayHours: rule.delayHours || 0,
      actionConfig: rule.actionConfig || {},
    });
    setIsCreateDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingRule(null);
    resetForm();
  };

  const triggerTypes = [
    { value: "job_completed", label: "Job Completed" },
    { value: "invoice_sent", label: "Invoice Sent" },
    { value: "invoice_paid", label: "Invoice Paid" },
    { value: "quote_sent", label: "Quote Sent" },
    { value: "quote_accepted", label: "Quote Accepted" },
  ];

  const actionTypes = [
    { value: "send_email", label: "Send Email", icon: Mail },
    { value: "send_sms", label: "Send SMS", icon: MessageSquare },
    { value: "request_review", label: "Request Review", icon: Star },
  ];

  // Calculate stats
  const totalRules = rules.length;
  const activeRules = rules.filter(r => r.isActive).length;
  const totalExecutions = rules.reduce((sum, r) => sum + r.executionCount, 0);
  const successRate = totalExecutions > 0
    ? ((rules.reduce((sum, r) => sum + r.successCount, 0) / totalExecutions) * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="h-8 w-8 text-purple-600" />
              Automation
            </h1>
            <p className="text-gray-600 mt-1">
              AI-powered workflows to save you time and grow your business
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Rule
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Rules</p>
                  <p className="text-2xl font-bold">{totalRules}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Rules</p>
                  <p className="text-2xl font-bold text-green-600">{activeRules}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Executions</p>
                  <p className="text-2xl font-bold">{totalExecutions}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{successRate}%</p>
                </div>
                <Sparkles className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="rules" className="space-y-4">
          <TabsList>
            <TabsTrigger value="rules">Automation Rules</TabsTrigger>
            <TabsTrigger value="reviews">Review Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="space-y-4">
            {rulesLoading ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  Loading automation rules...
                </CardContent>
              </Card>
            ) : rules.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No automation rules yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Create your first automation rule to start saving time
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create First Rule
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {rules.map((rule) => {
                  const ActionIcon = actionTypes.find(t => t.value === rule.actionType)?.icon || Mail;
                  const successRate = rule.executionCount > 0
                    ? ((rule.successCount / rule.executionCount) * 100).toFixed(0)
                    : 0;

                  return (
                    <Card key={rule.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <CardTitle className="text-lg">{rule.name}</CardTitle>
                              {rule.isActive ? (
                                <Badge variant="default" className="bg-green-500">Active</Badge>
                              ) : (
                                <Badge variant="secondary">Inactive</Badge>
                              )}
                              {rule.useAI && (
                                <Badge variant="outline" className="gap-1">
                                  <Sparkles className="h-3 w-3" />
                                  AI
                                </Badge>
                              )}
                            </div>
                            {rule.description && (
                              <CardDescription className="mt-2">{rule.description}</CardDescription>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleRuleMutation.mutate({ id: rule.id, isActive: !rule.isActive })}
                            >
                              {rule.isActive ? <Pause className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(rule)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this rule?')) {
                                  deleteRuleMutation.mutate(rule.id);
                                }
                              }}
                            >
                              <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                            <Clock className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="text-xs text-gray-600">Trigger</p>
                              <p className="font-medium text-sm">
                                {triggerTypes.find(t => t.value === rule.triggerType)?.label || rule.triggerType}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                            <ActionIcon className="h-5 w-5 text-purple-600" />
                            <div>
                              <p className="text-xs text-gray-600">Action</p>
                              <p className="font-medium text-sm">
                                {actionTypes.find(t => t.value === rule.actionType)?.label || rule.actionType}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="text-xs text-gray-600">Executions</p>
                              <p className="font-medium text-sm">{rule.executionCount}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                            <TrendingUp className="h-5 w-5 text-yellow-600" />
                            <div>
                              <p className="text-xs text-gray-600">Success Rate</p>
                              <p className="font-medium text-sm">{successRate}%</p>
                            </div>
                          </div>
                        </div>

                        {(rule.delayDays || rule.delayHours) ? (
                          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-sm text-orange-800">
                              <Clock className="h-4 w-4 inline mr-1" />
                              Delayed execution:{' '}
                              {rule.delayDays ? `${rule.delayDays} day${rule.delayDays > 1 ? 's' : ''}` : ''}
                              {rule.delayDays && rule.delayHours ? ' and ' : ''}
                              {rule.delayHours ? `${rule.delayHours} hour${rule.delayHours > 1 ? 's' : ''}` : ''}
                            </p>
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            {reviewsLoading ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  Loading review requests...
                </CardContent>
              </Card>
            ) : reviews.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No review requests yet
                  </h3>
                  <p className="text-gray-600">
                    Create a review request automation to start collecting reviews
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{review.customerName}</h3>
                            <Badge
                              variant={review.reviewReceived ? "default" : review.status === 'clicked' ? "secondary" : "outline"}
                              className={review.reviewReceived ? "bg-green-500" : ""}
                            >
                              {review.reviewReceived ? 'Completed' : review.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{review.customerEmail}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Sent: {new Date(review.sentAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          {review.reviewReceived && review.reviewRating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                              <span className="font-bold text-lg">{review.reviewRating}/5</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create/Edit Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={handleCloseDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? 'Edit Automation Rule' : 'Create Automation Rule'}
              </DialogTitle>
              <DialogDescription>
                Set up AI-powered automation to save time and delight customers
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Rule Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Follow-up after job completion"
                />
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What does this automation do?"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="triggerType">When (Trigger)</Label>
                  <Select
                    value={formData.triggerType}
                    onValueChange={(value) => setFormData({ ...formData, triggerType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {triggerTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="actionType">Then (Action)</Label>
                  <Select
                    value={formData.actionType}
                    onValueChange={(value) => setFormData({ ...formData, actionType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {actionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="delayDays">Delay (Days)</Label>
                  <Input
                    id="delayDays"
                    type="number"
                    min="0"
                    value={formData.delayDays}
                    onChange={(e) => setFormData({ ...formData, delayDays: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="delayHours">Delay (Hours)</Label>
                  <Input
                    id="delayHours"
                    type="number"
                    min="0"
                    value={formData.delayHours}
                    onChange={(e) => setFormData({ ...formData, delayHours: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {formData.actionType === 'send_email' && (
                <div>
                  <Label htmlFor="emailSubject">Email Subject</Label>
                  <Input
                    id="emailSubject"
                    value={formData.actionConfig.subject || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      actionConfig: { ...formData.actionConfig, subject: e.target.value }
                    })}
                    placeholder="e.g., Thanks for choosing us!"
                  />
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Use AI to generate message content</p>
                    <p className="text-sm text-gray-600">
                      Let Claude create personalized messages for each customer
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.useAI}
                  onCheckedChange={(checked) => setFormData({ ...formData, useAI: checked })}
                />
              </div>

              {formData.useAI ? (
                <div>
                  <Label htmlFor="aiPrompt">AI Prompt</Label>
                  <Textarea
                    id="aiPrompt"
                    value={formData.aiPrompt}
                    onChange={(e) => setFormData({ ...formData, aiPrompt: e.target.value })}
                    placeholder="e.g., Write a friendly follow-up message thanking the customer for their business and asking if they were satisfied with the {{jobTitle}}."
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Available variables: {'{{customerName}}, {{jobTitle}}, {{amount}}'}
                  </p>
                </div>
              ) : (
                <div>
                  <Label htmlFor="staticContent">Message Content</Label>
                  <Textarea
                    id="staticContent"
                    value={formData.staticContent}
                    onChange={(e) => setFormData({ ...formData, staticContent: e.target.value })}
                    placeholder="e.g., Hi {{customerName}}, thanks for choosing us for {{jobTitle}}!"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Available variables: {'{{customerName}}, {{jobTitle}}, {{amount}}'}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button onClick={handleCloseDialog} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={editingRule ? handleUpdateRule : handleCreateRule}
                  disabled={!formData.name || (formData.useAI ? !formData.aiPrompt : !formData.staticContent)}
                  className="flex-1"
                >
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
