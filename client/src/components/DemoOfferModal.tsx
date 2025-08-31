import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Clock, Zap, Gift } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DemoOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  demoCode: string;
  userId: string;
}

export function DemoOfferModal({ isOpen, onClose, demoCode, userId }: DemoOfferModalProps) {
  const [enteredCode, setEnteredCode] = useState("");
  const { toast } = useToast();

  const activateMutation = useMutation({
    mutationFn: async (code: string) => {
      return await apiRequest('/api/demo/activate', 'POST', { userId, demoCode: code });
    },
    onSuccess: (data: any) => {
      if (data.success) {
        toast({
          title: "Demo Activated!",
          description: "Your 14-day premium trial is now active. Welcome to Blue Tradie!",
        });
        window.location.reload(); // Refresh to show demo features
      } else {
        toast({
          title: "Activation Failed",
          description: data.message || "Invalid or expired demo code",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to activate demo. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleActivate = () => {
    if (!enteredCode.trim()) {
      toast({
        title: "Demo Code Required",
        description: "Please enter your demo access code",
        variant: "destructive",
      });
      return;
    }
    activateMutation.mutate(enteredCode.trim());
  };

  const handleUseProvidedCode = () => {
    activateMutation.mutate(demoCode);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-6 h-6 text-blue-600" />
            Unlock Your Free Demo!
          </DialogTitle>
          <DialogDescription>
            Get 14 days of premium Blue Tradie access with 1,000 AI tokens
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Demo Benefits */}
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
              <div className="text-sm">
                <div className="font-medium">14-Day Full Access</div>
                <div className="text-gray-600">Complete platform trial</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Zap className="w-5 h-5 text-green-600" />
              <div className="text-sm">
                <div className="font-medium">1,000 AI Tokens</div>
                <div className="text-gray-600">~20-30 advisor conversations</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Gift className="w-5 h-5 text-purple-600" />
              <div className="text-sm">
                <div className="font-medium">UGC Incentives</div>
                <div className="text-gray-600">Earn bonus tokens + benefits</div>
              </div>
            </div>
          </div>

          {/* Quick Activation */}
          {demoCode && (
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
              <h4 className="font-medium mb-2">Instant Activation</h4>
              <p className="text-sm mb-3 opacity-90">
                We've generated your demo access code. Click below to start immediately!
              </p>
              <Button 
                onClick={handleUseProvidedCode}
                disabled={activateMutation.isPending}
                className="w-full bg-white text-blue-600 hover:bg-gray-100"
              >
                {activateMutation.isPending ? "Activating..." : "Start Demo Now"}
              </Button>
            </div>
          )}

          {/* Manual Code Entry */}
          <div className="space-y-3">
            <Label htmlFor="demoCode">Or enter your demo code:</Label>
            <Input
              id="demoCode"
              placeholder="DEMO-ABC123XYZ"
              value={enteredCode}
              onChange={(e) => setEnteredCode(e.target.value)}
              className="text-center font-mono"
            />
            <Button 
              onClick={handleActivate}
              disabled={activateMutation.isPending}
              className="w-full"
              variant="outline"
            >
              {activateMutation.isPending ? "Activating..." : "Activate Demo"}
            </Button>
          </div>

          {/* UGC Incentives Info */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-1">Bonus Token Opportunities</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Social media post: +100 tokens</li>
              <li>• Written testimonial: +200 tokens</li>
              <li>• Case study: +500 tokens + Founding Member status</li>
            </ul>
          </div>

          <div className="text-xs text-gray-500 text-center">
            Demo codes expire in 24 hours. Premium features included.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}