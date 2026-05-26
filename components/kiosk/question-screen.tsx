"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Volume2,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  SkipForward,
  CheckCircle,
  Save,
  RefreshCw,
  Pause,
  Mic,
  MicOff,
} from "lucide-react";
import { Question, Language } from "@/types/kiosk-interview";
import { cn } from "@/lib/utils";
import { OnScreenKeyboard } from "@/components/kiosk/on-screen-keyboard";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { normalizeDate, formatDateInput } from "@/lib/date-utils";

interface QuestionScreenProps {
  question: Question;
  answer: any;
  language: Language;
  onAnswer: (value: any) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
  onHelp?: () => void;
  onAudio?: () => void;
  onPause?: () => void;
  isSaving?: boolean;
  lastSaved?: Date | null;
  applicationId?: string | null;
  progress: {
    current: number;
    total: number;
    sectionProgress: number;
    sectionTotal: number;
  };
}

const iconMap: Record<string, string> = {
  // Basic icons
  user: "👤",
  male: "👨",
  female: "👩",
  calendar: "📅",
  shield: "🛡️",
  globe: "🌍",
  fileText: "📄",
  idCard: "🪪",
  heart: "❤️",
  scale: "⚖️",
  users: "👥",
  home: "🏠",
  building: "🏢",
  phone: "📞",
  smartphone: "📱",
  messageSquare: "💬",
  mail: "✉️",
  mapPin: "📍",
  map: "🗺️",
  stethoscope: "🩺",
  hospital: "🏥",
  graduationCap: "🎓",
  wifi: "📶",
  printer: "🖨️",
  video: "📹",
  book: "📚",
  penTool: "✍️",
  baby: "👶",
  car: "🚗",
  bus: "🚌",
  footprints: "👣",
  
  // Additional representative icons
  flag: "🏳️",
  "file-x": "📋",
  "heart-off": "💔",
  x: "❌",
  dollar: "💵",
  percent: "📊",
  check: "✅",
  alert: "⚠️",
  info: "ℹ️",
  star: "⭐",
  clock: "🕐",
  key: "🔑",
  lock: "🔒",
  unlock: "🔓",
  camera: "📷",
  fingerprint: "👆",
  signature: "✍️",
  document: "📃",
  folder: "📁",
  briefcase: "💼",
  medical: "⚕️",
  pill: "💊",
  crutch: "🩼",
  wheelchair: "♿",
  eye: "👁️",
  ear: "👂",
  mouth: "👄",
  hand: "✋",
  family: "👨‍👩‍👧‍👦",
  child: "🧒",
  teen: "🧑",
  adult: "👱",
  senior: "👴",
  pregnant: "🤰",
};

const TEXT_INPUTS = new Set(["text", "phone", "currency"]);

