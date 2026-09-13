import UserRoles from "../../../domain/UserRole.js";
import { VerificationCode } from "../../../models/VerificationCode.js";
import sellerService from "../services/seller.service.js";
import jwtProvider from "../../../utils/jwtProvider.js";

class SellerController {
  async sendSellerLoginOtp(req, res) {
    try {
      let { email, mode } = req.body;
      if (!mode) mode = "login";

      if (!["signup", "login"].includes(mode)) {
        throw new Error("Invalid mode. Must be 'signup' or 'login'.");
      }

      await sellerService.sendSellerLoginOTP(email, mode);

      res.status(200).json({
        message: "OTP sent successfully",
        error: false,
        success: true,
        otpSent: true,
      });
    } catch (error) {
      res
        .status(400)
        .json({ message: error.message, error: true, success: false });
    }
  }

  async verifyLoginOtp(req, res) {
    try {
      const { email, otp } = req.body;

      const isOtpValid = await VerificationCode.findOne({ email, otp });
      if (!isOtpValid) {
        throw new Error("Invalid OTP");
      }

      const seller = await sellerService.getSellerByEmail(email);

      const token = jwtProvider.generateToken({
        email: seller.email,
        role: UserRoles.ROLE_SELLER,
      });

      res.status(200).json({
        message: "Login successful",
        jwt: token,
        error: false,
        success: true,
        role: UserRoles.ROLE_SELLER,
      });
    } catch (error) {
      res
        .status(400)
        .json({ message: error.message, error: true, success: false });
    }
  }

  async createSeller(req, res) {
    try {
      const seller = await sellerService.createSeller(req.body);

      const token = jwtProvider.generateToken({
        email: seller.email,
        role: UserRoles.ROLE_SELLER,
      });

      res.status(200).json({
        message: "Seller created successfully",
        jwt: token,
        error: false,
        success: true,
        role: UserRoles.ROLE_SELLER,
      });
    } catch (error) {
      res
        .status(400)
        .json({ message: error.message, error: true, success: false });
    }
  }

  async getSellerProfile(req, res) {
    try {
      const seller = req.seller;
      res.status(200).json({
        seller: seller,
        message: "Seller profile fetched successfully",
        error: false,
        success: true,
      });
    } catch (error) {
      res
        .status(400)
        .json({ message: error.message, error: true, success: false });
    }
  }

  async getAllSellers(req, res) {
    try {
      const sellers = await sellerService.getAllSellers(req.query.status);
      res.status(200).json({
        sellers: sellers,
        message: "All sellers fetched successfully",
        error: false,
        success: true,
      });
    } catch (error) {
      res
        .status(400)
        .json({ message: error.message, error: true, success: false });
    }
  }

  async updateSeller(req, res) {
    try {
      const seller = await sellerService.updateSeller(
        req.seller._id,
        req.body
      );
      res.status(200).json({
        seller: seller,
        message: "Seller updated successfully",
        error: false,
        success: true,
      });
    } catch (error) {
      res
        .status(400)
        .json({ message: error.message, error: true, success: false });
    }
  }

  async updateSellerAccountStatus(req, res) {
    try {
      const seller = await sellerService.updateSellerAccountStatus(
        req.params.id,
        req.params.accountStatus
      );
      res.status(200).json({
        seller: seller,
        message: "Seller status updated successfully",
        error: false,
        success: true,
      });
    } catch (error) {
      res
        .status(400)
        .json({ message: error.message, error: true, success: false });
    }
  }

  async deleteSeller(req, res) {
    try {
      const seller = await sellerService.deleteSeller(req.params.id);
      res.status(200).json({
        seller: seller,
        message: "Seller deleted successfully",
        error: false,
        success: true,
      });
    } catch (error) {
      res
        .status(400)
        .json({ message: error.message, error: true, success: false });
    }
  }

  async getSellerById(req, res) {
    try {
      const seller = await sellerService.getSellerById(req.params.id);
      res.status(200).json({
        seller: seller,
        message: "Seller fetched successfully",
        error: false,
        success: true,
      });
    } catch (error) {
      res
        .status(400)
        .json({ message: error.message, error: true, success: false });
    }
  }

  async getSellerReport(req, res) {
    try {
      const seller = await req.seller;
      const SellerReportService = (await import("../services/sellerReport.service.js")).default;
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
}

export default new SellerController();
