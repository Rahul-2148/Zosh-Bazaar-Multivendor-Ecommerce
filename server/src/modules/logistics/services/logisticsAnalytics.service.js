import { Shipment } from "../../../models/shipment.model.js";
import { DeliveryHub } from "../../../models/deliveryHub.model.js";
import { DeliveryAgent } from "../../../models/deliveryAgent.model.js";
import { Manifest } from "../../../models/manifest.model.js";
import { LogisticsException } from "../../../models/logisticsException.model.js";

class LogisticsAnalyticsService {
  /**
   * Real Control Tower Overview Metrics
   */
  async getOverviewMetrics() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      shipmentsToday,
      totalShipments,
      inTransitCount,
      outForDeliveryCount,
      deliveredTodayCount,
      pendingDispatchCount,
      failedDeliveriesCount,
      delayedCount,
      slaOnTrackCount,
      slaAtRiskCount,
      slaBreachedCount,
      openExceptionsCount,
      activeHubsCount,
      activeAgentsCount,
      openManifestsCount,
    ] = await Promise.all([
      Shipment.countDocuments({ createdAt: { $gte: todayStart } }),
      Shipment.countDocuments({}),
      Shipment.countDocuments({ status: { $in: ["DISPATCHED", "IN_TRANSIT"] } }),
      Shipment.countDocuments({ status: "OUT_FOR_DELIVERY" }),
      Shipment.countDocuments({
        status: "DELIVERED",
        "proofOfDelivery.deliveredAt": { $gte: todayStart },
      }),
      Shipment.countDocuments({
        status: { $in: ["CREATED", "ALLOCATED", "PICKING", "PACKED", "READY_FOR_DISPATCH"] },
      }),
      Shipment.countDocuments({ status: "DELIVERY_FAILED" }),
      Shipment.countDocuments({ status: "DELAYED" }),
      Shipment.countDocuments({ "sla.slaStatus": "ON_TRACK" }),
      Shipment.countDocuments({ "sla.slaStatus": "AT_RISK" }),
      Shipment.countDocuments({ "sla.slaStatus": "BREACHED" }),
      LogisticsException.countDocuments({ status: { $ne: "RESOLVED" } }),
      DeliveryHub.countDocuments({ status: "ACTIVE" }),
      DeliveryAgent.countDocuments({ status: { $in: ["AVAILABLE", "ASSIGNED", "OUT_FOR_DELIVERY"] } }),
      Manifest.countDocuments({ status: { $in: ["OPEN", "SEALED", "DISPATCHED"] } }),
    ]);

    // Calculate real on-time delivery rate
    const totalDelivered = await Shipment.countDocuments({ status: "DELIVERED" });
    const onTimeDelivered = await Shipment.countDocuments({
      status: "DELIVERED",
      "sla.slaStatus": { $in: ["COMPLETED", "ON_TRACK"] },
    });
    const onTimePercentage =
      totalDelivered > 0 ? Number(((onTimeDelivered / totalDelivered) * 100).toFixed(1)) : 100;

    return {
      liveOverview: {
        shipmentsToday,
        totalShipments,
        inTransit: inTransitCount,
        outForDelivery: outForDeliveryCount,
        deliveredToday: deliveredTodayCount,
        pendingDispatch: pendingDispatchCount,
        failedDeliveries: failedDeliveriesCount,
        delayed: delayedCount,
      },
      sla: {
        onTrack: slaOnTrackCount,
        atRisk: slaAtRiskCount,
        breached: slaBreachedCount,
        onTimePercentage,
      },
      networkHealth: {
        activeHubs: activeHubsCount,
        activeAgents: activeAgentsCount,
        pendingManifests: openManifestsCount,
        openExceptions: openExceptionsCount,
      },
    };
  }

  /**
   * Live Operations Board (Lanes)
   */
  async getOperationsBoard(filters = {}) {
    const query = {};
    if (filters.city) query["deliveryAddress.city"] = new RegExp(filters.city, "i");
    if (filters.hubId) query.currentHub = filters.hubId;
    if (filters.slaStatus && filters.slaStatus !== "ALL") query["sla.slaStatus"] = filters.slaStatus;

    const shipments = await Shipment.find(query)
      .populate("originHub", "hubCode name")
      .populate("destinationHub", "hubCode name")
      .populate("currentHub", "hubCode name")
      .populate("assignedAgent", "name agentId vehicle")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const lanes = {
      READY_TO_PICK: [],
      PICKING: [],
      PACKING: [],
      READY_FOR_DISPATCH: [],
      IN_TRANSIT: [],
      AT_HUB: [],
      OUT_FOR_DELIVERY: [],
      DELIVERED: [],
    };

    for (const s of shipments) {
      if (s.status === "CREATED" || s.status === "ALLOCATED") lanes.READY_TO_PICK.push(s);
      else if (s.status === "PICKING") lanes.PICKING.push(s);
      else if (s.status === "PICKED" || s.status === "PACKING") lanes.PACKING.push(s);
      else if (s.status === "PACKED" || s.status === "READY_FOR_DISPATCH") lanes.READY_FOR_DISPATCH.push(s);
      else if (s.status === "DISPATCHED" || s.status === "IN_TRANSIT") lanes.IN_TRANSIT.push(s);
      else if (s.status === "AT_HUB") lanes.AT_HUB.push(s);
      else if (s.status === "OUT_FOR_DELIVERY" || s.status === "DELIVERY_FAILED") lanes.OUT_FOR_DELIVERY.push(s);
      else if (s.status === "DELIVERED") lanes.DELIVERED.push(s);
    }

    return lanes;
  }

  /**
   * Comprehensive Operational Logistics Analytics
   */
  async getDetailedAnalytics(query = {}) {
    const days = parseInt(query.days) || 14;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const [
      totalShipments,
      deliveredShipments,
      onTimeDelivered,
      failedShipments,
      returnedShipments,
      serviceLevelAgg,
      slaStatusAgg,
      exceptionTypeAgg,
      dailyTrendAgg,
      hubPerformanceAgg,
      agentPerformanceAgg,
      allDeliveredWithTimes,
    ] = await Promise.all([
      Shipment.countDocuments({ createdAt: { $gte: startDate } }),
      Shipment.countDocuments({ status: "DELIVERED", createdAt: { $gte: startDate } }),
      Shipment.countDocuments({
        status: "DELIVERED",
        "sla.slaStatus": { $in: ["COMPLETED", "ON_TRACK"] },
        createdAt: { $gte: startDate },
      }),
      Shipment.countDocuments({ status: "DELIVERY_FAILED", createdAt: { $gte: startDate } }),
      Shipment.countDocuments({ status: "RETURNED", createdAt: { $gte: startDate } }),
      Shipment.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: "$serviceLevel", count: { $sum: 1 } } },
      ]),
      Shipment.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: "$sla.slaStatus", count: { $sum: 1 } } },
      ]),
      LogisticsException.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
      Shipment.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            created: { $sum: 1 },
            delivered: {
              $sum: { $cond: [{ $eq: ["$status", "DELIVERED"] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Shipment.aggregate([
        { $match: { currentHub: { $ne: null } } },
        {
          $group: {
            _id: "$currentHub",
            total: { $sum: 1 },
            inTransit: {
              $sum: { $cond: [{ $in: ["$status", ["DISPATCHED", "IN_TRANSIT"]] }, 1, 0] },
            },
            atHub: {
              $sum: { $cond: [{ $eq: ["$status", "AT_HUB"] }, 1, 0] },
            },
          },
        },
        { $limit: 10 },
      ]),
      DeliveryAgent.find({})
        .select("name agentId metrics rating status")
        .sort({ "metrics.completedDeliveries": -1 })
        .limit(10)
        .lean(),
      Shipment.find({
        status: "DELIVERED",
        createdAt: { $gte: startDate },
        "proofOfDelivery.deliveredAt": { $exists: true },
      })
        .select("createdAt proofOfDelivery statusHistory deliveryAttempts")
        .limit(100)
        .lean(),
    ]);

    // Calculate real averages
    let totalDeliveryHours = 0;
    let totalDispatchHours = 0;
    let singleAttemptCount = 0;

    for (const s of allDeliveredWithTimes) {
      if (s.proofOfDelivery?.deliveredAt && s.createdAt) {
        const diffMs = new Date(s.proofOfDelivery.deliveredAt) - new Date(s.createdAt);
        totalDeliveryHours += Math.max(0, diffMs / (1000 * 60 * 60));
      }

      // Check dispatch time
      const dispatchStep = s.statusHistory?.find((h) => h.status === "DISPATCHED");
      if (dispatchStep && s.createdAt) {
        const dispatchMs = new Date(dispatchStep.timestamp) - new Date(s.createdAt);
        totalDispatchHours += Math.max(0, dispatchMs / (1000 * 60 * 60));
      }

      if (!s.deliveryAttempts || s.deliveryAttempts.length <= 1) {
        singleAttemptCount++;
      }
    }

    const avgDeliveryTimeHours =
      allDeliveredWithTimes.length > 0
        ? Number((totalDeliveryHours / allDeliveredWithTimes.length).toFixed(1))
        : 0;

    const avgDispatchTimeHours =
      allDeliveredWithTimes.length > 0
        ? Number((totalDispatchHours / allDeliveredWithTimes.length).toFixed(1))
        : 0;

    const firstAttemptDeliveryPct =
      allDeliveredWithTimes.length > 0
        ? Number(((singleAttemptCount / allDeliveredWithTimes.length) * 100).toFixed(1))
        : 100;

    const onTimePercentage =
      deliveredShipments > 0
        ? Number(((onTimeDelivered / deliveredShipments) * 100).toFixed(1))
        : 100;

    const failedDeliveryPct =
      totalShipments > 0
        ? Number(((failedShipments / totalShipments) * 100).toFixed(1))
        : 0;

    const returnRatePct =
      totalShipments > 0
        ? Number(((returnedShipments / totalShipments) * 100).toFixed(1))
        : 0;

    // Populate Hub names
    const populatedHubs = await DeliveryHub.populate(hubPerformanceAgg, {
      path: "_id",
      select: "name hubCode city capacity",
    });

    return {
      kpis: {
        totalShipments,
        deliveredShipments,
        onTimePercentage,
        avgDeliveryTimeHours,
        avgDispatchTimeHours,
        firstAttemptDeliveryPct,
        failedDeliveryPct,
        returnRatePct,
      },
      serviceLevels: serviceLevelAgg.map((s) => ({
        name: s._id || "STANDARD",
        count: s.count,
      })),
      slaDistribution: slaStatusAgg.map((s) => ({
        status: s._id || "ON_TRACK",
        count: s.count,
      })),
      exceptions: exceptionTypeAgg.map((e) => ({
        type: e._id,
        count: e.count,
      })),
      dailyTrends: dailyTrendAgg.map((d) => ({
        date: d._id,
        created: d.created,
        delivered: d.delivered,
      })),
      hubPerformance: populatedHubs.map((h) => ({
        hubId: h._id?._id,
        name: h._id?.name || "Hub Facility",
        hubCode: h._id?.hubCode || "HUB",
        city: h._id?.city || "City",
        capacity: h._id?.capacity?.dailyThroughput || 1000,
        volume: h.total,
        backlog: h.atHub,
        inTransit: h.inTransit,
      })),
      topAgents: agentPerformanceAgg.map((a) => ({
        id: a._id,
        name: a.name,
        agentId: a.agentId,
        completed: a.metrics?.completedDeliveries || 0,
        failed: a.metrics?.failedDeliveries || 0,
        rating: a.rating || 5.0,
        status: a.status,
      })),
    };
  }
}

export default new LogisticsAnalyticsService();
