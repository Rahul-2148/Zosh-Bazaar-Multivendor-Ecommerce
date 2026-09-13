import SellerService from "../modules/seller/services/seller.service.js";
import userService from "../modules/customer/services/user.service.js";
import jwtProvider from "../utils/jwtProvider.js";
import UserRoles from "../domain/UserRole.js";
import AccountStatus from "../domain/AccountStatus.js";

const sellerAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Invalid token, Authorization Failed!", error: true, success: false });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Token missing, Authorization Failed!", error: true, success: false });
    }

    const email = jwtProvider.getEmailFromJwt(token);
    if (!email) {
      return res
        .status(401)
        .json({ message: "Invalid or expired token", error: true, success: false });
    }

    const seller = await SellerService.getSellerByEmail(email);

    if (!seller) {
      // Check if user is an Administrator
      const user = await userService.findUserByEmail(email);
      if (user && user.role === UserRoles.ADMIN) {
        req.user = user;
        req.seller = {
          _id: user._id,
          sellerName: user.fullName || "Admin",
          email: user.email,
          role: UserRoles.ADMIN,
        };
        return next();
      }

      return res
        .status(401)
        .json({ message: "Seller not found, access denied!", error: true, success: false });
    }

    // Lifecycle status enforcement
    const status = seller.accountStatus || AccountStatus.PENDING_VERIFICATION;
    if (
      status === AccountStatus.SUSPENDED ||
      status === AccountStatus.BANNED ||
      status === AccountStatus.CLOSED ||
      status === AccountStatus.DEACTIVATED
    ) {
      return res.status(403).json({
        success: false,
        error: true,
        code: `SELLER_${status}`,
        accountStatus: status,
        message: `Your seller account is ${status}. Access to seller portal has been restricted. Please contact platform administration.`,
      });
    }

    req.seller = seller;
    next();
  } catch (error) {
    return res.status(401).json({
      message: error.message || "Seller authentication failed",
      error: true,
      success: false,
    });
  }
};

export default sellerAuthMiddleware;
