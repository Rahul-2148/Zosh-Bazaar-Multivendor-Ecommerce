import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Close,
  LocalShippingOutlined,
  WarehouseOutlined,
  PersonPinCircleOutlined,
  QrCodeScannerOutlined,
  ReportProblemOutlined,
  AltRouteOutlined,
  AssessmentOutlined,
  Inventory2Outlined,
  KeyboardReturnOutlined,
} from "@mui/icons-material";
import { logisticsApi } from "../../services/api";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "SHIPMENTS" | "HUBS" | "AGENTS" | "PAGES">("ALL");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const pages = [
    { label: "Control Tower Overview", path: "/", icon: <AssessmentOutlined fontSize="small" />, cat: "PAGES" },
    { label: "Live Operations Board", path: "/operations", icon: <AltRouteOutlined fontSize="small" />, cat: "PAGES" },
    { label: "Interactive Network Map", path: "/map", icon: <PersonPinCircleOutlined fontSize="small" />, cat: "PAGES" },
    { label: "Shipments Management", path: "/shipments", icon: <LocalShippingOutlined fontSize="small" />, cat: "PAGES" },
    { label: "Package Scanner (Barcode/QR)", path: "/scanner", icon: <QrCodeScannerOutlined fontSize="small" />, cat: "PAGES" },
    { label: "Hubs & Fulfillment Centers", path: "/hubs", icon: <WarehouseOutlined fontSize="small" />, cat: "PAGES" },
    { label: "Delivery Zones & SLAs", path: "/zones", icon: <Inventory2Outlined fontSize="small" />, cat: "PAGES" },
    { label: "Fleet & Delivery Agents", path: "/agents", icon: <PersonPinCircleOutlined fontSize="small" />, cat: "PAGES" },
    { label: "Route Planner", path: "/routes", icon: <AltRouteOutlined fontSize="small" />, cat: "PAGES" },
    { label: "Inbound & Outbound Manifests", path: "/manifests", icon: <Inventory2Outlined fontSize="small" />, cat: "PAGES" },
    { label: "Exceptions Triage Center", path: "/exceptions", icon: <ReportProblemOutlined fontSize="small" />, cat: "PAGES" },
    { label: "SLA Command Center", path: "/sla", icon: <AssessmentOutlined fontSize="small" />, cat: "PAGES" },
    { label: "Reverse Logistics & Returns", path: "/returns", icon: <KeyboardReturnOutlined fontSize="small" />, cat: "PAGES" },
    { label: "Operational Analytics", path: "/analytics", icon: <AssessmentOutlined fontSize="small" />, cat: "PAGES" },
  ];

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const performSearch = async () => {
      const q = query.trim().toLowerCase();

      // Static pages matched
      const matchedPages = pages
        .filter((p) => !q || p.label.toLowerCase().includes(q))
        .map((p) => ({
          id: p.path,
          title: p.label,
          subtitle: "Operations Module",
          category: "PAGES",
          icon: p.icon,
          action: () => {
            navigate(p.path);
            onClose();
          },
        }));

      if (!q) {
        setResults(matchedPages);
        return;
      }

      setLoading(true);
      try {
        const [shipmentRes, hubRes, agentRes] = await Promise.allSettled([
          logisticsApi.getShipments({ search: q, limit: 5 }),
          logisticsApi.getHubs({ city: q }),
          logisticsApi.getAgents({ zone: q }),
        ]);

        const items: any[] = [...matchedPages];

        if (shipmentRes.status === "fulfilled" && shipmentRes.value.data?.shipments) {
          shipmentRes.value.data.shipments.forEach((s: any) => {
            items.push({
              id: s._id,
              title: `${s.shipmentId} · ${s.trackingNumber}`,
              subtitle: `Status: ${s.status} | Destination: ${s.deliveryAddress?.city}`,
              category: "SHIPMENTS",
              icon: <LocalShippingOutlined fontSize="small" className="text-primary" />,
              action: () => {
                navigate(`/shipments/${s._id}`);
                onClose();
              },
            });
          });
        }

        if (hubRes.status === "fulfilled" && hubRes.value.data?.hubs) {
          hubRes.value.data.hubs.forEach((h: any) => {
            items.push({
              id: h._id,
              title: `${h.hubCode} · ${h.name}`,
              subtitle: `${h.type} | ${h.city} (Cap: ${h.capacityDaily})`,
              category: "HUBS",
              icon: <WarehouseOutlined fontSize="small" className="text-info" />,
              action: () => {
                navigate("/hubs");
                onClose();
              },
            });
          });
        }

        if (agentRes.status === "fulfilled" && agentRes.value.data?.agents) {
          agentRes.value.data.agents.forEach((a: any) => {
            items.push({
              id: a._id,
              title: `${a.agentId} · ${a.name}`,
              subtitle: `Status: ${a.status} | Zone: ${a.currentZone} | Vehicle: ${a.vehicle?.vehicleType}`,
              category: "AGENTS",
              icon: <PersonPinCircleOutlined fontSize="small" className="text-success" />,
              action: () => {
                navigate("/agents");
                onClose();
              },
            });
          });
        }

        setResults(items);
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(performSearch, 150);
    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  const filteredResults =
    activeTab === "ALL" ? results : results.filter((r) => r.category === activeTab);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-overlay backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[80vh] cursor-default"
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-border bg-surface">
          <Search className="text-muted-foreground mr-3" fontSize="medium" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shipments, tracking codes, hubs, agents, or jump to page..."
            className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 hover:bg-surface-hover rounded-md text-muted-foreground"
            >
              <Close fontSize="small" />
            </button>
          )}
          <span className="ml-3 px-2 py-0.5 text-[10px] font-mono rounded bg-muted text-muted-foreground border border-border">
            ESC
          </span>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-surface/50 overflow-x-auto text-xs">
          {(["ALL", "SHIPMENTS", "HUBS", "AGENTS", "PAGES"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-border/40">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground text-xs">
              Scanning logistics network...
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No matching records found. Try another tracking number or keyword.
            </div>
          ) : (
            filteredResults.map((item) => (
              <div
                key={item.id}
                onClick={item.action}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-hover cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-surface border border-border group-hover:border-primary/30 transition-colors">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground">{item.title}</div>
                    <div className="text-[11px] text-muted-foreground">{item.subtitle}</div>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                  {item.category}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
