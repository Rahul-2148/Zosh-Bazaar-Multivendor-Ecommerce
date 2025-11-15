import bcrypt from "bcrypt";
import { Cart } from "../models/cart.model.js";
import { Seller } from "../models/seller.model.js";
import { User } from "../models/user.model.js";
import { VerificationCode } from "../models/VerificationCode.js";
import generateOTP from "../utils/generateOtp.js";
import jwtProvider from "../utils/jwtProvider.js";
import sendVerificationEmail from "../utils/sendEmail.js";

class AuthService {
  async sendLoginOTP(email, mode = "login") {
    if (!email) {
      throw new Error("Email is required to send OTP");
    }
    const SIGNIN_PREFIX = "signin_";

    // Remove prefix if it's added by the client
    if (email.startsWith(SIGNIN_PREFIX)) {
      email = email.substring(SIGNIN_PREFIX.length);
    }

    const user = await User.findOne({ email });
    const seller = await Seller.findOne({ email });

    if (mode === "login") {
      if (!user && !seller) {
        throw new Error("User or Seller not found for login");
      }
    } else if (mode === "signup") {
      if (user || seller) {
        throw new Error("Account already exists with this email");
      }
    }

    // Delete old OTP
    await VerificationCode.findOneAndDelete({ email });

    // Generate and save new OTP
    const otp = generateOTP();
    const verificationCode = new VerificationCode({ email, otp });
    await verificationCode.save();

    const subject = "Zosh Bazaar Login/Signup OTP";
    const body = `Your OTP is ${otp}. Please enter this code to continue.`;
    await sendVerificationEmail(email, subject, body);
  }

  async createUser(req) {
    const { fullName, email, otp, mobile, password } = req;

    if (!fullName || !mobile || !email || !otp) {
      throw new Error("Full Name, Mobile, Email and OTP are required");
    }

    let user = await User.findOne({ email });

    if (user) {
      throw new Error("User already exists with this email");
    }

    const verificationCode = await VerificationCode.findOne({ email });
    if (!verificationCode || verificationCode.otp !== otp) {
      throw new Error("Invalid OTP");
    }

    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10); // only hash if password provided
    }

    user = new User({
      email,
      fullName,
      mobile,
      role: "ROLE_CUSTOMER",
      password: hashedPassword,
    });

    await user.save();

    const cart = new Cart({ user: user._id });
    await cart.save();

    return jwtProvider.createJwt({ email });
  }

  async signin(req, res) {
    const { email, otp } = req;

    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("User not found with this email");
    }

    const verificationCode = await VerificationCode.findOne({ email });
    if (!verificationCode || verificationCode.otp !== otp) {
      throw new Error("Invalid OTP");
    }

    return {
      message: "Login successful",
      jwt: jwtProvider.createJwt({ email }),
      role: user.role,
      error: false,
      success: true,
    };
  }
}

export default new AuthService();

// async sendLoginOTP(email) {
//   const SIGNIN_PREFIX = "signin_";

//   if (email.startsWith(SIGNIN_PREFIX)) {
//     email = email.substring(SIGNIN_PREFIX.length);
//     const seller = await Seller.findOne({ email });
//     const user = await User.findOne({ email });

//     if (!seller && !user) {
//       throw new Error("User or seller not found");
//     }
//   }

//   const existingVerificationCode = await VerificationCode.findOne({ email });

//   if (existingVerificationCode) {
//     await VerificationCode.findOneAndDelete({ email });
//   }

//   const otp = generateOTP();
//   const verificationCode = new VerificationCode({ email, otp });
//   await verificationCode.save();

//   // send email with OTP to user
//   const subject = "Zosh Bazaar Login/Signup OTP";
//   const body = `Your OTP is ${otp}. Please enter this code to complete your login.`;
//   await sendVerificationEmail(email, subject, body);
// }