export function QuestionScreen({
  question,
  answer,
  language,
  onAnswer,
  onNext,
  onBack,
  onSkip,
  onHelp,
  onAudio,
  onPause,
  isSaving,
  lastSaved,
  applicationId,
  progress,
}: QuestionScreenProps) {
  // Re-init local state whenever the question id changes — prevents the
  // previous question's value from leaking into the next screen.
  const [localValue, setLocalValue] = useState<any>(answer ?? "");
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(answer ?? "");
  }, [question.id, answer]);

  // ----- Voice-to-text -----
  const speech = useSpeechRecognition({
    lang: language === "spanish" ? "es-ES" : "en-US",
    continuous: false,
    interimResults: true,
    onResult: (text, isFinal) => {
      if (!isFinal) return;
      // Append final transcript to current value (with a space if needed).
      setLocalValue((prev: any) => {
        const base = String(prev ?? "").trim();
        const cleaned = text.trim();
        if (!cleaned) return prev;
        return base ? `${base} ${cleaned}` : cleaned;
      });
    },
  });

  const toggleMic = () => {
    if (speech.isListening) {
      speech.stop();
    } else {
      // Clear any previous error so the user can retry after granting permission
      if (speech.error) speech.reset?.();
      speech.start();
    }
  };

  const commit = (value: any) => {
    setLocalValue(value);
    onAnswer(value);
  };

  const handleNext = () => {
    onAnswer(localValue);
    onNext();
  };

  const handleOptionSelect = (value: string) => {
    if (question.inputType === "multi_select") {
      const arr = Array.isArray(localValue) ? localValue : [];
      const next = arr.includes(value) ? arr.filter((v: string) => v !== value) : [...arr, value];
      commit(next);
    } else {
      commit(value);
    }
  };

  // ----- Keyboard handlers -----
  const kbPress = (k: string) => {
    let v = String(localValue ?? "");
    if (question.inputType === "phone") {
      const digits = (v + k).replace(/\D/g, "").slice(0, 10);
      v = digits;
      if (digits.length > 3) v = digits.slice(0, 3) + "-" + digits.slice(3);
      if (digits.length > 6) v = digits.slice(0, 3) + "-" + digits.slice(3, 6) + "-" + digits.slice(6);
    } else if (question.inputType === "date") {
      v = formatDateInput(v + k);
    } else if (question.id === "demographics_ssn") {
      const digits = (v + k).replace(/\D/g, "").slice(0, 9);
      v = digits;
      if (digits.length >= 3) v = digits.slice(0, 3) + "-" + digits.slice(3);
      if (digits.length >= 5) v = v.slice(0, 6) + "-" + digits.slice(5, 9);
    } else if (question.id === "demographics_taxId") {
      // Allow alphanumeric, max 20 chars
      v = (v + k).replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);
    } else {
      v = v + k;
    }
    setLocalValue(v);
  };

  const kbBackspace = () => {
    const v = String(localValue ?? "");
    setLocalValue(v.slice(0, -1));
  };

  const kbClear = () => setLocalValue("");

  const icon = iconMap[question.icon || ""] || "❓";

  // ----- Render input -----
  const renderInput = () => {
    switch (question.inputType) {
      case "text":
        // Special handling for SSN field
        if (question.id === "demographics_ssn") {
          const formatSSN = (value: string) => {
            const digits = value.replace(/\D/g, "").slice(0, 9);
            let formatted = digits;
            if (digits.length >= 3) formatted = digits.slice(0, 3) + "-" + digits.slice(3);
            if (digits.length >= 5) formatted = formatted.slice(0, 6) + "-" + digits.slice(5, 9);
            return formatted;
          };

          return (
            <Input
              ref={inputRef}
              value={localValue}
              onChange={(e) => setLocalValue(formatSSN(e.target.value))}
              placeholder="XXX-XX-XXXX"
              maxLength={10}
              className="text-3xl h-20"
            />
          );
        }

        // Special handling for Tax ID field
        if (question.id === "demographics_taxId") {
          const formatTaxId = (value: string) => {
            // Allow only alphanumeric characters, max 20 chars
            return value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);
          };

          return (
            <Input
              ref={inputRef}
              value={localValue}
              onChange={(e) => setLocalValue(formatTaxId(e.target.value))}
              placeholder={language === "english" ? question.helperTextEn : question.helperTextEs}
              maxLength={20}
              className="text-3xl h-20"
            />
          );
        }

        return (
          <Input
            ref={inputRef}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            placeholder={language === "english" ? question.helperTextEn : question.helperTextEs}
            className="text-3xl h-20"
          />
        );

      case "phone":
        return (
          <Input
            ref={inputRef}
            value={localValue}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
              let f = cleaned;
              if (cleaned.length > 3) f = cleaned.slice(0, 3) + "-" + cleaned.slice(3);
              if (cleaned.length > 6)
                f = cleaned.slice(0, 3) + "-" + cleaned.slice(3, 6) + "-" + cleaned.slice(6);
              setLocalValue(f);
            }}
            placeholder="XXX-XXX-XXXX"
            className="text-3xl h-20"
          />
        );

      case "date":
        return (
          <Input
            type="text"
            value={localValue}
            placeholder="MM/DD/YYYY"
            maxLength={10}
            className="text-3xl h-20"
            onChange={(e) => setLocalValue(formatDateInput(e.target.value))}
            onBlur={() => {
              const normalized = normalizeDate(localValue);
              setLocalValue(normalized ?? "");
              onAnswer(normalized);
            }}
          />
        );

      case "currency":
        return (
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl text-gray-500">$</span>
            <Input
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="0.00"
              className="text-3xl h-20 pl-12"
            />
          </div>
        );

      case "single_select":
        const cols = question.options?.length === 3 ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-2";
        return (
          <div className={`grid ${cols} gap-3`}>
            {question.options?.map((option) => (
              <Button
                key={option.value}
                variant={localValue === option.value ? "default" : "outline"}
                size="lg"
                onClick={() => handleOptionSelect(option.value)}
                className="h-24 flex-col gap-1 text-lg whitespace-normal"
              >
                <span className="text-6xl">{iconMap[option.icon || ""] || "📋"}</span>
                <span className="font-medium">
                  {language === "english" ? option.labelEn : option.labelEs}
                </span>
              </Button>
            ))}
          </div>
        );

      case "multi_select":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {question.options?.map((option) => {
              const active = Array.isArray(localValue) && localValue.includes(option.value);
              return (
                <Button
                  key={option.value}
                  variant={active ? "default" : "outline"}
                  size="lg"
                  onClick={() => handleOptionSelect(option.value)}
                  className="h-24 flex-col gap-1 text-lg whitespace-normal"
                >
                  <span className="text-6xl">{iconMap[option.icon || ""] || "📋"}</span>
                  <span className="font-medium">
                    {language === "english" ? option.labelEn : option.labelEs}
                  </span>
                  {active && <CheckCircle className="h-4 w-4" />}
                </Button>
              );
            })}
          </div>
        );

      case "yes_no":
        return (
          <div className="flex gap-4">
            <Button
              variant={localValue === "yes" ? "default" : "outline"}
              size="lg"
              onClick={() => commit("yes")}
              className="flex-1 h-32 flex-col gap-2 text-2xl"
            >
              <span className="text-5xl">👍</span>
              <span className="font-medium">{language === "english" ? "Yes" : "Sí"}</span>
            </Button>
            <Button
              variant={localValue === "no" ? "default" : "outline"}
              size="lg"
              onClick={() => commit("no")}
              className="flex-1 h-32 flex-col gap-2 text-2xl"
            >
              <span className="text-5xl">👎</span>
              <span className="font-medium">No</span>
            </Button>
          </div>
        );

      case "checkbox":
        return (
          <Button
            variant={localValue ? "default" : "outline"}
            size="lg"
            onClick={() => commit(!localValue)}
            className="h-24 w-full flex-col gap-2"
          >
            <span className="text-4xl">{localValue ? "✅" : "⬜"}</span>
            <span className="text-xl font-medium">
              {language === "english" ? "I Acknowledge" : "Reconozco"}
            </span>
          </Button>
        );

      default:
        return (
          <Input
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            className="text-3xl h-20"
          />
        );
    }
  };

  const showKeyboard = TEXT_INPUTS.has(question.inputType) || question.inputType === "date";
  const kbLayout =
    question.inputType === "phone"
      ? "phone"
      : question.inputType === "date"
      ? "date"
      : question.inputType === "currency"
      ? "numeric"
      : question.id === "demographics_address_zip" || question.id === "demographics_mailingAddress_zip"
      ? "numeric"
      : "alpha";

  return (
    <div className="min-h-[calc(100vh-3rem)] w-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Full-bleed content card */}
      <div className="flex-1 flex flex-col p-4 sm:p-8 max-w-7xl mx-auto w-full">
        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>
              {language === "english" ? "Question" : "Pregunta"} {progress.current} of {progress.total}
            </span>
            <span>
              {language === "english" ? "Section" : "Sección"} {progress.sectionProgress}/{progress.sectionTotal}
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="text-5xl shrink-0">{icon}</div>
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              {language === "english" ? question.labelEn : question.labelEs}
            </h2>
            {(question.helperTextEn || question.helperTextEs) && (
              <p className="text-base text-gray-600">
                {language === "english" ? question.helperTextEn : question.helperTextEs}
              </p>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            {onAudio && (
              <Button variant="ghost" size="icon" onClick={onAudio} title="Read aloud">
                <Volume2 className="h-5 w-5" />
              </Button>
            )}
            {onHelp && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHelp(!showHelp)}
                title="Help"
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {showHelp && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-semibold text-amber-800">
              {language === "english" ? "Help:" : "Ayuda:"}
            </p>
            <div className="text-sm text-amber-700 mt-1 space-y-2">
              {question.inputType === "text" && speech.isSupported && (
                <div>
                  <p className="font-medium">
                    {language === "english" ? "Microphone Instructions:" : "Instrucciones del micrófono:"}
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>
                      {language === "english"
                        ? "Click 'Speak' and allow microphone access when prompted"
                        : "Haga clic en 'Hablar' y permita el acceso al micrófono cuando se le solicite"}
                    </li>
                    <li>
                      {language === "english"
                        ? "If denied, click the lock icon in the address bar to allow mic"
                        : "Si se deniega, haga clic en el ícono de bloqueo en la barra de direcciones para permitir el micrófono"}
                    </li>
                    <li>
                      {language === "english"
                        ? "Then tap 'Speak' again to use voice input"
                        : "Luego toque 'Hablar' de nuevo para usar la entrada de voz"}
                    </li>
                  </ul>
                </div>
              )}
              <p>
                {language === "english"
                  ? question.helpExplanationEn ||
                    "Please answer this question to the best of your ability."
                  : question.helpExplanationEs ||
                    "Por favor responda esta pregunta lo mejor que pueda."}
              </p>
            </div>
          </div>
        )}

        {/* Voice-to-text bar — text inputs only */}
        {question.inputType === "text" && speech.isSupported && (
          <div className="mb-3 flex items-center gap-3">
            <Button
              type="button"
              variant={speech.isListening ? "default" : "outline"}
              size="lg"
              onClick={toggleMic}
              className={cn(
                "h-14 px-5",
                speech.isListening && "bg-red-600 hover:bg-red-700 animate-pulse"
              )}
            >
              {speech.isListening ? (
                <>
                  <MicOff className="h-5 w-5 mr-2" />
                  {language === "english" ? "Stop" : "Detener"}
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5 mr-2" />
                  {language === "english" ? "Speak" : "Hablar"}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowHelp(true)}
              className="h-14 w-14"
              title={language === "english" ? "How to enable microphone" : "Cómo habilitar el micrófono"}
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
            {speech.isListening && (
              <span className="text-sm text-gray-600 italic">
                {language === "english" ? "Listening…" : "Escuchando…"}
                {speech.interim && (
                  <span className="ml-2 text-gray-900">&ldquo;{speech.interim}&rdquo;</span>
                )}
              </span>
            )}
            {speech.error && (
              <div className="text-sm text-red-600">
                <p className="font-medium">
                  {language === "english" ? "Microphone access needed" : "Se necesita acceso al micrófono"}
                </p>
                <p className="text-xs mt-1">
                  {speech.error === "not-allowed"
                    ? language === "english"
                      ? "Allow mic in your browser settings, then tap Speak again."
                      : "Permita el micrófono en la configuración del navegador y toque Hablar de nuevo."
                    : `${language === "english" ? "Error: " : "Error: "}${speech.error}`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Input area */}
        <div className="mb-4">
          {renderInput()}
          {question.inputType === "date" && localValue && normalizeDate(localValue) === null && (
            <p className="text-sm text-red-600 mt-2">
              {language === "english"
                ? "Please enter a valid date (MM/DD/YYYY)."
                : "Por favor ingrese una fecha válida (MM/DD/YYYY)."}
            </p>
          )}
        </div>

        {/* On-screen keyboard */}
        {showKeyboard && (
          <div className="mb-4">
            <OnScreenKeyboard
              layout={kbLayout as any}
              onKeyPress={kbPress}
              onBackspace={kbBackspace}
              onClear={kbClear}
            />
          </div>
        )}

        {/* Save status */}
        {(applicationId || isSaving) && (
          <div className="mb-4 p-3 bg-white border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-gray-600">
                      {language === "english" ? "Saving..." : "Guardando..."}
                    </span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">
                      {language === "english" ? "Saved" : "Guardado"}
                      {lastSaved && ` ${lastSaved.toLocaleTimeString()}`}
                    </span>
                  </>
                )}
              </div>
              {applicationId && (
                <span className="text-xs text-gray-500">ID: {applicationId.slice(-8)}</span>
              )}
            </div>
          </div>
        )}

        {/* Navigation — pinned to bottom of the card via mt-auto */}
        <div className="flex gap-3 mt-auto pt-2">
          <Button variant="outline" size="lg" onClick={onBack} className="h-14 px-5 text-base">
            <ArrowLeft className="h-5 w-5 mr-2" />
            {language === "english" ? "Back" : "Atrás"}
          </Button>
          {onPause && applicationId && (
            <Button
              variant="outline"
              size="lg"
              onClick={onPause}
              className="h-14 px-5 text-base text-orange-700 border-orange-300"
            >
              <Pause className="h-5 w-5 mr-2" />
              {language === "english" ? "Pause" : "Pausar"}
            </Button>
          )}
          {onSkip && !question.required && (
            <Button variant="outline" size="lg" onClick={onSkip} className="h-14 px-5 text-base">
              <SkipForward className="h-5 w-5 mr-2" />
              {language === "english" ? "Skip" : "Saltar"}
            </Button>
          )}
          <Button
            variant="outline"
            size="lg"
            onClick={handleNext}
            disabled={question.required && !localValue}
            className="flex-1 h-14 text-base font-semibold border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
          >
            {language === "english" ? "Next" : "Siguiente"}
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
