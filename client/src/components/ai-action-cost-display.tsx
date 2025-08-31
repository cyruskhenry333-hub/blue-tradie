import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Coins, Info, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AIActionCostDisplayProps {
  action: string;
  tokens: number;
  description?: string;
  showAlert?: boolean;
  className?: string;
}

export default function AIActionCostDisplay({ 
  action, 
  tokens, 
  description,
  showAlert = false,
  className = ""
}: AIActionCostDisplayProps) {
  const { user } = useAuth();
  const currency = user?.country === "New Zealand" ? "NZD" : "AUD";
  const currencySymbol = user?.country === "New Zealand" ? "$" : "$";
  const tokenCostMultiplier = user?.country === "New Zealand" ? 0.00000218 : 0.00000182; // Accurate GPT-4o-mini pricing with 20% markup
  const cost = (tokens * tokenCostMultiplier).toFixed(6);
  
  if (showAlert) {
    return (
      <Alert className={`border-blue-200 bg-blue-50 ${className}`}>
        <Coins className="h-4 w-4 text-blue-600" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <span className="font-medium">{action}</span>
            {description && <span className="text-sm text-gray-600 ml-2">{description}</span>}
          </div>
          <Badge variant="secondary" className="ml-2">
            {tokens} tokens · {currencySymbol}{cost} {currency}
          </Badge>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`flex items-center justify-between p-2 bg-gray-50 rounded border ${className}`}>
      <div className="flex items-center space-x-2">
        <Zap className="h-4 w-4 text-blue-600" />
        <span className="font-medium text-sm">{action}</span>
        {description && <span className="text-xs text-gray-500">({description})</span>}
      </div>
      <Badge variant="outline" className="text-xs">
        <Coins className="h-3 w-3 mr-1" />
        {tokens} tokens · {currencySymbol}{cost} {currency}
      </Badge>
    </div>
  );
}

// Quick inline cost indicator for buttons and actions
export function InlineCostIndicator({ 
  tokens, 
  className = "" 
}: { 
  tokens: number; 
  className?: string; 
}) {
  const { user } = useAuth();
  const currency = user?.country === "New Zealand" ? "NZD" : "AUD";
  const currencySymbol = user?.country === "New Zealand" ? "$" : "$";
  const tokenCostMultiplier = user?.country === "New Zealand" ? 0.00000218 : 0.00000182; // Accurate GPT-4o-mini pricing with 20% markup
  const cost = (tokens * tokenCostMultiplier).toFixed(6);
  
  return (
    <span className={`text-xs text-gray-500 ${className}`}>
      ({tokens} tokens · {currencySymbol}{cost} {currency})
    </span>
  );
}

// Cost badge for AI features
export function TokenCostBadge({ 
  tokens, 
  label = "",
  variant = "secondary" 
}: { 
  tokens: number;
  label?: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
}) {
  const { user } = useAuth();
  const currency = user?.country === "New Zealand" ? "NZD" : "AUD";
  const currencySymbol = user?.country === "New Zealand" ? "$" : "$";
  const tokenCostMultiplier = user?.country === "New Zealand" ? 0.00000218 : 0.00000182; // Accurate GPT-4o-mini pricing with 20% markup
  const cost = (tokens * tokenCostMultiplier).toFixed(6);
  
  return (
    <Badge variant={variant} className="flex items-center space-x-1">
      <Coins className="h-3 w-3" />
      <span>{label}{tokens} tokens</span>
      <span className="text-xs opacity-70">·</span>
      <span className="text-xs">{currencySymbol}{cost} {currency}</span>
    </Badge>
  );
}