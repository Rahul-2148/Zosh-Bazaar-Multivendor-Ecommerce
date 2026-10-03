import express from "express";
import sellerRouter from "./routes/seller.route.js";
import sellerProductRouter from "./routes/sellerProduct.route.js";
import sellerOrderRouter from "./routes/sellerOrder.route.js";
import sellerReportRouter from "./routes/sellerReport.route.js";
import uploadRouter from "../customer/routes/upload.route.js";
import sellerAuthMiddleware from "../../middlewares/sellerAuthMiddleware.js";

const rootSellerRouter = express.Router();

rootSellerRouter.use("/product", sellerProductRouter);
rootSellerRouter.use("/order", sellerOrderRouter);
rootSellerRouter.use("/orders", sellerOrderRouter);
rootSellerRouter.use("/report", sellerReportRouter);
rootSellerRouter.use("/upload", sellerAuthMiddleware, uploadRouter);
rootSellerRouter.use("/", sellerRouter);

export default rootSellerRouter;
