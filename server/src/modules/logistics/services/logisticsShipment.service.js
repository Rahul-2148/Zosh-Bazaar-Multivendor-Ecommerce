import mongoose from "mongoose";
import { Shipment } from "../../../models/shipment.model.js";
import { ShipmentEvent } from "../../../models/shipmentEvent.model.js";
import { DeliveryAgent } from "../../../models/deliveryAgent.model.js";
import { Order } from "../../../models/order.model.js";
import {
  ShipmentStatus,
  VALID_SHIPMENT_TRANSITIONS,
  SlaStatus,
} from "../../../domain/LogisticsStatus.js";
import {
  emitShipmentCreated,
  emitShipmentStatusUpdated,
} from "../../../realtime/socket.js";

class LogisticsShipmentService {
  /**
   * Generates next human-readable IDs
   */
  generateShipmentId() {
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `ZB-SHP-${rand}`;
  }

  generateTrackingNumber() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "ZBT";
    for (let i = 0; i < 9; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Create a new shipment from an order
   */
  async createShipment(data) {
    const shipmentId = this.generateShipmentId();
    const trackingNumber = this.generateTrackingNumber();

    // Calculate volumetric weight: (L x W x H in cm) / 5000
    const dims = data.packageDetails?.dimensionsCm || { length: 25, width: 18, height: 10 };
    const volumetricWeightKg = Number(((dims.length * dims.width * dims.height) / 5000).toFixed(2));
    const deadWeightKg = Number(data.packageDetails?.weightKg || 0.8);

    // Calculate promised SLA based on service level
    const now = new Date();
    let slaHours = 48;
    if (data.serviceLevel === "EXPRESS") slaHours = 24;
    if (data.serviceLevel === "SAME_DAY") slaHours = 10;
    const promisedTo = new Date(now.getTime() + slaHours * 60 * 60 * 1000);

    const shipment = new Shipment({
      ...data,
      shipmentId,
      trackingNumber,
      status: ShipmentStatus.CREATED,
      packageDetails: {
        ...data.packageDetails,
        dimensionsCm: dims,
        weightKg: deadWeightKg,
        volumetricWeightKg,
        itemsCount: data.items?.length || 1,
      },
      sla: {
        promisedFrom: now,
        promisedTo,
        slaStatus: SlaStatus.ON_TRACK,
      },
      statusHistory: [
        {
          status: ShipmentStatus.CREATED,
          timestamp: now,
          note: "Shipment booked and registered in logistics network",
          updatedBy: data.operatorName || "SYSTEM",
        },
      ],
    });

    await shipment.save();

    // Create initial audit event
    await ShipmentEvent.create({
      shipment: shipment._id,
      trackingNumber,
      eventType: "PACKAGE_CREATED",
      status: ShipmentStatus.CREATED,
      note: "Shipment created in fulfillment queue",
      source: "SYSTEM",
      operator: { id: "SYS", name: "Fulfillment Engine", role: "SYSTEM" },
      timestamp: now,
    });

    emitShipmentCreated(shipment);

    return shipment;
  }

  /**
   * Query filtered, paginated shipments
   */
  async getShipments(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};

    // Status filter
    if (query.status && query.status !== "ALL") {
      filter.status = query.status;
    }

    // SLA status filter
    if (query.slaStatus && query.slaStatus !== "ALL") {
      filter["sla.slaStatus"] = query.slaStatus;
    }

    // Hub filter
    if (query.hubId) {
      filter.$or = [
        { originHub: query.hubId },
        { destinationHub: query.hubId },
        { currentHub: query.hubId },
      ];
    }

    // City filter
    if (query.city) {
      filter["deliveryAddress.city"] = new RegExp(query.city, "i");
    }

    // Priority filter
    if (query.priority) {
      filter.priority = query.priority;
    }

    // Service level filter
    if (query.serviceLevel) {
      filter.serviceLevel = query.serviceLevel;
    }

    // Seller filter
    if (query.sellerId) {
      filter.seller = query.sellerId;
    }

    // Assigned agent filter
    if (query.agentId) {
      filter.assignedAgent = query.agentId;
    }

    // Global Search: Tracking Number, Shipment ID, Customer Name, Mobile, Pincode
    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      filter.$or = [
        { shipmentId: new RegExp(s, "i") },
        { trackingNumber: new RegExp(s, "i") },
        { "deliveryAddress.name": new RegExp(s, "i") },
        { "deliveryAddress.mobile": new RegExp(s, "i") },
        { "deliveryAddress.pincode": Number(s) || 0 },
      ];
    }

    const [shipments, total] = await Promise.all([
      Shipment.find(filter)
        .populate("seller", "sellerName email businessDetails mobile")
        .populate("originHub", "hubCode name city")
        .populate("destinationHub", "hubCode name city")
        .populate("currentHub", "hubCode name city")
        .populate("assignedAgent", "agentId name phone vehicle status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Shipment.countDocuments(filter),
    ]);

    return {
      shipments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single shipment with full operational details
   */
  async getShipmentById(id) {
    let query = { _id: id };
    if (!mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ shipmentId: id }, { trackingNumber: id }] };
    }

