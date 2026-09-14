import bcrypt from "bcrypt";
import { Cart } from "../../../models/cart.model.js";
import { Seller } from "../../../models/seller.model.js";
import { User } from "../../../models/user.model.js";
import { VerificationCode } from "../../../models/VerificationCode.js";
import generateOTP from "../../../utils/generateOtp.js";
import jwtProvider from "../../../utils/jwtProvider.js";
import sendVerificationEmail from "../../../utils/sendEmail.js";
import { redisClient } from "../../../config/redis.service.js";
import { emailService, EMAIL_TEMPLATES, EmailPriority } from "../../email/index.js";

class AuthService {
  async sendLoginOTP(email, mode = "auto") {
    if (!email) {
      throw new Error("Email or mobile is required to send verification code");
    }
    const SIGNIN_PREFIX = "signin_";

    // Remove prefix if it's added by the client
    if (email.startsWith(SIGNIN_PREFIX)) {
      email = email.substring(SIGNIN_PREFIX.length);
    }
    email = email.trim().toLowerCase();

    // Check rate-limit cooldown
    const cooldownRemaining = await redisClient.ttl(`otp_cooldown:${email}`);
    if (cooldownRemaining > 0) {
      const err = new Error(
        `Please wait ${cooldownRemaining}s before requesting a new OTP.`
      );
      err.statusCode = 429;
      err.cooldownRemaining = cooldownRemaining;
      throw err;
    }

    const user = await User.findOne({ email });
    const seller = await Seller.findOne({ email });
    const exists = Boolean(user || seller);
    let isNewUser = !exists;

    if (mode === "login" && !exists) {
      // Seamlessly allow new customer registration rather than dead 400 error
      isNewUser = true;
    } else if (mode === "signup" && exists) {
      // Seamlessly allow existing user login rather than dead 400 error
      isNewUser = false;
    }

    // Delete old OTP from DB
    await VerificationCode.findOneAndDelete({ email });

    // Generate and save new OTP in Redis (10 min TTL - Flipkart/Amazon standard) and cooldown (60s)
    const otp = generateOTP();
    await redisClient.set(`otp:${email}`, otp, 600);
    await redisClient.set(`otp_cooldown:${email}`, "1", 60);

    // Save in DB as persistent fallback
    const verificationCode = new VerificationCode({ email, otp });
    await verificationCode.save();

    console.log(`🔑 [REDIS & DB OTP GENERATED]: ${otp} for ${email} (isNewUser: ${isNewUser})`);

    // Dispatch rich responsive transactional OTP email
    try {
      await emailService.sendTemplate({
        template: isNewUser
          ? EMAIL_TEMPLATES.CUSTOMER.AUTH_EMAIL_VERIFICATION
          : EMAIL_TEMPLATES.CUSTOMER.AUTH_LOGIN_OTP,
        recipient: email,
        data: {
          name: user?.fullName || user?.name || email.split("@")[0] || "Dear Customer",
          otp,
          expiresInMinutes: 10,
          validityMinutes: 10,
          purpose: isNewUser ? "Account Registration" : "Account Login Authentication",
          device: "Web Browser",
          time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        },
        priority: EmailPriority.HIGH,
        sync: false,
      });
    } catch (err) {
      console.warn("[AuthService] Fallback to direct send:", err.message);
      const subject = isNewUser
        ? "Zosh Bazaar - Registration Verification Code"
        : "Zosh Bazaar - Login Security OTP";
      const body = `Your 6-digit verification code is: ${otp}\n\nThis code is valid for 5 minutes. Do not share this code with anyone.`;
      await sendVerificationEmail(email, subject, body);
    }

    return {
      message: isNewUser
        ? "Welcome! We've sent a 6-digit verification code to register."
        : "OTP sent successfully to your registered email.",
      cooldownSeconds: 60,
      isNewUser,
      exists,
    };
  }

  async getOtpCooldown(email) {
    if (!email) return { canResend: true, remainingSeconds: 0 };
    const cooldownRemaining = await redisClient.ttl(`otp_cooldown:${email}`);
    return {
      canResend: cooldownRemaining <= 0,
      remainingSeconds: Math.max(0, cooldownRemaining),
    };
  }

  async createUser(req) {
    const { fullName, email, otp, mobile, password } = req;

    if (!email || !otp) {
      throw new Error("Email and OTP are required");
    }

    let user = await User.findOne({ email });

    // If user already exists, authenticate them seamlessly
    if (user) {
      return jwtProvider.createJwt({ email });
    }

    // Verify OTP via Redis fast path or DB fallback
    let isValid = false;
    const cachedOtp = await redisClient.get(`otp:${email}`);
    if (cachedOtp && String(cachedOtp) === String(otp)) {
      isValid = true;
      await redisClient.del(`otp:${email}`);
    } else {
      const verificationCode = await VerificationCode.findOne({ email });
      if (verificationCode && verificationCode.otp === otp) {
        isValid = true;
        await VerificationCode.findOneAndDelete({ email });
      }
    }

    if (!isValid) {
      throw new Error("Invalid or expired OTP");
    }

    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    user = new User({
      email,
      fullName: fullName || email.split("@")[0],
      mobile: mobile || "",
      role: "ROLE_CUSTOMER",
      password: hashedPassword,
    });

    await user.save();

    const cart = new Cart({ user: user._id });
    await cart.save();

    // Trigger rich welcome email asynchronously
    emailService
      .sendTemplate({
        template: EMAIL_TEMPLATES.CUSTOMER.AUTH_WELCOME,
        recipient: email,
        data: {
          name: user.fullName,
          email: user.email,
        },
      })
      .catch((err) => console.warn("[AuthService] Welcome email error:", err.message));

    return jwtProvider.createJwt({ email });
  }

  async signin(req) {
    const { email, otp, fullName, mobile } = req;

    if (!email || !otp) {
      throw new Error("Email and OTP are required for sign-in");
    }

    // Verify OTP via Redis fast path or DB fallback FIRST
    let isValid = false;
    const cachedOtp = await redisClient.get(`otp:${email}`);
    if (cachedOtp && String(cachedOtp) === String(otp)) {
      isValid = true;
      await redisClient.del(`otp:${email}`);
    } else {
      const verificationCode = await VerificationCode.findOne({ email });
      if (verificationCode && verificationCode.otp === otp) {
        isValid = true;
        await VerificationCode.findOneAndDelete({ email });
      }
    }

    if (!isValid) {
      throw new Error("Invalid or expired OTP. Please enter the correct code or request a new one.");
    }

    let user = await User.findOne({ email });
    let isNewUser = false;

    // If user does not exist, check if seller exists or auto-register as customer (Flipkart / Amazon Unified Auth)
    if (!user) {
      const seller = await Seller.findOne({ email });
      if (seller) {
        return {
          message: "Seller authentication successful",
          jwt: jwtProvider.createJwt({ email }),
          role: "ROLE_SELLER",
          error: false,
          success: true,
        };
      }

      // Seamlessly auto-register verified new customer
      const rawName = fullName || email.split("@")[0].replace(/[._-]/g, " ");
      const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

      user = new User({
        email,
        fullName: formattedName,
        mobile: mobile || "",
        role: "ROLE_CUSTOMER",
      });

      await user.save();

      const cart = new Cart({ user: user._id });
      await cart.save();

      isNewUser = true;
    }

    return {
      message: isNewUser
        ? "Welcome to Zosh Bazaar! Your account has been created."
        : "Login successful. Welcome back!",
      jwt: jwtProvider.createJwt({ email }),
      role: user.role,
      isNewUser,
      error: false,
      success: true,
    };
  }
}

export default new AuthService();
