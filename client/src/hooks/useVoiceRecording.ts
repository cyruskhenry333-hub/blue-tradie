import { useState, useRef, useCallback, useEffect } from 'react';

// Type shim for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

interface UseVoiceRecordingReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  confidence: number;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

/**
 * Hook for voice recognition using Web Speech API
 */
export function useVoiceRecording(options: {
  continuous?: boolean;
  language?: string;
  onResult?: (result: VoiceRecognitionResult) => void;
  onEnd?: () => void;
} = {}): UseVoiceRecordingReturn {
  const {
    continuous = false,
    language = 'en-AU', // Australian English
    onResult,
    onEnd,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  // Check if Speech Recognition is supported
  const isSupported = Boolean(
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || (window as any).webkitSpeechRecognition)
  );

  // Initialize recognition
  useEffect(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('[Voice] Recognition started');
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimText = '';
      let maxConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptPart = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcriptPart + ' ';
          maxConfidence = Math.max(maxConfidence, result[0].confidence);
        } else {
          interimText += transcriptPart;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript);
        setConfidence(maxConfidence);

        if (onResult) {
          onResult({
            transcript: finalTranscript.trim(),
            confidence: maxConfidence,
            isFinal: true,
          });
        }
      }

      if (interimText) {
        setInterimTranscript(interimText);

        if (onResult) {
          onResult({
            transcript: interimText,
            confidence: 0,
            isFinal: false,
          });
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('[Voice] Recognition error:', event.error);
      setError(`Recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('[Voice] Recognition ended');
      setIsListening(false);
      setInterimTranscript('');

      if (onEnd) {
        onEnd();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isSupported, continuous, language, onResult, onEnd]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Recognition not initialized');
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error('[Voice] Failed to start:', err);
      setError('Failed to start recognition');
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setConfidence(0);
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    confidence,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
}
