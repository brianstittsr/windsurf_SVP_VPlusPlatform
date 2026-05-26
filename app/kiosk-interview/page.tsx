"use client";

import { useState, useEffect } from "react";
import { WelcomeScreen } from "@/components/kiosk/welcome-screen";
import { QuestionScreen } from "@/components/kiosk/question-screen";
import { SectionTransition } from "@/components/kiosk/section-transition";
import { AttestationScreen } from "@/components/kiosk/attestation-screen";
import { SignaturePad } from "@/components/kiosk/signature-pad";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, Loader2, Save, RefreshCw } from "lucide-react";
import { Language, InterviewState, Question } from "@/types/kiosk-interview";
import { sections, getAllQuestions } from "@/lib/kiosk-interview-questions";
import { attestationParagraphs } from "@/lib/kiosk-attestation-content";
import { KioskSpaApplicationDoc } from "@/lib/schema";
import { useKioskPersistence } from "@/hooks/use-kiosk-persistence";
import { QaDebugPanel } from "@/components/kiosk/qa-debug-panel";

export default function KioskInterviewPage() {
  const {
    state,
    setState,
    saveProgress,
    loadProgress,
    isSaving,
    lastSaved,
    applicationId,
    createNewApplication,
  } = useKioskPersistence();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allQuestions = getAllQuestions();
  const currentSection = sections[state.currentSectionIndex];
  const currentQuestion = currentSection?.questions[state.currentQuestionIndex];
  const totalQuestions = allQuestions.length;
  const totalSections = sections.length;

  // Calculate progress
  const globalQuestionIndex = sections
    .slice(0, state.currentSectionIndex)
    .reduce((sum, s) => sum + s.questions.length, 0) + state.currentQuestionIndex;

  const handleLanguageChange = (lang: Language) => {
    setState((prev) => ({ ...prev, language: lang }));
  };

  const handleBegin = async () => {
    if (!applicationId) {
      await createNewApplication();
    }
    setState((prev) => ({ ...prev, status: "interview" }));
  };

  const handleAnswer = (value: any) => {
    if (!currentQuestion) return;
    const fieldPath = currentQuestion.fieldPath;
    setState((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [fieldPath]: value,
      },
    }));
  };

  const handleNext = () => {
    setState((prev) => {
      const section = sections[prev.currentSectionIndex];
      if (!section) return prev;

      // End of section?
      if (prev.currentQuestionIndex >= section.questions.length - 1) {
        const nextSectionIndex = prev.currentSectionIndex + 1;
        if (nextSectionIndex >= sections.length) {
          // All sections complete
          return {
            ...prev,
            completedSections: [...prev.completedSections, section.id],
            status: "attestation",
          };
        }
        return {
          ...prev,
          completedSections: [...prev.completedSections, section.id],
          currentSectionIndex: nextSectionIndex,
          currentQuestionIndex: 0,
          status: "section_transition",
        };
      }
      return { ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 };
    });
  };

  const handleBack = () => {
    setState((prev) => {
      if (prev.currentQuestionIndex > 0) {
        return { ...prev, currentQuestionIndex: prev.currentQuestionIndex - 1 };
      }
      if (prev.currentSectionIndex > 0) {
        const prevSection = sections[prev.currentSectionIndex - 1];
        return {
          ...prev,
          currentSectionIndex: prev.currentSectionIndex - 1,
          currentQuestionIndex: prevSection.questions.length - 1,
          completedSections: prev.completedSections.filter((id) => id !== prevSection.id),
        };
      }
      return prev;
    });
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleSectionTransitionComplete = () => {
    setState((prev) => ({ ...prev, status: "interview" }));
  };

  const handleAttestationComplete = () => {
    setState((prev) => {
      const idx = prev.completedSections.filter((s) => s.startsWith("attestation_")).length;
      if (idx >= attestationParagraphs.length) {
        return { ...prev, status: "signature" };
      }
      return {
        ...prev,
        completedSections: [...prev.completedSections, `attestation_${idx}`],
      };
    });
  };

  const handleSignatureComplete = async (signatureDataUrl: string) => {
    setLoading(true);
    try {
      // Save application to API
      const response = await fetch("/api/kiosk/spa-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: state.answers,
          signatureDataUrl,
          language: state.language,
          completedSections: state.completedSections,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setState({
          ...state,
          status: "completed",
        });
      } else {
        setError(data.error || "Failed to save application");
      }
    } catch (err) {
      setError("Failed to save application");
    } finally {
      setLoading(false);
    }
  };

  const handleAudio = () => {
    // Use SpeechSynthesis API to read the question aloud
    if ("speechSynthesis" in window && currentQuestion) {
      const text = state.language === "english" ? currentQuestion.labelEn : currentQuestion.labelEs;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = state.language === "english" ? "en-US" : "es-US";
      speechSynthesis.speak(utterance);
    }
  };

  const handleHelp = () => {
    // Show help overlay - for now just alert
    const helpText = state.language === "english"
      ? currentQuestion?.helpExplanationEn || "Please answer this question to the best of your ability."
      : currentQuestion?.helpExplanationEs || "Por favor responda esta pregunta lo mejor que pueda.";
    alert(helpText);
  };

  const handlePause = async () => {
    if (!applicationId) return;
    
    // Save current progress
    await saveProgress();
    
    // Show pause confirmation
    const pauseMessage = state.language === "english"
      ? `Your application has been saved. You can return later using Application ID: ${applicationId.slice(-8)}. Would you like to exit now?`
      : `Su solicitud ha sido guardada. Puede regresar más tarde usando el ID de Solicitud: ${applicationId.slice(-8)}. ¿Desea salir ahora?`;
    
    if (confirm(pauseMessage)) {
      // Redirect to home page
      window.location.href = "/";
    }
  };

  // Get current attestation paragraph
  const currentAttestationIndex = state.completedSections.filter((s) => s.startsWith("attestation_")).length;
  const currentAttestation = attestationParagraphs[currentAttestationIndex];

  return (
    <div className="min-h-screen pb-12">
      {/* Welcome Screen */}
      {state.status === "welcome" && (
        <WelcomeScreen
          language={state.language}
          onLanguageChange={handleLanguageChange}
          onBegin={handleBegin}
        />
      )}

      {/* Question Screen */}
      {state.status === "interview" && currentQuestion && (
        <QuestionScreen
          key={currentQuestion.id}
          question={currentQuestion}
          answer={state.answers[currentQuestion.fieldPath]}
          language={state.language}
          onAnswer={handleAnswer}
          onNext={handleNext}
          onBack={handleBack}
          onSkip={currentQuestion.required ? undefined : handleSkip}
          onHelp={handleHelp}
          onAudio={handleAudio}
          onPause={handlePause}
          isSaving={isSaving}
          lastSaved={lastSaved}
          applicationId={applicationId}
          progress={{
            current: globalQuestionIndex + 1,
            total: totalQuestions,
            sectionProgress: state.currentQuestionIndex + 1,
            sectionTotal: currentSection.questions.length,
          }}
        />
      )}

      {/* Section Transition */}
      {state.status === "section_transition" && currentSection && (
        <SectionTransition
          sectionName={state.language === "english" ? currentSection.titleEn : currentSection.titleEs}
          remainingSections={totalSections - state.currentSectionIndex - 1}
          language={state.language}
          onNext={handleSectionTransitionComplete}
          autoAdvance={true}
        />
      )}

      {/* Attestation Screen */}
      {state.status === "attestation" && currentAttestation && (
        <AttestationScreen
          paragraph={currentAttestation}
          language={state.language}
          onAcknowledge={handleAttestationComplete}
          onAudio={handleAudio}
        />
      )}

      {/* Signature Screen */}
      {state.status === "signature" && (
        <SignaturePad
          language={state.language}
          onSignatureComplete={handleSignatureComplete}
          patientId={applicationId || "temp"}
          patientName={`${state.answers["demographics.firstName"] || ""} ${state.answers["demographics.lastName"] || ""}`}
          topazEnabled={true}
          qrEnabled={true}
        />
      )}

      {/* Completion Screen */}
      {state.status === "completed" && (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {state.language === "english" ? "Application Complete!" : "¡Solicitud Completada!"}
              </h1>
              <p className="text-gray-600 mb-6">
                {state.language === "english"
                  ? "Thank you for completing your application. A staff member will be with you shortly."
                  : "Gracias por completar su solicitud. Un miembro del personal estará con usted en breve."}
              </p>
              {applicationId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    {state.language === "english" ? "Application ID:" : "ID de Solicitud:"} {applicationId}
                  </p>
                </div>
              )}
              <Button
                size="lg"
                onClick={() => (window.location.href = "/")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Home className="h-5 w-5 mr-2" />
                {state.language === "english" ? "Return Home" : "Volver al Inicio"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <p className="text-sm">
                {state.language === "english" ? "Saving..." : "Guardando..."}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="fixed bottom-16 right-4 max-w-md z-50">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-4">
              <p className="text-sm text-red-800">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setError(null)}
              >
                {state.language === "english" ? "Dismiss" : "Descartar"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* QA Debug Panel — shows live answers as the user responds */}
      <QaDebugPanel
        answers={state.answers}
        currentField={currentQuestion?.fieldPath}
      />
    </div>
  );
}
