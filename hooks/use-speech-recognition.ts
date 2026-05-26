"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  interim: string;
  start: () => void;
  stop: () => void;
  reset: () => void;
  error: string | null;
}

/**
 * Wraps the browser's native SpeechRecognition API.
 * Works in Chrome / Edge / Safari (uses webkitSpeechRecognition prefix when needed).
 * Returns flags + transcript text suitable for binding to an input field.
 */
export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const { lang = "en-US", continuous = false, interimResults = true, onResult, onError } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    const rec = new SR();
    rec.lang = lang;
    rec.continuous = continuous;
    rec.interimResults = interimResults;

    rec.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interimText += res[0].transcript;
      }
      if (finalText) {
        setTranscript((prev) => (prev ? prev + " " + finalText.trim() : finalText.trim()));
        onResult?.(finalText.trim(), true);
      }
      setInterim(interimText);
      if (interimText) onResult?.(interimText.trim(), false);
    };

    rec.onerror = (event: any) => {
      const msg = event?.error || "unknown speech recognition error";
      setError(msg);
      onError?.(msg);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
      setInterim("");
    };

    recognitionRef.current = rec;

    return () => {
      try {
        rec.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, [lang, continuous, interimResults, onResult, onError]);

  const start = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    setError(null);
    setTranscript("");
    setInterim("");
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      // Calling start() twice throws — swallow it.
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [isListening]);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      // ignore
    }
    setIsListening(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setInterim("");
    setError(null);
  }, []);

  return { isSupported, isListening, transcript, interim, start, stop, reset, error };
}
