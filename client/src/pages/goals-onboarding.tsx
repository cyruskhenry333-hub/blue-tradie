import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Target, DollarSign, Calendar, MapPin, ShoppingCart, Users, ArrowRight, Sparkles, Heart, CheckCircle2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";

const goalsSchema = z.object({
  userType: z.enum(["tradie", "partner", "admin"]),
  gender: z.enum(["male", "female", "other"]),
  businessStructure: z.enum(["solo", "family", "team"]),
  tonePreference: z.enum(["casual", "professional", "friendly"]),
  financial: z.object({
    monthlyTarget: z.number().min(0),
    savingsTarget: z.number().min(0),
  }),
  work: z.object({
    jobsPerWeek: z.number().min(1),
  }),
  personal: z.object({
    holiday: z.string().min(1),
    holidayActivity: z.string().min(1),
    purchase: z.string().min(1),
  }),
  // New vision crafting fields
  vision: z.object({
    timeframe: z.string().optional(),
    keyResult: z.string().optional(),
    whyImportant: z.string().optional(),
    firstAction: z.string().optional(),
    secondAction: z.string().optional(),
    thirdAction: z.string().optional(),
  }).optional(),
});

type GoalsForm = z.infer<typeof goalsSchema>;

export default function GoalsOnboarding() {
  const [step, setStep] = useState(1);
  const [generatedVision, setGeneratedVision] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const form = useForm<GoalsForm>({
    resolver: zodResolver(goalsSchema),
    defaultValues: {
      userType: "tradie",
      gender: "male",
      businessStructure: "solo",
      tonePreference: "casual",
      financial: {
        monthlyTarget: 5000,
        savingsTarget: 10000,
      },
      work: {
        jobsPerWeek: 15,
      },
      personal: {
        holiday: "Gold Coast",
        holidayActivity: "surfing and relaxing",
        purchase: "new work truck",
      },
      vision: {
        timeframe: "",
        keyResult: "",
        whyImportant: "",
        firstAction: "",
        secondAction: "",
        thirdAction: "",
      },
    },
  });



  const setupGoalsMutation = useMutation({
    mutationFn: async (data: GoalsForm) => {
      const response = await apiRequest("POST", "/api/goals/setup", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Goals Set Successfully!",
        description: "Your personalized AI assistants are now ready to help you achieve your vision.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Setup Failed",
        description: "Failed to save goals. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateVisionMutation = useMutation({
    mutationFn: async (data: GoalsForm) => {
      // Generate rich vision statement using the new crafted vision fields
      const visionData = data.vision;
      if (visionData && visionData.timeframe && visionData.keyResult && visionData.whyImportant) {
        const visionSentence = `It is now ${visionData.timeframe}, and ${visionData.keyResult}. This goal was really important to me because ${visionData.whyImportant}. The first three actions I took were ${visionData.firstAction}, ${visionData.secondAction}, and ${visionData.thirdAction}.`;
        return { visionSentence };
      } else {
        // Fallback to simple version
        const visionSentence = `In 12 months I will have $${data.financial.savingsTarget.toLocaleString()} saved, working ${data.work.jobsPerWeek} jobs per week, and we'll have gone on a holiday to ${data.personal.holiday} ${data.personal.holidayActivity}`;
        return { visionSentence };
      }
    },
    onSuccess: (data) => {
      setGeneratedVision(data.visionSentence);
      setStep(6); // Now step 6 for final vision display
    },
  });

  const onSubmit = (data: GoalsForm) => {
    if (step < 6) {
      if (step === 5) {
        // Step 5: Generate vision from crafted answers
        generateVisionMutation.mutate(data);
      } else {
        setStep(step + 1);
      }
    } else {
      // Final submission with vision sentence
      const finalData = {
        ...data,
        visionSentence: generatedVision,
        visionBoardEnabled: true,
        goals: {
          financial: data.financial,
          work: data.work,
          personal: data.personal,
        },
      };
      setupGoalsMutation.mutate(finalData);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Target className="h-12 w-12 text-tradie-blue mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Tell us about yourself</h2>
              <p className="text-gray-600">This helps us personalize your AI assistants</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="userType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I am the...</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="tradie">Tradie</SelectItem>
                        <SelectItem value="partner">Partner/Spouse</SelectItem>
                        <SelectItem value="admin">Office Manager</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessStructure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Structure</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="solo">Solo Operator</SelectItem>
                        <SelectItem value="family">Family Business</SelectItem>
                        <SelectItem value="team">Team/Employees</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Pronouns</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">He/Him</SelectItem>
                        <SelectItem value="female">She/Her</SelectItem>
                        <SelectItem value="other">They/Them</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tonePreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Communication Style</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="casual">Casual (mate, easy as)</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <DollarSign className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Financial Goals</h2>
              <p className="text-gray-600">What are you working towards?</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyTarget">Monthly Income Target ($)</Label>
                <Input 
                  id="monthlyTarget"
                  type="number" 
                  defaultValue={form.getValues("financial.monthlyTarget")}
                  onChange={(e) => form.setValue("financial.monthlyTarget", Number(e.target.value) || 0)}
                  placeholder="5000"
                  min="0"
                  step="100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="savingsTarget">12-Month Savings Goal ($)</Label>
                <Input 
                  id="savingsTarget"
                  type="number" 
                  defaultValue={form.getValues("financial.savingsTarget")}
                  onChange={(e) => form.setValue("financial.savingsTarget", Number(e.target.value) || 0)}
                  placeholder="10000"
                  min="0"
                  step="100"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Work & Personal Goals</h2>
              <p className="text-gray-600">Balance work and life</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jobsPerWeek">Target Jobs Per Week</Label>
                <Input 
                  id="jobsPerWeek"
                  type="number" 
                  key="jobsPerWeek-15"
                  value={form.watch("work.jobsPerWeek") || 15}
                  onChange={(e) => form.setValue("work.jobsPerWeek", Number(e.target.value) || 1)}
                  placeholder="15"
                  min="1"
                  step="1"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="personal.holiday"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dream Holiday Destination</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Gold Coast, Fiji" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="personal.holidayActivity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Holiday Activity</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., surfing and relaxing" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="personal.purchase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Big Purchase Goal</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., new work truck, tools, home extension" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Work & Time Priorities</h2>
              <p className="text-gray-600">How do you want to structure your work life?</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 Your work goals from the previous step help shape your business strategy
              </p>
            </div>

            <div className="text-center py-4">
              <p className="text-gray-600">Ready to create your vision statement?</p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Heart className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">💭 Craft Your Vision Statement</h2>
              <p className="text-gray-600">Let's create something that really motivates you</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-blue-800">
                🎯 These questions help create a powerful vision that will keep you motivated when things get tough
              </p>
            </div>

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="vision.timeframe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>📅 When do you want to reach your goal?</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., In 12 months, By June 2026" {...field} />
                    </FormControl>
                    <p className="text-xs text-gray-500">
                      ✨ Stores: "It is now [your answer]"
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vision.keyResult"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>🎯 What is the ONE result that will show you've achieved it?</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g., I've saved $10,000 and we're on a beach in Fiji with the kids laughing" 
                        className="min-h-20"
                        {...field} 
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">
                      ✨ Stores: "I am / I have [your answer]"
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vision.whyImportant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>❤️ Why is this goal really, really important to you?</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g., So I can provide for my family and feel proud of what I've built" 
                        className="min-h-20"
                        {...field} 
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">
                      ✨ Stores: "This goal is really important because [your answer]"
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="vision.firstAction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>🚀 First action you'll take</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Register my ABN" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vision.secondAction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>📝 Second action</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Make a job calendar" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vision.thirdAction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>📞 Third action</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Contact 3 clients" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Sparkles className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">🌟 Your Vision</h2>
              <p className="text-gray-600">Here's your personalized vision statement</p>
            </div>

            <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <CardContent className="p-6 text-center">
                <p className="text-lg italic text-gray-800">
                  "{generatedVision}"
                </p>
              </CardContent>
            </Card>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">What happens next:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Your AI assistants will reference these goals in conversations</li>
                <li>• A personalized vision board will be generated for your dashboard</li>
                <li>• Weekly check-ins will track your progress</li>
                <li>• All advice will be tailored to help you achieve this vision</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-tradie-light to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3, 4, 5, 6].map((stepNumber) => (
                <div
                  key={stepNumber}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    stepNumber <= step
                      ? "bg-tradie-blue text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {stepNumber}
                </div>
              ))}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-tradie-blue h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 6) * 100}%` }}
              />
            </div>
          </div>

          <Card className="card-tradie">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Goals Setup</CardTitle>
                <Badge variant="outline">Step {step} of 6</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {renderStep()}

                  <div className="flex justify-between pt-6">
                    {step > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(step - 1)}
                      >
                        Back
                      </Button>
                    )}
                    <Button
                      type="submit"
                      className="ml-auto"
                      disabled={setupGoalsMutation.isPending || generateVisionMutation.isPending}
                    >
                      {step === 6 ? (
                        setupGoalsMutation.isPending ? "Saving..." : "Complete Setup"
                      ) : step === 5 ? (
                        generateVisionMutation.isPending ? "Generating..." : "Generate Vision"
                      ) : (
                        <>
                          Next <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}