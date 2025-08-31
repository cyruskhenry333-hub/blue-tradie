import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, Users, Gift, DollarSign, Star, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReferralData {
  referralCode: string;
  totalReferrals: number;
  successfulReferrals: number;
  totalCredits: number;
  pendingCredits: number;
  foundingMemberStatus: boolean;
  discounts: {
    vipWaitlist: boolean;
    testimonialProvided: boolean;
    referralCredits: number;
  };
}

export default function ReferralDashboard() {
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState(false);

  const { data: referralData, isLoading } = useQuery<ReferralData>({
    queryKey: ['/api/referrals/dashboard'],
    staleTime: 30000, // 30 seconds
  });

  const copyReferralCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the code manually",
        variant: "destructive",
      });
    }
  };

  const shareReferralLink = (code: string) => {
    const baseUrl = window.location.origin;
    const referralLink = `${baseUrl}/waitlist?ref=${code}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Join Blue Tradie',
        text: 'Check out Blue Tradie - AI-powered business management for tradies!',
        url: referralLink,
      });
    } else {
      copyReferralCode(referralLink);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!referralData) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Unable to load referral data. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const referralLink = `${window.location.origin}/waitlist?ref=${referralData.referralCode}`;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-tradie-blue">Referral Dashboard</h1>
          <p className="text-gray-600">
            Share Blue Tradie with your mates and earn rewards together
          </p>
          {referralData.foundingMemberStatus && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
              🏆 Founding Member
            </Badge>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{referralData.totalReferrals}</div>
              <p className="text-xs text-muted-foreground">
                {referralData.successfulReferrals} joined the waitlist
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credits Earned</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${referralData.totalCredits}</div>
              <p className="text-xs text-muted-foreground">
                ${referralData.pendingCredits} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Discounts</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {referralData.discounts.vipWaitlist && (
                  <Badge variant="secondary" className="text-xs">30% VIP Discount</Badge>
                )}
                {referralData.discounts.testimonialProvided && (
                  <Badge variant="secondary" className="text-xs">10% Testimonial</Badge>
                )}
                {referralData.discounts.referralCredits > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    ${referralData.discounts.referralCredits} Credits
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Code Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Referral Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <code className="flex-1 p-3 bg-gray-100 rounded text-center font-mono text-lg font-bold">
                {referralData.referralCode}
              </code>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyReferralCode(referralData.referralCode)}
                className="shrink-0"
              >
                <Copy className="h-4 w-4" />
                {copiedCode ? 'Copied!' : 'Copy'}
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Share your link:</p>
              <div className="flex items-center space-x-2">
                <input 
                  type="text" 
                  value={referralLink}
                  readOnly 
                  className="flex-1 p-2 border rounded text-sm bg-gray-50"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => shareReferralLink(referralData.referralCode)}
                >
                  Share
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rewards Program */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Rewards Program
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Referral Credits</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">$5 credit per successful referral</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Stacks with other discounts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Applied to first month's subscription</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Founding Member Badge</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">3+ successful referrals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Permanent dashboard recognition</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Priority support access</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">How it works:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>Share your referral code or link with other tradies</li>
                <li>When they join the waitlist using your code, you both get benefits</li>
                <li>Credits are applied when Blue Tradie officially launches</li>
                <li>All discounts and credits stack together for maximum savings</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Progress towards Founding Member */}
        {!referralData.foundingMemberStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Progress to Founding Member
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Successful Referrals</span>
                  <span>{referralData.successfulReferrals} / 3</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-tradie-blue h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((referralData.successfulReferrals / 3) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600">
                  {3 - referralData.successfulReferrals > 0 
                    ? `${3 - referralData.successfulReferrals} more successful referrals to unlock Founding Member status!`
                    : 'Congratulations! You qualify for Founding Member status.'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}