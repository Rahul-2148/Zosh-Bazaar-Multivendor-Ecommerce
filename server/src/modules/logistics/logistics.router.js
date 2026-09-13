import express from "express";
import logisticsRouter from "./routes/logistics.route.js";

const rootLogisticsRouter = express.Router();

rootLogisticsRouter.use("/", logisticsRouter);

export default rootLogisticsRouter;
