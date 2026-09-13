import React, { useEffect, useState, useRef } from "react";
import L from "leaflet";
import {
  PersonPinCircleOutlined,
  Refresh,
} from "@mui/icons-material";
import { logisticsApi } from "../../services/api";
import { StatusBadge } from "../../components/common/StatusBadge";
import { useTheme } from "../../context/ThemeContext";

export const LiveMapControlTower: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const { resolvedTheme } = useTheme();
  const [hubs, setHubs] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadMapData = async () => {
    try {
      setLoading(true);
      const [hubRes, agentRes, shipRes] = await Promise.all([
        logisticsApi.getHubs(),
        logisticsApi.getAgents(),
        logisticsApi.getShipments({ limit: 50, status: "OUT_FOR_DELIVERY" }),
      ]);

      if (hubRes.data?.hubs) setHubs(hubRes.data.hubs);
      if (agentRes.data?.agents) setAgents(agentRes.data.agents);
      if (shipRes.data?.shipments) setShipments(shipRes.data.shipments);
    } catch (err) {
      console.error("Error loading map telemetry:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMapData();
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default centered on India (Bengaluru hub coords)
      const map = L.map(mapContainerRef.current, {
        center: [12.9716, 77.5946],
        zoom: 11,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // CartoDB Positron for light, Dark Matter for dark
      const tileUrl =
        resolvedTheme === "dark"
          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

      L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    } else {
      // Update tile layer if theme switches
      mapInstanceRef.current.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          const tileUrl =
            resolvedTheme === "dark"
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
          layer.setUrl(tileUrl);
        }
      });
    }

    return () => {
      // Map cleanup on unmount
    };
  }, [resolvedTheme]);

  // Render Map Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    // 1. Hub Markers (Hexagons/Squares)
    hubs.forEach((hub) => {
      const lat = hub.location?.lat || 12.9716;
      const lng = hub.location?.lng || 77.5946;

      const hubIcon = L.divIcon({
        className: "custom-hub-marker",
        html: `
          <div style="background-color: #2563eb; color: #fff; width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; border: 2px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.35); cursor: pointer;">
            ${hub.hubCode?.slice(0, 3) || "HUB"}
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const marker = L.marker([lat, lng], { icon: hubIcon });
      marker.on("click", () => {
        setSelectedEntity({ type: "HUB", data: hub });
      });
      markersLayerRef.current?.addLayer(marker);
    });

    // 2. Delivery Agent Markers (Vehicles / Couriers)
    agents.forEach((agent) => {
      const lat = agent.currentLocation?.lat || 12.96 + Math.random() * 0.05;
      const lng = agent.currentLocation?.lng || 77.58 + Math.random() * 0.05;

      const isAvailable = agent.status === "AVAILABLE" || agent.status === "OUT_FOR_DELIVERY";
      const color = isAvailable ? "#10b981" : "#f59e0b";

      const agentIcon = L.divIcon({
        className: "custom-agent-marker",
        html: `
          <div style="background-color: ${color}; color: #fff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; border: 2px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: pointer;">
            🛵
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([lat, lng], { icon: agentIcon });
      marker.on("click", () => {
        setSelectedEntity({ type: "AGENT", data: agent });
      });
      markersLayerRef.current?.addLayer(marker);
    });

    // 3. Active Shipment Delivery Stop Pins
    shipments.forEach((s) => {
      const lat = s.deliveryAddress?.lat || 12.98;
      const lng = s.deliveryAddress?.lng || 77.62;

      const stopIcon = L.divIcon({
        className: "custom-stop-marker",
        html: `
          <div style="background-color: #f43f5e; color: #fff; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.25); cursor: pointer;">
            📍
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([lat, lng], { icon: stopIcon });
      marker.on("click", () => {
        setSelectedEntity({ type: "SHIPMENT", data: s });
      });
      markersLayerRef.current?.addLayer(marker);
    });
  }, [hubs, agents, shipments]);

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Interactive Network Map & Fleet Radar
          </h1>
          <p className="text-xs text-muted-foreground">
            Geospatial tracking of fulfillment centers, linehaul hubs, delivery vehicles, and active drop-off stops.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-card border border-border text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-md bg-primary inline-block" /> Hubs ({hubs.length})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-success inline-block" /> Couriers ({agents.length})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-destructive inline-block" /> Active Stops ({shipments.length})
            </span>
          </div>

          <button
            onClick={loadMapData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-surface text-foreground text-xs font-medium transition-colors shadow-2xs"
          >
            <Refresh fontSize="small" className={loading ? "animate-spin" : ""} />
            <span>Refresh Radar</span>
          </button>
        </div>
      </div>

      {/* Main Map + Inspector Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[75vh]">
        {/* Leaflet Map Canvas */}
        <div className="lg:col-span-3 rounded-2xl border border-border overflow-hidden bg-card shadow-2xs relative">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Map Watermark Overlay */}
          <div className="absolute top-3 left-3 z-20 px-3 py-1 rounded-lg bg-card/90 backdrop-blur-xs border border-border text-[11px] font-mono text-muted-foreground pointer-events-none">
            ZOSH GEONETWORK · LIVE
          </div>
        </div>

        {/* Selected Entity Inspector Panel */}
        <div className="rounded-2xl border border-border bg-card shadow-2xs p-4 flex flex-col justify-between overflow-y-auto">
          {selectedEntity ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-primary">
                  {selectedEntity.type} INSPECTOR
                </span>
                <button
                  onClick={() => setSelectedEntity(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>

              {selectedEntity.type === "HUB" && (
                <div className="space-y-3 text-xs">
                  <div>
                    <h3 className="font-bold text-sm text-foreground">
                      {selectedEntity.data.name}
                    </h3>
                    <div className="text-muted-foreground font-mono">
                      Code: {selectedEntity.data.hubCode} · {selectedEntity.data.type}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-surface space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">City:</span>
                      <span className="text-foreground">{selectedEntity.data.city}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Capacity:</span>
                      <span className="text-foreground">{selectedEntity.data.capacityDaily} parcels/day</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Active Staff:</span>
                      <span className="text-foreground">{selectedEntity.data.activeStaff} staff on duty</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedEntity.type === "AGENT" && (
                <div className="space-y-3 text-xs">
                  <div>
                    <h3 className="font-bold text-sm text-foreground">
                      {selectedEntity.data.name}
                    </h3>
                    <div className="text-muted-foreground font-mono">
                      ID: {selectedEntity.data.agentId} · {selectedEntity.data.phone}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-surface space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <StatusBadge status={selectedEntity.data.status} size="sm" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vehicle:</span>
                      <span className="text-foreground">{selectedEntity.data.vehicle?.vehicleType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Active Parcels:</span>
                      <span className="text-foreground">{selectedEntity.data.activeShipmentsCount}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedEntity.type === "SHIPMENT" && (
                <div className="space-y-3 text-xs">
                  <div>
                    <h3 className="font-bold text-sm text-foreground font-mono">
                      {selectedEntity.data.shipmentId}
                    </h3>
                    <div className="text-muted-foreground font-mono">
                      Track: {selectedEntity.data.trackingNumber}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-surface space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Recipient:</span>
                      <span className="text-foreground">{selectedEntity.data.deliveryAddress?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">City:</span>
                      <span className="text-foreground">{selectedEntity.data.deliveryAddress?.city}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <StatusBadge status={selectedEntity.data.status} size="sm" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
              <PersonPinCircleOutlined fontSize="large" className="opacity-30 mb-2" />
              <div className="text-xs font-semibold text-foreground">Select a Pin</div>
              <div className="text-[11px] max-w-xs mt-1">
                Click any hub, delivery courier, or drop-off location on the map to inspect live metrics.
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-border text-[10px] text-muted-foreground flex justify-between items-center">
            <span>Coordinates: WGS84</span>
            <span className="font-mono">Realtime GPS</span>
          </div>
        </div>
      </div>
    </div>
  );
};
