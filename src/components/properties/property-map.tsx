"use client";

import { useEffect, useRef } from "react";

interface PropertyMapProps {
  properties?: Array<{
    id: number;
    title: string;
    price: number;
    lat: number;
    lng: number;
    image: string;
  }>;
  mapStyle?: "standard" | "satellite" | "terrain";
  center?: { lat: number; lng: number };
  zoom?: number;
}

export function PropertyMap({
  properties = [],
  mapStyle = "standard",
  center = { lat: 34.0522, lng: -118.2437 },
  zoom = 10,
}: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // In production, this would initialize a real map library (Mapbox, Google Maps, etc.)
    // For demo purposes, we'll show a placeholder
  }, [mapStyle, center, zoom]);

  return (
    <div
      ref={mapRef}
      className="w-full h-[500px] bg-gray-100 rounded-lg relative overflow-hidden"
      style={{
        backgroundImage: `url(https://maps.googleapis.com/maps/api/staticmap?center=${center.lat},${center.lng}&zoom=${zoom}&size=800x600&maptype=${mapStyle})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Map Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100/90">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Interactive Map</p>
          <p className="text-sm text-gray-500 mt-1">
            {properties.length} properties in this area
          </p>
        </div>
      </div>

      {/* Property Markers */}
      {properties.map((property) => (
        <div
          key={property.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
          style={{
            left: `${((property.lng - (center.lng - 0.5)) / 1) * 100}%`,
            top: `${((center.lat + 0.3 - property.lat) / 0.6) * 100}%`,
          }}
        >
          <div className="bg-white rounded-lg shadow-lg px-3 py-1.5 border hover:shadow-xl transition-shadow">
            <p className="font-semibold text-blue-600 text-sm">
              ${(property.price / 1000000).toFixed(1)}M
            </p>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white" />
        </div>
      ))}
    </div>
  );
}
