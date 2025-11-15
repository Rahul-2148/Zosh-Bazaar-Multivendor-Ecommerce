import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import connectDB from "./db/connectDB.js";
dotenv.config();

// importing routes
import adminRouter from "./routes/admin.route.js";
import authRouter from "./routes/auth.route.js";
import sellerRouter from "./routes/seller.route.js";
import userRouter from "./routes/user.route.js";
import productRouter from "./routes/product.route.js";
import sellerProductRouter from "./routes/sellerProduct.route.js";
import cartRouter from "./routes/cart.route.js";
import orderRouter from "./routes/order.route.js";
import sellerOrderRouter from "./routes/sellerOrder.route.js";
import paymentRouter from "./routes/payment.route.js";
import transactionRouter from "./routes/transaction.route.js";
import sellerReportRouter from "./routes/sellerReport.route.js";
import homeCategoryRouter from "./routes/homeCategory.route.js";
import dealRouter from "./routes/deal.route.js";

const app = express();

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(morgan("dev"));

// using routes (customer)
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/product", productRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/payment", paymentRouter);
app.use("/api/v1/homeCategory", homeCategoryRouter);
app.use("/api/v1/transactions", transactionRouter);

// seller routes
app.use("/api/v1/seller", sellerRouter);
app.use("/api/v1/seller/product", sellerProductRouter);
app.use("/api/v1/seller/order", sellerOrderRouter);
app.use("/api/v1/seller/report", sellerReportRouter);

// admin routes
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/admin/deal", dealRouter);

// default route
app.get("/", (req, res) => {
  res.send({ message: "Hello! Welcome to Zosh Bazaar Backend System!" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await connectDB();
});
