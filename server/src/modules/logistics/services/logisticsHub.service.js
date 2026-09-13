import { DeliveryHub } from "../../../models/deliveryHub.model.js";
import { DeliveryZone } from "../../../models/deliveryZone.model.js";
import { Manifest } from "../../../models/manifest.model.js";
import { Shipment } from "../../../models/shipment.model.js";
import { ShipmentEvent } from "../../../models/shipmentEvent.model.js";
import {
  emitShipmentStatusUpdated,
} from "../../../realtime/socket.js";

const pincodeDetailsCache = new Map();

async function resolveIndianPostalDetails(pinStr) {
  if (pincodeDetailsCache.has(pinStr)) return pincodeDetailsCache.get(pinStr);

  let result = {
    city: "Bengaluru",
    locality: "Area",
    state: "Karnataka",
  };

  const prefix = pinStr.slice(0, 2);
  if (prefix === "11") result = { city: "New Delhi", locality: "Delhi", state: "Delhi" };
  else if (prefix >= "12" && prefix <= "13") result = { city: "Gurugram", locality: "Haryana", state: "Haryana" };
  else if (prefix >= "14" && prefix <= "16") result = { city: "Chandigarh", locality: "Punjab", state: "Punjab" };
  else if (prefix >= "20" && prefix <= "28") result = { city: "Noida", locality: "Uttar Pradesh", state: "Uttar Pradesh" };
  else if (prefix >= "30" && prefix <= "34") result = { city: "Jaipur", locality: "Rajasthan", state: "Rajasthan" };
  else if (prefix >= "36" && prefix <= "39") result = { city: "Ahmedabad", locality: "Gujarat", state: "Gujarat" };
  else if (prefix >= "40" && prefix <= "44") result = { city: "Mumbai", locality: "Maharashtra", state: "Maharashtra" };
  else if (prefix >= "50" && prefix <= "53") result = { city: "Hyderabad", locality: "Telangana", state: "Telangana" };
  else if (prefix >= "56" && prefix <= "59") {
    result = { city: "Bengaluru", locality: pinStr === "560100" ? "Konappana Agrahara" : "Bengaluru", state: "Karnataka" };
  } else if (prefix >= "60" && prefix <= "64") result = { city: "Chennai", locality: "Tamil Nadu", state: "Tamil Nadu" };
  else if (prefix >= "67" && prefix <= "69") result = { city: "Kochi", locality: "Kerala", state: "Kerala" };
  else if (prefix >= "70" && prefix <= "74") result = { city: "Kolkata", locality: "West Bengal", state: "West Bengal" };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`https://api.postalpincode.in/pincode/${pinStr}`, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        result = {
          city: po.District || po.Division || result.city,
          locality: po.Name || po.Block || result.locality,
          state: po.State || result.state,
        };
      }
    }
  } catch {
    // Keep regional fallback
  }

  pincodeDetailsCache.set(pinStr, result);
  return result;
}

class LogisticsHubService {
  /**
   * Hub Management
   */
  async getHubs(query = {}) {
    const filter = {};
    if (query.city) filter.city = new RegExp(query.city, "i");
    if (query.status && query.status !== "ALL") filter.status = query.status;
    if (query.type && query.type !== "ALL") filter.type = query.type;

    return await DeliveryHub.find(filter).sort({ name: 1 }).lean();
  }

  async getHubById(id) {
    const hub = await DeliveryHub.findById(id).lean();
    if (!hub) throw new Error("Hub not found");

    // Compute live operational load
    const activeShipmentsCount = await Shipment.countDocuments({
      currentHub: hub._id,
      status: { $nin: ["DELIVERED", "CANCELLED", "RETURNED_TO_ORIGIN"] },
    });

    return {
      ...hub,
      liveBacklogCount: activeShipmentsCount,
    };
  }

  async createHub(data) {
    const hub = new DeliveryHub(data);
    await hub.save();
    return hub;
  }

  async updateHub(id, data) {
    const hub = await DeliveryHub.findByIdAndUpdate(id, data, { new: true });
    if (!hub) throw new Error("Hub not found");
    return hub;
  }

