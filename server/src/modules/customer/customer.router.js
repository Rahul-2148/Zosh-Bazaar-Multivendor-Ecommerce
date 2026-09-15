import express from "express";
import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
import categoryRouter from "./routes/category.route.js";
import brandRouter from "./routes/brand.route.js";
import productRouter from "./routes/product.route.js";
import reviewRouter from "./routes/review.route.js";
import settingsRouter from "../admin/routes/settings.route.js";
import cartRouter from "./routes/cart.route.js";
import orderRouter from "./routes/order.route.js";
import paymentRouter from "./routes/payment.route.js";
import homeCategoryRouter from "./routes/homeCategory.route.js";
import transactionRouter from "./routes/transaction.route.js";
import wishlistRouter from "./routes/wishlist.route.js";
import couponRouter from "./routes/coupon.route.js";
import notificationRouter from "./routes/notification.route.js";
import uploadRouter from "./routes/upload.route.js";
import accountRouter from "./routes/account.route.js";
import aiRouter from "../ai/ai.router.js";

const customerRouter = express.Router();

customerRouter.use("/auth", authRouter);
customerRouter.use("/user", userRouter);
customerRouter.use("/account", accountRouter);
customerRouter.use("/category", categoryRouter);
customerRouter.use("/brand", brandRouter);
customerRouter.use("/product", productRouter);
customerRouter.use("/review", reviewRouter);
customerRouter.use("/settings", settingsRouter);
customerRouter.use("/cart", cartRouter);
customerRouter.use("/order", orderRouter);
customerRouter.use("/payment", paymentRouter);
customerRouter.use("/homeCategory", homeCategoryRouter);
customerRouter.use("/home", homeCategoryRouter);
customerRouter.use("/transactions", transactionRouter);
customerRouter.use("/transaction", transactionRouter);
customerRouter.use("/wishlist", wishlistRouter);
customerRouter.use("/coupon", couponRouter);
customerRouter.use("/notifications", notificationRouter);
customerRouter.use("/upload", uploadRouter);
customerRouter.use("/recommendations", aiRouter);
customerRouter.use("/ai", aiRouter);

export default customerRouter;

