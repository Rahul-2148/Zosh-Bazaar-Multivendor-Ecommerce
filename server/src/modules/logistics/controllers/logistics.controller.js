import logisticsShipmentService from "../services/logisticsShipment.service.js";
import logisticsHubService from "../services/logisticsHub.service.js";
import logisticsAgentService from "../services/logisticsAgent.service.js";
import logisticsExceptionService from "../services/logisticsException.service.js";
import logisticsAnalyticsService from "../services/logisticsAnalytics.service.js";

class LogisticsController {
  // Overview & Analytics
  async getOverview(req, res, next) {
    try {
      const data = await logisticsAnalyticsService.getOverviewMetrics();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getOperationsBoard(req, res, next) {
    try {
      const lanes = await logisticsAnalyticsService.getOperationsBoard(req.query);
      res.status(200).json({ success: true, lanes });
    } catch (err) {
      next(err);
    }
  }

  async getAnalytics(req, res, next) {
    try {
      const data = await logisticsAnalyticsService.getDetailedAnalytics(req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // Shipments
  async getShipments(req, res, next) {
    try {
      const result = await logisticsShipmentService.getShipments(req.query);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getShipmentById(req, res, next) {
    try {
      const result = await logisticsShipmentService.getShipmentById(req.params.id);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async createShipment(req, res, next) {
    try {
      const shipment = await logisticsShipmentService.createShipment(req.body);
      res.status(201).json({
        success: true,
        message: "Shipment created successfully",
        shipment,
      });
    } catch (err) {
      next(err);
    }
  }

  async transitionStatus(req, res, next) {
    try {
      const { status, note, location, hubName } = req.body;
      const operator = {
        id: req.user?._id || "OPERATOR",
        name: req.user?.fullName || "Logistics Operator",
        role: req.user?.role || "OPERATOR",
        location,
        hubName,
      };

      const shipment = await logisticsShipmentService.transitionStatus(
        req.params.id,
        status,
        operator,
        note
      );

      res.status(200).json({
        success: true,
        message: `Shipment moved to ${status}`,
        shipment,
      });
    } catch (err) {
      next(err);
    }
  }

  async assignAgent(req, res, next) {
    try {
      const { agentId } = req.body;
      const operator = {
        id: req.user?._id || "DISPATCHER",
        name: req.user?.fullName || "Dispatcher",
      };

      const shipment = await logisticsShipmentService.assignAgent(
        req.params.id,
        agentId,
        operator
      );

      res.status(200).json({
        success: true,
        message: "Agent assigned successfully",
        shipment,
      });
    } catch (err) {
      next(err);
    }
  }

  async recordProofOfDelivery(req, res, next) {
    try {
      const operator = {
        name: req.user?.fullName || "Delivery Agent",
      };

      const shipment = await logisticsShipmentService.recordProofOfDelivery(
        req.params.id,
        req.body,
        operator
      );

      res.status(200).json({
        success: true,
        message: "Proof of delivery recorded",
        shipment,
      });
    } catch (err) {
      next(err);
    }
  }

  async recordDeliveryAttempt(req, res, next) {
    try {
      const operator = {
        name: req.user?.fullName || "Delivery Agent",
      };

      const shipment = await logisticsShipmentService.recordDeliveryAttempt(
        req.params.id,
        req.body,
        operator
      );

      res.status(200).json({
        success: true,
        message: "Delivery attempt recorded",
        shipment,
      });
    } catch (err) {
      next(err);
    }
  }

  // Public / Customer Safe Tracking
  async getCustomerTracking(req, res, next) {
    try {
      const result = await logisticsShipmentService.getCustomerTracking(
        req.params.trackingNumber
      );
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      if (err.message && err.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          error: true,
          message: err.message,
        });
      }
      next(err);
    }
  }

  // Hubs & Facilities
  async getHubs(req, res, next) {
    try {
      const hubs = await logisticsHubService.getHubs(req.query);
      res.status(200).json({ success: true, hubs });
    } catch (err) {
      next(err);
    }
  }

  async getHubById(req, res, next) {
    try {
      const hub = await logisticsHubService.getHubById(req.params.id);
      res.status(200).json({ success: true, hub });
    } catch (err) {
      next(err);
    }
  }

  async createHub(req, res, next) {
    try {
      const hub = await logisticsHubService.createHub(req.body);
      res.status(201).json({ success: true, hub });
    } catch (err) {
      next(err);
    }
  }

  async updateHub(req, res, next) {
    try {
      const hub = await logisticsHubService.updateHub(req.params.id, req.body);
      res.status(200).json({ success: true, hub });
    } catch (err) {
      next(err);
    }
  }

  // Delivery Zones & Serviceability
  async getZones(req, res, next) {
    try {
      const zones = await logisticsHubService.getZones(req.query);
      res.status(200).json({ success: true, zones });
    } catch (err) {
      next(err);
    }
  }

  async createZone(req, res, next) {
    try {
      const zone = await logisticsHubService.createZone(req.body);
      res.status(201).json({ success: true, zone });
    } catch (err) {
      next(err);
    }
  }

  async checkServiceability(req, res, next) {
    try {
      const { pincode, serviceLevel } = req.query;
      const result = await logisticsHubService.checkServiceability(
        pincode,
        serviceLevel
      );
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  // Manifests
  async getManifests(req, res, next) {
    try {
      const manifests = await logisticsHubService.getManifests(req.query);
      res.status(200).json({ success: true, manifests });
    } catch (err) {
      next(err);
    }
  }

  async createManifest(req, res, next) {
    try {
      const manifest = await logisticsHubService.createManifest(req.body);
      res.status(201).json({ success: true, manifest });
    } catch (err) {
      next(err);
    }
  }

  async sealManifest(req, res, next) {
    try {
      const manifest = await logisticsHubService.sealManifest(
        req.params.id,
        req.body.sealNumber
      );
      res.status(200).json({ success: true, manifest });
    } catch (err) {
      next(err);
    }
  }

  async dispatchManifest(req, res, next) {
    try {
      const manifest = await logisticsHubService.dispatchManifest(req.params.id);
      res.status(200).json({ success: true, manifest });
    } catch (err) {
      next(err);
    }
  }

  async receiveManifest(req, res, next) {
    try {
      const manifest = await logisticsHubService.receiveManifest(
        req.params.id,
        req.body.receivedBy
      );
      res.status(200).json({ success: true, manifest });
    } catch (err) {
      next(err);
    }
  }

  // Package Scanner
  async processScan(req, res, next) {
    try {
      const result = await logisticsHubService.processScanEvent(req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  // Delivery Agents
  async getAgents(req, res, next) {
    try {
      const agents = await logisticsAgentService.getAgents(req.query);
      res.status(200).json({ success: true, agents });
    } catch (err) {
      next(err);
    }
  }

  async getAgentById(req, res, next) {
    try {
      const agent = await logisticsAgentService.getAgentById(req.params.id);
      res.status(200).json({ success: true, agent });
    } catch (err) {
      next(err);
    }
  }

  async createAgent(req, res, next) {
    try {
      const agent = await logisticsAgentService.createAgent(req.body);
      res.status(201).json({ success: true, agent });
    } catch (err) {
      next(err);
    }
  }

  async updateAgentStatus(req, res, next) {
    try {
      const agent = await logisticsAgentService.updateAgentStatus(
        req.params.id,
        req.body.status
      );
      res.status(200).json({ success: true, agent });
    } catch (err) {
      next(err);
    }
  }

  async updateAgentLocation(req, res, next) {
    try {
      const agent = await logisticsAgentService.updateLocation(
        req.params.id,
        req.body
      );
      res.status(200).json({ success: true, agent });
    } catch (err) {
      next(err);
    }
  }

  // Routes
  async getRoutes(req, res, next) {
    try {
      const routes = await logisticsAgentService.getRoutes(req.query);
      res.status(200).json({ success: true, routes });
    } catch (err) {
      next(err);
    }
  }

  async createRoute(req, res, next) {
    try {
      const route = await logisticsAgentService.createRoute(req.body);
      res.status(201).json({ success: true, route });
    } catch (err) {
      next(err);
    }
  }

  async updateRouteStop(req, res, next) {
    try {
      const { status, failureReason } = req.body;
      const route = await logisticsAgentService.updateStopStatus(
        req.params.routeId,
        req.params.stopId,
        status,
        failureReason
      );
      res.status(200).json({ success: true, route });
    } catch (err) {
      next(err);
    }
  }

  // Exceptions
  async getExceptions(req, res, next) {
    try {
      const exceptions = await logisticsExceptionService.getExceptions(req.query);
      res.status(200).json({ success: true, exceptions });
    } catch (err) {
      next(err);
    }
  }

  async createException(req, res, next) {
    try {
      const exception = await logisticsExceptionService.createException(req.body);
      res.status(201).json({ success: true, exception });
    } catch (err) {
      next(err);
    }
  }

  async updateExceptionStatus(req, res, next) {
    try {
      const exception = await logisticsExceptionService.updateExceptionStatus(
        req.params.id,
        req.body
      );
      res.status(200).json({ success: true, exception });
    } catch (err) {
      next(err);
    }
  }
}

export default new LogisticsController();
