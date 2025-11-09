import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { Mic, MicOff, Volume2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onFinalTranscript?: (text: string, confidence: number) => void;
  placeholder?: string;
  className?: string;
  continuous?: boolean;
  language?: string;
  showConfidence?: boolean;
}

export function VoiceInput({
  onTranscript,
  onFinalTranscript,
  placeholder = 'Click microphone and start speaking...',
  className,
  continuous = false,
  language = 'en-AU',
  showConfidence = false,
}: VoiceInputProps) {
  const [fullTranscript, setFullTranscript] = useState('');

  const {
    isListening,
    transcript,
    interimTranscript,
    confidence,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceRecording({
    continuous,
    language,
    onResult: (result) => {
      if (result.isFinal && onFinalTranscript) {
        onFinalTranscript(result.transcript, result.confidence);
      }
    },
  });

  useEffect(() => {
    const combined = transcript + (interimTranscript ? ` ${interimTranscript}` : '');
    setFullTranscript(combined);
    onTranscript(combined);
  }, [transcript, interimTranscript, onTranscript]);

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      setFullTranscript('');
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Voice input is not supported in your browser. Please try Chrome, Edge, or Safari.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={handleToggle}
          variant={isListening ? 'destructive' : 'default'}
          className={cn(
            'gap-2 transition-all',
            isListening && 'animate-pulse'
          )}
        >
          {isListening ? (
            <>
              <MicOff className="h-4 w-4" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              Start Recording
            </>
          )}
        </Button>

        {isListening && (
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-red-500 animate-pulse" />
            <Badge variant="destructive">Listening...</Badge>
          </div>
        )}

        {showConfidence && confidence > 0 && (
          <Badge variant="outline">
            {Math.round(confidence * 100)}% confident
          </Badge>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {fullTranscript && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Mic className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 mb-1">Transcript:</p>
              <p className="text-sm text-blue-800">
                {transcript}
                {interimTranscript && (
                  <span className="italic text-blue-600"> {interimTranscript}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {!fullTranscript && !isListening && (
        <p className="text-sm text-gray-500 text-center py-4">{placeholder}</p>
      )}
    </div>
  );
}
