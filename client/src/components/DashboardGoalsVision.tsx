import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { 
  Target, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Users, 
  Zap,
  Star,
  ArrowRight,
  Eye,
  Heart,
  Edit3,
  RefreshCw,
  Upload,
  Sparkles,
  ImageIcon,
  FileImage
} from "lucide-react";

// Function to highlight key motivational words and specific user values with emojis and colors
const highlightKeywords = (text: string) => {
  const keywordMappings = [
    { word: 'freedom', emoji: '🆓', color: 'text-green-600' },
    { word: 'money', emoji: '💰', color: 'text-green-600' },
    { word: 'family', emoji: '👨‍👩‍👧‍👦', color: 'text-pink-600' },
    { word: 'holiday', emoji: '🏝️', color: 'text-blue-600' },
    { word: 'saved', emoji: '💎', color: 'text-purple-600' },
    { word: 'earn', emoji: '💸', color: 'text-green-600' },
    { word: 'business', emoji: '🏢', color: 'text-blue-600' },
    { word: 'success', emoji: '🎯', color: 'text-orange-600' },
    { word: 'dream', emoji: '💭', color: 'text-purple-600' },
    { word: 'goal', emoji: '🎯', color: 'text-orange-600' },
    { word: 'achieve', emoji: '✨', color: 'text-yellow-600' }
  ];
  
  // Specific values get different treatment
  const specificValues = ['6 months', '$5000', '$96000', '$5,000', '$96,000', '6-month', 'monthly', 'annually'];
  
  let highlightedText = text;
  
  // Highlight keyword terms with emojis and colors
  keywordMappings.forEach(({ word, emoji, color }) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    highlightedText = highlightedText.replace(regex, `<span class="font-medium ${color}">${emoji} $&</span>`);
  });
  
  // Highlight specific user values with bold styling and colors
  specificValues.forEach(value => {
    const regex = new RegExp(value.replace(/[\$,]/g, '\\$&'), 'gi');
    highlightedText = highlightedText.replace(regex, `<span class="font-semibold text-blue-700">💵 $&</span>`);
  });
  
  return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
};

interface UserGoals {
  financial: {
    targetRevenue: number;
    currentRevenue: number;
    targetClients: number;
    currentClients: number;
  };
  business: {
    growthGoal: string;
    timeframe: string;
    challenges: string[];
  };
  personal: {
    workLifeBalance: string;
    skillDevelopment: string[];
    vision: string;
  };
}

interface VisionBoard {
  id: string;
  category: string;
  title: string;
  description: string;
  image: string;
  progress: number;
  priority: "high" | "medium" | "low";
  keywords: string;
  isCustom: boolean;
}

