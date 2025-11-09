import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VoiceInput } from '@/components/VoiceInput';
import { useToast } from '@/hooks/use-toast';
import { Mic, FileText, Sparkles, Save } from 'lucide-react';

export default function VoiceQuote() {
  const { toast } = useToast();
  const [quoteData, setQuoteData] = useState({
    customerName: '',
    description: '',
    items: '',
    notes: '',
  });

  const [activeField, setActiveField] = useState<string | null>(null);

  const handleVoiceTranscript = (field: string) => (text: string) => {
    setQuoteData((prev) => ({
      ...prev,
      [field]: text,
    }));
  };

  const handleSaveQuote = () => {
    // In production, this would call the quotes API
    console.log('Saving quote:', quoteData);
    toast({
      title: 'Quote Saved',
      description: 'Your voice quote has been saved successfully!',
    });
  };

  const parseItems = () => {
    // Simple AI-like parsing of voice items
    // In production, could use Claude API to parse properly
    const lines = quoteData.items.split(/\n|,|\band\b/);
    return lines
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Mic className="h-8 w-8 text-purple-600" />
            Voice-to-Quote
          </h1>
          <p className="text-gray-600 mt-1">
            Create quotes hands-free using voice commands
          </p>
        </div>

        {/* Instructions */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">How it works:</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>1. Click the microphone button next to any field</li>
                  <li>2. Speak clearly in Australian English</li>
                  <li>3. Your speech will be converted to text automatically</li>
                  <li>4. Review and edit if needed, then save your quote</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Name */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Name</CardTitle>
            <CardDescription>Who is this quote for?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeField === 'customerName' ? (
              <div className="space-y-3">
                <VoiceInput
                  onTranscript={handleVoiceTranscript('customerName')}
                  placeholder="Say the customer's name..."
                  showConfidence
                />
                <Button
                  variant="outline"
                  onClick={() => setActiveField(null)}
                  className="w-full"
                >
                  Done
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={quoteData.customerName}
                  onChange={(e) =>
                    setQuoteData({ ...quoteData, customerName: e.target.value })
                  }
                  placeholder="e.g., John Smith"
                  className="flex-1"
                />
                <Button
                  onClick={() => setActiveField('customerName')}
                  variant="outline"
                  className="gap-2"
                >
                  <Mic className="h-4 w-4" />
                  Voice
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Job Description</CardTitle>
            <CardDescription>Describe the work to be done</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeField === 'description' ? (
              <div className="space-y-3">
                <VoiceInput
                  onTranscript={handleVoiceTranscript('description')}
                  placeholder="Describe the job..."
                  continuous
                  showConfidence
                />
                <Button
                  variant="outline"
                  onClick={() => setActiveField(null)}
                  className="w-full"
                >
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Textarea
                  value={quoteData.description}
                  onChange={(e) =>
                    setQuoteData({ ...quoteData, description: e.target.value })
                  }
                  placeholder="e.g., Install new kitchen sink and tap, repair leaking pipe"
                  rows={4}
                />
                <Button
                  onClick={() => setActiveField('description')}
                  variant="outline"
                  className="gap-2"
                >
                  <Mic className="h-4 w-4" />
                  Use Voice
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Items & Materials */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Items & Materials</CardTitle>
            <CardDescription>
              List items, materials, or services (one per line or separated by "and")
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeField === 'items' ? (
              <div className="space-y-3">
                <VoiceInput
                  onTranscript={handleVoiceTranscript('items')}
                  placeholder="Say each item... (e.g., 'kitchen sink, mixer tap, and PVC pipe')"
                  continuous
                  showConfidence
                />
                <Button
                  variant="outline"
                  onClick={() => setActiveField(null)}
                  className="w-full"
                >
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Textarea
                  value={quoteData.items}
                  onChange={(e) =>
                    setQuoteData({ ...quoteData, items: e.target.value })
                  }
                  placeholder="e.g., Kitchen sink&#10;Mixer tap&#10;PVC pipe&#10;Labour - 3 hours"
                  rows={6}
                />
                <Button
                  onClick={() => setActiveField('items')}
                  variant="outline"
                  className="gap-2"
                >
                  <Mic className="h-4 w-4" />
                  Use Voice
                </Button>

                {quoteData.items && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      Parsed items:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {parseItems().map((item, index) => (
                        <li key={index}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional Notes</CardTitle>
            <CardDescription>Any special requirements or notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeField === 'notes' ? (
              <div className="space-y-3">
                <VoiceInput
                  onTranscript={handleVoiceTranscript('notes')}
                  placeholder="Add any additional notes..."
                  continuous
                  showConfidence
                />
                <Button
                  variant="outline"
                  onClick={() => setActiveField(null)}
                  className="w-full"
                >
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Textarea
                  value={quoteData.notes}
                  onChange={(e) =>
                    setQuoteData({ ...quoteData, notes: e.target.value })
                  }
                  placeholder="e.g., Customer wants work done on Saturday morning"
                  rows={3}
                />
                <Button
                  onClick={() => setActiveField('notes')}
                  variant="outline"
                  className="gap-2"
                >
                  <Mic className="h-4 w-4" />
                  Use Voice
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleSaveQuote} className="flex-1 gap-2">
            <Save className="h-4 w-4" />
            Save Quote
          </Button>
          <Button
            onClick={() =>
              setQuoteData({
                customerName: '',
                description: '',
                items: '',
                notes: '',
              })
            }
            variant="outline"
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Clear
          </Button>
        </div>

        {/* Preview */}
        {(quoteData.customerName || quoteData.description || quoteData.items) && (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Quote Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quoteData.customerName && (
                <div>
                  <Label className="text-blue-900">Customer:</Label>
                  <p className="text-blue-800 font-medium">{quoteData.customerName}</p>
                </div>
              )}

              {quoteData.description && (
                <div>
                  <Label className="text-blue-900">Description:</Label>
                  <p className="text-blue-800">{quoteData.description}</p>
                </div>
              )}

              {quoteData.items && (
                <div>
                  <Label className="text-blue-900">Items:</Label>
                  <ul className="text-blue-800 space-y-1">
                    {parseItems().map((item, index) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {quoteData.notes && (
                <div>
                  <Label className="text-blue-900">Notes:</Label>
                  <p className="text-blue-800 text-sm italic">{quoteData.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
