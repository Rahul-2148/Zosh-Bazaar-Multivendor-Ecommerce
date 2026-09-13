import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { Navigation } from "lucide-react";

interface MiniMapLeafletProps {
  lat: number;
  lng: number;
  title?: string;
  address?: string;
}

export const MiniMapLeaflet: React.FC<MiniMapLeafletProps> = ({
  lat,
  lng,
  title,
  address: _address,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    // Custom Stop Marker
    const icon = L.divIcon({
      className: "custom-stop-pin",
      html: `<div style="background:#0284c7;color:#fff;width:28px;height:28px;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;box-shadow:0 4px 8px rgba(0,0,0,0.3)">📍</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });

    L.marker([lat, lng], { icon }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng]);

  const handleOpenGoogleMaps = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      "_blank"
    );
  };

  return (
    <div className="relative w-full h-[140px] rounded-2xl overflow-hidden border border-border shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      <div className="absolute bottom-2 right-2 z-10">
        <button
          onClick={handleOpenGoogleMaps}
          className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-extrabold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-transform"
        >
          <Navigation size={13} />
          <span>Launch GPS Navigation</span>
        </button>
      </div>
      {title && (
        <div className="absolute top-2 left-2 z-10 bg-card/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-border text-[11px] font-bold shadow-xs">
          {title}
        </div>
      )}
    </div>
  );
};
