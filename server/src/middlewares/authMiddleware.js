import userService from "../service/user.service.js";
import jwtProvider from "../utils/jwtProvider.js";

const authMiddleware = async (req, res, next) => {
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

    const user = await userService.findUserByEmail(email);

    if (!user) {
      return res
        .status(401)
        .json({ message: "User not found, access denied!" });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export default authMiddleware;
