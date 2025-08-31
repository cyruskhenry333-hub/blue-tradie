import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { HardHat, Briefcase, Wrench, Users, ArrowRight, CheckCircle, Target, DollarSign, Sparkles } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const onboardingSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  trade: z.string().min(1, "Please select your trade"),
  serviceArea: z.string().min(2, "Service area must be at least 2 characters"),
  country: z.enum(["Australia", "New Zealand"], { required_error: "Please select your country" }),
  businessType: z.enum(["new", "existing"]),
  isGstRegistered: z.boolean().default(false),
  experience: z.string().optional(),
  currentRevenue: z.string().optional(),
  
  // Goals and Personalization
  userType: z.enum(["tradie", "partner", "admin"]).default("tradie"),
  gender: z.enum(["male", "female", "other"]).default("male"),
  businessStructure: z.enum(["solo", "family", "team"]).default("solo"),
  tonePreference: z.enum(["casual", "professional", "friendly"]).default("casual"),
  financial: z.object({
    monthlyTarget: z.number().min(1000).max(100000),
    savingsTarget: z.number().min(1000).max(500000),
  }),
  work: z.object({
    jobsPerWeek: z.number().min(1).max(50),
  }),
  personal: z.object({
    holiday: z.string().min(2),
    holidayActivity: z.string().min(2),
    purchase: z.string().min(2),
  }),
});

type OnboardingForm = z.infer<typeof onboardingSchema>;

interface OnboardingWizardProps {
  onComplete: () => void;
}

