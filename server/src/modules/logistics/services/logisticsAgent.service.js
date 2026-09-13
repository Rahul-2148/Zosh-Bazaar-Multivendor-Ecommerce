import { DeliveryAgent } from "../../../models/deliveryAgent.model.js";
import { DeliveryRoute } from "../../../models/deliveryRoute.model.js";
import { Shipment } from "../../../models/shipment.model.js";
import { emitAgentStatusUpdated, getIO } from "../../../realtime/socket.js";

class LogisticsAgentService {
  /**
   * Agents Management
   */
  async getAgents(query = {}) {
    const filter = {};
    if (query.status && query.status !== "ALL") filter.status = query.status;
    if (query.hubId) filter.assignedHub = query.hubId;
    if (query.zone) filter.currentZone = new RegExp(query.zone, "i");

    return await DeliveryAgent.find(filter)
      .populate("assignedHub", "hubCode name city")
      .sort({ name: 1 })
      .lean();
  }

  async getAgentById(id) {
    const agent = await DeliveryAgent.findById(id).populate("assignedHub").lean();
    if (!agent) throw new Error("Agent not found");

    // Fetch active assigned shipments
    const activeShipments = await Shipment.find({
      assignedAgent: agent._id,
      status: { $in: ["PACKED", "READY_FOR_DISPATCH", "OUT_FOR_DELIVERY", "DELIVERY_FAILED"] },
    })
      .select("shipmentId trackingNumber status deliveryAddress priority packageDetails sla")
      .lean();

    return {
      ...agent,
      activeShipments,
    };
  }

  async createAgent(data) {
    const count = await DeliveryAgent.countDocuments();
    const agentId = data.agentId || `AGT-${String(count + 101).padStart(4, "0")}`;

    const agent = new DeliveryAgent({
      ...data,
      agentId,
    });
    await agent.save();
    return agent;
  }

  async updateAgentStatus(id, status) {
    const agent = await DeliveryAgent.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!agent) throw new Error("Agent not found");
    emitAgentStatusUpdated(agent);
    return agent;
  }

  async updateLocation(id, coords) {
    const agent = await DeliveryAgent.findByIdAndUpdate(
      id,
      {
        currentLocation: {
          lat: coords.lat,
          lng: coords.lng,
          lastPingAt: new Date(),
        },
      },
      { new: true }
    );
    if (!agent) throw new Error("Agent not found");
    return agent;
  }

  /**
   * Route Planning & Stop Sequencing
   */
  async getRoutes(query = {}) {
    const filter = {};
    if (query.agentId) filter.agent = query.agentId;
    if (query.status && query.status !== "ALL") filter.status = query.status;

    return await DeliveryRoute.find(filter)
      .populate("agent", "agentId name phone vehicle")
      .populate("hub", "hubCode name city")
      .sort({ createdAt: -1 })
      .lean();
  }

  async createRoute(data) {
    const count = await DeliveryRoute.countDocuments();
    const routeCode = `RT-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

    const stops = (data.stops || []).map((stop, idx) => ({
      ...stop,
      stopIndex: idx + 1,
      status: "PENDING",
    }));

    const route = new DeliveryRoute({
      ...data,
      routeCode,
      stops,
      totalStops: stops.length,
      status: "PLANNED",
    });

    await route.save();

    if (data.agent) {
      const agentDoc = await DeliveryAgent.findByIdAndUpdate(
        data.agent,
        { activeRoute: route._id, status: "ASSIGNED" },
        { new: true }
      );

      const io = getIO();
      if (io && agentDoc) {
        io.to(`agent_${agentDoc.agentId}`).emit("route:assigned", route);
        io.to(`agent_${agentDoc._id}`).emit("route:assigned", route);
        io.to("logistics_control_tower").emit("route:created", {
          routeCode: route.routeCode,
          agentId: agentDoc.agentId,
          totalStops: route.totalStops,
        });
      }
    }

    return route;
  }

  async updateStopStatus(routeId, stopId, status, failureReason = "") {
    const route = await DeliveryRoute.findById(routeId);
    if (!route) throw new Error("Route not found");

    const stop = route.stops.id(stopId);
    if (!stop) throw new Error("Stop not found");

    stop.status = status;
    if (status === "DELIVERED" || status === "FAILED") {
      stop.completedAt = new Date();
    }
    if (failureReason) {
      stop.failureReason = failureReason;
    }

    route.completedStops = route.stops.filter(
      (s) => s.status === "DELIVERED" || s.status === "FAILED"
    ).length;

    if (route.completedStops === route.totalStops) {
      route.status = "COMPLETED";
      route.endedAt = new Date();
    } else if (route.status === "PLANNED") {
      route.status = "ACTIVE";
      route.startedAt = new Date();
    }

    await route.save();

    const io = getIO();
    if (io) {
      const agentDoc = await DeliveryAgent.findById(route.agent);
      if (agentDoc) {
        io.to(`agent_${agentDoc.agentId}`).emit("route:updated", route);
        io.to(`agent_${agentDoc._id}`).emit("route:updated", route);
      }
      io.to("logistics_control_tower").emit("route:updated", route);
    }

    return route;
  }
}

export default new LogisticsAgentService();
