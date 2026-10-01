import React, { useEffect, useState, useRef } from "react";
import { Mic, MicOff, X, Volume2, Sparkles } from "lucide-react";

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscript: (transcript: string) => void;
  title?: string;
  placeholderHint?: string;
}

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  isOpen,
  onClose,
  onTranscript,
  title = "Listening...",
  placeholderHint = "Try saying: 'Running shoes under 2000' or 'Saste phones dikhao'",
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      setTranscript("");
      setInterim("");
      setErrorMsg(null);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "hi-IN, en-IN";

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMsg(null);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = "";
        let finalTrans = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTrans += event.results[i][0].transcript;
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }

        if (currentInterim) setInterim(currentInterim);
        if (finalTrans) {
          setTranscript(finalTrans);
          setTimeout(() => {
            onTranscript(finalTrans.trim());
            onClose();
          }, 450);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition event:", event.error);
        if (event.error === "no-speech") {
          setErrorMsg("Didn't catch that. Please tap the mic and speak again.");
        } else if (event.error === "not-allowed") {
          setErrorMsg("Microphone access was denied. Please allow microphone permissions in browser settings.");
        } else {
          setErrorMsg("Could not recognize voice input. Please try typing your search.");
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error("Failed to start voice recognition:", err);
      setErrorMsg("Unable to access microphone. Please check your browser permissions.");
      setIsListening(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [isOpen, onTranscript, onClose]);

  const handleRestart = () => {
    setErrorMsg(null);
    setTranscript("");
    setInterim("");
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch {
        // ignore
      }
    }
  };

  const isSupported =
    typeof window !== "undefined" &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  if (!isOpen) return null;

  if (!isSupported) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="relative w-full max-w-sm rounded-3xl bg-card border border-border text-foreground shadow-2xl p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 mx-auto rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
            <MicOff className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-foreground">Voice Search</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Voice recognition works seamlessly in Google Chrome, Microsoft Edge, and Apple Safari. You can type your search in the top search bar anytime!
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition cursor-pointer shadow-sm"
            >
              Type Search Query
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-card border border-border text-foreground shadow-2xl p-6 text-center space-y-5 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Pulse Mic Circle */}
        <div className="flex justify-center pt-2">
          <div className="relative flex items-center justify-center">
            {isListening && (
              <>
                <span className="absolute w-24 h-24 rounded-full bg-primary/20 animate-ping" />
                <span className="absolute w-20 h-20 rounded-full bg-primary/30 animate-pulse" />
              </>
            )}
            <button
              type="button"
              onClick={isListening ? () => recognitionRef.current?.stop() : handleRestart}
              className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 cursor-pointer ${
                isListening
                  ? "bg-gradient-to-tr from-rose-500 to-amber-500 shadow-rose-500/30"
                  : "bg-primary hover:bg-primary/90 shadow-primary/30"
              }`}
            >
              {isListening ? (
                <Mic className="w-8 h-8 animate-bounce" />
              ) : (
                <MicOff className="w-8 h-8" />
              )}
            </button>
          </div>
        </div>

        {/* Heading & Live Status */}
        <div className="space-y-1.5">
          <h3 className="text-base font-extrabold text-foreground flex items-center justify-center gap-1.5">
            {isListening ? (
              <>
                <Volume2 className="w-4 h-4 text-primary animate-pulse" />
                <span>{title}</span>
              </>
            ) : (
              <span>Voice Search</span>
            )}
          </h3>

          <p className="text-xs text-muted-foreground">
            {isListening ? "Boliyega... I am listening" : "Tap the mic icon above to speak"}
          </p>
        </div>

        {/* Audio Waveform Indicator */}
        {isListening && (
          <div className="flex items-center justify-center gap-1 h-8">
            <span className="w-1 bg-primary rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3" />
            <span className="w-1 bg-primary rounded-full animate-[pulse_0.4s_ease-in-out_infinite_0.1s] h-6" />
            <span className="w-1 bg-primary rounded-full animate-[pulse_0.7s_ease-in-out_infinite_0.2s] h-8" />
            <span className="w-1 bg-primary rounded-full animate-[pulse_0.5s_ease-in-out_infinite_0.15s] h-5" />
            <span className="w-1 bg-primary rounded-full animate-[pulse_0.6s_ease-in-out_infinite_0.3s] h-3" />
          </div>
        )}

        {/* Live Transcript Bubble */}
        <div className="min-h-[48px] p-3 rounded-2xl bg-muted/60 border border-border flex items-center justify-center">
          {transcript || interim ? (
            <p className="text-sm font-semibold text-foreground italic">
              "{transcript || interim}"
            </p>
          ) : (
            <p className="text-xs text-muted-foreground italic">{placeholderHint}</p>
          )}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
            {errorMsg}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center justify-center gap-2 pt-1">
          {transcript && (
            <button
              type="button"
              onClick={() => {
                onTranscript(transcript.trim());
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition cursor-pointer"
            >
              Search "{transcript.slice(0, 15)}..."
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80 transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceSearchModal;
