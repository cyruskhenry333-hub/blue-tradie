import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  Users, 
  ArrowLeft,
  Search,
  Mail,
  Building,
  Calendar,
  CheckCircle,
  XCircle,
  User,
  Trash2
} from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  businessName: string | null;
  trade: string | null;
  country: string | null;
  subscriptionTier: string | null;
  subscriptionStatus: string | null;
  isOnboarded: boolean;
  isBetaUser: boolean | null;
  betaTier: string | null;
  isDemoUser: boolean | null;
  demoStatus: string | null;
  createdAt: string;
  firstLoginAt: string | null;
  welcomeSentAt: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

interface AdminUsersResponse {
  users: AdminUser[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 50;

  const { data, isLoading } = useQuery({
    queryKey: ['/api/admin/users', { page, search, limit }],
    queryFn: async (): Promise<AdminUsersResponse> => {
      const offset = (page - 1) * limit;
      const params = new URLSearchParams({
        offset: offset.toString(),
        limit: limit.toString(),
        search: search
      });
      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete user');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User deleted",
        description: "User has been successfully removed from the system"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleDeleteUser = (user: AdminUser) => {
    if (window.confirm(`Are you sure you want to delete user ${user.email}? This action cannot be undone.`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      'active': { variant: 'default', label: 'Active' },
      'trialing': { variant: 'secondary', label: 'Trial' },
      'canceled': { variant: 'destructive', label: 'Canceled' },
      'incomplete': { variant: 'outline', label: 'Incomplete' },
      'past_due': { variant: 'destructive', label: 'Past Due' }
    };
    
    const config = statusMap[status] || { variant: 'outline' as const, label: status || 'Free' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-tradie-light to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-tradie-blue" />
              <div>
                <h1 className="text-2xl font-bold text-tradie-blue">User Management</h1>
                <p className="text-sm text-gray-600">Manage all Blue Tradie users</p>
              </div>
            </div>
            <Link href="/admin-analytics">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Analytics
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="md:col-span-2">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users by email, name, or business..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-tradie-blue mx-auto mb-2" />
              <div className="text-2xl font-bold text-tradie-blue">
                {data?.pagination.total || 0}
              </div>
              <div className="text-sm text-gray-600">Total Users</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {data?.users.filter(u => u.isOnboarded).length || 0}
              </div>
              <div className="text-sm text-gray-600">Onboarded</div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Users {data && `(${data.pagination.total})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tradie-blue mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading users...</p>
              </div>
            ) : !data?.users.length ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No users found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2">User</th>
                        <th className="text-left py-3 px-2">Business</th>
                        <th className="text-left py-3 px-2">Status</th>
                        <th className="text-left py-3 px-2">Created</th>
                        <th className="text-left py-3 px-2">Last Login</th>
                        <th className="text-left py-3 px-2">Welcome Email</th>
                        <th className="text-left py-3 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.users.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="py-4 px-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-tradie-blue rounded-full flex items-center justify-center text-white font-medium">
                                {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium">{user.firstName} {user.lastName}</div>
                                <div className="text-sm text-gray-600 flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-2">
                            <div className="flex items-center gap-1">
                              <Building className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="font-medium">{user.businessName || 'No business'}</div>
                                <div className="text-sm text-gray-600">{user.trade} • {user.country}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-2">
                            <div className="flex flex-col gap-1">
                              {getStatusBadge(user.subscriptionStatus)}
                              <div className="flex items-center gap-1">
                                {user.isOnboarded ? (
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-red-600" />
                                )}
                                <span className="text-xs text-gray-600">
                                  {user.isOnboarded ? 'Onboarded' : 'Pending'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span className="text-sm">{formatDate(user.createdAt)}</span>
                            </div>
                          </td>
                          <td className="py-4 px-2">
                            <span className="text-sm">{formatDate(user.firstLoginAt)}</span>
                          </td>
                          <td className="py-4 px-2">
                            <div className="flex items-center gap-1">
                              {user.welcomeSentAt ? (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              ) : (
                                <XCircle className="h-3 w-3 text-red-600" />
                              )}
                              <span className="text-sm">{formatDate(user.welcomeSentAt)}</span>
                            </div>
                          </td>
                          <td className="py-4 px-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUser(user)}
                              disabled={deleteUserMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {data.pagination.total > limit && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-600">
                      Showing {data.pagination.offset + 1}-{Math.min(data.pagination.offset + limit, data.pagination.total)} of {data.pagination.total} total users
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!data.pagination.hasMore}
                        onClick={() => setPage(page + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}