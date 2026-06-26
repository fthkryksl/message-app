"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LeafletMapProps {
  position: string; // Format: "latitude,longitude"
}

export default function LeafletMap({ position }: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const [latStr, lngStr] = position.split(",");
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) return;

    if (!mapRef.current) {
      // Map-Instanz erstellen
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        touchZoom: false,
        doubleClickZoom: false,
        scrollWheelZoom: false,
        boxZoom: false,
        keyboard: false,
      }).setView([lat, lng], 16);

      // OpenStreetMap Layer hinzufügen
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(mapRef.current);

      // Eigener orange-pulsierender Marker über Tailwind/HTML-divIcon
      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div class="relative flex items-center justify-center">
            <span class="absolute inline-flex h-6 w-6 animate-ping rounded-full bg-orange-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-4 w-4 bg-orange-600 border-2 border-white shadow-md"></span>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker([lat, lng], { icon: customIcon }).addTo(mapRef.current);
    } else {
      mapRef.current.setView([lat, lng], 16);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [position]);

  return (
    <div
      ref={mapContainerRef}
      className="h-40 w-full rounded-xl overflow-hidden border border-white shadow-inner z-0"
    />
  );
}
