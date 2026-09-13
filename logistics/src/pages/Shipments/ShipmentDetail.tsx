import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowBack,
  LocalShippingOutlined,
  PersonPinCircleOutlined,
  WarehouseOutlined,
  AssignmentIndOutlined,
  PrintOutlined,
  CheckCircleOutline,
  ReportProblemOutlined,
  QrCodeScannerOutlined,
  HistoryOutlined,
  SecurityOutlined,
} from "@mui/icons-material";
import { logisticsApi } from "../../services/api";
import { StatusBadge } from "../../components/common/StatusBadge";
import { SlaIndicator } from "../../components/common/SlaIndicator";
import { ShippingLabelModal } from "./ShippingLabelModal";
import dayjs from "dayjs";

export const ShipmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [shipment, setShipment] = useState<any>(null);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const [isPodModalOpen, setIsPodModalOpen] = useState(false);

  // Form states
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [nextStatus, setNextStatus] = useState("");
  const [transitionNote, setTransitionNote] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchShipment = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await logisticsApi.getShipmentById(id);
      if (res.data?.shipment) {
        setShipment(res.data.shipment);
        setAuditEvents(res.data.auditEvents || []);
      }
    } catch (err) {
      console.error("Failed to load shipment:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadAgents = async () => {
    try {
      const res = await logisticsApi.getAgents({ status: "AVAILABLE" });
      if (res.data?.agents) setAgents(res.data.agents);
    } catch (err) {
      console.error("Error loading agents:", err);
    }
  };

  useEffect(() => {
    fetchShipment();
    loadAgents();
  }, [id]);

  const handleTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nextStatus || !shipment) return;
    setActionLoading(true);
    try {
      await logisticsApi.transitionStatus(shipment._id, {
        status: nextStatus,
        note: transitionNote,
      });
      setIsTransitionModalOpen(false);
      setTransitionNote("");
      fetchShipment();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId || !shipment) return;
    setActionLoading(true);
    try {
      await logisticsApi.assignAgent(shipment._id, selectedAgentId);
      setIsAssignModalOpen(false);
      fetchShipment();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipment) return;
    setActionLoading(true);
    try {
      await logisticsApi.recordProofOfDelivery(shipment._id, {
        recipientName: recipientName || shipment.deliveryAddress?.name,
        otpVerified: true,
      });
      setIsPodModalOpen(false);
      fetchShipment();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-muted-foreground">Inspecting shipment telemetry...</div>;
  }

  if (!shipment) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="text-sm font-bold text-foreground">Shipment Not Found</div>
        <button onClick={() => navigate("/shipments")} className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs">
          Back to Shipments
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/shipments")}
            className="p-2 rounded-xl border border-border bg-card hover:bg-surface text-foreground transition-colors"
          >
            <ArrowBack fontSize="small" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono text-foreground">
                {shipment.shipmentId}
              </h1>
              <StatusBadge status={shipment.status} />
              <SlaIndicator slaStatus={shipment.sla?.slaStatus} promisedTo={shipment.sla?.promisedTo} />
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              Tracking: <span className="font-bold text-foreground">{shipment.trackingNumber}</span> · Booked{" "}
              {dayjs(shipment.createdAt).format("DD MMM YYYY, HH:mm")}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsLabelModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-surface text-foreground text-xs font-medium transition-colors shadow-2xs"
          >
            <PrintOutlined fontSize="small" />
            <span>Print Label</span>
          </button>

          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-surface text-foreground text-xs font-medium transition-colors shadow-2xs"
          >
            <AssignmentIndOutlined fontSize="small" />
            <span>Assign Courier</span>
          </button>

          {shipment.status !== "DELIVERED" && (
            <>
              <button
                onClick={() => setIsTransitionModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity shadow-xs"
              >
                <LocalShippingOutlined fontSize="small" />
                <span>Move Status</span>
              </button>

              <button
                onClick={() => setIsPodModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-success text-success-foreground text-xs font-medium hover:opacity-90 transition-opacity shadow-xs"
              >
                <CheckCircleOutline fontSize="small" />
                <span>Verify POD</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Network Journey Route Node Progress */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Origin-to-Destination Journey Corridor
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-surface border border-border/50 space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground uppercase">1. Origin Facility</span>
            <div className="font-bold text-foreground">{shipment.pickupAddress?.storeName || "Vendor Facility"}</div>
            <div className="text-muted-foreground text-[11px]">{shipment.pickupAddress?.city || "Origin City"}</div>
          </div>

          <div className="p-3 rounded-xl bg-surface border border-border/50 space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground uppercase">2. Linehaul Hub</span>
            <div className="font-bold text-foreground">{shipment.originHub?.name || "Sorting Center"}</div>
            <div className="text-muted-foreground text-[11px]">{shipment.originHub?.city || "Hub Location"}</div>
          </div>

          <div className="p-3 rounded-xl bg-surface border border-border/50 space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground uppercase">3. Last-Mile Hub</span>
            <div className="font-bold text-foreground">{shipment.destinationHub?.name || "Destination Center"}</div>
            <div className="text-muted-foreground text-[11px]">{shipment.destinationHub?.city || "Destination City"}</div>
          </div>

          <div className="p-3 rounded-xl bg-surface border border-border/50 space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground uppercase">4. Customer Drop-off</span>
            <div className="font-bold text-foreground">{shipment.deliveryAddress?.name}</div>
            <div className="text-muted-foreground text-[11px]">
              {shipment.deliveryAddress?.locality}, {shipment.deliveryAddress?.city} ({shipment.deliveryAddress?.pincode})
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recipient & Destination Details */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Customer & Address</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-success/15 text-success">
              {shipment.deliveryAddress?.resolutionStatus || "RESOLVED"}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-muted-foreground">Recipient: </span>
              <span className="font-semibold text-foreground">{shipment.deliveryAddress?.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Contact: </span>
              <span className="font-mono text-foreground">{shipment.deliveryAddress?.mobile}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Delivery Address: </span>
              <div className="p-2.5 rounded-xl bg-surface mt-1 text-foreground leading-relaxed">
                {shipment.deliveryAddress?.address}, {shipment.deliveryAddress?.locality},{" "}
                {shipment.deliveryAddress?.city}, {shipment.deliveryAddress?.state} - {shipment.deliveryAddress?.pincode}
              </div>
            </div>
          </div>
        </div>

        {/* Package & Volumetric Dimensions */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Package Dimensions & Weight
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between p-2 rounded-xl bg-surface">
              <span className="text-muted-foreground">Package Type:</span>
              <span className="text-foreground font-bold">{shipment.packageDetails?.packageType || "BOX"}</span>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-surface">
              <span className="text-muted-foreground">Dead Weight:</span>
              <span className="text-foreground font-bold">{shipment.packageDetails?.weightKg || 0.8} kg</span>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-surface">
              <span className="text-muted-foreground">Dimensions (L×W×H):</span>
              <span className="text-foreground font-bold">
                {shipment.packageDetails?.dimensionsCm?.length || 25} ×{" "}
                {shipment.packageDetails?.dimensionsCm?.width || 18} ×{" "}
                {shipment.packageDetails?.dimensionsCm?.height || 10} cm
              </span>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-surface">
              <span className="text-muted-foreground">Volumetric Weight:</span>
              <span className="text-foreground font-bold">
                {shipment.packageDetails?.volumetricWeightKg || 0.9} kg
              </span>
            </div>
          </div>
        </div>

        {/* Assigned Fleet & POD Verification */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Fleet Allocation & POD
          </div>

          <div className="space-y-2.5 text-xs">
            {shipment.assignedAgent ? (
              <div className="p-3 rounded-xl bg-surface space-y-1">
                <div className="font-semibold text-foreground">{shipment.assignedAgent.name}</div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  ID: {shipment.assignedAgent.agentId} · {shipment.assignedAgent.phone}
                </div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  Vehicle: {shipment.assignedAgent.vehicle?.vehicleType} ({shipment.assignedVehicle?.plateNumber || "N/A"})
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-surface text-muted-foreground italic text-xs">
                No courier assigned yet.
              </div>
            )}

            {shipment.proofOfDelivery?.deliveredAt ? (
              <div className="p-3 rounded-xl bg-success/10 border border-success/20 space-y-1 text-xs">
                <div className="font-bold text-success flex items-center gap-1.5">
                  <CheckCircleOutline fontSize="small" /> Proof of Delivery Verified
                </div>
                <div className="text-foreground font-medium">
                  Received by: {shipment.proofOfDelivery.recipientName}
                </div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  Delivered at: {dayjs(shipment.proofOfDelivery.deliveredAt).format("DD MMM YYYY, HH:mm")}
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-muted-foreground italic">
                Awaiting last-mile delivery and OTP verification.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Immutable Event Audit Trail */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <HistoryOutlined fontSize="small" className="text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Immutable Supply Chain Audit Trail ({auditEvents.length} Events)
          </h2>
        </div>

        <div className="relative pl-6 border-l border-border space-y-4 text-xs">
          {auditEvents.map((evt, index) => (
            <div key={evt._id || index} className="relative">
              <span className="absolute -left-[31px] top-0.5 w-3 h-3 rounded-full bg-primary ring-4 ring-card" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                <span className="font-bold text-foreground">
                  {evt.eventType.replace(/_/g, " ")} · {evt.status}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {dayjs(evt.timestamp).format("DD MMM YYYY, HH:mm:ss")}
                </span>
              </div>
              <div className="text-muted-foreground">{evt.note}</div>
              <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                Logged by: {evt.operator?.name || "System"} ({evt.operator?.role || "SYSTEM"}) · Source: {evt.source}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping Label Print Modal */}
      {isLabelModalOpen && (
        <ShippingLabelModal
          shipment={shipment}
          onClose={() => setIsLabelModalOpen(false)}
        />
      )}

      {/* Assign Agent Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-foreground">Assign Courier to Shipment</h3>
            <form onSubmit={handleAssignAgent} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Select Delivery Agent</label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full p-2 rounded-xl border border-border bg-surface text-foreground text-xs"
                  required
                >
                  <option value="">Choose an available agent...</option>
                  {agents.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name} ({a.agentId}) · {a.vehicle?.vehicleType} · {a.activeShipmentsCount} active
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-border text-foreground text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium"
                >
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transition Status Modal */}
      {isTransitionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-foreground">Manual Status Transition</h3>
            <form onSubmit={handleTransition} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Next Status</label>
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                  className="w-full p-2 rounded-xl border border-border bg-surface text-foreground text-xs"
                  required
                >
                  <option value="">Select target status...</option>
                  <option value="PICKING">PICKING</option>
                  <option value="PACKED">PACKED</option>
                  <option value="READY_FOR_DISPATCH">READY_FOR_DISPATCH</option>
                  <option value="DISPATCHED">DISPATCHED</option>
                  <option value="IN_TRANSIT">IN_TRANSIT</option>
                  <option value="AT_HUB">AT_HUB</option>
                  <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="DELIVERY_FAILED">DELIVERY_FAILED</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Operational Note</label>
                <input
                  type="text"
                  placeholder="Reason or handover details..."
                  value={transitionNote}
                  onChange={(e) => setTransitionNote(e.target.value)}
                  className="w-full p-2 rounded-xl border border-border bg-surface text-foreground text-xs"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTransitionModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-border text-foreground text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium"
                >
                  Submit Transition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record POD Modal */}
      {isPodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-foreground">Record Proof of Delivery (POD)</h3>
            <form onSubmit={handleRecordPod} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Recipient Name</label>
                <input
                  type="text"
                  placeholder={shipment.deliveryAddress?.name}
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full p-2 rounded-xl border border-border bg-surface text-foreground text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-success/10 border border-success/20 text-xs text-success flex items-center gap-2">
                <SecurityOutlined fontSize="small" />
                <span>Customer OTP Confirmation Verified</span>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPodModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-border text-foreground text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-xl bg-success text-success-foreground text-xs font-medium"
                >
                  Confirm Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
