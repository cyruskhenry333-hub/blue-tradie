import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppUser } from "@shared/types/user";
import { toAppUser } from "@shared/utils/toAppUser";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  CheckCircle,
  Circle,
  MessageCircle,
  FileText,
  Building,
  CreditCard,
  Shield,
  AlertTriangle,
  Plus,
  ExternalLink,
  Palette
} from "lucide-react";


interface SetupItem {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "skipped";
  urgent: boolean;
  category: "legal" | "financial" | "operational";
  aiHelper?: string;
  externalLink?: string;
}

interface BusinessDetails {
  fullName: string;
  phone: string;
  personalAddress: string;
  businessAddress: string;
  businessName: string;
  abn: string; // This represents ABN for Australia or NZBN for New Zealand
  bankDetails: string;
  gstStatus: "registered" | "not_registered" | "pending";
}



export default function BusinessSetupChecklist() {
  const [showDetailsForm, setShowDetailsForm] = useState(false);
  const { user } = useAuth();

  const [businessDetails, setBusinessDetails] = useState<BusinessDetails>({
    fullName: "",
    phone: "",
    personalAddress: "",
    businessAddress: "",
    businessName: "",
    abn: "",
    bankDetails: "",
    gstStatus: "not_registered"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Regional settings based on user's country
  const isNewZealand = user?.country === "New Zealand";
  const businessNumberTitle = isNewZealand ? "Register NZBN" : "Register ABN";
  const businessNumberDescription = isNewZealand ? "New Zealand Business Number registration" : "Australian Business Number registration";
  const businessNumberUrl = isNewZealand ? "https://www.companiesoffice.govt.nz/" : "https://www.abr.gov.au/";
  const businessNameUrl = isNewZealand ? "https://www.companiesoffice.govt.nz/" : "https://www.asic.gov.au/";
  const gstThreshold = isNewZealand ? "$60k" : "$75k";
  const gstDescription = `Register for GST if required (>${gstThreshold} revenue)`;
  const taxSetupDescription = isNewZealand ? "GST returns, PAYE, record keeping systems" : "BAS, PAYG, record keeping systems";
  const insuranceUrl = isNewZealand ? "https://www.anz.co.nz/business/insurance/" : "https://www.suncorp.com.au/insurance/business";

  const { data: setupStatusData } = useQuery({
    queryKey: ["/api/user/setup-status"],
    retry: false,
  });
  const setupStatus = toAppUser(setupStatusData);

  const updateSetupMutation = useMutation({
    mutationFn: async (data: { itemId: string; status: string; details?: Partial<BusinessDetails> }) => {
      const response = await apiRequest("POST", "/api/user/update-setup", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/setup-status"] });
      toast({
        title: "Setup Updated",
        description: "Your business setup progress has been saved."
      });
    }
  });

  const setupItems: SetupItem[] = [
    {
      id: "business_details",
      title: "Complete Business Details",
      description: "Full name, phone, addresses, business name",
      status: setupStatus?.businessDetails ? "completed" : "pending",
      urgent: true,
      category: "operational"
    },
    {
      id: "abn_registration",
      title: businessNumberTitle,
      description: businessNumberDescription,
      status: setupStatus?.abnRegistration ? "completed" : "pending",
      urgent: true,
      category: "legal",
      aiHelper: "accountant",
      externalLink: businessNumberUrl
    },
    {
      id: "business_name",
      title: "Register Business Name",
      description: "Official business name registration",
      status: setupStatus?.businessName ? "completed" : "pending",
      urgent: false,
      category: "legal",
      aiHelper: "legal",
      externalLink: businessNameUrl
    },
    {
      id: "insurance_setup",
      title: "Public Liability Insurance",
      description: "Essential insurance coverage for trade work",
      status: setupStatus?.insurance ? "completed" : "pending",
      urgent: true,
      category: "legal",
      aiHelper: "legal",
      externalLink: insuranceUrl
    },
    {
      id: "bank_account",
      title: "Business Bank Account",
      description: "Separate business banking for clean finances",
      status: setupStatus?.businessBanking ? "completed" : "pending",
      urgent: true,
      category: "financial",
      aiHelper: "accountant"
    },
    {
      id: "gst_registration",
      title: "GST Registration",
      description: gstDescription,
      status: setupStatus?.gstRegistration ? "completed" : "pending",
      urgent: false,
      category: "financial",
      aiHelper: "accountant"
    },
    {
      id: "tax_setup",
      title: "Tax & Accounting Setup",
      description: taxSetupDescription,
      status: setupStatus?.taxSetup ? "completed" : "pending",
      urgent: false,
      category: "financial",
      aiHelper: "accountant"
    }
  ];

  const urgentItems = setupItems.filter(item => item.urgent && item.status === "pending");
  const completedItems = setupItems.filter(item => item.status === "completed");
  const pendingItems = setupItems.filter(item => item.status === "pending");

  const handleStatusChange = (itemId: string, newStatus: string) => {
    updateSetupMutation.mutate({ itemId, status: newStatus });
  };

  const handleAskAI = (aiHelper: string, itemTitle: string) => {
    // Navigate to AI chat with pre-filled question
    window.location.href = `/chat/${aiHelper}?question=What do I need to know about ${itemTitle}?`;
  };



  return (
    <Card className="business-setup-checklist">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5 text-blue-600" />
          Business Setup Checklist
          <Badge variant={urgentItems.length > 0 ? "destructive" : "secondary"}>
            {completedItems.length}/{setupItems.length} Complete
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Progress Summary */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Setup Progress</span>
            <span className="text-sm text-gray-600">
              {Math.round((completedItems.length / setupItems.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
              style={{ width: `${(completedItems.length / setupItems.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Urgent Items Alert */}
        {urgentItems.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-800">Urgent Items Need Attention</span>
            </div>
            <p className="text-sm text-red-700">
              {urgentItems.length} critical setup tasks are pending. Complete these first to get your business running legally.
            </p>
          </div>
        )}

        {/* Setup Items */}
        <div className="space-y-3">
          {setupItems.map((item) => {
            const isCompleted = item.status === "completed";
            const isUrgent = item.urgent && !isCompleted;

            return (
              <div 
                key={item.id}
                className={`p-3 border rounded-lg ${isCompleted ? 'bg-green-50 border-green-200' : isUrgent ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={(checked) => 
                      handleStatusChange(item.id, checked ? "completed" : "pending")
                    }
                    className="mt-0.5"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-medium ${isCompleted ? 'text-green-800' : 'text-gray-900'}`}>
                        {item.title}
                      </h4>
                      {isUrgent && (
                        <Badge variant="destructive" className="text-xs">
                          Urgent
                        </Badge>
                      )}
                      {item.category === "legal" && <Shield className="h-3 w-3 text-blue-500" />}
                      {item.category === "financial" && <CreditCard className="h-3 w-3 text-green-500" />}
                      {item.category === "operational" && <FileText className="h-3 w-3 text-orange-500" />}
                    </div>
                    <p className={`text-sm ${isCompleted ? 'text-green-700' : 'text-gray-600'}`}>
                      {item.description}
                    </p>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-2">
                      {item.aiHelper && !isCompleted && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAskAI(item.aiHelper!, item.title)}
                          className="text-xs"
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Ask AI
                        </Button>
                      )}
                      {item.externalLink && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(item.externalLink, '_blank')}
                          className="text-xs"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Official Site
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {isCompleted && (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Complete Details Form */}
        <div className="mt-6 pt-4 border-t">
          <Dialog open={showDetailsForm} onOpenChange={setShowDetailsForm}>
            <DialogTrigger asChild>
              <Button className="w-full" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Complete Business Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Complete Your Business Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={businessDetails.fullName}
                      onChange={(e) => setBusinessDetails(prev => ({ ...prev, fullName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={businessDetails.phone}
                      onChange={(e) => setBusinessDetails(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="personalAddress">Personal Address *</Label>
                  <Input
                    id="personalAddress"
                    value={businessDetails.personalAddress}
                    onChange={(e) => setBusinessDetails(prev => ({ ...prev, personalAddress: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="businessAddress">Business Address</Label>
                  <Input
                    id="businessAddress"
                    value={businessDetails.businessAddress}
                    onChange={(e) => setBusinessDetails(prev => ({ ...prev, businessAddress: e.target.value }))}
                    placeholder="Same as personal if home-based"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      value={businessDetails.businessName}
                      onChange={(e) => setBusinessDetails(prev => ({ ...prev, businessName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="abn">{isNewZealand ? "NZBN" : "ABN"}</Label>
                    <Input
                      id="abn"
                      value={businessDetails.abn}
                      onChange={(e) => setBusinessDetails(prev => ({ ...prev, abn: e.target.value }))}
                      placeholder={isNewZealand ? "13 digit number" : "11 digit number"}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="gstStatus">GST Status</Label>
                  <Select 
                    value={businessDetails.gstStatus} 
                    onValueChange={(value) => setBusinessDetails(prev => ({ ...prev, gstStatus: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_registered">Not Registered</SelectItem>
                      <SelectItem value="pending">Registration Pending</SelectItem>
                      <SelectItem value="registered">Registered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      updateSetupMutation.mutate({ 
                        itemId: "business_details", 
                        status: "completed",
                        details: businessDetails 
                      });
                      setShowDetailsForm(false);
                    }}
                    disabled={!businessDetails.fullName || !businessDetails.phone}
                  >
                    Save Details
                  </Button>
                  <Button variant="outline" onClick={() => setShowDetailsForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>


      </CardContent>
    </Card>
  );
}