export default function DashboardGoalsVision() {
  const [editingItem, setEditingItem] = useState<VisionBoard | null>(null);
  const [newKeywords, setNewKeywords] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userGoals } = useQuery<UserGoals>({
    queryKey: ["/api/user/goals"],
    retry: false,
  });

  const { data: visionBoard } = useQuery<VisionBoard[]>({
    queryKey: ["/api/user/vision-board"],
    retry: false,
  });

  const updateVisionBoardMutation = useMutation({
    mutationFn: async ({ itemId, updates }: { itemId: string; updates: any }) => {
      const response = await apiRequest("PATCH", `/api/user/vision-board/${itemId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Vision Board Updated",
        description: "Your vision board item has been updated successfully."
      });
      // Force a fresh fetch by removing cached data
      queryClient.removeQueries({ queryKey: ["/api/user/vision-board"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/vision-board"] });
      setEditingItem(null);
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update vision board item. Please try again.",
        variant: "destructive"
      });
    }
  });

  const regenerateImageMutation = useMutation({
    mutationFn: async ({ itemId, keywords }: { itemId: string; keywords: string }) => {
      const response = await apiRequest("POST", `/api/user/vision-board/${itemId}/regenerate`, { keywords });
      return response.json();
    },
    onSuccess: (data) => {
      setNewImageUrl(data.image);
      toast({
        title: "New Image Generated",
        description: "A new image has been generated based on your keywords."
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate new image. Please try again.",
        variant: "destructive"
      });
    }
  });

  const openEditDialog = (item: VisionBoard) => {
    setEditingItem(item);
    setNewKeywords(item.keywords);
    setNewTitle(item.title);
    setNewDescription(item.description);
    setNewImageUrl(item.image);
  };

  const handleSaveChanges = () => {
    if (!editingItem) return;
    
    updateVisionBoardMutation.mutate({
      itemId: editingItem.id,
      updates: {
        keywords: newKeywords,
        title: newTitle,
        description: newDescription,
        image: newImageUrl
      }
    });
  };

  const handleRegenerateImage = () => {
    if (!editingItem) return;
    
    regenerateImageMutation.mutate({
      itemId: editingItem.id,
      keywords: newKeywords
    });
  };

  const regenerateAllMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/user/vision-board/regenerate-all", {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "All Images Regenerated",
        description: "Your entire vision board has been refreshed with new images."
      });
      // Force a fresh fetch by removing cached data
      queryClient.removeQueries({ queryKey: ["/api/user/vision-board"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/vision-board"] });
    },
    onError: () => {
      toast({
        title: "Regeneration Failed",
        description: "Failed to regenerate all images. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive"
      });
      return;
    }

    // Check file size (max 2MB to avoid payload issues)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 2MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingImage(true);
    
    try {
      // Convert to base64 for upload
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const dataUrl = e.target?.result as string;
          
          // Upload the image via API
          const response = await apiRequest("POST", "/api/user/vision-board/upload-image", {
            imageData: dataUrl,
            fileName: file.name
          });
          
          const result = await response.json();
          
          if (result.success) {
            setNewImageUrl(result.imageUrl || dataUrl);
            toast({
              title: "Image Uploaded",
              description: "Your custom image has been uploaded successfully. Click 'Save Changes' to apply it."
            });
          } else {
            throw new Error("Upload failed");
          }
        } catch (uploadError) {
          console.error("Upload error:", uploadError);
          toast({
            title: "Upload Failed",
            description: "Failed to upload the image to server.",
            variant: "destructive"
          });
        } finally {
          setIsUploadingImage(false);
        }
      };
      
      reader.onerror = () => {
        setIsUploadingImage(false);
        toast({
          title: "Upload Failed",
          description: "Failed to process the image file.",
          variant: "destructive"
        });
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      setIsUploadingImage(false);
      toast({
        title: "Upload Failed",
        description: "Failed to upload the image.",
        variant: "destructive"
      });
    }
  };

  const handleRegenerateAll = () => {
    regenerateAllMutation.mutate();
  };

  if (!userGoals) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Set Your Business Goals</h3>
          <p className="text-gray-600 mb-4">
            Let our AI Business Coach help you create a roadmap for success
          </p>
          <Link href="/goals">
            <Button>
              <Target className="w-4 h-4 mr-2" />
              Start Goal Setting
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const revenueProgress = userGoals.financial.targetRevenue > 0 
    ? (userGoals.financial.currentRevenue / userGoals.financial.targetRevenue) * 100 
    : 0;

  const clientProgress = userGoals.financial.targetClients > 0 
    ? (userGoals.financial.currentClients / userGoals.financial.targetClients) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Personal Vision Statement */}
      {userGoals.personal.vision && (
        <Card className="bg-gradient-to-r from-slate-50 to-blue-50 border-l-4 border-tradie-blue">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-tradie-blue" />
                  <h3 className="font-semibold text-lg text-gray-800">Your Vision</h3>
                </div>
                <Link href="/goals">
                  <Button variant="outline" size="sm" className="text-xs">
                    <Edit3 className="w-3 h-3 mr-1" />
                    Update Goals
                  </Button>
                </Link>
              </div>
              
              <div className="relative">
                <div className="absolute -top-2 -left-1 text-3xl text-gray-300 font-serif">"</div>
                <div className="absolute -bottom-2 -right-1 text-3xl text-gray-300 font-serif">"</div>
                <p className="text-gray-700 text-lg font-medium leading-relaxed pl-6 pr-6 py-2">
                  {userGoals.personal.vision}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goals Progress Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Financial Goals */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
              Financial Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Revenue Target */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Annual Revenue Target</span>
                <span className="font-bold">
                  ${userGoals.financial.currentRevenue.toLocaleString()} / ${userGoals.financial.targetRevenue.toLocaleString()}
                </span>
              </div>
              <Progress value={revenueProgress} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{Math.round(revenueProgress)}% achieved</span>
                <span>${(userGoals.financial.targetRevenue - userGoals.financial.currentRevenue).toLocaleString()} to go</span>
              </div>
            </div>

            {/* Client Target */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Client Target</span>
                <span className="font-bold">
                  {userGoals.financial.currentClients} / {userGoals.financial.targetClients}
                </span>
              </div>
              <Progress value={clientProgress} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{Math.round(clientProgress)}% achieved</span>
                <span>{userGoals.financial.targetClients - userGoals.financial.currentClients} more needed</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Development */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Business Growth
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Growth Focus</span>
                <Badge variant="outline">{userGoals.business.timeframe}</Badge>
              </div>
              <p className="text-sm text-gray-700">{userGoals.business.growthGoal}</p>
            </div>
            
            {userGoals.business.challenges.length > 0 && (
              <div>
                <span className="text-sm font-medium">Key Challenges</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {userGoals.business.challenges.slice(0, 3).map((challenge, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {challenge}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vision Board */}
      {visionBoard && visionBoard.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-600" />
              Your Vision Board
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Click on any image to edit and upload your own custom photos
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {visionBoard.slice(0, 6).map((item) => (
                <div key={item.id} className="relative group">
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
                    <div className="relative w-full h-full">
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          // Fallback to gradient on image load error
                          const target = e.target as HTMLImageElement;
                          const parent = target.parentElement;
                          if (parent) {
                            const colorVariations = [
                              'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
                              'linear-gradient(135deg, #10B981 0%, #047857 100%)',
                              'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                              'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                              'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                              'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
                            ];
                            const colorIndex = (item.category.length + item.keywords.length) % colorVariations.length;
                            parent.style.background = colorVariations[colorIndex];
                            parent.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center text-white">
                                <div class="text-center">
                                  <div class="text-4xl mb-2">🎯</div>
                                  <div class="text-sm font-medium px-2">${item.title}</div>
                                </div>
                              </div>
                            `;
                          }
                        }}
                      />
                      {/* Centered text overlay - always visible */}
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                        <div className="text-center text-white p-2">
                          <h4 className="font-bold text-sm mb-1">{item.title}</h4>
                          <p className="text-xs opacity-90 line-clamp-2">{item.description}</p>
                        </div>
                      </div>
                    </div>

                  </div>
                  
                  {item.progress > 0 && (
                    <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-full p-1">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-green-600">{item.progress}%</span>
                      </div>
                    </div>
                  )}
                  
                  {item.priority === "high" && (
                    <div className="absolute top-2 left-2">
                      <Heart className="w-4 h-4 text-red-500 fill-current" />
                    </div>
                  )}

                  {/* Edit Button */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="bg-white bg-opacity-90 hover:bg-white"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-600" />
                            Edit Vision Board Item
                          </DialogTitle>
                          <DialogDescription>
                            Customize your vision board item with AI-generated images or upload your own.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 pb-4">
                          {/* Current Image Preview */}
                          <div className="space-y-2">
                            <Label>Current Image</Label>
                            <div className="aspect-square w-32 bg-gray-100 rounded-lg overflow-hidden mx-auto">
                              <img 
                                src={newImageUrl || item.image} 
                                alt={item.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  const parent = target.parentElement;
                                  if (parent) {
                                    const colorVariations = [
                                      'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
                                      'linear-gradient(135deg, #10B981 0%, #047857 100%)',
                                      'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                                      'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                                      'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                                      'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
                                    ];
                                    const colorIndex = (item.category.length + item.keywords.length) % colorVariations.length;
                                    parent.style.background = colorVariations[colorIndex];
                                    parent.innerHTML = `
                                      <div class="w-full h-full flex items-center justify-center text-white">
                                        <div class="text-center">
                                          <div class="text-2xl mb-1">🎯</div>
                                          <div class="text-xs font-medium px-1">${item.title}</div>
                                        </div>
                                      </div>
                                    `;
                                  }
                                }}
                              />
                            </div>
                          </div>

                          {/* Title */}
                          <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                              id="title"
                              value={newTitle}
                              onChange={(e) => setNewTitle(e.target.value)}
                              placeholder="Enter title"
                            />
                          </div>

                          {/* Description */}
                          <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              value={newDescription}
                              onChange={(e) => setNewDescription(e.target.value)}
                              placeholder="Enter description"
                              rows={2}
                            />
                          </div>

                          {/* Keywords for AI Generation */}
                          <div className="space-y-2">
                            <Label htmlFor="keywords">Keywords for Image Generation</Label>
                            <Input
                              id="keywords"
                              value={newKeywords}
                              onChange={(e) => setNewKeywords(e.target.value)}
                              placeholder="e.g., tropical beach vacation sunset relaxing"
                            />
                            <p className="text-xs text-gray-500">
                              Add keywords to generate a more accurate image
                            </p>
                          </div>

                          {/* File Upload */}
                          <div className="space-y-2">
                            <Label>Upload Your Own Image</Label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploadingImage}
                                className="flex-1"
                              >
                                <ImageIcon className={`w-3 h-3 mr-2 ${isUploadingImage ? 'animate-pulse' : ''}`} />
                                {isUploadingImage ? 'Uploading...' : 'Choose Image'}
                              </Button>
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                              />
                            </div>
                            <p className="text-xs text-gray-500">
                              JPG, PNG, GIF up to 5MB
                            </p>
                          </div>



                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleRegenerateImage}
                              disabled={regenerateImageMutation.isPending}
                              className="flex-1"
                            >
                              <RefreshCw className={`w-3 h-3 mr-2 ${regenerateImageMutation.isPending ? 'animate-spin' : ''}`} />
                              Generate New
                            </Button>
                            <Button
                              onClick={handleSaveChanges}
                              disabled={updateVisionBoardMutation.isPending}
                              size="sm"
                              className="flex-1"
                            >
                              <Upload className="w-3 h-3 mr-2" />
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Add Regenerate All Button */}
            <div className="mt-4 text-center">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRegenerateAll}
                disabled={regenerateAllMutation.isPending}
                className="text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                <Sparkles className={`w-4 h-4 mr-2 ${regenerateAllMutation.isPending ? 'animate-spin' : ''}`} />
                {regenerateAllMutation.isPending ? 'Regenerating...' : 'Regenerate All Images'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skill Development */}
      {userGoals.personal.skillDevelopment.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5 text-orange-600" />
              Skill Development
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {userGoals.personal.skillDevelopment.map((skill, idx) => (
                <Badge key={idx} variant="outline" className="text-sm">
                  {skill}
                </Badge>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Work-Life Balance Goal</span>
                <Badge variant="secondary">{userGoals.personal.workLifeBalance}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-tradie-light to-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-tradie-blue">Ready to make progress?</h4>
              <p className="text-sm text-gray-600">Chat with your Business Coach for personalized guidance</p>
            </div>
            <Link href="/chat/coach">
              <Button size="sm" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Get Coaching
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}