import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, Users } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

interface WaitlistFormProps {
  onSuccess?: () => void;
  betaCount?: number;
  waitlistCount?: number;
}

export function WaitlistForm({ onSuccess, betaCount = 100, waitlistCount = 0 }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("Australia");
  const [trade, setTrade] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const joinWaitlistMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      firstName?: string;
      lastName?: string;
      country: string;
      trade?: string;
    }) => {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to join waitlist");
      }
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Welcome to the Waitlist!",
        description: "You'll get 40% off when Blue Tradie officially launches.",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    joinWaitlistMutation.mutate({
      email: email.trim(),
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      country,
      trade: trade.trim() || undefined,
    });
  };

  if (isSubmitted) {
    return (
      <Card className="shadow-lg border-green-200">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-600">You're On The List!</CardTitle>
          <CardDescription className="text-lg">
            Welcome to the Blue Tradie waitlist. You'll be among the first to know when we launch!
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">What's Next?</h3>
            <p className="text-green-700 text-sm">
              • We'll email you when Blue Tradie launches<br/>
              • You'll get 40% off your first year<br/>
              • Early access to new features
            </p>
          </div>
          <p className="text-gray-500 text-sm">
            Position #{waitlistCount + 1} on the waitlist
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center">
        <div className="flex justify-center space-x-4 mb-4">
          <div className="flex items-center space-x-2 text-blue-600">
            <Users className="h-5 w-5" />
            <span className="text-sm font-medium">{betaCount}/100 Beta Spots Taken</span>
          </div>
          <div className="flex items-center space-x-2 text-orange-600">
            <Clock className="h-5 w-5" />
            <span className="text-sm font-medium">{waitlistCount} on Waitlist</span>
          </div>
        </div>
        <CardTitle className="text-2xl text-tradie-blue">
          🎉 Join the Waitlist
        </CardTitle>
        <CardDescription className="text-lg">
          The first 100 tradies are in! Get 40% off your first year when we launch.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Your first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Your last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Australia">🇦🇺 Australia</SelectItem>
                  <SelectItem value="New Zealand">🇳🇿 New Zealand</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="trade">Trade (Optional)</Label>
              <Input
                id="trade"
                type="text"
                placeholder="e.g. Electrician, Plumber"
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full btn-tradie-primary"
            disabled={joinWaitlistMutation.isPending}
          >
            {joinWaitlistMutation.isPending ? "Joining..." : "Join Waitlist & Get 40% Off"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By joining the waitlist, you'll be notified when Blue Tradie launches and receive exclusive early access offers.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}