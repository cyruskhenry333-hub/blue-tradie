import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Eye, CreditCard, FileText, Camera, Upload, Star, Search, MapPin } from "lucide-react";
import AdminRoadmapValue from "@/components/AdminRoadmapValue";

interface JobData {
  id: string;
  title: string;
  description: string;
  status: string;
  amount: number;
  photos: string[];
  signedOff: boolean;
  depositPaid: boolean;
}

export default function ClientPortal() {
  const { jobId, token } = useParams();
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobData = async () => {
      try {
        const response = await fetch(`/api/client/portal/${jobId}?token=${token}`);
        const data = await response.json();
        
        if (response.ok) {
          setJob(data.job);
        } else {
          setError(data.message || "Failed to load job information");
        }
      } catch (err) {
        setError("Unable to connect to server");
      } finally {
        setLoading(false);
      }
    };

    if (jobId && token) {
      fetchJobData();
    } else {
      setError("Invalid portal link");
      setLoading(false);
    }
  }, [jobId, token]);

  const handleSignOff = async () => {
    if (!job) return;
    
    try {
      const response = await fetch(`/api/client/portal/${jobId}/signoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setJob({ ...job, signedOff: true });
      } else {
        alert(data.message || "Failed to sign off");
      }
    } catch (err) {
      alert("Unable to process sign-off");
    }
  };

  const handlePayDeposit = async () => {
    if (!job) return;
    
    try {
      const response = await fetch(`/api/client/portal/${jobId}/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(data.message);
      } else {
        alert(data.message || "Payment processing failed");
      }
    } catch (err) {
      alert("Unable to process payment");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold">Blue Tradie Client Portal</h1>
          <p className="text-blue-100">Job Information & Actions</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {job.title}
              </CardTitle>
              <Badge variant={job.status === "completed" ? "default" : "secondary"}>
                {job.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{job.description}</p>
            <div className="text-lg font-semibold">
              Total Amount: ${job.amount.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        {job.photos && job.photos.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Job Photos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {job.photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={photo} 
                      alt={`Job photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => window.open(photo, '_blank')}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Actions Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {job.signedOff ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                )}
                <div>
                  <h4 className="font-medium">Sign Off Completed Work</h4>
                  <p className="text-sm text-gray-600">Confirm that the job has been completed to your satisfaction</p>
                </div>
              </div>
              {!job.signedOff && (
                <Button onClick={handleSignOff}>
                  Sign Off
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {job.depositPaid ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                )}
                <div>
                  <h4 className="font-medium">Pay Deposit</h4>
                  <p className="text-sm text-gray-600">Secure payment processing</p>
                </div>
              </div>
              {!job.depositPaid && (
                <Button onClick={handlePayDeposit} className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Pay Deposit
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Features - Tradie Directory Access */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>Need More Services?</span>
            </CardTitle>
            <p className="text-sm text-gray-600">Browse our verified tradie directory for additional services</p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="browse" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="browse">Browse Directory</TabsTrigger>
                <TabsTrigger value="request">Request Quote</TabsTrigger>
              </TabsList>
              
              <TabsContent value="browse" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <AdminRoadmapValue value="⚡" />
                      </div>
                      <div>
                        <h3 className="font-semibold"><AdminRoadmapValue value="Mike's Electrical" /></h3>
                        <p className="text-sm text-gray-600"><AdminRoadmapValue value="Licensed Electrician" /></p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm"><AdminRoadmapValue value="4.8 (127 reviews)" /></span>
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm"><AdminRoadmapValue value="2.3 km away" /></span>
                    </div>
                    <Button size="sm" className="w-full">Get Quote</Button>
                  </Card>

                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <AdminRoadmapValue value="🔧" />
                      </div>
                      <div>
                        <h3 className="font-semibold"><AdminRoadmapValue value="Chen Plumbing" /></h3>
                        <p className="text-sm text-gray-600"><AdminRoadmapValue value="Master Plumber" /></p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm"><AdminRoadmapValue value="4.9 (89 reviews)" /></span>
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm"><AdminRoadmapValue value="5.1 km away" /></span>
                    </div>
                    <Button size="sm" className="w-full">Get Quote</Button>
                  </Card>

                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <AdminRoadmapValue value="🔨" />
                      </div>
                      <div>
                        <h3 className="font-semibold"><AdminRoadmapValue value="Wilson Carpentry" /></h3>
                        <p className="text-sm text-gray-600"><AdminRoadmapValue value="Custom Carpenter" /></p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm"><AdminRoadmapValue value="4.7 (203 reviews)" /></span>
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm"><AdminRoadmapValue value="8.7 km away" /></span>
                    </div>
                    <Button size="sm" className="w-full">Get Quote</Button>
                  </Card>
                </div>
                
                <div className="text-center">
                  <Button variant="outline" className="w-full">
                    <Search className="w-4 h-4 mr-2" />
                    View Full Directory
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="request" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Service Type</label>
                    <Input placeholder="e.g. Plumbing, Electrical, Carpentry..." />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Job Description</label>
                    <Textarea placeholder="Describe what you need done..." rows={3} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Urgency</label>
                      <Input placeholder="ASAP / This Week / Flexible" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Budget Range</label>
                      <Input placeholder="$500-1000" />
                    </div>
                  </div>
                  <Button className="w-full">
                    Send to Matching Tradies
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Photo Upload Enhancement */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Camera className="w-4 h-4 mr-2" />
              Upload Progress Photos
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Progress Photos</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Drag & drop photos here or click to browse
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  Choose Files
                </Button>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Add Note (Optional)</label>
                <Textarea placeholder="Any comments about this progress update..." rows={2} />
              </div>
              <Button className="w-full">Upload Photos</Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="text-center text-sm text-gray-500">
          <p>Powered by Blue Tradie • Secure Client Portal</p>
        </div>
      </div>
    </div>
  );
}