import jwt from "jsonwebtoken";

/**
 * Socket.IO Handshake Authentication Middleware (Phase 14 - Section 3 & 4)
 *
 * Strictly separates:
 * 1. Guests: No token provided -> Connected as GUEST (Allowed only for public catalog sync)
 * 2. Invalid Token: Token provided but expired or forged -> Connection REJECTED
 * 3. Authenticated: Verified via JWT & verified against DB -> Full access to authorized private channels
 */
export const socketAuthMiddleware = async (socket, next) => {
  const authHeader =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization ||
    socket.handshake.query?.token;

  // 1. Unauthenticated Guest Connection Policy (Section 4)
  if (!authHeader) {
    socket.user = {
      isGuest: true,
      role: "GUEST",
      authenticated: false,
    };
    return next();
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  const secret =
    process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || "default_jwt_secret";

  try {
    const decoded = jwt.verify(token, secret);
    const email = decoded.email;
    let verifiedUser = null;

    if (email) {
      // 1. Check Customer / Admin collection
      const { User } = await import("../models/user.model.js");
      const user = await User.findOne({ email }).select(
        "_id email role fullName mobile status"
      );

      if (user) {
        verifiedUser = {
          _id: user._id.toString(),
          email: user.email,
          role: user.role || "ROLE_CUSTOMER",
          fullName: user.fullName,
          isGuest: false,
          authenticated: true,
        };
      } else {
        // 2. Check Merchant / Seller collection
        const Seller = (await import("../models/seller.model.js")).default;
        const seller = await Seller.findOne({ email }).select(
          "_id email role sellerName accountStatus"
        );

        if (seller) {
          verifiedUser = {
            _id: seller._id.toString(),
            sellerId: seller._id.toString(),
            email: seller.email,
            role: "ROLE_SELLER",
            sellerName: seller.sellerName,
            isGuest: false,
            authenticated: true,
          };
        }
      }
    }

    socket.user = verifiedUser || {
      _id: decoded._id || decoded.id,
      email: decoded.email,
      role: decoded.role || "ROLE_CUSTOMER",
      isGuest: false,
      authenticated: true,
    };

    next();
  } catch (err) {
    // Section 4: If an explicit token was provided but failed verification,
    // REJECT the connection rather than silently downgrading to an authenticated identity.
    console.warn(
      `[Socket.IO Auth] Handshake token rejected from ${socket.id}: ${err.message}`
    );
    return next(new Error(`AUTHENTICATION_FAILED: ${err.message}`));
  }
};

export default socketAuthMiddleware;
