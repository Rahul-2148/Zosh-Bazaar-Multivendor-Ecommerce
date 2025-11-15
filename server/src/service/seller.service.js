import bcrypt from "bcrypt";
import { Address } from "../models/address.model.js";
import { Seller } from "../models/seller.model.js";
import { VerificationCode } from "../models/VerificationCode.js";
import generateOTP from "../utils/generateOtp.js";
import jwtProvider from "../utils/jwtProvider.js";
import sendVerificationEmail from "../utils/sendEmail.js";

class SellerService {
  async createSeller(sellerData) {
    const existingSeller = await Seller.findOne({ email: sellerData.email });
    if (existingSeller) {
      throw new Error("Seller already exists with this email");
    }

    let savedAddress = null;
    if (sellerData.pickupAddress) {
      savedAddress = await Address.create(sellerData.pickupAddress);
    }

    const hashedPassword = await bcrypt.hash(sellerData.password, 10);

    const newSeller = new Seller({
      sellerName: sellerData.sellerName,
      email: sellerData.email,
      mobile: sellerData.mobile,
      password: hashedPassword,
      pickupAddress: savedAddress?._id,
      GSTIN: sellerData.GSTIN,
      bankDetails: sellerData.bankDetails,
      businessDetails: sellerData.businessDetails,
      role: sellerData.role || "SELLER",
      accountStatus: sellerData.accountStatus || "PENDING_VERIFICATION",
      isEmailVerified: sellerData.isEmailVerified,
    });

    const savedSeller = await newSeller.save();

    // 🔥 Generate JWT
    const token = jwtProvider.createJwt({ email: savedSeller.email });

    return {
      seller: savedSeller,
      jwt: token,
      role: savedSeller.role,
    };
  }

  // verify login otp
  async getSellerByEmail(email) {
    const seller = await Seller.findOne({ email }).populate("pickupAddress");
    if (!seller) {
      throw new Error("Seller not found");
    }
    return seller;
  }

  // get seller profile
  async getSellerProfile(jwt) {
    const email = jwtProvider.getEmailFromJwt(jwt);
    return await Seller.findOne({ email }).populate("pickupAddress");
  }

  async sendSellerLoginOTP(email, mode = "login") {
    if (!email) {
      throw new Error("Email is required to send OTP");
    }
    const SIGNIN_PREFIX = "signin_";

    if (email.startsWith(SIGNIN_PREFIX)) {
      email = email.substring(SIGNIN_PREFIX.length);
    }

    const seller = await Seller.findOne({ email });

    if (mode === "login") {
      if (!seller) {
        throw new Error("Seller not found for login");
      }
    } else if (mode === "signup") {
      if (seller) {
        throw new Error("Seller account already exists with this email");
      }
    }

    // Delete old OTP
    await VerificationCode.findOneAndDelete({ email });

    // Generate new OTP
    const otp = generateOTP();
    const verificationCode = new VerificationCode({ email, otp });
    await verificationCode.save();

    const subject = "Zosh Bazaar Seller Login/Signup OTP";
    const body = `Your OTP is ${otp}. Please enter this code to continue.`;
    await sendVerificationEmail(email, subject, body);
  }

  async getSellerById(id) {
    const seller = await Seller.findById(id);

    if (!seller) {
      throw new Error("Seller not found");
    }

    return seller;
  }

  async getAllSellers(status) {
    const query = status ? { accountStatus: status } : {};
    return await Seller.find(query);
  }

  async updateSeller(existingSeller, sellerData) {
    return await Seller.findByIdAndUpdate(existingSeller._id, sellerData, {
      new: true,
    });
  }

  async updateSellerStatus(sellerId, status) {
    return await Seller.findByIdAndUpdate(
      sellerId,
      { $set: { accountStatus: status } },
      { new: true }
    );
  }

  async deleteSeller(sellerId) {
    const seller = await Seller.findByIdAndDelete(sellerId);
    if (seller?.pickupAddress) {
      await Address.findByIdAndDelete(seller.pickupAddress);
    }
    return seller;
  }
}

export default new SellerService();