  /**
   * Delivery Zones
   */
  async getZones(query = {}) {
    const filter = {};
    if (query.city) filter.city = new RegExp(query.city, "i");
    return await DeliveryZone.find(filter).populate("hub", "hubCode name city").lean();
  }

  async createZone(data) {
    const zone = new DeliveryZone(data);
    await zone.save();
    return zone;
  }

  async updateZone(id, data) {
    return await DeliveryZone.findByIdAndUpdate(id, data, { new: true });
  }

  /**
   * Serviceability Check
   */
  async checkServiceability(pincode, serviceLevel = "STANDARD") {
    const code = Number(pincode);
    const zone = await DeliveryZone.findOne({ pincodes: code, serviceability: true })
      .populate("hub")
      .lean();

    if (!zone) {
      const pinStr = pincode ? pincode.toString().trim() : "";
      if (/^[1-9][0-9]{5}$/.test(pinStr)) {
        const estimatedDelivery = new Date(Date.now() + 72 * 60 * 60 * 1000);
        const postalDetails = await resolveIndianPostalDetails(pinStr);

        return {
          serviceable: true,
          zone: "National Logistics Network",
          city: postalDetails.city,
          locality: postalDetails.locality,
          state: postalDetails.state,
          hub: null,
          deliveryFee: 0,
          estimatedDelivery,
          slaHours: 72,
          sameDayAvailable: false,
          isStandardCourier: true,
          message: "Delivery available via Standard Express (2-4 business days)",
        };
      }
      return {
        serviceable: false,
        message: `Pincode ${pincode} is currently outside our direct fulfillment coverage.`,
      };
    }

    let slaHours = zone.standardSlaHours || 48;
    if (serviceLevel === "EXPRESS") slaHours = zone.expressSlaHours || 24;
    if (serviceLevel === "SAME_DAY" && zone.sameDayAvailable) slaHours = 10;

    const estimatedDelivery = new Date(Date.now() + slaHours * 60 * 60 * 1000);

    return {
      serviceable: true,
      zone: zone.name,
      city: zone.city,
      hub: zone.hub,
      deliveryFee: zone.deliveryFee,
      estimatedDelivery,
      slaHours,
      sameDayAvailable: zone.sameDayAvailable,
    };
  }

  /**
   * Manifests
   */
  async getManifests(query = {}) {
    const filter = {};
    if (query.status && query.status !== "ALL") filter.status = query.status;
    if (query.type && query.type !== "ALL") filter.type = query.type;

    return await Manifest.find(filter)
      .populate("originHub", "hubCode name city")
      .populate("destinationHub", "hubCode name city")
      .populate("shipments", "shipmentId trackingNumber status packageDetails")
      .sort({ createdAt: -1 })
      .lean();
  }

