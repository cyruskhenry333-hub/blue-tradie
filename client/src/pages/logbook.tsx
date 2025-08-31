import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Clock, 
  MapPin, 
  Calendar, 
  FileText, 
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  User,
  Phone
} from "lucide-react";

interface LogEntry {
  id: string;
  date: string;
  time: string;
  customerName: string;
  phone?: string;
  location: string;
  jobType: string;
  description: string;
  duration: string;
  materials?: string;
  notes?: string;
  status: 'completed' | 'in-progress' | 'scheduled';
  invoiced: boolean;
}

export default function LogbookPage() {
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: logEntries = [], isLoading } = useQuery({
    queryKey: ["/api/logbook"],
    retry: false,
  });

  // Mock data for demonstration
  const mockLogEntries: LogEntry[] = [
    {
      id: "1",
      date: "2025-01-23",
      time: "09:00",
      customerName: "John Smith",
      phone: "0412 345 678",
      location: "123 Main St, Sydney NSW",
      jobType: "Kitchen Renovation",
      description: "Install new benchtops and splashback",
      duration: "4 hours",
      materials: "Granite benchtop, subway tiles, adhesive",
      notes: "Customer very happy with the result. Recommend for future work.",
      status: "completed",
      invoiced: true
    },
    {
      id: "2", 
      date: "2025-01-23",
      time: "14:00",
      customerName: "Sarah Wilson",
      phone: "0456 789 012", 
      location: "456 Oak Ave, Melbourne VIC",
      jobType: "Bathroom Repair",
      description: "Fix leaking tap and replace toilet seat",
      duration: "2 hours",
      materials: "Tap washers, toilet seat",
      notes: "Emergency call - leak was worse than expected",
      status: "completed",
      invoiced: false
    },
    {
      id: "3",
      date: "2025-01-24",
      time: "10:30",
      customerName: "Mike Johnson", 
      phone: "0423 456 789",
      location: "789 Pine Rd, Brisbane QLD",
      jobType: "Deck Construction",
      description: "Build outdoor entertainment deck",
      duration: "6 hours",
      materials: "Treated pine, screws, brackets",
      notes: "Day 1 of 3 - foundation complete",
      status: "in-progress",
      invoiced: false
    }
  ];

  const createEntryMutation = useMutation({
    mutationFn: async (newEntry: Partial<LogEntry>) => {
      return await apiRequest("POST", "/api/logbook", newEntry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logbook"] });
      setShowNewEntry(false);
      toast({
        title: "Entry Added",
        description: "Your logbook entry has been recorded successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add logbook entry. Please try again.",
        variant: "destructive"
      });
    }
  });

  const filteredEntries = mockLogEntries.filter(entry => {
    const matchesSearch = entry.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.jobType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || entry.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "in-progress":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case "scheduled":
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "in-progress":
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Work Logbook</h1>
            <p className="text-gray-600">Track your daily work activities and job progress</p>
          </div>
          
          <Dialog open={showNewEntry} onOpenChange={setShowNewEntry}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Logbook Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Date</label>
                    <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Time</label>
                    <Input type="time" defaultValue={new Date().toTimeString().slice(0, 5)} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Customer Name</label>
                  <Input placeholder="John Smith" />
                </div>
                <div>
                  <label className="text-sm font-medium">Job Type</label>
                  <Input placeholder="Kitchen renovation, plumbing repair, etc." />
                </div>
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <Input placeholder="123 Main St, Sydney NSW" />
                </div>
                <div>
                  <label className="text-sm font-medium">Duration</label>
                  <Input placeholder="4 hours" />
                </div>
                <div>
                  <label className="text-sm font-medium">Work Description</label>
                  <Textarea placeholder="Describe the work completed..." />
                </div>
                <div>
                  <label className="text-sm font-medium">Materials Used</label>
                  <Input placeholder="List materials and supplies used" />
                </div>
                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea placeholder="Additional notes or observations..." />
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Add Entry
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by customer, job type, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Completed Today</p>
                  <p className="text-2xl font-bold">
                    {mockLogEntries.filter(e => e.status === "completed" && e.date === new Date().toISOString().split('T')[0]).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Hours</p>
                  <p className="text-2xl font-bold">
                    {mockLogEntries.reduce((total, entry) => {
                      const hours = parseInt(entry.duration.split(' ')[0]) || 0;
                      return total + hours;
                    }, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">To Invoice</p>
                  <p className="text-2xl font-bold">
                    {mockLogEntries.filter(e => !e.invoiced && e.status === "completed").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Unique Clients</p>
                  <p className="text-2xl font-bold">
                    {new Set(mockLogEntries.map(e => e.customerName)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Logbook Entries */}
      <div className="space-y-4">
        {filteredEntries.map((entry) => (
          <Card key={entry.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    {getStatusIcon(entry.status)}
                    <h3 className="text-lg font-semibold">{entry.customerName}</h3>
                    {getStatusBadge(entry.status)}
                    {entry.invoiced && (
                      <Badge className="bg-purple-100 text-purple-800">Invoiced</Badge>
                    )}
                  </div>
                  
                  <p className="text-gray-700 mb-3 font-medium">{entry.jobType}</p>
                  <p className="text-gray-600 mb-3">{entry.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(entry.date).toLocaleDateString()} at {entry.time}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{entry.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>{entry.duration}</span>
                    </div>
                    {entry.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <span>{entry.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  {entry.materials && (
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Materials:</strong> {entry.materials}
                      </p>
                    </div>
                  )}
                  
                  {entry.notes && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Notes:</strong> {entry.notes}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="text-right ml-4">
                  <div className="flex flex-col space-y-2">
                    {!entry.invoiced && entry.status === "completed" && (
                      <Button variant="outline" size="sm" className="bg-green-50 hover:bg-green-100">
                        <FileText className="w-4 h-4 mr-1" />
                        Create Invoice
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      Edit Entry
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEntries.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No entries found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== "all" 
                ? "No entries match your search criteria. Try adjusting your filters."
                : "Start logging your work activities to track your business progress."
              }
            </p>
            <Button onClick={() => setShowNewEntry(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Entry
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}