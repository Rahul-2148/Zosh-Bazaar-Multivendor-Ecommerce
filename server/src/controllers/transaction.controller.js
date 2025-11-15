import TransactionService from "../service/transaction.service.js";

class TransactionController {
  async getTransactionBySeller(req, res) {
    try {
      const seller = await req.seller;
      const transactions = await TransactionService.getTransactionBySellerId(
        seller._id
      );
      return res.status(200).json({
        message: "Transactions fetched successfully",
        transactions: transactions,
        error: false,
        success: true,
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}

export default new TransactionController();
