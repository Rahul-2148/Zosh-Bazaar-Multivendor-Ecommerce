import { SellerReport } from "../models/sellerReport.model.js";

class SellerReportService {
  async getSellerReport(seller) {
    try {
      let sellerReport = await SellerReport.findOne({ seller: seller._id });
      console.log("Fetched Seller Report: ", sellerReport);

      // If the report doesn't exist, create a new one
      if (!sellerReport) {
        sellerReport = new SellerReport({
          seller: seller._id,
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
