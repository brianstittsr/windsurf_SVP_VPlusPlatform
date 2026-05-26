"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Languages, Clock, CheckCircle, ArrowRight } from "lucide-react";
import { Language } from "@/types/kiosk-interview";

interface WelcomeScreenProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onBegin: () => void;
}

export function WelcomeScreen({ language, onLanguageChange, onBegin }: WelcomeScreenProps) {
  const sections = [
    { id: "demographics", labelEn: "Patient Information", labelEs: "Información del Paciente" },
    { id: "additionalQuestions", labelEn: "Additional Questions", labelEs: "Preguntas Adicionales" },
    { id: "incomeInfo", labelEn: "Income Information", labelEs: "Información de Ingresos" },
    { id: "housingInfo", labelEn: "Housing Information", labelEs: "Información de Vivienda" },
    { id: "householdInfo", labelEn: "Household Information", labelEs: "Información del Hogar" },
    { id: "attestation", labelEn: "Attestation", labelEs: "Declaración" },
    { id: "signature", labelEn: "Signature", labelEs: "Firma" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="max-w-2xl w-full">
        <CardContent className="pt-8 pb-8">
          {/* Language Selection */}
          <div className="flex justify-center gap-4 mb-8">
            <Button
              variant={language === "english" ? "default" : "outline"}
              size="lg"
              onClick={() => onLanguageChange("english")}
              className="flex-1"
            >
              <Languages className="h-5 w-5 mr-2" />
              English
            </Button>
            <Button
              variant={language === "spanish" ? "default" : "outline"}
              size="lg"
              onClick={() => onLanguageChange("spanish")}
              className="flex-1"
            >
              <Languages className="h-5 w-5 mr-2" />
              Español
            </Button>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {language === "english" ? "Welcome to Urban Ministries" : "Bienvenido a Urban Ministries"}
            </h1>
            <p className="text-lg text-gray-600">
              {language === "english"
                ? "Patient Intake Interview"
                : "Entrevista de Ingreso del Paciente"}
            </p>
          </div>

          {/* Time Estimate */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-3">
              <Clock className="h-6 w-6 text-blue-600" />
              <div className="text-center">
                <p className="text-sm text-blue-800 font-medium">
                  {language === "english"
                    ? "This interview takes approximately 15-20 minutes"
                    : "Esta entrevista toma aproximadamente 15-20 minutos"}
                </p>
              </div>
            </div>
          </div>

          {/* Section Overview */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 text-center">
              {language === "english" ? "You will complete 7 sections:" : "Completará 7 secciones:"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sections.map((section, i) => (
                <div
                  key={section.id}
                  className="flex items-center gap-2 text-sm p-2 rounded bg-gray-50"
                >
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                  <span className="text-gray-700">
                    {language === "english" ? section.labelEn : section.labelEs}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-semibold text-amber-800">
              {language === "english" ? "Tips:" : "Consejos:"}
            </p>
            <ul className="mt-2 space-y-1 text-sm text-amber-700">
              <li>
                • {language === "english" ? "Answer one question at a time" : "Responda una pregunta a la vez"}
              </li>
              <li>
                • {language === "english" ? "Tap buttons or type your answers" : "Toque botones o escriba sus respuestas"}
              </li>
              <li>
                • {language === "english" ? "You can skip optional questions" : "Puede omitir preguntas opcionales"}
              </li>
              <li>
                • {language === "english" ? "Ask staff for help if needed" : "Pida ayuda al personal si es necesario"}
              </li>
            </ul>
          </div>

          {/* Begin Button */}
          <Button
            size="lg"
            onClick={onBegin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
          >
            {language === "english" ? "Begin Interview" : "Comenzar Entrevista"}
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>

          {/* Privacy Notice */}
          <p className="text-xs text-gray-500 text-center mt-4">
            {language === "english"
              ? "Your information is kept confidential and secure."
              : "Su información se mantiene confidencial y segura."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
