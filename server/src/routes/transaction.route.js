import express from "express";
import sellerAuthMiddleware from "../middlewares/sellerAuthMiddleware.js";
import transactionController from "../controllers/transaction.controller.js";

const transactionRouter = express.Router();

// get transaction by seller   
transactionRouter.get(
  "/seller",
  sellerAuthMiddleware,
  transactionController.getTransactionBySeller
);

export default transactionRouter;
