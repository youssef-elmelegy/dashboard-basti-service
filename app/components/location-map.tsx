import { useEffect, useRef } from "react";

declare global {
  interface Window {
    L: {
      map: (el: HTMLElement) => {
        setView: (
          coords: [number, number],
          zoom: number,
        ) => {
          addLayer: (layer: unknown) => void;
          remove: () => void;
        };
        remove: () => void;
      };
      tileLayer: (
        url: string,
        options: Record<string, unknown>,
      ) => { addTo: (map: unknown) => void };
      marker: (coords: [number, number]) => {
        addTo: (map: unknown) => {
          bindPopup: (text: string) => { openPopup: () => void };
        };
      };
    };
  }
}

interface LocationMapProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  className?: string;
}

export function LocationMap({
  latitude = 0,
  longitude = 0,
  address = "Location",
  className = "w-full h-80",
}: LocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<{
    remove: () => void;
  } | null>(null);

  useEffect(() => {
    // Load Leaflet dynamically
    if (!window.L) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      script.async = true;
      script.onload = () => initializeMap();
      document.body.appendChild(script);
    } else {
      initializeMap();
    }

    function initializeMap() {
      if (!mapContainer.current) return;

      // Only initialize once
      if (mapInstance.current) return;

      const L = window.L;
      const map = L.map(mapContainer.current).setView(
        [latitude, longitude],
        15,
      );
      mapInstance.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Add marker
      L.marker([latitude, longitude]).addTo(map).bindPopup(address).openPopup();
    }

    return () => {
      // Cleanup
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [latitude, longitude, address]);

  return <div ref={mapContainer} className={className} />;
}
