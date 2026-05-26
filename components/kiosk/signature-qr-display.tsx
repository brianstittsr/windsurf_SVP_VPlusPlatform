"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, QrCode, CheckCircle, RefreshCw, Smartphone, Clock } from "lucide-react";

interface SignatureQRDisplayProps {
  patientId: string;
  patientName: string;
  language?: "english" | "spanish";
  onSignatureComplete?: (signatureDataUrl: string) => void;
  onCancel?: () => void;
  sessionId?: string;
  applicationId?: string;
}

export function SignatureQRDisplay({
  patientId,
  patientName,
  language = "english",
  onSignatureComplete,
  onCancel,
  sessionId,
  applicationId,
}: SignatureQRDisplayProps) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signed, setSigned] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate signature session and QR code
  const generateSession = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/kiosk/signature-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          sessionId,
          applicationId,
          patientName,
          language,
          createdBy: "kiosk",
        }),
      });

      const data = await res.json();
      if (res.ok && data.data?.signatureUrl) {
        setQrUrl(data.data.signatureUrl);
        startPolling(data.data.id);
        startCountdown();
      } else {
        setError(data.error || "Failed to generate signature link");
      }
    } catch (err) {
      setError("Unable to generate signature link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Poll for signature completion
  const startPolling = (sessionId: string) => {
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/kiosk/signature-sessions?patientId=${patientId}&status=signed`);
        const data = await res.json();
        const signedSession = data.data?.find((s: any) => s.id === sessionId);

        if (signedSession?.signatureDataUrl) {
          setSigned(true);
          stopPolling();
          stopCountdown();
          onSignatureComplete?.(signedSession.signatureDataUrl);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000); // Poll every 2 seconds
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Countdown timer
  const startCountdown = () => {
    countdownIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          stopCountdown();
          setError("Session expired. Please generate a new link.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  useEffect(() => {
    generateSession();

    return () => {
      stopPolling();
      stopCountdown();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-blue-600" />
              Sign on Your Phone
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {language === "spanish" ? "Firme en su teléfono" : "Scan to sign on your device"}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Badge variant={timeRemaining < 60 ? "destructive" : "outline"}>
              {formatTime(timeRemaining)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
            <p className="text-sm text-muted-foreground">
              {language === "spanish" ? "Generando código QR..." : "Generating QR code..."}
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-sm text-red-600 mb-3">{error}</p>
            <Button
              variant="outline"
              onClick={generateSession}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {language === "spanish" ? "Intentar de nuevo" : "Try Again"}
            </Button>
          </div>
        ) : signed ? (
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-3" />
            <p className="text-lg font-bold text-gray-900">
              {language === "spanish" ? "¡Firma recibida!" : "Signature Received!"}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              {language === "spanish"
                ? "Su firma ha sido guardada exitosamente."
                : "Your signature has been successfully saved."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* QR Code Display */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                {qrUrl && (
                  <iframe
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrUrl)}`}
                    className="w-64 h-64 border-0"
                    title="Signature QR Code"
                  />
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                <li>
                  {language === "spanish"
                    ? "Abra la cámara de su teléfono"
                    : "Open your phone's camera"}
                </li>
                <li>
                  {language === "spanish"
                    ? "Escanee el código QR arriba"
                    : "Scan the QR code above"}
                </li>
                <li>
                  {language === "spanish"
                    ? "Firme en la pantalla de su teléfono"
                    : "Sign on your phone's screen"}
                </li>
                <li>
                  {language === "spanish"
                    ? "La firma se enviará automáticamente"
                    : "Signature will be submitted automatically"}
                </li>
              </ol>
            </div>

            {/* Alternative Options */}
            <div className="flex flex-col gap-2">
              <p className="text-xs text-center text-muted-foreground">
                {language === "spanish"
                  ? "¿No puede escanear? Use:"
                  : "Can't scan? Use:"}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    if (qrUrl) window.open(qrUrl, "_blank");
                  }}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  {language === "spanish" ? "Abrir enlace" : "Open Link"}
                </Button>
                {onCancel && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancel}
                  >
                    {language === "spanish" ? "Cancelar" : "Cancel"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
