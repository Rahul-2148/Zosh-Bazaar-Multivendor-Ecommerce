import UserRoles from "../domain/UserRole.js";
import AccountStatus from "../domain/AccountStatus.js";

/**
 * Generic Role-Based Access Control (RBAC) middleware factory.
 * Verifies that the authenticated user has at least one of the specified roles.
 */
export const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role || req.seller?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: true,
        code: "INSUFFICIENT_PERMISSIONS",
        message: "Access denied. You do not have the required permissions for this action.",
      });
    }

    next();
  };
};

/**
 * Ensures the caller is a Platform Administrator or Super Administrator.
 */
export const adminOnly = (req, res, next) => {
  const role = req.user?.role;
  const isAdmin = role === UserRoles.ADMIN || role === UserRoles.SUPER_ADMIN || role === "ROLE_ADMIN" || role === "ROLE_SUPER_ADMIN";

  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      error: true,
      code: "ADMIN_REQUIRED",
      message: "Access denied. Administrator privileges required.",
    });
  }

  next();
};

/**
 * Ensures the authenticated seller has an ACTIVE account status.
 * Blocks actions (product creation, fulfillment) for PENDING, SUSPENDED, BANNED, or DEACTIVATED sellers.
 */
export const sellerActiveOnly = (req, res, next) => {
  if (!req.seller) {
    return res.status(401).json({
      success: false,
      error: true,
      message: "Seller authentication required.",
    });
  }

  const status = req.seller.accountStatus || AccountStatus.PENDING_VERIFICATION;

  if (status !== AccountStatus.ACTIVE && status !== "ACTIVE") {
    return res.status(403).json({
      success: false,
      error: true,
      code: `SELLER_${status}`,
      accountStatus: status,
      message: `Your seller account is currently "${status}". Only verified ACTIVE sellers can perform this operation.`,
    });
  }

  next();
};

/**
 * Ensures caller is an Admin, Super Admin, or authorized Logistics Operator.
 */
export const logisticsOnly = (req, res, next) => {
  const role = req.user?.role || req.agent?.role;
  const isAuthorized =
    role === UserRoles.ADMIN ||
    role === UserRoles.SUPER_ADMIN ||
    role === "ROLE_ADMIN" ||
    role === "ROLE_SUPER_ADMIN" ||
    role === "LOGISTICS_OPERATOR" ||
    role === "ROLE_LOGISTICS_OPERATOR";

  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      error: true,
      code: "LOGISTICS_AUTH_REQUIRED",
      message: "Access denied. Logistics operations clearance required.",
    });
  }

  next();
};
