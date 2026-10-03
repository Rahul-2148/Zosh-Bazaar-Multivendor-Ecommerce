import express from "express";
import adminRouter from "./routes/admin.route.js";
import dealRouter from "./routes/deal.route.js";
import uploadRouter from "../customer/routes/upload.route.js";

const rootAdminRouter = express.Router();

rootAdminRouter.use("/deal", dealRouter);
rootAdminRouter.use("/upload", uploadRouter);
rootAdminRouter.use("/", adminRouter);

export default rootAdminRouter;
