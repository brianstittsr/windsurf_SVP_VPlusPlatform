"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { InterviewState } from "@/types/kiosk-interview";
import { KioskSpaApplicationDoc } from "@/lib/schema";

type SetStateAction<S> = S | ((prev: S) => S);

interface PersistenceHookReturn {
  state: InterviewState;
  setState: (state: SetStateAction<InterviewState>) => void;
  saveProgress: () => Promise<void>;
  loadProgress: (applicationId?: string) => Promise<void>;
  isSaving: boolean;
  lastSaved: Date | null;
  applicationId: string | null;
  createNewApplication: () => Promise<string | null>;
}

export function useKioskPersistence(): PersistenceHookReturn {
  const [state, setState] = useState<InterviewState>({
    currentSectionIndex: 0,
    currentQuestionIndex: 0,
    language: "english",
    answers: {},
    completedSections: [],
    status: "welcome",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save every 30 seconds or when state changes
  const saveProgress = useCallback(async () => {
    if (!applicationId) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/kiosk/spa-application/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewData: state,
          lastUpdated: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save progress");
      }

      setLastSaved(new Date());
    } catch (error) {
      console.error("Error saving progress:", error);
    } finally {
      setIsSaving(false);
    }
  }, [state, applicationId]);

  // Load existing application
  const loadProgress = useCallback(async (appId?: string) => {
    const idToLoad = appId || applicationId;
    if (!idToLoad) return;

    try {
      const response = await fetch(`/api/kiosk/spa-application/${idToLoad}`);
      if (!response.ok) return;

      const { data } = await response.json();
      if (data?.interviewData) {
        setState(data.interviewData);
        setApplicationId(idToLoad);
        setLastSaved(data.lastUpdated ? new Date(data.lastUpdated) : null);
      }
    } catch (error) {
      console.error("Error loading progress:", error);
    }
  }, [applicationId]);

  // Create new application. Fail-soft: never throw — the interview should
  // continue locally even if the backend is unavailable.
  const createNewApplication = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch("/api/kiosk/spa-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "in_progress",
          interviewData: state,
          createdAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        console.warn(
          "[kiosk] could not create application; continuing without persistence.",
          response.status,
          errBody
        );
        return null;
      }

      const { data } = await response.json();
      setApplicationId(data.id);
      return data.id;
    } catch (error) {
      console.warn("[kiosk] could not create application; continuing without persistence.", error);
      return null;
    }
  }, [state]);

  // Auto-save when state changes
  useEffect(() => {
    if (!applicationId) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(() => {
      saveProgress();
    }, 5000); // Save 5 seconds after last change

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state, applicationId, saveProgress]);

  // Periodic auto-save every 30 seconds
  useEffect(() => {
    if (!applicationId) return;

    const interval = setInterval(() => {
      saveProgress();
    }, 30000);

    return () => clearInterval(interval);
  }, [applicationId, saveProgress]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (applicationId && state.status !== "completed") {
        // Use navigator.sendBeacon for reliable saving on page unload
        const data = JSON.stringify({
          interviewData: state,
          lastUpdated: new Date().toISOString(),
        });
        
        const success = navigator.sendBeacon(`/api/kiosk/spa-application/${applicationId}`, new Blob([data], { type: 'application/json' }));
        if (!success) {
          console.warn('Failed to send data via beacon');
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [applicationId, state]);

  // Check for existing application on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const existingAppId = urlParams.get("appId");
    
    if (existingAppId) {
      loadProgress(existingAppId);
    }
  }, [loadProgress]);

  return {
    state,
    setState,
    saveProgress,
    loadProgress,
    isSaving,
    lastSaved,
    applicationId,
    createNewApplication,
  };
}