const trades = [
  "Plumber", "Electrician", "Carpenter", "Landscaper", "Painter", "Roofer",
  "HVAC Technician", "Flooring Installer", "Tiler", "Plasterer", "Handyman", "Other"
];

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [generatedVision, setGeneratedVision] = useState("");
  const { toast } = useToast();

  const form = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      businessName: "",
      trade: "",
      serviceArea: "",
      country: "Australia",
      businessType: "new",
      isGstRegistered: false,
      experience: "",
      currentRevenue: "",
      
      // Goals defaults
      userType: "tradie",
      gender: "male", 
      businessStructure: "solo",
      tonePreference: "casual",
      financial: {
        monthlyTarget: 8000,
        savingsTarget: 20000,
      },
      work: {
        jobsPerWeek: 12,
      },
      personal: {
        holiday: "Bali",
        holidayActivity: "relaxing on the beach",
        purchase: "new ute",
      },
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (data: OnboardingForm) => {
      return await apiRequest("POST", "/api/user/onboarding", data);
    },
    onSuccess: async (data) => {
      toast({
        title: "Welcome to Blue Tradie!",
        description: "Your account has been set up successfully.",
      });
      
      // Set onboarding completion flag to trigger auto-tour  
      localStorage.setItem('blue-tradie-onboarding-completed', 'true');
      localStorage.setItem('blue-tradie-first-visit-completed', 'true');
      // Ensure tour completion flag is cleared for new users
      localStorage.removeItem('blue-tradie-tour-completed');
      
      // Small delay to ensure toast is visible before redirect
      setTimeout(() => {
        onComplete();
      }, 1000);
    },
    onError: (error) => {
      console.error("Onboarding error:", error);
      toast({
        title: "Setup Error",
        description: "Failed to complete setup. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OnboardingForm) => {
    completeMutation.mutate(data);
  };

  const nextStep = () => {
    if (step < 6) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const businessType = form.watch("businessType");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress indicator - 3 steps for streamlined onboarding */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i <= Math.min(step, 3) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {i < Math.min(step, 3) ? <CheckCircle className="w-5 h-5" /> : i}
                </div>
                {i < 3 && (
                  <div className={`w-12 h-1 mx-2 ${i < Math.min(step, 3) ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <HardHat className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">
              {step === 1 && "Welcome to Blue Tradie"}
              {step === 2 && "Tell us about your business"}
              {step === 3 && "Business experience"}
              {step === 4 && "About you"}
              {step === 5 && "Your goals"}
              {step === 6 && "Your vision"}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Step 1: Business Type */}
                {step === 1 && (
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="businessType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold">What describes you best?</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid grid-cols-1 gap-4 mt-4"
                            >
                              <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                <RadioGroupItem value="new" id="new" />
                                <Label htmlFor="new" className="flex items-center space-x-3 cursor-pointer flex-1">
                                  <Briefcase className="w-6 h-6 text-blue-600" />
                                  <div>
                                    <div className="font-medium">New Business Owner</div>
                                    <div className="text-sm text-gray-500">Just starting out, need help with everything</div>
                                  </div>
                                </Label>
                              </div>
                              <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                <RadioGroupItem value="existing" id="existing" />
                                <Label htmlFor="existing" className="flex items-center space-x-3 cursor-pointer flex-1">
                                  <Users className="w-6 h-6 text-orange-600" />
                                  <div>
                                    <div className="font-medium">Existing Business Owner</div>
                                    <div className="text-sm text-gray-500">Already running a business, want to streamline</div>
                                  </div>
                                </Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <Button onClick={nextStep} className="btn-tradie-primary">
                        Next <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2: Business Details */}
                {step === 2 && (
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Smith Plumbing Services" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="trade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Trade</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your trade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {trades.map((trade) => (
                                <SelectItem key={trade} value={trade}>
                                  {trade}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || "Australia"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Australia">🇦🇺 Australia</SelectItem>
                              <SelectItem value="New Zealand">🇳🇿 New Zealand</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="serviceArea"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Area</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Sydney Metro, Auckland Central" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={prevStep}>
                        Back
                      </Button>
                      <Button onClick={nextStep} className="btn-tradie-primary">
                        Next <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Experience & Business Details */}
                {step === 3 && (
                  <div className="space-y-6">
                    {businessType === "existing" && (
                      <>
                        <FormField
                          control={form.control}
                          name="experience"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Years in Business</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select experience level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="1-2">1-2 years</SelectItem>
                                  <SelectItem value="3-5">3-5 years</SelectItem>
                                  <SelectItem value="6-10">6-10 years</SelectItem>
                                  <SelectItem value="10+">10+ years</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="currentRevenue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Monthly Revenue</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select revenue range" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="0-5k">$0 - $5,000</SelectItem>
                                  <SelectItem value="5k-15k">$5,000 - $15,000</SelectItem>
                                  <SelectItem value="15k-30k">$15,000 - $30,000</SelectItem>
                                  <SelectItem value="30k+">$30,000+</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    {/* GST Registration - for both business types */}
                    <FormField
                      control={form.control}
                      name="isGstRegistered"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I'm registered for GST ({form.watch("country") === "New Zealand" ? "15%" : "10%"})
                            </FormLabel>
                            <p className="text-sm text-muted-foreground">
                              {form.watch("country") === "New Zealand" 
                                ? "This helps us calculate correct GST (15%) on your invoices and provide IRD-specific advice"
                                : "This helps us calculate correct GST (10%) on your invoices and provide ATO-specific advice"
                              }
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    {businessType === "new" && (
                      <div className="text-center p-6 bg-blue-50 rounded-lg">
                        <Wrench className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                        <h3 className="font-semibold mb-2">Ready to get started!</h3>
                        <p className="text-gray-600 text-sm">
                          We'll help you set up your first job, create professional invoices, 
                          and connect you with AI assistants for business advice.
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={prevStep}>
                        Back
                      </Button>
                      <Button 
                        type="submit" 
                        className="btn-tradie-primary"
                        disabled={completeMutation.isPending}
                      >
                        {completeMutation.isPending ? "Setting up..." : "Complete Setup"}
                        {!completeMutation.isPending && <CheckCircle className="w-4 h-4 ml-2" />}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}