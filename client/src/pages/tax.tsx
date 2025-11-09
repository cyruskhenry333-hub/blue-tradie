import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign,
  Calculator,
  FileText,
  Lightbulb,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Sparkles,
  Settings,
  RefreshCw
} from "lucide-react";

interface TaxSettings {
  id: number;
  abn?: string;
  gstRegistered: boolean;
  gstRegistrationDate?: string;
  financialYearEnd: string;
  accountingBasis: string;
  basReportingPeriod: string;
  nextBasDueDate?: string;
  gstRate: string;
  accountantName?: string;
  accountantEmail?: string;
  accountantPhone?: string;
}

interface BasReport {
  id: number;
  quarter: string;
  periodStart: string;
  periodEnd: string;
  g1TotalSales: string;
  g1aGstOnSales: string;
  g11NonCapitalPurchases: string;
  g1bGstOnPurchases: string;
  totalGstPayable: string;
  status: string;
  submittedAt?: string;
  paidAt?: string;
}

interface TaxSuggestion {
  id: number;
  suggestionType: string;
  title: string;
  description: string;
  estimatedAmount?: string;
  estimatedSaving?: string;
  confidence?: string;
  aiReasoning?: string;
  status: string;
  createdAt: string;
}

interface TaxSummary {
  currentQuarter: string;
  estimatedGstPayable: number;
  totalDeductions: number;
  potentialSavings: number;
  nextBasDueDate?: string;
}

