import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Smartphone, 
  Mic, 
  Download, 
  Zap 
} from "lucide-react";

export default function DashboardMigrationCTA() {
  return (
    <div className="space-y-4">
      {/* Migration CTA */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-blue-900">Switch from ServiceM8 or Tradify?</h3>
              </div>
              <p className="text-blue-800 text-sm">
                Migrate your jobs, customers, and invoices in under 15 minutes. Keep all your data.
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                <Badge variant="outline" className="text-xs bg-white text-blue-700">
                  ServiceM8
                </Badge>
                <Badge variant="outline" className="text-xs bg-white text-blue-700">
                  Tradify
                </Badge>
                <Badge variant="outline" className="text-xs bg-white text-blue-700">
                  CSV Import
                </Badge>
              </div>
            </div>
            <Link href="/migration">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                <Download className="w-4 h-4" />
                Start Migration
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Voice Feature CTA */}
      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-orange-900">Voice-to-Text Features</h3>
                <Badge className="bg-orange-500 text-white text-xs animate-pulse">
                  🚧 BETA
                </Badge>
              </div>
              <p className="text-orange-800 text-sm">
                Create invoices hands-free while working. Perfect for tradie job sites.
              </p>
              <p className="text-xs text-orange-700">
                Coming Q2 2025 • Early access available
              </p>
            </div>
            <Link href="/migration">
              <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Learn More
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}