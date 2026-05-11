"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Zap, Droplets, Network, Building2, CheckCircle2, XCircle, AlertTriangle, TrendingUp, Wifi, Shield, Wind, Thermometer, Mountain, Factory, ArrowRight } from "lucide-react";
import { GoogleMap } from "@/components/zenthium/openstreetmap-map";
import { evaluateSite, SiteEvaluationResult } from "@/lib/zenthium-evaluation";

export default function ZenthiumDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const submissionId = searchParams.get("id");
  
  const [propertyData, setPropertyData] = useState<any>(null);
  const [evaluation, setEvaluation] = useState<SiteEvaluationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (submissionId) {
      fetchPropertyData(submissionId);
    } else {
      setLoading(false);
    }
  }, [submissionId]);

  const fetchPropertyData = async (id: string) => {
    try {
      const response = await fetch(`/api/zenthium/location-submissions/${id}`);
      if (response.ok) {
        const data = await response.json();
        setPropertyData(data);
        
        // Evaluate the site
        const evalResult = evaluateSite({
          squareFootage: data.squareFootage,
          powerAvailableMW: data.powerAvailableMW,
          ceilingHeightFt: data.ceilingHeightFt,
          isSingleStory: data.isSingleStory,
          isFloor: data.isFloor,
          waterAvailable: data.waterAvailable,
          waterSource: data.waterSource,
          fiberAvailable: data.fiberAvailable,
          fiberProviders: data.fiberProviders,
          zoningClassification: data.zoningClassification,
          environmentalClearance: data.environmentalClearance,
          floodZone: data.floodZone,
        });
        setEvaluation(evalResult);
      }
    } catch (error) {
      console.error("Error fetching property:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!propertyData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Property Not Found</h1>
          <Button onClick={() => router.push("/zenthium/submit")} variant="outline">
            Submit New Property
          </Button>
        </div>
      </div>
    );
  }

  const meetsRequirements = evaluation?.meetsRequirements || false;
  const score = evaluation?.score || 0;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section - Apple Style */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 via-black to-black" />
        
        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <div className="mb-6">
            <Badge 
              variant={meetsRequirements ? "default" : "destructive"} 
              className="text-lg px-6 py-2 mb-4"
            >
              {meetsRequirements ? "✓ Qualified Site" : "⚠ Review Required"}
            </Badge>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            {propertyData.propertyName || "Data Center Site"}
          </h1>
          
          <p className="text-2xl md:text-3xl text-gray-400 mb-4">
            {propertyData.city}, {propertyData.state}
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-500" />
              <span className="text-gray-300">{propertyData.address}</span>
            </div>
          </div>

          {/* Score Circle */}
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 mb-8"
               style={{ borderColor: meetsRequirements ? '#22c55e' : '#ef4444' }}>
            <div className="text-center">
              <div className="text-4xl font-bold">{score}</div>
              <div className="text-sm text-gray-400">/ 100</div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-orange-600 hover:bg-orange-700 text-white px-8"
              onClick={() => router.push(`/zenthium/submit?id=${submissionId}`)}
            >
              View Full Details <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-600 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-gray-600 rounded-full" />
          </div>
        </div>
      </section>

      {/* Location Map Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-4">Prime Location</h2>
            <p className="text-xl text-gray-400">Strategic positioning for data center operations</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-orange-500" />
                  Address
                </h3>
                <p className="text-gray-300 text-lg">{propertyData.address}</p>
                <p className="text-gray-400">{propertyData.city}, {propertyData.state} {propertyData.zip}</p>
                {propertyData.coordinates && (
                  <p className="text-sm text-gray-500 mt-2">
                    Coordinates: {propertyData.coordinates}
                  </p>
                )}
              </div>

              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <h3 className="text-2xl font-semibold mb-4">Site Characteristics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Property Type</span>
                    <span className="font-medium">{propertyData.propertyType || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Zoning</span>
                    <span className="font-medium">{propertyData.zoningClassification || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Size</span>
                    <span className="font-medium">
                      {propertyData.squareFootage ? `${Number(propertyData.squareFootage).toLocaleString()} sq ft` : "N/A"}
                    </span>
                  </div>
                  {propertyData.acreage && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Acreage</span>
                      <span className="font-medium">{propertyData.acreage} acres</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 h-[500px]">
              {propertyData.coordinates ? (
                <GoogleMap address={propertyData.coordinates} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MapPin className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Map unavailable</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Requirements Analysis */}
      <section className="py-20 px-6 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-4">Requirements Analysis</h2>
            <p className="text-xl text-gray-400">Zenthium data center specifications</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Power */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Zap className="w-6 h-6 text-yellow-500" />
                  Power Capacity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {propertyData.powerAvailableMW || 0} MW
                </div>
                <div className="flex items-center gap-2 mb-4">
                  {(propertyData.powerAvailableMW || 0) >= 20 ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="text-green-500">Meets requirement (20+ MW)</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span className="text-red-500">Below requirement (20+ MW needed)</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-400">
                  Type: {propertyData.powerType || "Not specified"}
                </p>
                {propertyData.hasBackupPower && (
                  <Badge variant="outline" className="mt-2">
                    <Shield className="w-3 h-3 mr-1" />
                    Backup Power Available
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Water */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Droplets className="w-6 h-6 text-blue-500" />
                  Water & Cooling
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  {propertyData.waterAvailable ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="text-green-500 font-semibold">Water Available</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span className="text-red-500 font-semibold">No Water Access</span>
                    </>
                  )}
                </div>
                {propertyData.waterSource && (
                  <p className="text-sm text-gray-400 mb-2">
                    Source: {propertyData.waterSource}
                  </p>
                )}
                {propertyData.coolingCapacity && (
                  <p className="text-sm text-gray-400 mb-2">
                    Capacity: {propertyData.coolingCapacity}
                  </p>
                )}
                {propertyData.hvacInstalled && (
                  <Badge variant="outline" className="mt-2">
                    <Wind className="w-3 h-3 mr-1" />
                    HVAC Installed
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Connectivity */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Network className="w-6 h-6 text-purple-500" />
                  Connectivity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  {propertyData.fiberAvailable ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="text-green-500 font-semibold">Fiber Available</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span className="text-red-500 font-semibold">No Fiber</span>
                    </>
                  )}
                </div>
                {propertyData.fiberProviders && (
                  <p className="text-sm text-gray-400">
                    Providers: {propertyData.fiberProviders}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Additional Requirements */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Building2 className="w-6 h-6 text-orange-500" />
                  Building Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Ceiling Height</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {propertyData.ceilingHeightFt || 0} ft
                    </span>
                    {(propertyData.ceilingHeightFt || 0) >= 18 ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Single Story</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {propertyData.isSingleStory ? "Yes" : "No"}
                    </span>
                    {propertyData.isSingleStory ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Flat Floor</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {propertyData.isFloor ? "Yes" : "No"}
                    </span>
                    {propertyData.isFloor ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Mountain className="w-6 h-6 text-green-500" />
                  Environmental & Risk
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Flood Zone</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {propertyData.floodZone ? "Yes" : "No"}
                    </span>
                    {!propertyData.floodZone ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Environmental Clearance</span>
                  <span className="font-medium text-sm">
                    {propertyData.environmentalClearance || "Pending"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Data Center Amenities */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-4">Data Center Advantages</h2>
            <p className="text-xl text-gray-400">What makes this site exceptional</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-center">
              <Zap className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">High Power Density</h3>
              <p className="text-sm text-gray-400">
                {propertyData.powerAvailableMW || 0} MW capacity for intensive compute workloads
              </p>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-center">
              <Wifi className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Low Latency</h3>
              <p className="text-sm text-gray-400">
                Fiber connectivity for high-speed data transfer
              </p>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-center">
              <Thermometer className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Efficient Cooling</h3>
              <p className="text-sm text-gray-400">
                Water access and climate for optimal PUE
              </p>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-center">
              <Factory className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Industrial Zoning</h3>
              <p className="text-sm text-gray-400">
                Proper zoning for 24/7 operations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-t from-orange-900/20 to-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6">Ready to Learn More?</h2>
          <p className="text-xl text-gray-400 mb-8">
            Contact our team to discuss this property opportunity
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-orange-600 hover:bg-orange-700 text-white px-8"
              onClick={() => router.push(`/zenthium/submit?id=${submissionId}`)}
            >
              View Full Details
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-gray-700 text-white hover:bg-gray-800"
              onClick={() => window.location.href = "mailto:zenthium@strategicvalueplus.com"}
            >
              Contact Us
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
