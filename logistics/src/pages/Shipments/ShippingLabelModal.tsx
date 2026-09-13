import React from "react";
import { Close, PrintOutlined } from "@mui/icons-material";
import dayjs from "dayjs";

interface ShippingLabelModalProps {
  shipment: any;
  onClose: () => void;
}

export const ShippingLabelModal: React.FC<ShippingLabelModalProps> = ({
  shipment,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-5 print:shadow-none print:border-none">
        <div className="flex items-center justify-between border-b border-border pb-3 print:hidden">
          <h3 className="text-sm font-bold text-foreground">Print Shipping Label</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground"
          >
            <Close fontSize="small" />
          </button>
        </div>

        {/* Printable Label Box */}
        <div className="p-5 rounded-xl border-2 border-black bg-white text-black font-sans space-y-4 text-xs">
          {/* Label Header */}
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div>
              <div className="text-lg font-black tracking-tighter">ZOSH EXPRESS</div>
              <div className="text-[10px] font-mono uppercase">Direct Supply Chain Logistics</div>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded bg-black text-white font-mono font-bold text-xs">
                {shipment.serviceLevel || "STANDARD"}
              </span>
              <div className="text-[10px] font-mono mt-0.5">HUB: {shipment.originHub?.hubCode || "BLR-01"}</div>
            </div>
          </div>

          {/* Barcode Simulation */}
          <div className="py-2 text-center border-b-2 border-black space-y-1">
            <div className="tracking-widest font-mono text-xl font-black scale-y-125 select-none">
              ||||| | |||| ||| ||||| || |||||| | ||| |||| |
            </div>
            <div className="font-mono text-sm font-bold tracking-wider">
              {shipment.trackingNumber}
            </div>
          </div>

          {/* Delivery To Address */}
          <div className="border-b-2 border-black pb-3 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider block text-gray-600">
              Deliver To:
            </span>
            <div className="font-bold text-sm">{shipment.deliveryAddress?.name}</div>
            <div className="text-xs leading-relaxed">
              {shipment.deliveryAddress?.address}, {shipment.deliveryAddress?.locality}
            </div>
            <div className="font-bold text-sm">
              {shipment.deliveryAddress?.city}, {shipment.deliveryAddress?.state} -{" "}
              <span className="text-base font-black underline">{shipment.deliveryAddress?.pincode}</span>
            </div>
            <div className="text-xs font-mono">Contact: {shipment.deliveryAddress?.mobile}</div>
          </div>

          {/* Return & Sender From */}
          <div className="border-b-2 border-black pb-3 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider block text-gray-600">
              Return / Origin:
            </span>
            <div className="font-semibold">{shipment.pickupAddress?.storeName || "Zosh Official Merchant"}</div>
            <div className="text-[11px] text-gray-700">
              {shipment.pickupAddress?.address || "Electronic City Phase 1"}, {shipment.pickupAddress?.city || "Bengaluru"} - {shipment.pickupAddress?.pincode || 560100}
            </div>
          </div>

          {/* Package Details Footer */}
          <div className="flex items-center justify-between text-[11px] font-mono pt-1">
            <div>
              <span className="font-bold">Weight:</span> {shipment.packageDetails?.weightKg || 0.8} kg
            </div>
            <div>
              <span className="font-bold">Shipment:</span> {shipment.shipmentId}
            </div>
            <div>
              <span className="font-bold">Date:</span> {dayjs(shipment.createdAt).format("DD/MM/YY")}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 print:hidden pt-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl border border-border text-foreground text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:opacity-90"
          >
            <PrintOutlined fontSize="small" />
            <span>Print Label</span>
          </button>
        </div>
      </div>
    </div>
  );
};
