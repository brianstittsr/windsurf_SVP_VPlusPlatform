"use client";

import { useEffect, useRef } from "react";

interface GoogleMapProps {
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
}: GoogleMapProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      let src = "https://www.google.com/maps/embed/v1/place?key=";
      
      // Note: You need to add your Google Maps API key to .env.local
      // NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.warn("Google Maps API key not configured. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local");
        // Fallback to embed without API key (limited functionality)
        const query = [address, city, state, zip].filter(Boolean).join(", ");
        iframeRef.current.src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
        return;
      }

      if (lat && lng) {
        src += `${apiKey}&q=${lat},${lng}`;
      } else {
        const query = [address, city, state, zip].filter(Boolean).join(", ");
        src += `${apiKey}&q=${encodeURIComponent(query)}`;
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
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Google Map"
      />
    </div>
  );
}
