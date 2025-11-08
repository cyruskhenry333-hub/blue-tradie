import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import {
  Plus,
  MessageSquare,
  FileText,
  Users,
  Receipt,
  Settings,
  Sparkles,
  Target,
  Compass,
  FileSignature
} from "lucide-react";

export default function QuickAccessPanel() {
  const [isOpen, setIsOpen] = useState(false);

  const quickActions = [
    {
      id: "new-invoice",
      title: "New Invoice",
      description: "Create a professional invoice",
      icon: FileText,
      href: "/invoices",
      color: "bg-blue-500 hover:bg-blue-600",
      shortcut: "I",
      className: "invoices-link"
    },
    {
      id: "quotes",
      title: "Quotes",
      description: "Create and manage quotes",
      icon: FileSignature,
      href: "/quotes",
      color: "bg-cyan-500 hover:bg-cyan-600",
      shortcut: "U",
      className: "quotes-link"
    },
    {
      id: "add-job",
      title: "Client Book",
      description: "View and manage jobs",
      icon: Users,
      href: "/jobs",
      color: "bg-green-500 hover:bg-green-600",
      shortcut: "J",
      className: "jobs-link"
    },
    {
      id: "add-expense",
      title: "Log Expense",
      description: "Track business costs",
      icon: Receipt,
      href: "/expenses",
      color: "bg-orange-500 hover:bg-orange-600",
      shortcut: "E",
      className: "expenses-link"
    },
    {
      id: "ai-chat",
      title: "AI Assistant",
      description: "Get instant business help",
      icon: MessageSquare,
      href: "/chat",
      color: "bg-purple-500 hover:bg-purple-600",
      shortcut: "A"
    },
    {
      id: "logbook",
      title: "Work Logbook",
      description: "Track daily activities",
      icon: Target,
      href: "/logbook",
      color: "bg-pink-500 hover:bg-pink-600",
      shortcut: "L"
    },
    {
      id: "roadmap",
      title: "Business Roadmap",
      description: "Track your progress",
      icon: Compass,
      href: "/roadmap",
      color: "bg-indigo-500 hover:bg-indigo-600",
      shortcut: "R"
    }
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if Ctrl+Shift is held (Cmd+Shift on Mac)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        const action = quickActions.find(action => 
          action.shortcut.toLowerCase() === e.key.toLowerCase()
        );
        if (action) {
          e.preventDefault();
          window.location.href = action.href;
        }
        // Open/close quick panel with Ctrl+Shift+Q
        if (e.key.toLowerCase() === 'q') {
          e.preventDefault();
          setIsOpen(prev => !prev);
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <>
      {/* Floating Quick Access Button - Middle Right */}
      <div 
        className="fixed right-0 top-1/2 transform -translate-y-1/2 z-[99999]"
        style={{ 
          position: 'fixed',
          right: '0px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 99999,
          pointerEvents: 'auto',
          isolation: 'isolate'
        }}
      >
        <div className="relative group">
          <Button
            onClick={() => setIsOpen(true)}
            className="h-14 w-12 rounded-l-full shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 transition-all duration-200 hover:w-14 !important quick-access-trigger quick-access-panel"
            style={{ zIndex: 99999 }}
            title="Quick Actions (Ctrl+Shift+Q)"
            data-tour-target="quick-access"
          >
            <Plus className="h-6 w-6" />
          </Button>
          <div className="absolute right-14 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Access common tasks quickly
          </div>
        </div>
      </div>

      {/* Quick Access Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Quick Actions
            </DialogTitle>
            <DialogDescription>
              Access your most common tasks quickly with keyboard shortcuts
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-2">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Link key={action.id} href={action.href}>
                  <Card 
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 border-2 hover:border-gray-300 ${(action as any).className || ''}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${action.color} text-white`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{action.title}</h3>
                      <p className="text-xs text-gray-600 mb-2">{action.description}</p>
                      <div className="flex items-center justify-center">
                        <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono text-gray-600">
                          ⌘⇧{action.shortcut}
                        </kbd>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Quick Tips */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Quick Tips</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div>• Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">⌘⇧Q</kbd> to open quick actions</div>
              <div>• Use shortcuts to navigate faster</div>
              <div>• Click outside to close panel</div>
              <div>• All actions work from any page</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}