export default function Tax() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGenerateBasOpen, setIsGenerateBasOpen] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState("");

  // Fetch tax summary
  const { data: summary } = useQuery<TaxSummary>({
    queryKey: ["/api/accounting/summary"],
  });

  // Fetch tax settings
  const { data: settings } = useQuery<TaxSettings>({
    queryKey: ["/api/accounting/settings"],
  });

  // Fetch BAS reports
  const { data: basReports = [], isLoading: basLoading } = useQuery<BasReport[]>({
    queryKey: ["/api/accounting/bas"],
  });

  // Fetch tax suggestions
  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery<TaxSuggestion[]>({
    queryKey: ["/api/accounting/suggestions"],
  });

  // Fetch current quarter
  const { data: currentQuarterData } = useQuery<{ quarter: string }>({
    queryKey: ["/api/accounting/current-quarter"],
  });

  // Generate BAS mutation
  const generateBasMutation = useMutation({
    mutationFn: async (quarter: string) => {
      const res = await fetch("/api/accounting/bas/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quarter }),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/bas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/summary"] });
      setIsGenerateBasOpen(false);
      toast({ title: "Success", description: "BAS report generated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Submit BAS mutation
  const submitBasMutation = useMutation({
    mutationFn: async (reportId: number) => {
      const res = await fetch(`/api/accounting/bas/${reportId}/submit`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/bas"] });
      toast({ title: "Success", description: "BAS report submitted" });
    },
  });

  // Mark BAS paid mutation
  const markPaidMutation = useMutation({
    mutationFn: async (reportId: number) => {
      const res = await fetch(`/api/accounting/bas/${reportId}/paid`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/bas"] });
      toast({ title: "Success", description: "BAS marked as paid" });
    },
  });

  // Generate suggestions mutation
  const generateSuggestionsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/accounting/suggestions/generate", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/summary"] });
      toast({ title: "Success", description: "AI tax suggestions generated" });
    },
  });

  // Accept suggestion mutation
  const acceptSuggestionMutation = useMutation({
    mutationFn: async (suggestionId: number) => {
      const res = await fetch(`/api/accounting/suggestions/${suggestionId}/accept`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/suggestions"] });
      toast({ title: "Success", description: "Suggestion accepted" });
    },
  });

  // Dismiss suggestion mutation
  const dismissSuggestionMutation = useMutation({
    mutationFn: async (suggestionId: number) => {
      const res = await fetch(`/api/accounting/suggestions/${suggestionId}/dismiss`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/suggestions"] });
      toast({ title: "Success", description: "Suggestion dismissed" });
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<TaxSettings>) => {
      const res = await fetch("/api/accounting/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/settings"] });
      setIsSettingsOpen(false);
      toast({ title: "Success", description: "Tax settings updated" });
    },
  });

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(num);
  };

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Calculator className="h-8 w-8 text-green-600" />
              Tax & BAS
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your GST, BAS reports, and tax deductions
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsSettingsOpen(true)} variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button
              onClick={() => {
                setSelectedQuarter(currentQuarterData?.quarter || "");
                setIsGenerateBasOpen(true);
              }}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Generate BAS
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Current Quarter</p>
                  <p className="text-2xl font-bold">{summary?.currentQuarter || '-'}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Estimated GST</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {summary ? formatCurrency(summary.estimatedGstPayable) : '-'}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">GST Credits</p>
                  <p className="text-2xl font-bold text-green-600">
                    {summary ? formatCurrency(summary.totalDeductions) : '-'}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Potential Savings</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {summary ? formatCurrency(summary.potentialSavings) : '-'}
                  </p>
                </div>
                <Sparkles className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="bas" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bas">BAS Reports</TabsTrigger>
            <TabsTrigger value="suggestions">
              Tax Suggestions
              {pendingSuggestions.length > 0 && (
                <Badge variant="default" className="ml-2 bg-purple-500">
                  {pendingSuggestions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bas" className="space-y-4">
            {basLoading ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  Loading BAS reports...
                </CardContent>
              </Card>
            ) : basReports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No BAS reports yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Generate your first BAS report to track GST
                  </p>
                  <Button
                    onClick={() => {
                      setSelectedQuarter(currentQuarterData?.quarter || "");
                      setIsGenerateBasOpen(true);
                    }}
                    className="gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Generate BAS Report
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {basReports.map((report) => (
                  <Card key={report.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {report.quarter}
                            <Badge
                              variant={
                                report.status === 'paid' ? 'default' :
                                report.status === 'submitted' ? 'secondary' :
                                'outline'
                              }
                              className={report.status === 'paid' ? 'bg-green-500' : ''}
                            >
                              {report.status}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            {new Date(report.periodStart).toLocaleDateString()} - {new Date(report.periodEnd).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Total GST</p>
                          <p className="text-2xl font-bold text-orange-600">
                            {formatCurrency(report.totalGstPayable)}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-600">Total Sales</p>
                          <p className="font-semibold">{formatCurrency(report.g1TotalSales)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">GST on Sales</p>
                          <p className="font-semibold text-orange-600">{formatCurrency(report.g1aGstOnSales)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Purchases</p>
                          <p className="font-semibold">{formatCurrency(report.g11NonCapitalPurchases)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">GST Credits</p>
                          <p className="font-semibold text-green-600">{formatCurrency(report.g1bGstOnPurchases)}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {report.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => submitBasMutation.mutate(report.id)}
                            disabled={submitBasMutation.isPending}
                          >
                            Submit to ATO
                          </Button>
                        )}
                        {report.status === 'submitted' && (
                          <Button
                            size="sm"
                            onClick={() => markPaidMutation.mutate(report.id)}
                            disabled={markPaidMutation.isPending}
                          >
                            Mark as Paid
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="gap-2">
                          <Download className="h-4 w-4" />
                          Export PDF
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                AI-powered suggestions to maximize your tax deductions
              </p>
              <Button
                onClick={() => generateSuggestionsMutation.mutate()}
                disabled={generateSuggestionsMutation.isPending}
                variant="outline"
                className="gap-2"
              >
                {generateSuggestionsMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Generate Suggestions
              </Button>
            </div>

            {suggestionsLoading ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  Loading suggestions...
                </CardContent>
              </Card>
            ) : suggestions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No tax suggestions yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Generate AI-powered suggestions to find potential deductions
                  </p>
                  <Button
                    onClick={() => generateSuggestionsMutation.mutate()}
                    disabled={generateSuggestionsMutation.isPending}
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate Suggestions
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {suggestions.map((suggestion) => (
                  <Card key={suggestion.id} className={suggestion.status === 'pending' ? 'border-purple-200' : ''}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="h-5 w-5 text-yellow-500" />
                            <h3 className="font-semibold">{suggestion.title}</h3>
                            <Badge variant="outline" className="text-xs">
                              {suggestion.confidence}% confident
                            </Badge>
                            {suggestion.status !== 'pending' && (
                              <Badge
                                variant={suggestion.status === 'accepted' ? 'default' : 'secondary'}
                                className={suggestion.status === 'accepted' ? 'bg-green-500' : ''}
                              >
                                {suggestion.status}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                          {suggestion.aiReasoning && (
                            <p className="text-xs text-gray-500 italic">"{suggestion.aiReasoning}"</p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          {suggestion.estimatedSaving && (
                            <div>
                              <p className="text-xs text-gray-600">Potential saving</p>
                              <p className="text-xl font-bold text-green-600">
                                {formatCurrency(suggestion.estimatedSaving)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {suggestion.status === 'pending' && (
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            onClick={() => acceptSuggestionMutation.mutate(suggestion.id)}
                            disabled={acceptSuggestionMutation.isPending}
                            className="gap-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => dismissSuggestionMutation.mutate(suggestion.id)}
                            disabled={dismissSuggestionMutation.isPending}
                            className="gap-2"
                          >
                            <XCircle className="h-4 w-4" />
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Generate BAS Dialog */}
        <Dialog open={isGenerateBasOpen} onOpenChange={setIsGenerateBasOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate BAS Report</DialogTitle>
              <DialogDescription>
                Select the quarter for your BAS report
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="quarter">Quarter</Label>
                <Input
                  id="quarter"
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(e.target.value)}
                  placeholder="e.g., Q1 2025"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current quarter: {currentQuarterData?.quarter}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={() => setIsGenerateBasOpen(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={() => generateBasMutation.mutate(selectedQuarter)}
                  disabled={!selectedQuarter || generateBasMutation.isPending}
                  className="flex-1"
                >
                  Generate Report
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Tax Settings Dialog */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tax Settings</DialogTitle>
              <DialogDescription>
                Configure your tax and BAS preferences
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="abn">ABN (Australian Business Number)</Label>
                <Input
                  id="abn"
                  value={settings?.abn || ''}
                  onChange={(e) => {
                    if (settings) {
                      updateSettingsMutation.mutate({ abn: e.target.value });
                    }
                  }}
                  placeholder="11 digits"
                  maxLength={11}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium">GST Registered</p>
                  <p className="text-sm text-gray-600">
                    Are you registered for GST?
                  </p>
                </div>
                <Switch
                  checked={settings?.gstRegistered || false}
                  onCheckedChange={(checked) => {
                    if (settings) {
                      updateSettingsMutation.mutate({ gstRegistered: checked });
                    }
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Reporting Period</Label>
                  <p className="text-sm font-medium mt-2">
                    {settings?.basReportingPeriod || 'Quarterly'}
                  </p>
                </div>
                <div>
                  <Label>Financial Year End</Label>
                  <p className="text-sm font-medium mt-2">
                    {settings?.financialYearEnd || '30-06'}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="accountantName">Accountant Name (Optional)</Label>
                <Input
                  id="accountantName"
                  value={settings?.accountantName || ''}
                  onChange={(e) => {
                    if (settings) {
                      updateSettingsMutation.mutate({ accountantName: e.target.value });
                    }
                  }}
                  placeholder="Your accountant's name"
                />
              </div>

              <Button onClick={() => setIsSettingsOpen(false)} className="w-full">
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
