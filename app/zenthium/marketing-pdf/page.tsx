"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Download, Share2, MapPin, Zap, TrendingUp, Clock, Building2, Server, CheckCircle } from "lucide-react";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const BENEFITS = [
  { icon: Zap, title: "Power Assessment", desc: "50+ MW capacity evaluation" },
  { icon: MapPin, title: "Location Analysis", desc: "Zoning & connectivity review" },
  { icon: TrendingUp, title: "Maximize Value", desc: "Turn property into high-value asset" },
  { icon: Clock, title: "Fast Track", desc: "Response within 5 business days" },
];

const REQUIREMENTS = [
  "20+ acres or 100,000+ sq ft building",
  "Access to 50+ MW power capacity",
  "Fiber connectivity available",
  "Industrial/commercial zoning",
];

export default function MarketingPDFPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const formUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/zenthium/submit`
    : "https://strategicvalueplus.com/zenthium/submit";

  useEffect(() => {
    // Generate QR code
    QRCode.toDataURL(formUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    }).then(setQrDataUrl);
  }, [formUrl]);

  const downloadPDF = async () => {
    if (!pageRef.current) return;
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(pageRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: null,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width / 2, canvas.height / 2],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save("zenthium-data-center-opportunity.pdf");
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const sharePage = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Zenthium Data Center Opportunity",
          text: "Do you have property suitable for data center development? Submit your location to Zenthium.",
          url: formUrl,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(formUrl);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      {/* Controls */}
      <div className="max-w-[850px] mx-auto mb-6 flex gap-4 justify-center print:hidden">
        <Button onClick={downloadPDF} disabled={isGenerating} className="gap-2">
          <Download className="h-4 w-4" />
          {isGenerating ? "Generating..." : "Download PDF"}
        </Button>
        <Button onClick={sharePage} variant="outline" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>

      {/* 1-Pager Container - US Letter Size (850px x 1100px at 96dpi) */}
      <div 
        ref={pageRef}
        className="relative mx-auto bg-white overflow-hidden"
        style={{ width: "850px", height: "1100px" }}
      >
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="Modern data center server room"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col text-white p-12">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <Server className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Zenthium</h1>
              <p className="text-sm text-gray-300">Data Center Development Partnership</p>
            </div>
          </div>

          {/* Main Headline */}
          <div className="text-center mb-8">
            <h2 className="text-5xl font-bold mb-4 leading-tight">
              Do You Have Property<br />
              <span className="text-primary">for Data Center Development?</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Turn your land or building into a high-value digital infrastructure asset. 
              We evaluate sites for leading technology companies and data center operators.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {BENEFITS.map((benefit) => (
              <div key={benefit.title} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <benefit.icon className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold text-lg">{benefit.title}</h3>
                <p className="text-sm text-gray-300">{benefit.desc}</p>
              </div>
            ))}
          </div>

          {/* What We Look For */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              What We&apos;re Looking For
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {REQUIREMENTS.map((req, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{req}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Section - QR Code & CTA */}
          <div className="mt-auto flex items-end justify-between gap-8">
            {/* QR Code */}
            <div className="bg-white rounded-xl p-4 shadow-2xl">
              {qrDataUrl && (
                <img 
                  src={qrDataUrl} 
                  alt="Scan to submit your property"
                  className="w-32 h-32"
                />
              )}
              <p className="text-center text-xs text-gray-600 mt-2 font-medium">
                Scan to Submit<br />Your Location
              </p>
            </div>

            {/* CTA Box */}
            <div className="flex-1 bg-primary/20 backdrop-blur-sm rounded-xl p-6 border border-primary/30">
              <h3 className="text-2xl font-bold mb-2">Submit Your Property Today</h3>
              <p className="text-gray-300 mb-4">
                Initial site assessment within 5 business days. 
                No obligation. Your information is kept confidential.
              </p>
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <p className="font-semibold">Visit:</p>
                  <p className="text-primary">strategicvalueplus.com/zenthium/submit</p>
                </div>
                <div className="text-sm">
                  <p className="font-semibold">Email:</p>
                  <p className="text-primary">zenthium@strategicvalueplus.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-white/20 text-center text-sm text-gray-400">
            <p>Zenthium is a division of Strategic Value Plus, Inc. | Helping property owners connect with data center development opportunities</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="max-w-[850px] mx-auto mt-8 text-center text-gray-600 print:hidden">
        <p className="text-sm">
          Click &quot;Download PDF&quot; to save this 1-pager. The PDF is formatted for US Letter (8.5&quot; x 11&quot;) printing.
        </p>
      </div>
    </div>
  );
}
