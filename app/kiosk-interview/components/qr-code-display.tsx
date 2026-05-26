"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  QrCode, 
  Smartphone, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  RefreshCw,
  Link2
} from "lucide-react";

interface UploadedDocument {
  id: string;
  type: string;
  fileName: string;
  thumbnailUrl: string;
  uploadedAt: Date;
  aiStatus: "pending" | "processing" | "completed" | "failed";
  aiResults?: any;
}

interface QRCodeDisplayProps {
  patientId: string;
  patientName: string;
  language: "english" | "spanish";
  onComplete: () => void;
  onSkip: () => void;
}

interface DocumentType {
  id: string;
  nameEn: string;
  nameEs: string;
  required: boolean;
}

const REQUIRED_DOCUMENTS: DocumentType[] = [
  {
    id: "photo_id_front",
    nameEn: "Photo ID - Front",
    nameEs: "Identificación con Foto - Frente",
    required: true
  },
  {
    id: "photo_id_back", 
    nameEn: "Photo ID - Back",
    nameEs: "Identificación con Foto - Atrás",
    required: true
  }
];

const OPTIONAL_DOCUMENTS: DocumentType[] = [
  {
    id: "social_security_card",
    nameEn: "Social Security Card",
    nameEs: "Tarjeta de Seguro Social", 
    required: false
  },
  {
    id: "tax_return",
    nameEn: "Tax Return",
    nameEs: "Declaración de Impuestos",
    required: false
  },
  {
    id: "pay_stub",
    nameEn: "Pay Stub",
    nameEs: "Recibo de Pago",
    required: false
  },
  {
    id: "utility_bill",
    nameEn: "Utility Bill",
    nameEs: "Factura de Servicios",
    required: false
  },
  {
    id: "insurance_card",
    nameEn: "Insurance Card",
    nameEs: "Tarjeta de Seguro",
    required: false
  }
];

