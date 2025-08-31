import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ToneOption {
  id: string;
  title: string;
  icon: string;
  description: string;
  example: string;
}

const toneOptions: ToneOption[] = [
  {
    id: "matey",
    title: "🧢 Matey & Casual",
    icon: "🧢",
    description: "Friendly, relaxed, down-to-earth with tradie slang",
    example: "No worries mate! Let's get this sorted for you. GST is pretty straightforward once you break it down. I'll walk you through it step by step, easy as!"
  },
  {
    id: "professional",
    title: "🧠 Professional & Direct", 
    icon: "🧠",
    description: "Clear, structured, business-focused communication",
    example: "Here are the key points: 1. GST rate is 10%, 2. Register if turnover exceeds $75k, 3. Lodge quarterly returns, 4. Track claimable expenses systematically."
  }
];

interface CommunicationToneSelectorProps {
  onComplete?: () => void;
  compact?: boolean;
}

export default function CommunicationToneSelector({ onComplete, compact = false }: CommunicationToneSelectorProps) {
  const { user } = useAuth();
  const [selectedTone, setSelectedTone] = useState(user?.communicationTone || "matey");
  const queryClient = useQueryClient();

  const updateToneMutation = useMutation({
    mutationFn: async (tone: string) => {
      return apiRequest('POST', '/api/user/communication-tone', { communicationTone: tone });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      onComplete?.();
    }
  });

  const handleSaveTone = () => {
    updateToneMutation.mutate(selectedTone);
  };

  if (compact) {
    return (
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">How would you like your AI assistants to talk to you?</h4>
        <div className="grid gap-3">
          {toneOptions.map((tone) => (
            <Button
              key={tone.id}
              variant={selectedTone === tone.id ? "default" : "outline"}
              className="justify-start h-auto p-4 text-left"
              onClick={() => {
                setSelectedTone(tone.id);
                // Auto-save in compact mode
                updateToneMutation.mutate(tone.id);
              }}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{tone.icon}</span>
                <div>
                  <div className="font-medium">{tone.title.split(' ').slice(1).join(' ')}</div>
                  <div className="text-xs text-gray-600">{tone.description}</div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Choose Your AI Communication Style</CardTitle>
        <p className="text-center text-gray-600">
          How would you like your AI business assistants to talk to you?
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          {toneOptions.map((tone) => (
            <Card 
              key={tone.id}
              className={`cursor-pointer transition-all duration-200 ${
                selectedTone === tone.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'hover:border-gray-300 hover:shadow-md'
              }`}
              onClick={() => setSelectedTone(tone.id)}
            >
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="text-3xl mb-2">{tone.icon}</div>
                  <h3 className="font-semibold text-lg">{tone.title}</h3>
                  <p className="text-sm text-gray-600">{tone.description}</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-700 font-medium mb-1">Example:</p>
                  <p className="text-sm text-gray-600 italic">"{tone.example}"</p>
                </div>
                
                {selectedTone === tone.id && (
                  <div className="mt-3 text-center">
                    <Badge className="bg-blue-100 text-blue-700">Selected</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center">
          <Button 
            onClick={handleSaveTone}
            disabled={updateToneMutation.isPending}
            className="px-8"
          >
            {updateToneMutation.isPending ? "Saving..." : "Save Preference"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}