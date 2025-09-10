import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { HardHat, ArrowLeft, User, Building, MapPin, Flag, Upload, Image } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { toAppUser } from "@shared/utils/toAppUser";

const profileSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  trade: z.string().min(1, "Please select your trade"),
  serviceArea: z.string().min(2, "Service area must be at least 2 characters"),
  country: z.string().min(2, "Please select your country"),
  isGstRegistered: z.boolean().default(false),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const trades = [
  "Plumber", "Electrician", "Carpenter", "Landscaper", "Painter", "Roofer",
  "HVAC Technician", "Flooring Installer", "Tiler", "Plasterer", "Handyman", "Other"
];

export default function Profile() {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: userData, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });
  const user = toAppUser(userData);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      businessName: user?.businessName || "",
      trade: user?.trade || "",
      serviceArea: user?.serviceArea || "",
      country: (user?.country ?? "Australia"),
      isGstRegistered: user?.isGstRegistered || false,
    },
  });

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      form.reset({
        businessName: user.businessName || "",
        trade: user.trade || "",
        serviceArea: user.serviceArea || "",
        country: (user.country ?? "Australia"),
        isGstRegistered: user.isGstRegistered || false,
      });
      
      // Show existing logo status if user has one
      if (user.businessLogo && !logoPreview) {
        // For now, show a placeholder since we don't store actual image URLs
        // In a real implementation, this would be the actual logo URL
        setLogoPreview("/placeholder-user-logo.png");
      }
    }
  }, [user, form, logoPreview]);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      // First update business details
      const response = await apiRequest("POST", "/api/onboarding", data);
      
      // If there's a logo file, upload it separately
      if (logoFile) {
        const logoResponse = await apiRequest("POST", "/api/upload-logo", {
          businessName: data.businessName,
          logoFile: logoFile.name // In real implementation, would handle file upload
        });
        
        return logoResponse;
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Profile Updated",
        description: logoFile ? "Business profile and logo updated successfully!" : "Your business profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/journey"] });
      
      // Keep logo preview if upload was successful
      if (logoFile && result?.logoUrl) {
        // Keep the preview but clear the file
        setLogoFile(null);
      }
      
      // Navigate back to dashboard after successful save
      setTimeout(() => {
        setLocation("/");
      }, 1000); // Small delay to let user see the success message
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
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
              <HardHat className="h-8 w-8 text-tradie-blue" />
              <div>
                <h1 className="text-2xl font-bold text-tradie-blue">Blue Tradie</h1>
                <p className="text-sm text-gray-600">Business Profile</p>
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

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="card-tradie">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-6 w-6 text-tradie-blue" />
              <span>Business Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Logo Upload */}
                <div className="space-y-4">
                  <FormLabel className="flex items-center space-x-2">
                    <Image className="h-4 w-4" />
                    <span>Business Logo</span>
                  </FormLabel>
                  <div className="flex items-center space-x-4">
                    {logoPreview ? (
                      <div className="w-24 h-24 border-2 border-gray-200 rounded-lg overflow-hidden">
                        <img 
                          src={logoPreview} 
                          alt="Logo preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                        <Image className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label htmlFor="logo-upload" className="cursor-pointer">
                        <Button type="button" variant="outline" className="flex items-center space-x-2" asChild>
                          <span>
                            <Upload className="h-4 w-4" />
                            <span>Upload Logo</span>
                          </span>
                        </Button>
                      </label>
                      <p className="text-sm text-gray-500">
                        JPG, PNG up to 2MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Business Name */}
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Building className="h-4 w-4" />
                        <span>Business Name</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Smith Plumbing Services" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Trade */}
                <FormField
                  control={form.control}
                  name="trade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Trade</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
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

                {/* Service Area */}
                <FormField
                  control={form.control}
                  name="serviceArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>Service Area</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Sydney Metro, Auckland Central" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Country */}
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Flag className="h-4 w-4" />
                        <span>Country</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "Australia"}>
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

                {/* GST Registration */}
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

                {/* Submit Button */}
                <div className="flex justify-end space-x-3">
                  <Link href="/">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                    className="btn-tradie-primary"
                  >
                    {updateProfileMutation.isPending ? "Updating..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}