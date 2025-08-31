import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Wrench,
  MapPin,
  Users,
  CheckSquare,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  MessageCircle
} from "lucide-react";

interface OnboardingData {
  tradeType: string;
  businessName: string;
  region: string;
  businessSize: string;
  needs: string[];
  primaryGoal: string;
}

interface OnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function OnboardingFlow({ isOpen, onClose, onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    tradeType: "",
    businessName: "",
    region: "",
    businessSize: "",
    needs: [],
    primaryGoal: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveOnboardingMutation = useMutation({
    mutationFn: async (onboardingData: OnboardingData) => {
      return await apiRequest("POST", "/api/user/onboarding", onboardingData);
    },
    onSuccess: (data) => {
      toast({
        title: "Welcome to Blue Tradie!",
        description: "Your profile has been set up. Let's get started building your business."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onComplete();
    },
    onError: (error) => {
      console.error("Onboarding error:", error);
      toast({
        title: "Setup Failed",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive"
      });
    }
  });

  const tradeTypes = [
    "Electrician", "Plumber", "Carpenter", "Painter", "Roofer", 
    "Flooring", "HVAC", "Landscaper", "Handyman", "Builder",
    "Tiler", "Glazier", "Concreter", "Bricklayer", "Other"
  ];

  const businessSizes = [
    { value: "solo", label: "Just me (solo trader)" },
    { value: "small", label: "2-5 people (small team)" },
    { value: "medium", label: "6-15 people (growing business)" },
    { value: "large", label: "15+ people (established company)" }
  ];

  const availableNeeds = [
    "Invoicing & Payments",
    "Job Management", 
    "Marketing & Branding",
    "Tax & Compliance",
    "Customer Management",
    "Scheduling",
    "Financial Tracking",
    "Legal Guidance"
  ];

  const primaryGoals = [
    "Grow my revenue",
    "Get more organized", 
    "Save time on admin",
    "Improve cash flow",
    "Scale my business",
    "Better work-life balance"
  ];

  const handleNeedToggle = (need: string) => {
    setData(prev => ({
      ...prev,
      needs: prev.needs.includes(need) 
        ? prev.needs.filter(n => n !== need)
        : [...prev.needs, need]
    }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = () => {
    saveOnboardingMutation.mutate(data);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.tradeType && data.businessName && data.region;
      case 2:
        return data.businessSize && data.needs.length > 0;
      case 3:
        return data.primaryGoal;
      default:
        return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Welcome to Blue Tradie
          </DialogTitle>
          <DialogDescription>
            Let's set up your profile to give you the best experience
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={(step / 3) * 100} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Step {step} of 3</span>
            <span>{Math.round((step / 3) * 100)}% complete</span>
          </div>
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold">Tell us about your trade</h3>
                </div>
                <p className="text-sm text-gray-600">
                  This helps us customize Blue Tradie for your specific industry
                </p>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={data.businessName}
                onChange={(e) => setData(prev => ({...prev, businessName: e.target.value}))}
                placeholder="e.g., Smith Electrical Services"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tradeType">Trade Type</Label>
              <Select value={data.tradeType} onValueChange={(value) => setData(prev => ({...prev, tradeType: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your trade" />
                </SelectTrigger>
                <SelectContent>
                  {tradeTypes.map(trade => (
                    <SelectItem key={trade} value={trade}>{trade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select value={data.region} onValueChange={(value) => setData(prev => ({...prev, region: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="australia">🇦🇺 Australia</SelectItem>
                  <SelectItem value="new-zealand">🇳🇿 New Zealand</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 2: Business Size & Needs */}
        {step === 2 && (
          <div className="space-y-4">
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-green-600" />
                  <h3 className="font-semibold">Business setup</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Help us understand your business size and what you need help with
                </p>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label>Business Size</Label>
              <Select value={data.businessSize} onValueChange={(value) => setData(prev => ({...prev, businessSize: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="How big is your business?" />
                </SelectTrigger>
                <SelectContent>
                  {businessSizes.map(size => (
                    <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>What do you need help with? (Select all that apply)</Label>
              <div className="grid grid-cols-2 gap-2">
                {availableNeeds.map(need => (
                  <div key={need} className="flex items-center space-x-2">
                    <Checkbox
                      id={need}
                      checked={data.needs.includes(need)}
                      onCheckedChange={() => handleNeedToggle(need)}
                    />
                    <Label htmlFor={need} className="text-sm">{need}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Primary Goal */}
        {step === 3 && (
          <div className="space-y-4">
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckSquare className="w-4 h-4 text-purple-600" />
                  <h3 className="font-semibold">Your main goal</h3>
                </div>
                <p className="text-sm text-gray-600">
                  What's the most important thing Blue Tradie can help you achieve?
                </p>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Label>Primary Goal</Label>
              <div className="space-y-2">
                {primaryGoals.map(goal => (
                  <div
                    key={goal}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      data.primaryGoal === goal 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => setData(prev => ({...prev, primaryGoal: goal}))}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{goal}</span>
                      {data.primaryGoal === goal && (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {step < 3 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!canProceed() || saveOnboardingMutation.isPending}
            >
              {saveOnboardingMutation.isPending ? 'Setting up...' : 'Complete Setup'}
              <CheckSquare className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}