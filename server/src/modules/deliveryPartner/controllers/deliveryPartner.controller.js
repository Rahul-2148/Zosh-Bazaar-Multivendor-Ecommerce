import deliveryPartnerService from "../services/deliveryPartner.service.js";

class DeliveryPartnerController {
  async login(req, res) {
    try {
      const { identifier, secret } = req.body;
      const result = await deliveryPartnerService.login(identifier, secret);
      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: true,
        message: error.message || "Login failed",
      });
    }
  }

  async getProfile(req, res) {
    try {
      const agentId = req.agent.agentId;
      const profile = await deliveryPartnerService.getProfile(agentId);
      return res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: true,
        message: error.message || "Failed to fetch profile",
      });
    }
  }

  async updateShift(req, res) {
    try {
      const agentId = req.agent.agentId;
      const { action } = req.body;
      const updated = await deliveryPartnerService.updateShift(agentId, action);
      return res.status(200).json({
        success: true,
        message: `Shift status updated successfully: ${action}`,
        data: updated,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: true,
        message: error.message || "Shift update failed",
      });
    }
  }

  async getActiveRoute(req, res) {
    try {
      const agentId = req.agent.agentId;
      const route = await deliveryPartnerService.getActiveRoute(agentId);
      return res.status(200).json({
        success: true,
        data: route,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: true,
        message: error.message || "Failed to fetch active route",
      });
    }
  }

  async startRoute(req, res) {
    try {
      const agentId = req.agent.agentId;
      const { routeId } = req.params;
      const route = await deliveryPartnerService.startRoute(agentId, routeId);
      return res.status(200).json({
        success: true,
        message: "Route started. Shipments are now Out For Delivery.",
        data: route,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: true,
        message: error.message || "Failed to start route",
      });
    }
  }

  async arriveAtStop(req, res) {
    try {
      const agentId = req.agent.agentId;
      const { routeId, stopId } = req.params;
      const result = await deliveryPartnerService.arriveAtStop(agentId, routeId, stopId);
      return res.status(200).json({
        success: true,
        message: "Arrived at destination stop",
        data: result,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: true,
        message: error.message || "Arrival failed",
      });
    }
  }

  async scanPackage(req, res) {
    try {
      const agentId = req.agent.agentId;
      const { routeId, stopId } = req.params;
      const { barcode } = req.body;
      const result = await deliveryPartnerService.scanPackage(agentId, routeId, stopId, barcode);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: true,
        message: error.message || "Scan processing error",
      });
    }
  }

  async verifyOtp(req, res) {
    try {
      const agentId = req.agent.agentId;
      const { routeId, stopId } = req.params;
      const { otp } = req.body;
      const result = await deliveryPartnerService.verifyOtp(agentId, routeId, stopId, otp);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: true,
        message: error.message || "OTP verification error",
      });
    }
  }

  async collectPayment(req, res) {
    try {
      const agentId = req.agent.agentId;
      const { routeId, stopId } = req.params;
      const idempotencyKey = req.headers["x-idempotency-key"] || req.body.idempotencyKey;
      const result = await deliveryPartnerService.collectPayment(agentId, routeId, stopId, {
        ...req.body,
        idempotencyKey,
      });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: true,
        message: error.message || "Payment collection failed",
      });
    }
  }

  async completeDelivery(req, res) {
    try {
      const agentId = req.agent.agentId;
      const { routeId, stopId } = req.params;
      const idempotencyKey = req.headers["x-idempotency-key"] || req.body.idempotencyKey;
      const result = await deliveryPartnerService.completeDelivery(agentId, routeId, stopId, {
        pod: req.body.pod,
        idempotencyKey,
      });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: true,
        message: error.message || "Delivery completion failed",
      });
    }
  }

  async failDelivery(req, res) {
    try {
      const agentId = req.agent.agentId;
      const { routeId, stopId } = req.params;
      const result = await deliveryPartnerService.failDelivery(agentId, routeId, stopId, req.body);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: true,
        message: error.message || "Delivery failure recording failed",
      });
    }
  }

  async reportException(req, res) {
    try {
      const agentId = req.agent.agentId;
      const result = await deliveryPartnerService.reportException(agentId, req.body);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: true,
        message: error.message || "Exception report failed",
      });
    }
  }

  async updateLocation(req, res) {
    try {
      const agentId = req.agent.agentId;
      const result = await deliveryPartnerService.updateLocation(agentId, req.body);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: true,
        message: error.message || "Location ping failed",
      });
    }
  }

  async getEarnings(req, res) {
    try {
      const agentId = req.agent.agentId;
      const result = await deliveryPartnerService.getEarnings(agentId);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: true,
        message: error.message || "Failed to load earnings",
      });
    }
  }

  async getHistory(req, res) {
    try {
      const agentId = req.agent.agentId;
      const result = await deliveryPartnerService.getHistory(agentId, req.query);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: true,
        message: error.message || "Failed to load history",
      });
    }
  }
}

export default new DeliveryPartnerController();
