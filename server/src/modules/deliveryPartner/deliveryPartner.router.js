import express from "express";
import deliveryPartnerRouter from "./routes/deliveryPartner.route.js";

const rootDeliveryPartnerRouter = express.Router();

rootDeliveryPartnerRouter.use("/", deliveryPartnerRouter);

export default rootDeliveryPartnerRouter;
