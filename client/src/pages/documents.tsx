import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  File,
  Image,
  FileText,
  Download,
  Trash2,
  Eye,
  Share2,
  Lock,
  Calendar,
  HardDrive,
} from "lucide-react";

interface Document {
  id: number;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  documentType: string;
  category?: string;
  title?: string;
  description?: string;
  isPublic: boolean;
  jobId?: number;
  invoiceId?: number;
  quoteId?: number;
  downloadCount: number;
  createdAt: string;
}

export default function DocumentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadDocumentType, setUploadDocumentType] = useState('photo');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  // Fetch documents
  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents', filterType],
    queryFn: async () => {
      const url = filterType === 'all'
        ? '/api/documents'
        : `/api/documents?type=${filterType}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['/api/documents/stats/summary'],
    queryFn: async () => {
      const response = await fetch('/api/documents/stats/summary');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload file');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents/stats/summary'] });
      setShowUploadDialog(false);
      resetUploadForm();
      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete document');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents/stats/summary'] });
      setShowDetailDialog(false);
      toast({
        title: "Document deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Toggle public mutation
  const togglePublicMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await fetch(`/api/documents/${documentId}/toggle-public`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to toggle public status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Sharing settings updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const resetUploadForm = () => {
    setSelectedFile(null);
    setUploadDocumentType('photo');
    setUploadTitle('');
    setUploadDescription('');
    setUploadCategory('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadTitle(file.name);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('documentType', uploadDocumentType);
    formData.append('title', uploadTitle);
    formData.append('description', uploadDescription);
    formData.append('category', uploadCategory);

    uploadMutation.mutate(formData);
  };

  const handleDownload = (document: Document) => {
    window.open(`/api/documents/${document.id}/download`, '_blank');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getDocumentIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (mimeType === 'application/pdf') return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      photo: 'bg-blue-100 text-blue-800',
      invoice: 'bg-green-100 text-green-800',
      quote: 'bg-purple-100 text-purple-800',
      receipt: 'bg-orange-100 text-orange-800',
      contract: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || colors.other;
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600 mt-2">Manage your photos, invoices, and files</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Files</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.total || 0}</p>
                </div>
                <File className="w-12 h-12 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Recent Uploads</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.recentUploads || 0}</p>
                </div>
                <Upload className="w-12 h-12 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Storage Used</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.totalSize ? formatFileSize(stats.totalSize) : '0 B'}
                  </p>
                </div>
                <HardDrive className="w-12 h-12 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <Button className="w-full" onClick={() => setShowUploadDialog(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Filter by type:</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Documents</SelectItem>
                  <SelectItem value="photo">Photos</SelectItem>
                  <SelectItem value="invoice">Invoices</SelectItem>
                  <SelectItem value="quote">Quotes</SelectItem>
                  <SelectItem value="receipt">Receipts</SelectItem>
                  <SelectItem value="contract">Contracts</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Documents Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Your Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : documents && documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedDocument(doc);
                      setShowDetailDialog(true);
                    }}
                  >
                    {/* Thumbnail/Preview */}
                    <div className="h-48 bg-gray-100 flex items-center justify-center">
                      {isImage(doc.mimeType) ? (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <Image className="w-16 h-16 text-gray-400" />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          {getDocumentIcon(doc.mimeType)}
                          <p className="text-sm text-gray-500 mt-2">
                            {doc.mimeType.split('/')[1]?.toUpperCase()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900 truncate flex-1">
                          {doc.title || doc.originalFileName}
                        </h3>
                        {doc.isPublic ? (
                          <Share2 className="w-4 h-4 text-green-600 ml-2" />
                        ) : (
                          <Lock className="w-4 h-4 text-gray-400 ml-2" />
                        )}
                      </div>

                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getTypeColor(doc.documentType)}>
                          {doc.documentType}
                        </Badge>
                        {doc.category && (
                          <Badge variant="outline">{doc.category}</Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                      </div>

                      {doc.downloadCount > 0 && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500 mt-2">
                          <Download className="w-3 h-3" />
                          <span>{doc.downloadCount} downloads</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <File className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No documents yet</p>
                <Button className="mt-4" onClick={() => setShowUploadDialog(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Your First File
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload File</DialogTitle>
              <DialogDescription>
                Upload photos, invoices, receipts, or other documents
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File *
                </label>
                <Input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type *
                </label>
                <Select value={uploadDocumentType} onValueChange={setUploadDocumentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photo">Photo</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="quote">Quote</SelectItem>
                    <SelectItem value="receipt">Receipt</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {uploadDocumentType === 'photo' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <Select value={uploadCategory} onValueChange={setUploadCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="before">Before</SelectItem>
                      <SelectItem value="after">After</SelectItem>
                      <SelectItem value="progress">Progress</SelectItem>
                      <SelectItem value="damage">Damage</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <Input
                  placeholder="Document title"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Textarea
                  placeholder="Optional description"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={!selectedFile || uploadMutation.isPending}>
                {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedDocument?.title || selectedDocument?.originalFileName}</DialogTitle>
            </DialogHeader>
            {selectedDocument && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Type</p>
                    <Badge className={getTypeColor(selectedDocument.documentType)}>
                      {selectedDocument.documentType}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-gray-600">Size</p>
                    <p className="font-medium">{formatFileSize(selectedDocument.fileSize)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Uploaded</p>
                    <p className="font-medium">
                      {new Date(selectedDocument.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Downloads</p>
                    <p className="font-medium">{selectedDocument.downloadCount}</p>
                  </div>
                </div>

                {selectedDocument.description && (
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Description</p>
                    <p className="text-sm">{selectedDocument.description}</p>
                  </div>
                )}

                <div className="flex items-center space-x-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handleDownload(selectedDocument)}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => togglePublicMutation.mutate(selectedDocument.id)}
                    disabled={togglePublicMutation.isPending}
                  >
                    {selectedDocument.isPublic ? (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Make Private
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(selectedDocument.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
