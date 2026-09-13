import React, { useEffect, useState } from "react";
import { partnerApi } from "../../api/partnerApi";
import { StatusPill } from "../../components/common/StatusPill";
import { History, Search, Calendar, MapPin, Package } from "lucide-react";

export const DeliveryHistory: React.FC = () => {
  const [history, setHistory] = useState<
    Array<{
      _id: string;
      stopIndex: number;
      trackingNumber: string;
      customerName: string;
      address: string;
      status: string;
      completedAt?: string;
      failureReason?: string;
      paymentType: string;
      codAmount: number;
    }>
  >([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await partnerApi.getHistory();
        setHistory(data);
      } catch {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  const filteredHistory = history.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.customerName?.toLowerCase().includes(q) ||
      item.address?.toLowerCase().includes(q) ||
      item.trackingNumber?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-primary">
            Audit Records & Handover Logs
          </span>
          <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-1.5 text-foreground">
            <History size={20} className="text-primary" />
            <span>Delivery History</span>
          </h2>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order # or customer..."
            className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-primary focus:outline-hidden"
          />
        </div>
      </div>

      <div>
        {filteredHistory.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredHistory.map((item) => (
              <div
                key={item._id}
                className="p-4 bg-card border border-border rounded-2xl shadow-xs space-y-2 flex flex-col justify-between hover:border-primary/40 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold leading-tight text-foreground">{item.customerName}</h4>
                      <span className="text-[10px] sm:text-xs text-muted-foreground font-mono font-bold">
                        {item.trackingNumber}
                      </span>
                    </div>
                    <StatusPill status={item.status} size="sm" />
                  </div>

                  <p className="text-xs text-muted-foreground flex items-start gap-1.5 line-clamp-2">
                    <MapPin size={13} className="shrink-0 mt-0.5 text-primary" />
                    <span>{item.address}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground pt-2 border-t border-border/50">
                  <span className="font-bold text-foreground">
                    {item.paymentType === "COD" ? `COD ₹${item.codAmount.toLocaleString("en-IN")}` : "Prepaid"}
                  </span>
                  <span>{item.completedAt ? new Date(item.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Completed"}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center bg-card border border-border rounded-2xl text-xs sm:text-sm text-muted-foreground space-y-1">
            <History size={32} className="mx-auto text-muted-foreground/50 mb-1" />
            <p className="font-semibold text-foreground">No past deliveries found</p>
            <p className="text-xs">No records matching your search query.</p>
          </div>
        )}
      </div>
    </div>
  );
};
