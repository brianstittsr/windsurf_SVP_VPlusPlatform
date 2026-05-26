"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PenTool, RefreshCw, Smartphone, QrCode, AlertTriangle, CheckCircle } from "lucide-react";
import { Language } from "@/types/kiosk-interview";
import { SignatureQRDisplay } from "@/components/kiosk/signature-qr-display";

interface SignaturePadProps {
  language: Language;
  onSignatureComplete: (signatureDataUrl: string) => void;
  patientId: string;
  patientName: string;
  sessionId?: string;
  applicationId?: string;
  topazEnabled?: boolean;
  qrEnabled?: boolean;
}

export function SignaturePad({
  language,
  onSignatureComplete,
  patientId,
  patientName,
  sessionId,
  applicationId,
  topazEnabled = true,
  qrEnabled = true,
}: SignaturePadProps) {
  const [mode, setMode] = useState<"topaz" | "canvas" | "qr">("topaz");
  const [topazConnected, setTopazConnected] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Detect Topaz pad
  useEffect(() => {
    if (!topazEnabled) {
      setMode("canvas");
      return;
    }

    // Try to detect SigWeb service (runs on localhost:47289)
    const detectTopaz = async () => {
      try {
        const response = await fetch("http://localhost:47289", {
          method: "GET",
          mode: "no-cors",
        });
        setTopazConnected(true);
        setMode("topaz");
      } catch {
        setTopazConnected(false);
        setMode("canvas");
      }
    };

    detectTopaz();
  }, [topazEnabled]);

  // Canvas drawing handlers (fallback)
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  };

  const captureCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setSignatureData(dataUrl);
    onSignatureComplete(dataUrl);
  };

  // Topaz capture handler
  const captureTopaz = async () => {
    setIsCapturing(true);
    try {
      // Call SigWeb API to capture signature
      // This would use the actual SigWeb SDK - for now, fallback to canvas
      setMode("canvas");
    } catch {
      setMode("canvas");
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PenTool className="h-6 w-6 text-purple-600" />
              <CardTitle>
                {language === "english" ? "Digital Signature" : "Firma Digital"}
              </CardTitle>
            </div>
            {/* Mode Selection */}
            <div className="flex gap-2">
              {topazEnabled && (
                <Button
                  variant={mode === "topaz" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("topaz")}
                  disabled={!topazConnected}
                >
                  <PenTool className="h-4 w-4 mr-1" />
                  {language === "english" ? "Pad" : "Tableta"}
                </Button>
              )}
              <Button
                variant={mode === "canvas" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("canvas")}
              >
                <PenTool className="h-4 w-4 mr-1" />
                {language === "english" ? "Screen" : "Pantalla"}
              </Button>
              {qrEnabled && (
                <Button
                  variant={mode === "qr" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("qr")}
                >
                  <Smartphone className="h-4 w-4 mr-1" />
                  {language === "english" ? "Phone" : "Teléfono"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Topaz Mode */}
          {mode === "topaz" && (
            <div className="space-y-4">
              {topazConnected ? (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <p className="text-lg text-green-800 font-medium mb-2">
                      {language === "english"
                        ? "Please sign on the signature pad"
                        : "Por favor firme en la tableta de firma"}
                    </p>
                    <p className="text-sm text-green-600">
                      {language === "english"
                        ? "Use the stylus to sign your name"
                        : "Use el lápiz para firmar su nombre"}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        // Clear Topaz pad
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {language === "english" ? "Clear" : "Limpiar"}
                    </Button>
                    <Button
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      onClick={captureTopaz}
                      disabled={isCapturing}
                    >
                      {isCapturing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          {language === "english" ? "Capturing..." : "Capturando..."}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {language === "english" ? "Capture" : "Capturar"}
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
                  <AlertTriangle className="h-8 w-8 text-amber-600 mx-auto mb-3" />
                  <p className="text-sm text-amber-800">
                    {language === "english"
                      ? "Signature pad not detected. Please use the screen or phone option."
                      : "Tableta de firma no detectada. Use la pantalla o teléfono."}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Canvas Mode */}
          {mode === "canvas" && (
            <div className="space-y-4">
              <div className="bg-white border-2 border-gray-300 rounded-lg">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={300}
                  className="w-full h-64 touch-none cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={clearCanvas}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {language === "english" ? "Clear" : "Limpiar"}
                </Button>
                <Button
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  onClick={captureCanvas}
                  disabled={!signatureData}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {language === "english" ? "Submit" : "Enviar"}
                </Button>
              </div>
              <p className="text-xs text-gray-500 text-center">
                {language === "english"
                  ? "Sign with your finger or stylus on the screen above"
                  : "Firme con su dedo o lápiz en la pantalla de arriba"}
              </p>
            </div>
          )}

          {/* QR Mode */}
          {mode === "qr" && (
            <SignatureQRDisplay
              patientId={patientId}
              patientName={patientName}
              language={language}
              sessionId={sessionId}
              applicationId={applicationId}
              onSignatureComplete={onSignatureComplete}
            />
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>{language === "english" ? "Important:" : "Importante:"}</strong>
              {language === "english"
                ? " Your signature will be stored and used on your application forms. Please sign your full legal name."
                : " Su firma se almacenará y se usará en sus formularios de solicitud. Por favor firme su nombre legal completo."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
