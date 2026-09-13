import { LogisticsException } from "../../../models/logisticsException.model.js";
import { Shipment } from "../../../models/shipment.model.js";
import { ShipmentEvent } from "../../../models/shipmentEvent.model.js";
import { emitLogisticsException } from "../../../realtime/socket.js";

class LogisticsExceptionService {
  async getExceptions(query = {}) {
    const filter = {};
    if (query.status && query.status !== "ALL") filter.status = query.status;
    if (query.type && query.type !== "ALL") filter.type = query.type;
    if (query.priority && query.priority !== "ALL") filter.priority = query.priority;

    return await LogisticsException.find(filter)
      .populate("shipment")
      .sort({ detectedAt: -1 })
      .lean();
  }

  async createException(data) {
    const count = await LogisticsException.countDocuments();
    const exceptionCode = `EXC-${String(count + 1001).padStart(5, "0")}`;

    const exception = new LogisticsException({
      ...data,
      exceptionCode,
      status: "DETECTED",
      history: [
        {
          status: "DETECTED",
          note: data.reason || "Exception detected by operations",
          updatedBy: data.operatorName || "SYSTEM",
          timestamp: new Date(),
        },
      ],
    });

    await exception.save();

    // Increment exceptions count on shipment
    if (data.shipment) {
      await Shipment.findByIdAndUpdate(data.shipment, {
        $inc: { exceptionsCount: 1 },
      });

      await ShipmentEvent.create({
        shipment: data.shipment,
        trackingNumber: data.trackingNumber || "SHIPMENT",
        eventType: "EXCEPTION_LOGGED",
        status: "EXCEPTION",
        note: `Exception ${exceptionCode}: ${data.reason}`,
        timestamp: new Date(),
      });
    }

    emitLogisticsException(exception);

    return exception;
  }

  async updateExceptionStatus(id, updateData) {
    const exception = await LogisticsException.findById(id);
    if (!exception) throw new Error("Exception not found");

    const { status, note, operatorName, resolutionNotes, actionTaken } = updateData;

    if (status) exception.status = status;
    if (resolutionNotes) exception.resolutionNotes = resolutionNotes;
    if (actionTaken) exception.actionTaken = actionTaken;
    if (status === "RESOLVED") exception.resolvedAt = new Date();

    exception.history.push({
      status: status || exception.status,
      note: note || resolutionNotes || `Exception updated to ${status}`,
      updatedBy: operatorName || "OPERATOR",
      timestamp: new Date(),
    });

    await exception.save();
    return exception;
  }
}

export default new LogisticsExceptionService();
