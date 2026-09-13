import { SellerReport } from "../../../models/sellerReport.model.js";

class SellerReportService {
  async getSellerReport(seller) {
    try {
      const sellerId = seller?._id || seller;
      let sellerReport = await SellerReport.findOne({ seller: sellerId });
      console.log("Fetched Seller Report for:", sellerId, sellerReport);

      // If the report doesn't exist, create a new one
      if (!sellerReport) {
        sellerReport = new SellerReport({
          seller: sellerId,
          totalOrders: 0,
          totalEarnings: 0,
          totalSales: 0,
        });

        sellerReport = await sellerReport.save();
      }
      return sellerReport;
    } catch (error) {
      throw new Error(`Error fetching seller report ${error.message}`);
    }
  }
  async updateSellerReport(sellerReport) {
    try {
      // Update and save the seller report
      return await SellerReport.findByIdAndUpdate(
        sellerReport._id,
        sellerReport,
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error updating seller report: ${error.message}`);
    }
  }
}

export default new SellerReportService();
