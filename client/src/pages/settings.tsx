import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Settings as SettingsIcon, MessageSquare, User, Bell } from "lucide-react";
import { Link } from "wouter";
import CommunicationToneSelector from "@/components/communication-tone-selector";

export default function Settings() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("communication");

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-tradie-light to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <SettingsIcon className="h-6 w-6 text-tradie-blue" />
              <h1 className="text-2xl font-bold text-tradie-blue">Settings</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={activeSection === "communication" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveSection("communication")}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  AI Communication
                </Button>
                <Button
                  variant={activeSection === "profile" ? "default" : "ghost"}
                  className="w-full justify-start profile-tab-button"
                  onClick={() => setActiveSection("profile")}
                  data-section="profile"
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile & Business
                </Button>
                <Button
                  variant={activeSection === "notifications" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveSection("notifications")}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            {activeSection === "communication" && (
              <div className="space-y-6">
                <Card className="communication-tone-card">
                  <CardHeader>
                    <CardTitle>AI Communication Preferences</CardTitle>
                    <p className="text-gray-600">
                      Customize how your AI assistants talk to you. These preferences affect all agents (Accountant, Marketing, Coach, Legal).
                    </p>
                  </CardHeader>
                  <CardContent className="tone-selector">
                    <CommunicationToneSelector compact />
                  </CardContent>
                </Card>



                <Card>
                  <CardHeader>
                    <CardTitle>Helpful AI Prompts</CardTitle>
                    <p className="text-gray-600">
                      Not sure how to ask your AI assistants? Use these phrases:
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-green-700">✅ Great prompts to try:</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>• "Explain this like I'm new to business"</p>
                          <p>• "Break this down step-by-step"</p>
                          <p>• "I'm feeling overwhelmed - help me"</p>
                          <p>• "Can you explain that more simply?"</p>
                          <p>• "What does this mean for my business?"</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-blue-700">💡 Advanced tips:</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>• "Give me action steps I can do today"</p>
                          <p>• "What are the most important things?"</p>
                          <p>• "Help me prioritize this list"</p>
                          <p>• "Show me an example"</p>
                          <p>• "What questions should I be asking?"</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === "profile" && (
              <Card className="business-profile-card profile-settings-section">
                <CardHeader>
                  <CardTitle>Profile & Business Information</CardTitle>
                  <p className="text-gray-600">
                    Your business details help AI agents provide personalized advice.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Basic Info</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>Country:</strong> {user.country || "Not set"}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Business Structure</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Type:</strong> {user.userType || "Not set"}</p>
                        <p><strong>Structure:</strong> {user.businessStructure || "Not set"}</p>
                        <p><strong>Journey Stage:</strong> Stage {user.currentJourneyStage || 1}</p>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="mt-4">
                    Update Profile Information
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeSection === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <p className="text-gray-600">
                    Manage when and how Blue Tradie notifies you.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Mate Check-ins</h4>
                        <p className="text-sm text-gray-600">Weekly motivation and progress check-ins from your Business Coach</p>
                      </div>
                      <Badge variant={user.mateCheckInsEnabled ? "default" : "outline"}>
                        {user.mateCheckInsEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Beta Updates</h4>
                        <p className="text-sm text-gray-600">Get notified about new features and improvements</p>
                      </div>
                      <Badge variant="outline">
                        {/* TODO: Beta removed - was: user.isBetaUser ? "Beta User" : "Regular User" */}
                        Regular User
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}