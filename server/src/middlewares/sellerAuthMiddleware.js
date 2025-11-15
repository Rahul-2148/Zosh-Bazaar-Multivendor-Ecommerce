import SellerService from "../service/seller.service.js";
import jwtProvider from "../utils/jwtProvider.js";

const sellerAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Invalid token, Authorization Failed!" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Token missing, Authorization Failed!" });
    }

    const email = jwtProvider.getEmailFromJwt(token);

    const seller = await SellerService.getSellerByEmail(email);

    if (!seller) {
      return res
        .status(401)
        .json({ message: "Seller not found, access denied!" });
    }

    req.seller = seller;

    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export default sellerAuthMiddleware;