export function QRCodeDisplay({ patientId, patientName, language, onComplete, onSkip }: QRCodeDisplayProps) {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [uploadToken, setUploadToken] = useState<string>("");
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [polling, setPolling] = useState(false);

  const isSpanish = language === "spanish";

  useEffect(() => {
    generateUploadLink();
  }, []);

  useEffect(() => {
    if (uploadToken && !polling) {
      setPolling(true);
      startPolling();
    }
  }, [uploadToken]);

  const generateUploadLink = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/kiosk/upload-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          patientName,
          language,
          expiresMinutes: 10,
          createdBy: "kiosk"
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate upload link");
      }

      const data = await response.json();
      const token = data.data.token;
      const url = `${window.location.origin}/kiosk-docs/${token}`;
      
      setUploadToken(token);
      setQrUrl(url);
      setLoading(false);
    } catch (err) {
      setError(isSpanish ? "Error al generar enlace" : "Failed to generate link");
      setLoading(false);
    } finally {
      setGenerating(false);
    }
  };

  const startPolling = () => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/kiosk/upload-links/${uploadToken}`);
        if (response.ok) {
          const data = await response.json();
          const documents = data.data.documents || [];
          
          setUploadedDocs(documents.map((doc: any) => ({
            id: doc.id,
            type: doc.documentType,
            fileName: doc.fileName,
            thumbnailUrl: doc.thumbnailUrl,
            uploadedAt: new Date(doc.uploadedAt),
            aiStatus: doc.aiStatus || "pending",
            aiResults: doc.aiResults
          })));

          // Check if all required documents are uploaded and processed
          const requiredCompleted = REQUIRED_DOCUMENTS.filter(reqDoc =>
            documents.find((doc: any) => 
              doc.documentType === reqDoc.id && 
              doc.aiStatus === "completed"
            )
          );

          if (requiredCompleted.length === REQUIRED_DOCUMENTS.length) {
            clearInterval(interval);
            setPolling(false);
            setTimeout(onComplete, 1000);
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  };

  const getDocumentName = (docType: string) => {
    const allDocs = [...REQUIRED_DOCUMENTS, ...OPTIONAL_DOCUMENTS];
    const doc = allDocs.find(d => d.id === docType);
    return doc ? (isSpanish ? doc.nameEs : doc.nameEn) : docType;
  };

  const getProgress = () => {
    const requiredCompleted = REQUIRED_DOCUMENTS.filter(reqDoc =>
      uploadedDocs.find(doc => 
        doc.type === reqDoc.id && 
        doc.aiStatus === "completed"
      )
    );
    return (requiredCompleted.length / REQUIRED_DOCUMENTS.length) * 100;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Upload className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    if (isSpanish) {
      switch (status) {
        case "completed": return "Completado";
        case "processing": return "Procesando";
        case "failed": return "Error";
        default: return "Pendiente";
      }
    } else {
      switch (status) {
        case "completed": return "Completed";
        case "processing": return "Processing";
        case "failed": return "Failed";
        default: return "Pending";
      }
    }
  };

  const openLink = () => {
    if (qrUrl) {
      window.open(qrUrl, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">
          {isSpanish ? "Subir Documentos" : "Upload Documents"}
        </h3>
        <p className="text-gray-600">
          {isSpanish 
            ? "Escanee el código QR para subir documentos desde su teléfono"
            : "Scan the QR code to upload documents from your phone"
          }
        </p>
      </div>

      {/* QR Code Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            {isSpanish ? "Código QR" : "QR Code"}
          </CardTitle>
          <CardDescription>
            {isSpanish 
              ? "Use la cámara de su teléfono para escanear este código"
              : "Use your phone camera to scan this code"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            {qrUrl && (
              <div className="relative">
                <iframe
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrUrl)}`}
                  className="w-64 h-64 border-2 border-gray-200 rounded-lg"
                  title="Document Upload QR Code"
                />
                {polling && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={openLink}>
                <Link2 className="h-4 w-4 mr-2" />
                {isSpanish ? "Abrir Enlace" : "Open Link"}
              </Button>
              <Button variant="outline" onClick={generateUploadLink} disabled={generating}>
                <RefreshCw className={`h-4 w-4 mr-2 ${generating ? "animate-spin" : ""}`} />
                {isSpanish ? "Generar Nuevo" : "Generate New"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{isSpanish ? "Progreso" : "Progress"}</span>
          <span>{Math.round(getProgress())}%</span>
        </div>
        <Progress value={getProgress()} className="h-2" />
      </div>

      {/* Document Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {isSpanish ? "Estado de Documentos" : "Document Status"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Required Documents */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <span>{isSpanish ? "Documentos Requeridos" : "Required Documents"}</span>
                <Badge variant="destructive" className="text-xs">
                  {isSpanish ? "Requerido" : "Required"}
                </Badge>
              </h4>
              <div className="space-y-2">
                {REQUIRED_DOCUMENTS.map((docType) => {
                  const uploadedDoc = uploadedDocs.find(doc => doc.type === docType.id);
                  return (
                    <div key={docType.id} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">
                        {isSpanish ? docType.nameEs : docType.nameEn}
                      </span>
                      <div className="flex items-center gap-2">
                        {uploadedDoc ? (
                          <>
                            {getStatusIcon(uploadedDoc.aiStatus)}
                            <span className="text-xs text-gray-600">
                              {getStatusText(uploadedDoc.aiStatus)}
                            </span>
                          </>
                        ) : (
                          <Upload className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Optional Documents */}
            <div>
              <h4 className="font-medium mb-2">
                {isSpanish ? "Documentos Opcionales" : "Optional Documents"}
              </h4>
              <div className="space-y-2">
                {OPTIONAL_DOCUMENTS.map((docType) => {
                  const uploadedDoc = uploadedDocs.find(doc => doc.type === docType.id);
                  return (
                    <div key={docType.id} className="flex items-center justify-between p-2 border rounded opacity-60">
                      <span className="text-sm">
                        {isSpanish ? docType.nameEs : docType.nameEn}
                      </span>
                      <div className="flex items-center gap-2">
                        {uploadedDoc ? (
                          <>
                            {getStatusIcon(uploadedDoc.aiStatus)}
                            <span className="text-xs text-gray-600">
                              {getStatusText(uploadedDoc.aiStatus)}
                            </span>
                          </>
                        ) : (
                          <Upload className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Alert>
        <Smartphone className="h-4 w-4" />
        <AlertDescription>
          {isSpanish ? (
            <>
              <strong>Instrucciones:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Abra la cámara de su teléfono</li>
                <li>Escanee el código QR</li>
                <li>Siga las instrucciones para tomar fotos de los documentos requeridos</li>
                <li>Los documentos se analizarán automáticamente</li>
                <li>Regrese aquí cuando termine</li>
              </ol>
            </>
          ) : (
            <>
              <strong>Instructions:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Open your phone camera</li>
                <li>Scan the QR code</li>
                <li>Follow instructions to take photos of required documents</li>
                <li>Documents will be automatically analyzed</li>
                <li>Return here when finished</li>
              </ol>
            </>
          )}
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          onClick={onSkip} 
          variant="outline"
          className="flex-1"
        >
          {isSpanish ? "Omitir" : "Skip"}
        </Button>
        <Button 
          onClick={onComplete}
          disabled={getProgress() < 100}
          className="flex-1"
        >
          {isSpanish ? "Continuar" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
