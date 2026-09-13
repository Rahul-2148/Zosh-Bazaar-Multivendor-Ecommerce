import userService from "../modules/customer/services/user.service.js";
import SellerService from "../modules/seller/services/seller.service.js";
import jwtProvider from "../utils/jwtProvider.js";
import UserRoles from "../domain/UserRole.js";
import AccountStatus, { TERMINATED_STATES } from "../domain/AccountStatus.js";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Authorization token missing or malformed", error: true, success: false });
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
        .json({ message: "Invalid or expired session token", error: true, success: false });
    }

    const user = await userService.findUserByEmail(email);

    if (!user) {
      // Check if this token belongs to a Seller account
      const seller = await SellerService.getSellerByEmail(email);
      if (seller) {
        req.user = {
          _id: seller._id,
          email: seller.email,
          fullName: seller.sellerName,
          mobile: seller.mobile,
          role: UserRoles.SELLER,
          isSeller: true,
          seller: seller,
        };
        req.seller = seller;
        return next();
      }

      return res
        .status(401)
        .json({ message: "User account not found, access denied!", error: true, success: false });
    }

    // ── Account Lifecycle Status Enforcement ─────────────────
    const status = user.accountStatus || AccountStatus.ACTIVE;

    // Deactivated: block with reactivation prompt
    // Allow through ONLY for reactivation endpoint
    if (status === AccountStatus.DEACTIVATED) {
      const isReactivationEndpoint = req.originalUrl?.includes("/account/reactivate");
      if (!isReactivationEndpoint) {
        return res.status(403).json({
          success: false,
          error: true,
          code: "ACCOUNT_DEACTIVATED",
          message: "Your account has been deactivated. Please reactivate to continue shopping.",
          deactivatedAt: user.deactivatedAt,
        });
      }
    }

    // Terminated states: account is gone
    if (TERMINATED_STATES.includes(status)) {
      return res.status(410).json({
        success: false,
        error: true,
        code: "ACCOUNT_DELETED",
        message: "This account has been permanently deleted.",
      });
    }

    // DELETION_REQUESTED / DELETION_SCHEDULED — user can still access
    // (they need to be able to cancel their deletion request)

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: error.message || "Authentication failed",
      error: true,
      success: false,
    });
  }
};

export default authMiddleware;

