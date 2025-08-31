import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  Upload, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  FileText, 
  Users, 
  DollarSign,
  ArrowRight,
  Smartphone,
  Building2,
  Zap
} from "lucide-react";

interface MigrationStep {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in-progress" | "pending";
  type: "data" | "setup" | "verification";
}

interface MigrationSource {
  name: string;
  logo: string;
  description: string;
  dataTypes: string[];
  difficulty: "Easy" | "Medium" | "Advanced";
  estimatedTime: string;
  supported: boolean;
}

export default function MigrationHub() {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [migrationSteps, setMigrationSteps] = useState<MigrationStep[]>([
    { id: "profile", title: "Complete Profile Setup", description: "Business details and preferences", status: "completed", type: "setup" },
    { id: "data", title: "Import Existing Data", description: "Jobs, customers, and invoices", status: "in-progress", type: "data" },
    { id: "agents", title: "Meet Your AI Team", description: "Chat with your business advisors", status: "pending", type: "setup" },
    { id: "verify", title: "Verify Everything Works", description: "Test key features", status: "pending", type: "verification" },
  ]);
  
  const { toast } = useToast();

  const migrationSources: MigrationSource[] = [
    {
      name: "ServiceM8",
      logo: "📱",
      description: "Import jobs, clients, invoices, and job history from ServiceM8",
      dataTypes: ["Jobs & Scheduling", "Customer Database", "Invoices & Payments", "Photos & Notes"],
      difficulty: "Easy",
      estimatedTime: "10-15 minutes",
      supported: true
    },
    {
      name: "Tradify", 
      logo: "🔧",
      description: "Transfer your project data, contacts, and quotes from Tradify",
      dataTypes: ["Project Management", "Contact Lists", "Quotes & Estimates", "Receipt Tracking"],
      difficulty: "Easy", 
      estimatedTime: "10-15 minutes",
      supported: true
    },
    {
      name: "Simpro",
      logo: "🏗️", 
      description: "Enterprise data migration (contact our team for assistance)",
      dataTypes: ["Complex Workflows", "Asset Management", "Advanced Reporting", "Multi-location Data"],
      difficulty: "Advanced",
      estimatedTime: "1-2 hours with support",
      supported: false
    },
    {
      name: "Manual Entry",
      logo: "✍️",
      description: "Start fresh or manually add your key data",
      dataTypes: ["Customer Contacts", "Active Jobs", "Recent Invoices", "Basic Setup"],
      difficulty: "Easy",
      estimatedTime: "30-60 minutes", 
      supported: true
    },
    {
      name: "Excel/CSV",
      logo: "📊",
      description: "Upload customer lists and job data from spreadsheets", 
      dataTypes: ["Customer Lists", "Job History", "Basic Financial Data", "Contact Information"],
      difficulty: "Medium",
      estimatedTime: "15-25 minutes",
      supported: true
    }
  ];

  const getStepIcon = (step: MigrationStep) => {
    if (step.status === "completed") return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    if (step.status === "in-progress") return <Clock className="w-5 h-5 text-blue-600 animate-pulse" />;
    return <Clock className="w-5 h-5 text-gray-400" />;
  };

  const getProgressPercentage = () => {
    const completed = migrationSteps.filter(s => s.status === "completed").length;
    return (completed / migrationSteps.length) * 100;
  };

  const handleStartMigration = (sourceName: string) => {
    setSelectedSource(sourceName);
    toast({
      title: "Migration Started",
      description: `Beginning data import from ${sourceName}...`,
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-tradie-blue">Migration Hub</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Welcome to Blue Tradie! Let's get your existing business data moved over quickly and easily.
        </p>
      </div>

      {/* Progress Overview */}
      <Card className="border-l-4 border-l-tradie-blue">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-tradie-blue" />
            Migration Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm font-bold text-tradie-blue">{Math.round(getProgressPercentage())}% Complete</span>
          </div>
          <Progress value={getProgressPercentage()} className="h-3" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {migrationSteps.map((step) => (
              <div key={step.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {getStepIcon(step)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{step.title}</p>
                  <p className="text-xs text-gray-500 truncate">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Migration Sources */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center">Choose Your Migration Source</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {migrationSources.map((source) => (
            <Card key={source.name} className={`relative hover:shadow-lg transition-all duration-200 ${
              !source.supported ? 'opacity-75' : 'cursor-pointer hover:border-tradie-blue'
            }`}>
              {!source.supported && (
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary">Contact Support</Badge>
                </div>
              )}
              
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{source.logo}</div>
                    <div>
                      <h3 className="font-bold text-lg">{source.name}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant={source.difficulty === "Easy" ? "default" : 
                                      source.difficulty === "Medium" ? "secondary" : "destructive"}>
                          {source.difficulty}
                        </Badge>
                        <span className="text-sm text-gray-500">{source.estimatedTime}</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm leading-relaxed">{source.description}</p>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Data we can import:</h4>
                    <div className="flex flex-wrap gap-1">
                      {source.dataTypes.map((type) => (
                        <Badge key={type} variant="outline" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {source.supported ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full" onClick={() => setSelectedSource(source.name)}>
                          <Download className="w-4 h-4 mr-2" />
                          Start Migration
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Import from {source.name}</DialogTitle>
                        </DialogHeader>
                        <MigrationDialog source={source} onStart={() => handleStartMigration(source.name)} />
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contact Support Team
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Help */}
      <Card className="bg-gradient-to-r from-tradie-light to-white">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <MessageSquare className="w-12 h-12 text-tradie-blue mx-auto" />
            <h3 className="text-xl font-bold text-tradie-blue">Need Help with Migration?</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our team is here to help! Chat with our migration specialists or AI assistants for personalized guidance.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Chat with Support
              </Button>
              <Button className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Try AI Assistant
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Migration Dialog Component
function MigrationDialog({ source, onStart }: { source: MigrationSource; onStart: () => void }) {
  const [step, setStep] = useState(1);
  const { toast } = useToast();

  const handleFileUpload = () => {
    toast({
      title: "Upload Started",
      description: "Processing your data...",
    });
    setTimeout(() => {
      setStep(2);
      toast({
        title: "Import Successful",
        description: "Your data has been imported successfully!",
      });
    }, 2000);
  };

  if (step === 1) {
    return (
      <div className="space-y-4">
        <p className="text-gray-600">
          Ready to import your data from {source.name}? This will take about {source.estimatedTime}.
        </p>
        
        <div className="space-y-3">
          <h4 className="font-medium">What we'll import:</h4>
          <ul className="space-y-1">
            {source.dataTypes.map((type) => (
              <li key={type} className="flex items-center space-x-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>{type}</span>
              </li>
            ))}
          </ul>
        </div>

        {source.name === "ServiceM8" || source.name === "Tradify" ? (
          <div className="space-y-3">
            <Input placeholder="Account Email" type="email" />
            <Input placeholder="API Key or Export File" />
            <p className="text-xs text-gray-500">
              Find your export file in {source.name} settings → Export Data
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <Input type="file" accept=".csv,.xlsx,.xls" />
            <p className="text-xs text-gray-500">
              Upload your customer list or job data as CSV or Excel file
            </p>
          </div>
        )}

        <Button className="w-full" onClick={handleFileUpload}>
          <Upload className="w-4 h-4 mr-2" />
          Start Import
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
      <h3 className="text-lg font-bold text-green-600">Import Complete!</h3>
      <p className="text-gray-600">
        Successfully imported your data from {source.name}. You're ready to start using Blue Tradie!
      </p>
      <Button className="w-full" onClick={onStart}>
        <ArrowRight className="w-4 h-4 mr-2" />
        Continue to Dashboard
      </Button>
    </div>
  );
}