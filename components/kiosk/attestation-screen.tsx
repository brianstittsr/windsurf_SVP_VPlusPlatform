"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Volume2, CheckCircle, ScrollText } from "lucide-react";
import { Language, AttestationParagraph } from "@/types/kiosk-interview";

interface AttestationScreenProps {
  paragraph: AttestationParagraph;
  language: Language;
  onAcknowledge: () => void;
  onAudio?: () => void;
}

export function AttestationScreen({ paragraph, language, onAcknowledge, onAudio }: AttestationScreenProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  const handleAcknowledge = () => {
    setAcknowledged(true);
    onAcknowledge();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <Card className="max-w-3xl w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ScrollText className="h-6 w-6 text-purple-600" />
              <CardTitle className="text-xl">
                {language === "english" ? "Attestation" : "Declaración"}
              </CardTitle>
            </div>
            {onAudio && (
              <Button variant="outline" size="sm" onClick={onAudio}>
                <Volume2 className="h-4 w-4 mr-2" />
                {language === "english" ? "Listen" : "Escuchar"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Spanish Text */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <p className="text-sm text-blue-600 font-medium mb-3">
              {language === "english" ? "Spanish / Español:" : "Español:"}
            </p>
            <p className="text-lg text-gray-900 leading-relaxed">{paragraph.spanish}</p>
          </div>

          {/* English Translation */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
            <p className="text-sm text-gray-600 font-medium mb-3">
              {language === "english" ? "English Translation:" : "Traducción al Inglés:"}
            </p>
            <p className="text-base text-gray-700 leading-relaxed">{paragraph.english}</p>
          </div>

          {/* Acknowledge Button */}
          <Button
            size="lg"
            onClick={handleAcknowledge}
            disabled={acknowledged}
            className="w-full bg-purple-600 hover:bg-purple-700 py-6 text-lg"
          >
            {acknowledged ? (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                {language === "english" ? "Acknowledged" : "Reconocido"}
              </>
            ) : (
              <>
                {language === "english" ? "I Understand / Entiendo" : "Entiendo / I Understand"}
              </>
            )}
          </Button>

          {/* Helper Text */}
          <p className="text-xs text-gray-500 text-center">
            {language === "english"
              ? "By tapping the button above, you acknowledge that you have read and understand this policy."
              : "Al tocar el botón de arriba, reconoce que ha leído y entiende esta política."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
