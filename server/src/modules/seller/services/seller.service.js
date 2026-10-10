import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { Address } from "../../../models/address.model.js";
import { Seller } from "../../../models/seller.model.js";
import { Product } from "../../../models/product.model.js";
import { Review } from "../../../models/review.model.js";
import { VerificationCode } from "../../../models/VerificationCode.js";
import AccountStatus from "../../../domain/AccountStatus.js";
import generateOTP from "../../../utils/generateOtp.js";
import jwtProvider from "../../../utils/jwtProvider.js";
import sendVerificationEmail from "../../../utils/sendEmail.js";
import { emailService, EMAIL_TEMPLATES, EmailPriority } from "../../email/index.js";

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
    console.log(`[SELLER_OTP] Generated OTP for ${email}: ${otp}`);

    const subject = "Zosh Bazaar Seller Login/Signup OTP";
    const body = `Your OTP is ${otp}. Please enter this code to continue.`;

    try {
      await emailService.sendTemplate({
        template:
          mode === "signup"
            ? EMAIL_TEMPLATES.SELLER.ONBOARDING_REGISTRATION_RECEIVED
            : EMAIL_TEMPLATES.SELLER.ONBOARDING_EMAIL_VERIFICATION,
        recipient: email,
        data: {
          sellerName: seller?.sellerName || "Merchant Partner",
          storeName: seller?.businessDetails?.businessName || "Zosh Bazaar Merchant",
          otp,
          expiresInMinutes: 10,
          validityMinutes: 10,
          purpose: mode === "signup" ? "Seller Portal Registration" : "Seller Security Verification",
        },
        priority: EmailPriority.HIGH,
        sync: false,
      });
    } catch (err) {
      console.warn("[SellerService] Fallback to direct send:", err.message);
      await sendVerificationEmail(email, subject, body);
    }
  }

  async getSellerById(id) {
    const seller = await Seller.findById(id);

    if (!seller) {
      throw new Error("Seller not found");
    }

    return seller;
  }

  async getPublicSellerProfile(sellerId) {
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      throw new Error("Invalid seller ID format");
    }

    const seller = await Seller.findById(sellerId).populate("pickupAddress");
    if (!seller) {
      throw new Error("Seller not found");
    }

    // Check account status against terminated states
    const isTerminated = [
      AccountStatus.DELETED,
      AccountStatus.DELETING,
      AccountStatus.BANNED,
      AccountStatus.CLOSED,
    ].includes(seller.accountStatus);

    if (isTerminated) {
      throw new Error("Seller storefront is permanently closed");
    }

    // Derive stable public seller code
    const sellerCode = `ZB-SLR-${seller._id.toString().slice(-6).toUpperCase()}`;

    // Query active published catalog products count
    const publishedProducts = await Product.find({
      seller: seller._id,
      status: "PUBLISHED",
    }).select("_id");
    const activeProductsCount = publishedProducts.length;
    const productIds = publishedProducts.map((p) => p._id);

    // True review aggregation across seller's published products
    let rating = null;
    let ratingCount = 0;
    const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (productIds.length > 0) {
      const stats = await Review.aggregate([
        { $match: { product: { $in: productIds }, status: "APPROVED" } },
        {
          $group: {
            _id: "$rating",
            count: { $sum: 1 },
          },
        },
      ]);

      let totalRatingSum = 0;
      for (const item of stats) {
        const star = Math.round(item._id);
        if (star >= 1 && star <= 5) {
          ratingBreakdown[star] = (ratingBreakdown[star] || 0) + item.count;
          ratingCount += item.count;
          totalRatingSum += item._id * item.count;
        }
      }

      if (ratingCount > 0) {
        rating = Math.round((totalRatingSum / ratingCount) * 10) / 10;
      }
    }

    // Calculate tenure in months
    const joinedDate = seller.createdAt || new Date();
    const tenureMonths = Math.max(
      1,
      Math.round((Date.now() - new Date(joinedDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
    );

    // Safe location representation
    const city = seller.pickupAddress?.city || "Regional Logistics Hub";
    const state = seller.pickupAddress?.state || "India";

    // Format safe masked GSTIN for business transparency without full data leakage
    const rawGstin = seller.GSTIN || "";
    const maskedGstin =
      rawGstin.length >= 15
        ? `${rawGstin.slice(0, 2)}••••••••${rawGstin.slice(-3)}`
        : rawGstin
        ? "GST Registered Merchant"
        : null;

    const isVerified =
      seller.accountStatus === AccountStatus.ACTIVE && Boolean(seller.isEmailVerified);

    return {
      sellerId: seller._id,
      sellerCode,
      businessName:
        seller.businessDetails?.businessName || seller.sellerName || "Zosh Marketplace Partner",
      sellerName: seller.sellerName,
      businessLogo: seller.businessDetails?.businessLogo || null,
      banner: seller.businessDetails?.banner || null,
      isVerified,
      accountStatus: seller.accountStatus,
      rating, // null when no reviews exist; never fabricated
      ratingCount, // 0 when no reviews exist
      ratingBreakdown,
      activeProductsCount,
      shipsFrom: {
        city,
        state,
      },
      fulfillmentMethod: "Zosh Express Logistics (Direct / Hub)",
      returnPolicy: "7 Days Replacement & Return Policy backed by Zosh Bazaar Buyer Guarantee",
      maskedGstin,
      joinedDate,
      tenureMonths,
    };
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
    const updated = await Seller.findByIdAndUpdate(
      sellerId,
      { $set: { accountStatus: status } },
      { new: true }
    );

    if (updated && updated.email) {
      try {
        let templateKey = null;
        if (status === "ACTIVE") {
          templateKey = EMAIL_TEMPLATES.SELLER.ONBOARDING_APPROVED;
        } else if (status === "SUSPENDED") {
          templateKey = EMAIL_TEMPLATES.SELLER.ONBOARDING_SUSPENDED;
        } else if (status === "REJECTED") {
          templateKey = EMAIL_TEMPLATES.SELLER.ONBOARDING_REJECTED;
        }

        if (templateKey) {
          emailService
            .sendTemplate({
              template: templateKey,
              recipient: updated.email,
              data: {
                sellerName: updated.sellerName,
                storeName: updated.businessDetails?.businessName || "Merchant Store",
                sellerId: updated._id.toString(),
                status,
              },
            })
            .catch((e) => console.warn("[SellerService] Status email dispatch error:", e.message));
        }
      } catch {
        /* non-critical */
      }
    }

    return updated;
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
