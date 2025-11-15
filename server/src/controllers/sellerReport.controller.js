import SellerReportService from "../service/sellerReport.service.js";

class SellerReportController {
  async getSellerReport(req, res) {
    try {
      const seller = await req.seller;
      const report = await SellerReportService.getSellerReport(seller._id);
      return res.status(200).json({
        message: "Seller report fetched successfully",
        report: report,
        error: false,
        success: true,
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async updateSellerReport(req, res) {
    try {
      const seller = await req.seller;
      const report = await SellerReportService.updateSellerReport(
        seller._id,
        req.body
      );
      return res.status(200).json({
        message: "Seller report updated!",
        report: report,
        error: false,
        success: true,
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}

export default new SellerReportController();
