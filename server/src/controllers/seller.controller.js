import UserRoles from "../domain/UserRole.js";
import { VerificationCode } from "../models/VerificationCode.js";
import sellerService from "../service/seller.service.js";
import jwtProvider from "../utils/jwtProvider.js";

class SellerController {
  async sendSellerLoginOtp(req, res) {
    try {
      const { email, mode } = req.body;

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
        .status(error instanceof Error ? 404 : 500)
        .json({ message: error.message });
    }
  }

  async verifyLoginOtp(req, res) {
    try {
      const { email, otp } = req.body;
      const seller = await sellerService.getSellerByEmail(email);

      const verificationCode = await VerificationCode.findOne({ email });
      if (!verificationCode || verificationCode.otp !== otp) {
        throw new Error("Invalid OTP");
      }

      const token = jwtProvider.createJwt({ email });

      const authResponse = {
        message: `Welcome back seller ${seller.sellerName}`,
        jwt: token,
        role: UserRoles.SELLER,
        seller: seller,
        error: false,
        success: true,
      };

      res.status(200).json(authResponse);
    } catch (error) {
      res
        .status(error instanceof Error ? 404 : 500)
        .json({ message: error.message });
    }
  }

  async createSeller(req, res) {
    try {
      const seller = await sellerService.createSeller(req.body);
      res.status(200).json({
        message: "Seller created successfully",
        error: false,
        success: true,
        seller: seller,
      });
    } catch (error) {
      res
        .status(error instanceof Error ? 404 : 500)
        .json({ message: error.message });
    }
  }

  // ------------------
  async getSellerProfile(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({ message: "Authorization token missing or invalid" });
      }

      const profile = await req.seller;
      console.log("profile", profile);
      const token = authHeader.split(" ")[1];
      const seller = await sellerService.getSellerProfile(token);

      res.status(200).json({
        message: "Seller profile fetched successfully",
        seller,
        error: false,
        success: true,
      });
    } catch (error) {
      res
        .status(error instanceof Error ? 404 : 500)
        .json({ message: error.message });
    }
  }

  async getAllSellers(req, res) {
    try {
      const status = req.query.status;
      const sellers = await sellerService.getAllSellers(status);
      res.status(200).json({
        message: "All sellers fetched successfully",
        sellers: sellers,
        error: false,
        success: true,
      });
    } catch (error) {
      res
        .status(error instanceof Error ? 404 : 500)
        .json({ message: error.message });
    }
  }

  async updateSeller(req, res) {
    try {
      const existingSeller = await req.seller;
      const seller = await sellerService.updateSeller(existingSeller, req.body);
      res.status(200).json({
        seller: seller,
        message: "Seller updated successfully",
        error: false,
        success: true,
      });
    } catch (error) {
      res
        .status(error instanceof Error ? 404 : 500)
        .json({ message: error.message });
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
        .status(error instanceof Error ? 404 : 500)
        .json({ message: error.message });
    }
  }

  // update seller account status (admin route banega)
  async updateSellerAccountStatus(req, res) {
    try {
      const updatedSeller = await sellerService.updateSellerStatus(
        req.params.id,
        req.params.accountStatus
      );
      res.status(200).json({
        seller: updatedSeller,
        message: "Seller account status updated!",
        error: false,
        success: true,
      });
    } catch (error) {
      res
        .status(error instanceof Error ? 404 : 500)
        .json({ message: error.message });
    }
  }
}

export default new SellerController();