    const shipment = await Shipment.findOne(query)
      .populate("order")
      .populate("seller", "sellerName email businessDetails mobile pickupAddress")
      .populate("customer", "fullName email mobile")
      .populate("originHub")
      .populate("destinationHub")
      .populate("currentHub")
      .populate("assignedAgent")
      .populate("currentRoute");

    if (!shipment) throw new Error("Shipment not found");

    // Fetch immutable audit event history
    const events = await ShipmentEvent.find({ shipment: shipment._id })
      .sort({ timestamp: 1 })
      .lean();

    return {
      shipment,
      auditEvents: events,
    };
  }

  /**
   * Customer-safe public tracking
   */
  async getCustomerTracking(trackingNumber) {
    const shipment = await Shipment.findOne({ trackingNumber })
      .select(
        "shipmentId trackingNumber status serviceLevel sla estimatedDelivery deliveryAddress.city deliveryAddress.locality carrier createdAt updatedAt"
      )
      .lean();

    if (!shipment) throw new Error("Tracking number not found");

    const events = await ShipmentEvent.find({ trackingNumber })
      .select("status eventType location.city note timestamp")
      .sort({ timestamp: 1 })
      .lean();

    // Map internal events to customer-safe simplified milestones
    const safeTimeline = events.map((e) => ({
      status: e.status,
      title: e.eventType.replace(/_/g, " "),
      city: e.location?.city || "",
      timestamp: e.timestamp,
    }));

    return {
      shipment,
      timeline: safeTimeline,
    };
  }

  /**
   * Execute valid state machine transition
   */
  async transitionStatus(shipmentId, nextStatus, operator = {}, note = "") {
    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) throw new Error("Shipment not found");

    const allowed = VALID_SHIPMENT_TRANSITIONS[shipment.status] || [];
    if (!allowed.includes(nextStatus)) {
      throw new Error(
        `Invalid status transition: Cannot move shipment from "${shipment.status}" to "${nextStatus}". Allowed: [${allowed.join(
          ", "
        )}]`
      );
    }

    const previousStatus = shipment.status;
    shipment.status = nextStatus;

    const now = new Date();

    // Append to status history
    shipment.statusHistory.push({
      status: nextStatus,
      timestamp: now,
      note: note || `Shipment transitioned to ${nextStatus}`,
      updatedBy: operator.name || "OPERATOR",
      location: operator.location || "",
      hubName: operator.hubName || "",
    });

    // Check SLA completion or breach
    if (nextStatus === ShipmentStatus.DELIVERED) {
      shipment.sla.actualDeliveredAt = now;
      shipment.sla.slaStatus =
        now <= shipment.sla.promisedTo ? SlaStatus.COMPLETED : SlaStatus.BREACHED;

      // Update parent Order if all shipments delivered
      await Order.findByIdAndUpdate(shipment.order, {
        orderStatus: "DELIVERED",
        $push: {
          statusHistory: {
            status: "DELIVERED",
            timestamp: now,
            note: `Delivered via Shipment ${shipment.shipmentId}`,
            updatedBy: "LOGISTICS",
          },
        },
      });
    } else if (now > shipment.sla.promisedTo && shipment.status !== ShipmentStatus.DELIVERED) {
      shipment.sla.slaStatus = SlaStatus.BREACHED;
    }

    await shipment.save();

    // Record immutable audit event
    await ShipmentEvent.create({
      shipment: shipment._id,
      trackingNumber: shipment.trackingNumber,
      eventType: nextStatus,
      status: nextStatus,
      hub: shipment.currentHub,
      hubName: operator.hubName || "",
      operator: {
        id: operator.id || "OP-1",
        name: operator.name || "Operator",
        role: operator.role || "LOGISTICS_OPERATOR",
      },
      source: "OPERATIONS_CONSOLE",
      note: note || `Status updated from ${previousStatus} to ${nextStatus}`,
      timestamp: now,
    });

    emitShipmentStatusUpdated(shipment);

    return shipment;
  }

  /**
   * Server-side Agent Assignment
   */
  async assignAgent(shipmentId, agentId, operator = {}) {
    const [shipment, agent] = await Promise.all([
      Shipment.findById(shipmentId),
      DeliveryAgent.findById(agentId),
    ]);

    if (!shipment) throw new Error("Shipment not found");
    if (!agent) throw new Error("Delivery Agent not found");

    if (agent.status === "SUSPENDED" || agent.status === "OFFLINE") {
      throw new Error(`Cannot assign to agent in status "${agent.status}"`);
    }

    shipment.assignedAgent = agent._id;
    shipment.assignedVehicle = {
      plateNumber: agent.vehicle?.plateNumber || "",
      vehicleType: agent.vehicle?.vehicleType || "BIKE",
    };

    if (shipment.status === ShipmentStatus.PACKED || shipment.status === ShipmentStatus.READY_FOR_DISPATCH) {
      shipment.status = ShipmentStatus.OUT_FOR_DELIVERY;
    }

    await shipment.save();

    // Increment agent active shipments count
    await DeliveryAgent.findByIdAndUpdate(agentId, {
      $inc: { activeShipmentsCount: 1, "todayStats.assigned": 1 },
      status: "ASSIGNED",
    });

    // Record event
    await ShipmentEvent.create({
      shipment: shipment._id,
      trackingNumber: shipment.trackingNumber,
      eventType: "ASSIGNED_TO_AGENT",
      status: shipment.status,
      operator: {
        id: operator.id || "DISPATCHER",
        name: operator.name || "Dispatcher",
        role: "DISPATCHER",
      },
      note: `Assigned to delivery agent ${agent.name} (${agent.agentId})`,
      timestamp: new Date(),
    });

    emitShipmentStatusUpdated(shipment);

    return shipment;
  }

  /**
   * Record Proof of Delivery (POD)
   */
  async recordProofOfDelivery(shipmentId, podData, operator = {}) {
    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) throw new Error("Shipment not found");

    const now = new Date();

    shipment.status = ShipmentStatus.DELIVERED;
    shipment.proofOfDelivery = {
      deliveredAt: now,
      recipientName: podData.recipientName || shipment.deliveryAddress.name,
      relationshipToCustomer: podData.relationshipToCustomer || "SELF",
      signatureUrl: podData.signatureUrl || "",
      photoUrl: podData.photoUrl || "",
      otpVerified: Boolean(podData.otpVerified),
      location: podData.location || { lat: shipment.deliveryAddress.lat, lng: shipment.deliveryAddress.lng },
      agentId: shipment.assignedAgent,
    };

    shipment.sla.actualDeliveredAt = now;
    shipment.sla.slaStatus = now <= shipment.sla.promisedTo ? SlaStatus.COMPLETED : SlaStatus.BREACHED;

    shipment.statusHistory.push({
      status: ShipmentStatus.DELIVERED,
      timestamp: now,
      note: `Delivered to ${shipment.proofOfDelivery.recipientName} (POD verified)`,
      updatedBy: operator.name || "AGENT",
    });

    await shipment.save();

    // Decrement agent active count & increment completed count
    if (shipment.assignedAgent) {
      await DeliveryAgent.findByIdAndUpdate(shipment.assignedAgent, {
        $inc: { activeShipmentsCount: -1, "todayStats.completed": 1 },
      });
    }

    // Update parent order
    await Order.findByIdAndUpdate(shipment.order, {
      orderStatus: "DELIVERED",
      deliveryDate: now,
    });

    // Audit event
    await ShipmentEvent.create({
      shipment: shipment._id,
      trackingNumber: shipment.trackingNumber,
      eventType: "DELIVERED",
      status: ShipmentStatus.DELIVERED,
      operator: {
        id: operator.id || "AGENT",
        name: operator.name || "Delivery Agent",
        role: "DELIVERY_AGENT",
      },
      note: `Delivered with POD verification`,
      metadata: shipment.proofOfDelivery,
      timestamp: now,
    });

    emitShipmentStatusUpdated(shipment);

    return shipment;
  }

  /**
   * Record failed delivery attempt
   */
  async recordDeliveryAttempt(shipmentId, attemptData, operator = {}) {
    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) throw new Error("Shipment not found");

    const attemptNumber = (shipment.deliveryAttempts?.length || 0) + 1;
    const now = new Date();

    const attempt = {
      attemptNumber,
      timestamp: now,
      agent: shipment.assignedAgent,
      agentName: operator.name || "Agent",
      reasonCode: attemptData.reasonCode || "CUSTOMER_UNAVAILABLE",
      notes: attemptData.notes || "Customer not answering phone",
      nextAttemptScheduledAt: attemptData.nextAttemptScheduledAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    shipment.deliveryAttempts.push(attempt);
    shipment.status = ShipmentStatus.DELIVERY_FAILED;

    shipment.statusHistory.push({
      status: ShipmentStatus.DELIVERY_FAILED,
      timestamp: now,
      note: `Delivery attempt #${attemptNumber} failed: ${attempt.reasonCode}`,
      updatedBy: operator.name || "AGENT",
    });

    await shipment.save();

    // Audit event
    await ShipmentEvent.create({
      shipment: shipment._id,
      trackingNumber: shipment.trackingNumber,
      eventType: "DELIVERY_ATTEMPTED",
      status: ShipmentStatus.DELIVERY_FAILED,
      note: `Attempt #${attemptNumber} failed: ${attempt.reasonCode}`,
      metadata: attempt,
      timestamp: now,
    });

    emitShipmentStatusUpdated(shipment);

    return shipment;
  }
}

export default new LogisticsShipmentService();
