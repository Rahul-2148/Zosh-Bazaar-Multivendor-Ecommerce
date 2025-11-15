import { Order } from "../models/order.model.js";
import { Seller } from "../models/seller.model.js";
import Transaction from "../models/transaction.model.js";

class TransactionService {
  // create a new transaction for an order
  async createTransaction(orderId) {
    try {
      const order = await Order.findById(orderId).populate("seller");
      if (!order) {
        throw new Error("Order not found");
      }
      const seller = await Seller.findById(order.seller._id);
      if (!seller) {
        throw new Error("Seller not found");
      }
      // create a new transaction
      const transaction = new Transaction({
        seller: seller._id,
        customer: order.user,
        order: order._id,
      });
      // save and return the transaction
      return await transaction.save();
    } catch (error) {
      throw new Error(`Error creating transaction: ${error.message}`);
    }
  }

  // Get all transactions
  async getAllTransactions() {
    try {
      return await Transaction.find().populate("seller order customer");
    } catch (error) {
      throw new Error(`Error fetching transactions: ${error.message}`);
    }
  }

  // ------------seller route -------------
  // Get transaction by seller ID
  async getTransactionBySellerId(sellerId) {
    try {
      return await Transaction.find({ seller: sellerId }).populate("order");
    } catch (error) {
      throw new Error(`Error fetching transactions: ${error.message}`);
    }
  }
}

export default new TransactionService();
