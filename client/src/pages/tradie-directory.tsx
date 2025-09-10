// @ts-nocheck
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, 
  Star, 
  Phone, 
  Mail, 
  Clock, 
  DollarSign,
  Users,
  Award,
  Filter,
  Search,
  Heart,
  MessageSquare
} from "lucide-react";
import AdminRoadmapValue from "@/components/AdminRoadmapValue";

interface TradieProfile {
  id: string;
  name: string;
  businessName: string;
  trade: string;
  specialties: string[];
  location: string;
  rating: number;
  reviewCount: number;
  hourlyRate: string;
  availability: 'Available' | 'Busy' | 'Booked';
  profileImage: string;
  verified: boolean;
  responseTime: string;
  completedJobs: number;
  joinedDate: string;
  distance: string;
}

const mockTradies: TradieProfile[] = [
  {
    id: '1',
    name: 'Mike Thompson',
    businessName: 'Thompson Electrical',
    trade: 'Electrician',
    specialties: ['Residential', 'Solar', 'Commercial'],
    location: 'Sydney, NSW',
    rating: 4.8,
    reviewCount: 127,
    hourlyRate: '$95-120',
    availability: 'Available',
    profileImage: '/api/placeholder/64/64',
    verified: true,
    responseTime: '< 2 hours',
    completedJobs: 340,
    joinedDate: 'Jan 2023',
    distance: '2.3 km'
  },
  {
    id: '2',
    name: 'Sarah Chen',
    businessName: 'Chen Plumbing Solutions',
    trade: 'Plumber',
    specialties: ['Emergency', 'Renovations', 'Gas'],
    location: 'Melbourne, VIC',
    rating: 4.9,
    reviewCount: 89,
    hourlyRate: '$85-110',
    availability: 'Busy',
    profileImage: '/api/placeholder/64/64',
    verified: true,
    responseTime: '< 1 hour',
    completedJobs: 156,
    joinedDate: 'Mar 2023',
    distance: '5.1 km'
  },
  {
    id: '3',
    name: 'Dave Wilson',
    businessName: 'Wilson Carpentry',
    trade: 'Carpenter',
    specialties: ['Custom Furniture', 'Decking', 'Renovations'],
    location: 'Brisbane, QLD',
    rating: 4.7,
    reviewCount: 203,
    hourlyRate: '$75-95',
    availability: 'Available',
    profileImage: '/api/placeholder/64/64',
    verified: true,
    responseTime: '< 4 hours',
    completedJobs: 289,
    joinedDate: 'Aug 2022',
    distance: '8.7 km'
  }
];

export default function TradieDirectory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrade, setSelectedTrade] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('all');
  const [viewMode, setViewMode] = useState<'browse' | 'referrals' | 'favorites'>('browse');

  const filteredTradies = mockTradies.filter(tradie => {
    const matchesSearch = tradie.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tradie.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tradie.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTrade = selectedTrade === 'all' || tradie.trade.toLowerCase() === selectedTrade;
    const matchesLocation = selectedLocation === 'all' || tradie.location.includes(selectedLocation);
    const matchesAvailability = selectedAvailability === 'all' || tradie.availability === selectedAvailability;

    return matchesSearch && matchesTrade && matchesLocation && matchesAvailability;
  });

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Busy': return 'bg-yellow-100 text-yellow-800';
      case 'Booked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tradie Directory</h1>
        <p className="text-gray-600 mt-2">Connect with verified trade professionals in your network</p>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse" className="flex items-center space-x-2">
            <Search className="w-4 h-4" />
            <span>Browse Directory</span>
          </TabsTrigger>
          <TabsTrigger value="referrals" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Send Referrals</span>
          </TabsTrigger>
          <TabsTrigger value="favorites" className="flex items-center space-x-2">
            <Heart className="w-4 h-4" />
            <span>My Network</span>
          </TabsTrigger>
        </TabsList>

        {/* Browse Directory */}
        <TabsContent value="browse" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="w-5 h-5" />
                <span>Find Tradies</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Search by name, business, or specialty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="md:col-span-1"
                />
                <Select value={selectedTrade} onValueChange={setSelectedTrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Trades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Trades</SelectItem>
                    <SelectItem value="electrician">Electrician</SelectItem>
                    <SelectItem value="plumber">Plumber</SelectItem>
                    <SelectItem value="carpenter">Carpenter</SelectItem>
                    <SelectItem value="painter">Painter</SelectItem>
                    <SelectItem value="tiler">Tiler</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="Sydney">Sydney</SelectItem>
                    <SelectItem value="Melbourne">Melbourne</SelectItem>
                    <SelectItem value="Brisbane">Brisbane</SelectItem>
                    <SelectItem value="Perth">Perth</SelectItem>
                    <SelectItem value="Adelaide">Adelaide</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedAvailability} onValueChange={setSelectedAvailability}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Availability</SelectItem>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Busy">Busy</SelectItem>
                    <SelectItem value="Booked">Booked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                <AdminRoadmapValue value={`${filteredTradies.length} tradies found`} />
              </h2>
              <div className="text-sm text-gray-600">Sorted by proximity & rating</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTradies.map((tradie) => (
                <Card key={tradie.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={tradie.profileImage}
                          alt={tradie.name}
                          className="w-12 h-12 rounded-full bg-gray-200"
                        />
                        <div>
                          <h3 className="font-semibold">
                            <AdminRoadmapValue value={tradie.name} />
                          </h3>
                          <p className="text-sm text-gray-600">
                            <AdminRoadmapValue value={tradie.businessName} />
                          </p>
                        </div>
                      </div>
                      {tradie.verified && (
                        <Award className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">
                        <AdminRoadmapValue value={tradie.trade} />
                      </Badge>
                      <Badge className={getAvailabilityColor(tradie.availability)}>
                        <AdminRoadmapValue value={tradie.availability} />
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {tradie.specialties.map((specialty) => (
                        <Badge key={specialty} variant="secondary" className="text-xs">
                          <AdminRoadmapValue value={specialty} />
                        </Badge>
                      ))}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>
                          <AdminRoadmapValue value={`${tradie.location} • ${tradie.distance}`} />
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span>
                          <AdminRoadmapValue value={`${tradie.rating} (${tradie.reviewCount} reviews)`} />
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span>
                          <AdminRoadmapValue value={`${tradie.hourlyRate}/hour`} />
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>
                          <AdminRoadmapValue value={`Responds ${tradie.responseTime}`} />
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button size="sm" className="flex-1">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Message
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Phone className="w-4 h-4 mr-1" />
                        Call
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Send Referrals */}
        <TabsContent value="referrals">
          <Card>
            <CardHeader>
              <CardTitle>Refer a Job</CardTitle>
              <p className="text-sm text-gray-600">
                Too busy? Pass quality work to trusted tradies in your network
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Referral System Coming Soon</h3>
                <p className="text-gray-600">
                  Send overflow work to qualified tradies and earn referral fees
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Network */}
        <TabsContent value="favorites">
          <Card>
            <CardHeader>
              <CardTitle>My Trusted Network</CardTitle>
              <p className="text-sm text-gray-600">
                Tradies you've worked with and trust
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Build Your Network</h3>
                <p className="text-gray-600">
                  Connect with other tradies to build your trusted referral network
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}