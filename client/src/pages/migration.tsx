import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Mic, Smartphone } from "lucide-react";
import MigrationHub from "@/components/MigrationHub";
import VoiceToTextFeature from "@/components/VoiceToTextFeature";

export default function Migration() {
  const [activeTab, setActiveTab] = useState<"migration" | "voice">("migration");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" className="text-tradie-blue hover:text-tradie-orange">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-tradie-blue">Migration & Innovation Hub</h1>
              <p className="text-gray-600">Switch platforms and discover cutting-edge features</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-white rounded-lg p-1 w-fit">
          <Button
            variant={activeTab === "migration" ? "default" : "ghost"}
            onClick={() => setActiveTab("migration")}
            className="flex items-center gap-2"
          >
            <Smartphone className="w-4 h-4" />
            Platform Migration
          </Button>
          <Button
            variant={activeTab === "voice" ? "default" : "ghost"}
            onClick={() => setActiveTab("voice")}
            className="flex items-center gap-2"
          >
            <Mic className="w-4 h-4" />
            Voice Features (Beta)
          </Button>
        </div>

        {/* Content */}
        {activeTab === "migration" ? (
          <MigrationHub />
        ) : (
          <VoiceToTextFeature />
        )}
      </div>
    </div>
  );
}