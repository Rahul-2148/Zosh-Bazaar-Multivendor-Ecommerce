import express from "express";
import adminRouter from "./routes/admin.route.js";
import dealRouter from "./routes/deal.route.js";
import uploadRouter from "../customer/routes/upload.route.js";
import authMiddleware from "../../middlewares/authMiddleware.js";
import { adminOnly } from "../../middlewares/rbac.middleware.js";

const rootAdminRouter = express.Router();

rootAdminRouter.use("/deal", dealRouter);
rootAdminRouter.use("/upload", authMiddleware, adminOnly, uploadRouter);
rootAdminRouter.use("/", adminRouter);

export default rootAdminRouter;
