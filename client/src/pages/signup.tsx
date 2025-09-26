import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { HardHat, ArrowLeft, CheckCircle, User, Building, MapPin, Flag, CreditCard } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import blueTradieLogo from "@assets/Blue Tradie Logo_1753253697164.png";

const signupSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  trade: z.string().min(1, "Please select your trade"),
  serviceArea: z.string().min(2, "Service area must be at least 2 characters"),
  country: z.enum(["Australia", "New Zealand"], { required_error: "Please select your country" }),
  isGstRegistered: z.boolean().default(false),
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to the terms and conditions"),
});

type SignupForm = z.infer<typeof signupSchema>;

const trades = [
  "Plumber", "Electrician", "Carpenter", "Landscaper", "Painter", "Roofer",
  "HVAC Technician", "Flooring Installer", "Tiler", "Plasterer", "Handyman", "Other"
];

export default function Signup() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const search = useSearch();
  
  // Get plan from URL parameter (pro or teams)
  const urlParams = new URLSearchParams(search);
  const selectedPlan = urlParams.get('plan') || 'pro';

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      businessName: "",
      trade: "",
      serviceArea: "",
      country: "Australia",
      isGstRegistered: false,
      agreeToTerms: false,
    },
  });

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/checkout/start-trial", {
        ...data,
        plan: selectedPlan
      });
      
      if (response.ok) {
        const { sessionUrl } = await response.json();
        
        toast({
          title: "Redirecting to Secure Checkout",
          description: "We'll redirect you to enter your payment details for your free trial.",
        });
        
        // Redirect to Stripe Checkout
        window.location.href = sessionUrl;
      } else {
        const errorData = await response.json();
        toast({
          title: "Checkout Failed",
          description: errorData.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Failed",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-tradie-light to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer">
                <img 
                  src={blueTradieLogo} 
                  alt="Blue Tradie Logo" 
                  className="h-16 w-16 object-contain"
                />
                <span className="text-2xl font-bold text-tradie-blue">Blue Tradie</span>
              </div>
            </Link>
            
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Homepage
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Free Trial Banner */}
          <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-6 mb-8 text-center border border-green-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Start Your {selectedPlan === 'teams' ? 'Teams' : 'Pro'} Free Trial
              </h2>
            </div>
            <p className="text-gray-700 mb-4">
              Full access to all features for 30 days. Card required but no charge until day 31. Cancel anytime.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center justify-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>6 AI Advisors</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Smart Invoicing</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Tradie Network</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Automation</span>
              </div>
            </div>
          </div>

          {/* Signup Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Create Your Account</CardTitle>
              <p className="text-center text-gray-600">
                Tell us about your business so we can personalize your experience
              </p>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="h-5 w-5 text-gray-500" />
                      <h3 className="text-lg font-semibold">Personal Information</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Smith" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Business Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Building className="h-5 w-5 text-gray-500" />
                      <h3 className="text-lg font-semibold">Business Information</h3>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Smith Electrical Services" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="trade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Trade</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    </div>

                    <FormField
                      control={form.control}
                      name="serviceArea"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Area</FormLabel>
                          <FormControl>
                            <Input placeholder="Sydney, NSW" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isGstRegistered"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I'm GST registered
                            </FormLabel>
                            <p className="text-sm text-gray-500">
                              We'll automatically calculate GST on your invoices
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Terms and Conditions */}
                  <FormField
                    control={form.control}
                    name="agreeToTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm">
                            I agree to the{" "}
                            <a href="/terms" className="text-blue-600 hover:underline">
                              Terms of Service
                            </a>{" "}
                            and{" "}
                            <a href="/privacy" className="text-blue-600 hover:underline">
                              Privacy Policy
                            </a>
                          </FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-6 text-lg font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Redirecting to Checkout...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Start My Free Trial
                      </>
                    )}
                  </Button>

                  {/* Legal Notice */}
                  <div className="text-center text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold mb-2">30-day free trial. Card charged on day 31 unless canceled.</p>
                    <p>Up to 3 reminder emails/SMS. Reply STOP to opt out.</p>
                  </div>

                  {/* Additional Info */}
                  <div className="text-center text-sm text-gray-500 space-y-2">
                    <p>✅ Secure checkout powered by Stripe</p>
                    <p>✅ Cancel anytime during your free month</p>
                    <p>✅ Full access to all features</p>
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