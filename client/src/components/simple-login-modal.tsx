import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { Mail, User, AlertTriangle } from "lucide-react";

interface SimpleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SimpleLoginModal({ isOpen, onClose }: SimpleLoginModalProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("Beta");
  const [lastName, setLastName] = useState("Tester");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleLogin = async () => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/simple-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim() || "Beta",
          lastName: lastName.trim() || "Tester"
        }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      toast({
        title: "Welcome to Blue Tradie!",
        description: "You're now logged in as a beta tester"
      });

      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      onClose();
      
      // Refresh page to load authenticated state
      window.location.reload();
      
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Unable to log in. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => !isLoading && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-tradie-blue" />
            Beta Testing Login
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-tradie-blue">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-tradie-blue mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Beta Testing Access</h3>
                <p className="text-sm text-blue-800">
                  This is a simplified login for beta testing. Your data is secure and will be properly 
                  managed during the beta period.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleLogin}
              disabled={isLoading}
              className="btn-tradie-primary flex-1"
            >
              {isLoading ? "Logging In..." : "Enter Beta Testing"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}