  async createManifest(data) {
    const count = await Manifest.countDocuments();
    const manifestNumber = `MNF-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const manifest = new Manifest({
      ...data,
      manifestNumber,
      status: "OPEN",
      totalShipmentsCount: data.shipments?.length || 0,
    });

    await manifest.save();
    return manifest;
  }

  async sealManifest(id, sealNumber) {
    const manifest = await Manifest.findById(id);
    if (!manifest) throw new Error("Manifest not found");
    if (manifest.status !== "OPEN") throw new Error("Only OPEN manifests can be sealed");

    manifest.status = "SEALED";
    manifest.sealNumber = sealNumber || `SEAL-${Date.now().toString(36).toUpperCase()}`;
    manifest.sealedAt = new Date();
    await manifest.save();
    return manifest;
  }

  async dispatchManifest(id) {
    const manifest = await Manifest.findById(id);
    if (!manifest) throw new Error("Manifest not found");
    if (manifest.status !== "SEALED") throw new Error("Manifest must be sealed before dispatch");

    manifest.status = "DISPATCHED";
    manifest.dispatchedAt = new Date();
    await manifest.save();

    // Transition all included shipments to IN_TRANSIT
    const now = new Date();
    for (const shipmentId of manifest.shipments) {
      await Shipment.findByIdAndUpdate(shipmentId, {
        status: "IN_TRANSIT",
        $push: {
          statusHistory: {
            status: "IN_TRANSIT",
            timestamp: now,
            note: `Dispatched via Manifest ${manifest.manifestNumber}`,
            updatedBy: "DISPATCH_LINEHAUL",
          },
        },
      });

      await ShipmentEvent.create({
        shipment: shipmentId,
        trackingNumber: "MANIFEST_DISPATCH",
        eventType: "DISPATCHED_IN_LINEHAUL",
        status: "IN_TRANSIT",
        note: `Dispatched in linehaul manifest ${manifest.manifestNumber}`,
        timestamp: now,
      });
    }

    return manifest;
  }

  async receiveManifest(id, receivedBy = "Hub Operator") {
    const manifest = await Manifest.findById(id);
    if (!manifest) throw new Error("Manifest not found");

    manifest.status = "RECEIVED";
    manifest.receivedAt = new Date();
    manifest.receivedBy = receivedBy;
    await manifest.save();

    // Update shipments currentHub to destinationHub and status to AT_HUB
    const now = new Date();
    for (const shipmentId of manifest.shipments) {
      await Shipment.findByIdAndUpdate(shipmentId, {
        status: "AT_HUB",
        currentHub: manifest.destinationHub,
        $push: {
          statusHistory: {
            status: "AT_HUB",
            timestamp: now,
            note: `Received at destination hub via Manifest ${manifest.manifestNumber}`,
            updatedBy: receivedBy,
          },
        },
      });

      await ShipmentEvent.create({
        shipment: shipmentId,
        trackingNumber: "HUB_RECEIVE",
        eventType: "ARRIVED_AT_HUB",
        status: "AT_HUB",
        hub: manifest.destinationHub,
        note: `Arrived and scanned at destination hub`,
        timestamp: now,
      });
    }

    return manifest;
  }

  /**
   * Barcode / QR Package Scan Processor
   */
  async processScanEvent(data) {
    const { barcode, scanEvent, hubId, operatorName } = data;
    const cleanCode = barcode.trim();

    const shipment = await Shipment.findOne({
      $or: [{ trackingNumber: cleanCode }, { shipmentId: cleanCode }],
    });

    if (!shipment) {
      throw new Error(`Package with barcode "${cleanCode}" not found in system.`);
    }

    const now = new Date();
    let nextStatus = shipment.status;

    if (scanEvent === "PICKED") nextStatus = "PICKED";
    else if (scanEvent === "PACKED") nextStatus = "PACKED";
    else if (scanEvent === "SORTED") nextStatus = "AT_HUB";
    else if (scanEvent === "LOADED") nextStatus = "IN_TRANSIT";
    else if (scanEvent === "DISPATCHED") nextStatus = "IN_TRANSIT";
    else if (scanEvent === "ARRIVED_AT_HUB") nextStatus = "AT_HUB";
    else if (scanEvent === "OUT_FOR_DELIVERY") nextStatus = "OUT_FOR_DELIVERY";
    else if (scanEvent === "DELIVERED") nextStatus = "DELIVERED";

    shipment.status = nextStatus;
    if (hubId) shipment.currentHub = hubId;

    shipment.statusHistory.push({
      status: nextStatus,
      timestamp: now,
      note: `Scanned as ${scanEvent} by ${operatorName || "Scanner"}`,
      updatedBy: operatorName || "SCANNER",
    });

    await shipment.save();

    await ShipmentEvent.create({
      shipment: shipment._id,
      trackingNumber: shipment.trackingNumber,
      eventType: scanEvent,
      status: nextStatus,
      hub: hubId || shipment.currentHub,
      operator: { id: "SCANNER", name: operatorName || "Scanner Device", role: "SCANNER" },
      source: "HUB_SCANNER",
      note: `Physical package scan: ${scanEvent}`,
      timestamp: now,
    });

    emitShipmentStatusUpdated(shipment);

    return {
      success: true,
      shipment,
      scannedAt: now,
      message: `Package ${shipment.trackingNumber} successfully recorded as ${scanEvent}`,
    };
  }
}

export default new LogisticsHubService();
