// @ts-nocheck
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bot, 
  Camera, 
  Clock, 
  DollarSign, 
  Mail, 
  MapPin, 
  Receipt, 
  Settings,
  Zap,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Calendar
} from "lucide-react";
import AdminRoadmapValue from "@/components/AdminRoadmapValue";

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'communication' | 'operational' | 'marketing';
  isActive: boolean;
  timeSaved: string;
  accuracy: number;
  lastTriggered?: Date;
}

const automationRules: AutomationRule[] = [
  {
    id: 'receipt-scan',
    name: 'Receipt Auto-Categorization',
    description: 'Automatically scans and categorizes receipts for tax deductions',
    category: 'financial',
    isActive: true,
    timeSaved: '2.5 hrs/week',
    accuracy: 94,
    lastTriggered: new Date()
  },
  {
    id: 'invoice-followup',
    name: 'Payment Follow-up Automation',
    description: 'Sends reminder emails for overdue invoices automatically',
    category: 'communication',
    isActive: true,
    timeSaved: '1.2 hrs/week',
    accuracy: 89,
    lastTriggered: new Date(Date.now() - 86400000)
  },
  {
    id: 'job-completion',
    name: 'Job Completion Follow-up',
    description: 'Automatically requests reviews after job completion',
    category: 'marketing',
    isActive: true,
    timeSaved: '45 min/week',
    accuracy: 92,
  },
  {
    id: 'route-optimization',
    name: 'Route Optimization',
    description: 'Optimizes daily routes based on job locations and traffic',
    category: 'operational',
    isActive: false,
    timeSaved: '3.1 hrs/week',
    accuracy: 88,
  },
  {
    id: 'expense-tracking',
    name: 'GPS Expense Tracking',
    description: 'Automatically logs business travel and fuel expenses',
    category: 'financial',
    isActive: true,
    timeSaved: '1.8 hrs/week',
    accuracy: 96,
  },
  {
    id: 'quote-generation',
    name: 'Voice-to-Quote Generation',
    description: 'Converts voice notes into professional quotes',
    category: 'operational',
    isActive: false,
    timeSaved: '2.2 hrs/week',
    accuracy: 85,
  }
];

export default function Automation() {
  const [rules, setRules] = useState(automationRules);
  
  const toggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    ));
  };

  const activeRules = rules.filter(rule => rule.isActive);
  const totalTimeSaved = activeRules.reduce((total, rule) => {
    const hours = parseFloat(rule.timeSaved.match(/[\d.]+/)?.[0] || '0');
    return total + hours;
  }, 0);

  const categoryIcons = {
    financial: DollarSign,
    communication: Mail,
    operational: Settings,
    marketing: TrendingUp
  };

  const categoryColors = {
    financial: 'bg-green-100 text-green-800',
    communication: 'bg-blue-100 text-blue-800',
    operational: 'bg-purple-100 text-purple-800',
    marketing: 'bg-orange-100 text-orange-800'
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">AI Automation</h1>
        <p className="text-gray-600 mt-2">Your intelligent business assistant working 24/7</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Bot className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Rules</p>
                <p className="text-2xl font-bold">
                  <AdminRoadmapValue value={activeRules.length} />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Time Saved/Week</p>
                <p className="text-2xl font-bold">
                  <AdminRoadmapValue value={`${totalTimeSaved.toFixed(1)}h`} />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Tasks Automated</p>
                <p className="text-2xl font-bold">
                  <AdminRoadmapValue value="247" />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Value Added</p>
                <p className="text-2xl font-bold">
                  <AdminRoadmapValue value="$2,450" />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rules" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rules">Automation Rules</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Automation Rules */}
        <TabsContent value="rules">
          <div className="space-y-4">
            {Object.entries(
              rules.reduce((acc, rule) => {
                if (!acc[rule.category]) acc[rule.category] = [];
                acc[rule.category].push(rule);
                return acc;
              }, {} as Record<string, AutomationRule[]>)
            ).map(([category, categoryRules]) => {
              const IconComponent = categoryIcons[category as keyof typeof categoryIcons];
              return (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <IconComponent className="w-5 h-5" />
                      <span className="capitalize">
                        <AdminRoadmapValue value={`${category} Automation`} />
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {categoryRules.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold">
                                <AdminRoadmapValue value={rule.name} />
                              </h3>
                              <Badge className={categoryColors[rule.category]}>
                                <AdminRoadmapValue value={category} />
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            <AdminRoadmapValue value={rule.description} />
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-sm">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <AdminRoadmapValue value={`Saves ${rule.timeSaved}`} />
                            </span>
                            <span className="flex items-center space-x-1">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <AdminRoadmapValue value={`${rule.accuracy}% accurate`} />
                            </span>
                            {rule.lastTriggered && (
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <AdminRoadmapValue value={`Last: ${rule.lastTriggered.toLocaleDateString()}`} />
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          {rule.isActive && (
                            <div className="text-center">
                              <Progress value={rule.accuracy} className="w-16" />
                              <p className="text-xs text-gray-600 mt-1">
                                <AdminRoadmapValue value={`${rule.accuracy}%`} />
                              </p>
                            </div>
                          )}
                          <Switch
                            checked={rule.isActive}
                            onCheckedChange={() => toggleRule(rule.id)}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Recent Activity */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Automation Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Receipt processed automatically</p>
                    <p className="text-sm text-gray-600">Bunnings receipt categorized as "Tools & Equipment" - $127.50 tax deduction added</p>
                    <p className="text-xs text-gray-500 mt-1">2 minutes ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Payment reminder sent</p>
                    <p className="text-sm text-gray-600">Automatic follow-up sent to Johnson Family for overdue invoice #1247</p>
                    <p className="text-xs text-gray-500 mt-1">1 hour ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Route optimized</p>
                    <p className="text-sm text-gray-600">Tomorrow's schedule optimized - saved 45 minutes of travel time</p>
                    <p className="text-xs text-gray-500 mt-1">3 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Cash flow alert</p>
                    <p className="text-sm text-gray-600">Predicted cash shortage next Tuesday - 3 invoice follow-ups queued</p>
                    <p className="text-xs text-gray-500 mt-1">Yesterday</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Automation Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Smart Notifications</p>
                    <p className="text-sm text-gray-600">Get notified when automation saves you money or time</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekly Reports</p>
                    <p className="text-sm text-gray-600">Email summary of automation performance</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Advanced Learning</p>
                    <p className="text-sm text-gray-600">Allow AI to learn from your patterns for better automation</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Integration Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Bank Account</span>
                  </div>
                  <Badge variant="secondary">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Email</span>
                  </div>
                  <Badge variant="secondary">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <span>Calendar</span>
                  </div>
                  <Button size="sm" variant="outline">Connect</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <span>GPS Tracking</span>
                  </div>
                  <Button size="sm" variant="outline">Enable</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}