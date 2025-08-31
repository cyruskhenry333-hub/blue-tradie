import { Badge } from "@/components/ui/badge";

interface TierBadgeProps {
  tier: 'vip' | 'demo' | 'founding';
  tag: string;
  className?: string;
}

function getTierBadgeStyle(tier: string): string {
  switch (tier) {
    case 'vip':
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case 'founding':
      return "bg-purple-100 text-purple-800 border-purple-300";
    case 'demo':
      return "bg-blue-100 text-blue-800 border-blue-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
}

export function TierBadge({ tier, tag, className = "" }: TierBadgeProps) {
  const badgeStyle = getTierBadgeStyle(tier);
  
  return (
    <Badge className={`${badgeStyle} ${className} text-xs font-medium`}>
      {tag}
    </Badge>
  );
}