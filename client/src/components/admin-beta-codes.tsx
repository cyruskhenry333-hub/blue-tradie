import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Copy, Ban, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function AdminBetaCodes() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [description, setDescription] = useState("");
  const [maxUses, setMaxUses] = useState("1");
  const [expiryDays, setExpiryDays] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ["/api/admin/beta-codes"]
  });

  const createCodeMutation = useMutation({
    mutationFn: async (data: { description: string; maxUses: number; expiresAt?: string }) => {
      return await apiRequest("/api/admin/beta-codes", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/beta-codes"] });
      setShowCreateDialog(false);
      setDescription("");
      setMaxUses("1");
      setExpiryDays("");
      toast({
        title: "Beta Code Created",
        description: "New invite code generated successfully"
      });
    }
  });

  const revokeCodeMutation = useMutation({
    mutationFn: async (codeId: number) => {
      return await apiRequest(`/api/admin/beta-codes/${codeId}/revoke`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/beta-codes"] });
      toast({
        title: "Code Revoked",
        description: "Beta code has been deactivated"
      });
    }
  });

  const handleCreateCode = () => {
    if (!description.trim()) {
      toast({
        title: "Description Required",
        description: "Please provide a description for this beta code",
        variant: "destructive"
      });
      return;
    }

    const data: any = {
      description: description.trim(),
      maxUses: parseInt(maxUses) || 1
    };

    if (expiryDays) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays));
      data.expiresAt = expiryDate.toISOString();
    }

    createCodeMutation.mutate(data);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code Copied",
      description: `${code} copied to clipboard`
    });
  };

  const getStatusBadge = (code: any) => {
    if (!code.isActive) {
      return <Badge variant="destructive"><Ban className="h-3 w-3 mr-1" />Revoked</Badge>;
    }
    if (code.expiresAt && new Date() > new Date(code.expiresAt)) {
      return <Badge variant="destructive"><Clock className="h-3 w-3 mr-1" />Expired</Badge>;
    }
    if (code.currentUses >= code.maxUses) {
      return <Badge variant="secondary"><CheckCircle className="h-3 w-3 mr-1" />Used</Badge>;
    }
    return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
  };

  if (isLoading) {
    return <div>Loading beta codes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Beta Invite Codes</h2>
          <p className="text-gray-600">Manage beta testing invitations and track usage</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="btn-tradie-primary">
              <Plus className="h-4 w-4 mr-2" />
              Create Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Beta Code</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="e.g., 'For John Smith - Electrician from Sydney' or 'Social media campaign batch 1'"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxUses">Max Uses</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    min="1"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="expiryDays">Expires in (days)</Label>
                  <Input
                    id="expiryDays"
                    type="number"
                    min="1"
                    placeholder="Leave empty for no expiry"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateCode} 
                  disabled={createCodeMutation.isPending}
                  className="btn-tradie-primary flex-1"
                >
                  {createCodeMutation.isPending ? "Creating..." : "Create Code"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Beta Code Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {codes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No beta codes created yet. Create your first code to start inviting beta testers.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((code: any) => (
                  <TableRow key={code.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                          {code.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(code.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={code.description}>
                        {code.description}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(code)}</TableCell>
                    <TableCell>
                      {code.currentUses}/{code.maxUses}
                      {code.expiresAt && (
                        <div className="text-xs text-gray-500">
                          Expires: {new Date(code.expiresAt).toLocaleDateString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{new Date(code.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {code.isActive && code.currentUses < code.maxUses && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => revokeCodeMutation.mutate(code.id)}
                          disabled={revokeCodeMutation.isPending}
                        >
                          <Ban className="h-3 w-3 mr-1" />
                          Revoke
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}