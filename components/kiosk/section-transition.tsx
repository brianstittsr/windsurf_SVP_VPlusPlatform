"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Clock } from "lucide-react";
import { Language } from "@/types/kiosk-interview";

interface SectionTransitionProps {
  sectionName: string;
  remainingSections: number;
  language: Language;
  onNext: () => void;
  autoAdvance?: boolean;
}

export function SectionTransition({
  sectionName,
  remainingSections,
  language,
  onNext,
  autoAdvance = true,
}: SectionTransitionProps) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!autoAdvance) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onNext();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoAdvance, onNext]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {language === "english" ? "Section Complete!" : "¡Sección Completada!"}
          </h1>

          {/* Section Name */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-lg text-green-800 font-medium">{sectionName}</p>
          </div>

          {/* Next Section Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <p className="text-sm text-blue-800 font-medium">
                {language === "english"
                  ? `Next: ${remainingSections > 0 ? "Next Section" : "Signature"}`
                  : `Siguiente: ${remainingSections > 0 ? "Próxima Sección" : "Firma"}`}
              </p>
            </div>
            <p className="text-sm text-blue-700">
              {language === "english"
                ? `${remainingSections} section${remainingSections !== 1 ? "s" : ""} remaining`
                : `${remainingSections} sección${remainingSections !== 1 ? "es" : ""} restante${remainingSections !== 1 ? "s" : ""}`}
              </p>
          </div>

          {/* Countdown or Manual Continue */}
          {autoAdvance ? (
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {language === "english" ? "Continuing in" : "Continuando en"} {countdown}...
              </p>
            </div>
          ) : (
            <Button
              size="lg"
              onClick={onNext}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {language === "english" ? "Continue" : "Continuar"}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
