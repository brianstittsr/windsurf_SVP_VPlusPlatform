"use client";

import { useEffect, useRef } from "react";

interface OpenStreetMapProps {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  lat?: number;
  lng?: number;
  height?: string;
  className?: string;
}

export function GoogleMap({
  address,
  city,
  state,
  zip,
  lat,
  lng,
  height = "300px",
  className = "",
}: OpenStreetMapProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      let src: string;
      
      // Use OpenStreetMap (no API key required)
      if (lat && lng) {
        // Use coordinates directly
        src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`;
      } else {
        // Use search query - OpenStreetMap uses Nominatim for geocoding
        const query = [address, city, state, zip].filter(Boolean).join(", ");
        // For search queries, we'll use a default view and let the user navigate
        // OpenStreetMap embed doesn't support direct search in URL, so we use the search page
        src = `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`;
      }

      iframeRef.current.src = src;
    }
  }, [address, city, state, zip, lat, lng]);

  return (
    <div className={`relative w-full ${className}`} style={{ height }}>
      <iframe
        ref={iframeRef}
        width="100%"
        height="100%"
        style={{ border: 0, borderRadius: "8px" }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="OpenStreetMap"
      />
    </div>
  );
}

// Alternative: Static OpenStreetMap tile image for simple display
export function OpenStreetMapStatic({
  lat,
  lng,
  zoom = 15,
  width = 400,
  height: imgHeight = 300,
  className = "",
}: {
  lat: number;
  lng: number;
  zoom?: number;
  width?: number;
  height?: number;
  className?: string;
}) {
  // OpenStreetMap tile URL pattern
  // Using openstreetmap.org's standard tile server
  const tileUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02}%2C${lat - 0.02}%2C${lng + 0.02}%2C${lat + 0.02}&layer=mapnik&marker=${lat}%2C${lng}`;
  
  return (
    <div className={`relative w-full ${className}`} style={{ height: imgHeight }}>
      <iframe
        src={tileUrl}
        width="100%"
        height="100%"
        style={{ border: 0, borderRadius: "8px" }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="OpenStreetMap"
      />
    </div>
  );
}
